from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from decimal import Decimal
import re
from io import BytesIO
from PIL import Image
import pytesseract
import sympy
from sympy import sympify, simplify, latex
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

from src.models.homework_scanner import HomeworkScan, HomeworkFeedback, MistakeType
from src.repositories.homework_scanner_repository import (
    HomeworkScanRepository,
    HomeworkFeedbackRepository
)
from src.schemas.homework_scanner import (
    HomeworkScanCreate,
    HomeworkScanUpdate,
    HomeworkFeedbackCreate,
    ScanProcessRequest
)
from src.utils.s3_client import s3_client
from src.config import settings


class HomeworkScannerService:
    def __init__(self, db: Session):
        self.db = db
        self.scan_repo = HomeworkScanRepository(db)
        self.feedback_repo = HomeworkFeedbackRepository(db)

    def create_scan(self, data: HomeworkScanCreate, image_urls: List[str]) -> HomeworkScan:
        scan = self.scan_repo.create(
            student_id=data.student_id,
            subject_id=data.subject_id,
            scan_image_urls=image_urls
        )
        self.db.commit()
        self.db.refresh(scan)
        return scan

    def get_scan(self, scan_id: int) -> Optional[HomeworkScan]:
        return self.scan_repo.get_by_id(scan_id)

    def get_scan_with_feedbacks(self, scan_id: int) -> Optional[HomeworkScan]:
        return self.scan_repo.get_with_feedbacks(scan_id)

    def list_scans_by_student(
        self,
        student_id: int,
        skip: int = 0,
        limit: int = 100,
        subject_id: Optional[int] = None
    ) -> Tuple[List[HomeworkScan], int]:
        scans = self.scan_repo.list_by_student(student_id, skip, limit, subject_id)
        total = self.scan_repo.count_by_student(student_id, subject_id)
        return scans, total

    def perform_ocr(self, image_url: str) -> str:
        try:
            s3_key = image_url.split('.amazonaws.com/')[-1] if '.amazonaws.com/' in image_url else image_url
            
            image_bytes = s3_client.download_file(s3_key)
            image = Image.open(BytesIO(image_bytes))
            
            text = pytesseract.image_to_string(
                image,
                config='--psm 6 --oem 3'
            )
            
            return text.strip()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"OCR failed: {str(e)}"
            )

    def extract_answers_from_ocr(self, ocr_text: str) -> Dict[int, str]:
        answers = {}
        
        lines = ocr_text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            match = re.match(r'^(\d+)[\.\)\:]?\s*(.+)$', line)
            if match:
                question_num = int(match.group(1))
                answer = match.group(2).strip()
                answers[question_num] = answer
        
        return answers

    def evaluate_answers(
        self,
        scan_id: int,
        student_answers: Dict[int, str],
        answer_key: Dict[str, str]
    ) -> List[Dict[str, Any]]:
        feedbacks = []
        correct_count = 0
        
        for q_num_str, correct_answer in answer_key.items():
            q_num = int(q_num_str)
            student_answer = student_answers.get(q_num, "")
            
            is_correct = self._compare_answers(student_answer, correct_answer)
            
            mistake_type = None
            if not is_correct:
                mistake_type = self._identify_mistake_type(
                    student_answer,
                    correct_answer
                )
            
            ai_feedback = self._generate_feedback(
                student_answer,
                correct_answer,
                is_correct,
                mistake_type
            )
            
            remedial_url = self._get_remedial_content_url(mistake_type, q_num)
            
            if is_correct:
                correct_count += 1
            
            feedbacks.append({
                'scan_id': scan_id,
                'question_number': q_num,
                'student_answer': student_answer,
                'correct_answer': correct_answer,
                'is_correct': 1 if is_correct else 0,
                'mistake_type': mistake_type,
                'ai_feedback': ai_feedback,
                'remedial_content_url': remedial_url
            })
        
        return feedbacks

    def _compare_answers(self, student_answer: str, correct_answer: str) -> bool:
        if not student_answer:
            return False
        
        student_clean = student_answer.strip().lower()
        correct_clean = correct_answer.strip().lower()
        
        if student_clean == correct_clean:
            return True
        
        try:
            transformations = standard_transformations + (implicit_multiplication_application,)
            student_expr = parse_expr(student_answer, transformations=transformations)
            correct_expr = parse_expr(correct_answer, transformations=transformations)
            
            diff = simplify(student_expr - correct_expr)
            return diff == 0
        except:
            pass
        
        student_numeric = re.sub(r'[^\d\.\-]', '', student_answer)
        correct_numeric = re.sub(r'[^\d\.\-]', '', correct_answer)
        
        if student_numeric and correct_numeric:
            try:
                return abs(float(student_numeric) - float(correct_numeric)) < 0.001
            except:
                pass
        
        return False

    def _identify_mistake_type(
        self,
        student_answer: str,
        correct_answer: str
    ) -> Optional[MistakeType]:
        if not student_answer.strip():
            return MistakeType.INCOMPLETE
        
        try:
            student_expr = parse_expr(student_answer)
            correct_expr = parse_expr(correct_answer)
            
            student_neg = simplify(-student_expr)
            if simplify(student_neg - correct_expr) == 0:
                return MistakeType.SIGN_ERROR
            
        except:
            pass
        
        student_nums = re.findall(r'-?\d+\.?\d*', student_answer)
        correct_nums = re.findall(r'-?\d+\.?\d*', correct_answer)
        
        if len(student_nums) == len(correct_nums) and len(student_nums) > 0:
            try:
                s_vals = [float(n) for n in student_nums]
                c_vals = [float(n) for n in correct_nums]
                
                if sorted(s_vals) == sorted(c_vals) and s_vals != c_vals:
                    return MistakeType.CALCULATION
            except:
                pass
        
        student_units = re.findall(r'[a-zA-Z]+', student_answer.lower())
        correct_units = re.findall(r'[a-zA-Z]+', correct_answer.lower())
        
        try:
            student_val = float(re.sub(r'[^\d\.\-]', '', student_answer))
            correct_val = float(re.sub(r'[^\d\.\-]', '', correct_answer))
            
            if abs(student_val - correct_val) < 0.001 and student_units != correct_units:
                return MistakeType.UNIT
        except:
            pass
        
        return MistakeType.CONCEPT

    def _generate_feedback(
        self,
        student_answer: str,
        correct_answer: str,
        is_correct: bool,
        mistake_type: Optional[MistakeType]
    ) -> str:
        if is_correct:
            return "Excellent! Your answer is correct."
        
        if mistake_type == MistakeType.CALCULATION:
            return f"You have a calculation error. Check your arithmetic steps. The correct answer is {correct_answer}."
        elif mistake_type == MistakeType.SIGN_ERROR:
            return f"You have a sign error in your answer. Pay attention to positive and negative values. The correct answer is {correct_answer}."
        elif mistake_type == MistakeType.CONCEPT:
            return f"This appears to be a conceptual error. Review the topic and try to understand the underlying principle. The correct answer is {correct_answer}."
        elif mistake_type == MistakeType.UNIT:
            return f"Your numerical value might be close, but check your units. The correct answer is {correct_answer}."
        elif mistake_type == MistakeType.INCOMPLETE:
            return f"Your answer is incomplete. Make sure to complete all parts of the question. The correct answer is {correct_answer}."
        else:
            return f"Your answer is incorrect. The correct answer is {correct_answer}. Please review this question."

    def _get_remedial_content_url(
        self,
        mistake_type: Optional[MistakeType],
        question_number: int
    ) -> Optional[str]:
        if not mistake_type:
            return None
        
        base_url = f"{settings.app_url}/learning-resources"
        
        remedial_map = {
            MistakeType.CALCULATION: f"{base_url}/arithmetic-skills",
            MistakeType.SIGN_ERROR: f"{base_url}/signs-and-operations",
            MistakeType.CONCEPT: f"{base_url}/concept-review",
            MistakeType.UNIT: f"{base_url}/units-and-measurements",
            MistakeType.INCOMPLETE: f"{base_url}/problem-solving-strategies"
        }
        
        return remedial_map.get(mistake_type)

    def process_scan(
        self,
        scan_id: int,
        answer_key: Dict[str, str]
    ) -> HomeworkScan:
        scan = self.scan_repo.get_by_id(scan_id)
        if not scan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan not found"
            )
        
        all_ocr_text = []
        for image_url in scan.scan_image_urls:
            ocr_text = self.perform_ocr(image_url)
            all_ocr_text.append(ocr_text)
        
        combined_ocr_text = "\n\n--- Page Break ---\n\n".join(all_ocr_text)
        
        student_answers = self.extract_answers_from_ocr(combined_ocr_text)
        
        feedbacks_data = self.evaluate_answers(scan_id, student_answers, answer_key)
        
        feedbacks = self.feedback_repo.create_bulk(feedbacks_data)
        
        total_questions = len(answer_key)
        correct_count = sum(1 for f in feedbacks_data if f['is_correct'])
        total_score = Decimal(correct_count) / Decimal(total_questions) * Decimal(100)
        
        processed_results = {
            'total_questions': total_questions,
            'correct_answers': correct_count,
            'incorrect_answers': total_questions - correct_count,
            'score_percentage': float(total_score),
            'student_answers': student_answers,
            'answer_key': answer_key
        }
        
        self.scan_repo.update(
            scan_id,
            ocr_text=combined_ocr_text,
            processed_results=processed_results,
            total_score=total_score
        )
        
        self.db.commit()
        
        return self.scan_repo.get_with_feedbacks(scan_id)

    def identify_mistake_patterns(
        self,
        student_id: int,
        subject_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        return self.feedback_repo.get_mistake_patterns_by_student(student_id, subject_id)

    async def upload_image(
        self,
        file: UploadFile,
        student_id: int
    ) -> Dict[str, str]:
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only JPEG and PNG images are allowed"
            )
        
        file_content = await file.read()
        
        max_size = 10 * 1024 * 1024
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 10MB limit"
            )
        
        s3_key = f"homework_scans/student_{student_id}/{file.filename}"
        
        image_url = s3_client.upload_file(
            file_content,
            s3_key,
            content_type=file.content_type
        )
        
        return {
            'image_url': image_url,
            's3_key': s3_key
        }
