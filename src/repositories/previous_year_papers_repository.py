from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_, desc
from datetime import datetime
from src.models.previous_year_papers import (
    PreviousYearPaper,
    QuestionBank,
    QuestionType,
    DifficultyLevel,
    BloomTaxonomyLevel,
    Board,
    TopicPrediction
)
from src.schemas.previous_year_papers import (
    PreviousYearPaperCreate,
    PreviousYearPaperUpdate,
    QuestionBankCreate,
    QuestionBankUpdate
)


class PreviousYearPaperRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, paper_data: PreviousYearPaperCreate) -> PreviousYearPaper:
        db_paper = PreviousYearPaper(**paper_data.model_dump())
        self.db.add(db_paper)
        self.db.commit()
        self.db.refresh(db_paper)
        return db_paper

    def get_by_id(self, paper_id: int) -> Optional[PreviousYearPaper]:
        return self.db.query(PreviousYearPaper).filter(
            PreviousYearPaper.id == paper_id
        ).first()

    def update(self, paper_id: int, paper_data: PreviousYearPaperUpdate) -> Optional[PreviousYearPaper]:
        db_paper = self.get_by_id(paper_id)
        if not db_paper:
            return None
        
        update_data = paper_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_paper, field, value)
        
        self.db.commit()
        self.db.refresh(db_paper)
        return db_paper

    def delete(self, paper_id: int) -> bool:
        db_paper = self.get_by_id(paper_id)
        if not db_paper:
            return False
        
        self.db.delete(db_paper)
        self.db.commit()
        return True

    def list_papers(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        board: Optional[Board] = None,
        year: Optional[int] = None,
        grade_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        is_active: Optional[bool] = None,
        ocr_processed: Optional[bool] = None,
        search: Optional[str] = None
    ) -> Tuple[List[PreviousYearPaper], int]:
        query = self.db.query(PreviousYearPaper).filter(
            PreviousYearPaper.institution_id == institution_id
        )

        if board:
            query = query.filter(PreviousYearPaper.board == board)
        if year:
            query = query.filter(PreviousYearPaper.year == year)
        if grade_id:
            query = query.filter(PreviousYearPaper.grade_id == grade_id)
        if subject_id:
            query = query.filter(PreviousYearPaper.subject_id == subject_id)
        if is_active is not None:
            query = query.filter(PreviousYearPaper.is_active == is_active)
        if ocr_processed is not None:
            query = query.filter(PreviousYearPaper.ocr_processed == ocr_processed)
        if search:
            search_filter = or_(
                PreviousYearPaper.title.ilike(f"%{search}%"),
                PreviousYearPaper.description.ilike(f"%{search}%"),
                PreviousYearPaper.tags.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)

        total = query.count()
        papers = query.order_by(desc(PreviousYearPaper.created_at)).offset(skip).limit(limit).all()
        
        return papers, total

    def update_pdf_info(
        self,
        paper_id: int,
        file_name: str,
        file_size: int,
        file_url: str,
        s3_key: str
    ) -> Optional[PreviousYearPaper]:
        db_paper = self.get_by_id(paper_id)
        if not db_paper:
            return None
        
        db_paper.pdf_file_name = file_name
        db_paper.pdf_file_size = file_size
        db_paper.pdf_file_url = file_url
        db_paper.pdf_s3_key = s3_key
        
        self.db.commit()
        self.db.refresh(db_paper)
        return db_paper

    def update_ocr_text(
        self,
        paper_id: int,
        ocr_text: str
    ) -> Optional[PreviousYearPaper]:
        db_paper = self.get_by_id(paper_id)
        if not db_paper:
            return None
        
        db_paper.ocr_text = ocr_text
        db_paper.ocr_processed = True
        db_paper.ocr_processed_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_paper)
        return db_paper

    def increment_view_count(self, paper_id: int) -> bool:
        db_paper = self.get_by_id(paper_id)
        if not db_paper:
            return False
        
        db_paper.view_count += 1
        self.db.commit()
        return True

    def increment_download_count(self, paper_id: int) -> bool:
        db_paper = self.get_by_id(paper_id)
        if not db_paper:
            return False
        
        db_paper.download_count += 1
        self.db.commit()
        return True

    def get_statistics(self, institution_id: int) -> dict:
        total_papers = self.db.query(func.count(PreviousYearPaper.id)).filter(
            PreviousYearPaper.institution_id == institution_id
        ).scalar()

        papers_by_board = dict(
            self.db.query(
                PreviousYearPaper.board,
                func.count(PreviousYearPaper.id)
            ).filter(
                PreviousYearPaper.institution_id == institution_id
            ).group_by(PreviousYearPaper.board).all()
        )

        papers_by_year = dict(
            self.db.query(
                PreviousYearPaper.year,
                func.count(PreviousYearPaper.id)
            ).filter(
                PreviousYearPaper.institution_id == institution_id
            ).group_by(PreviousYearPaper.year).order_by(desc(PreviousYearPaper.year)).all()
        )

        ocr_processed_count = self.db.query(func.count(PreviousYearPaper.id)).filter(
            and_(
                PreviousYearPaper.institution_id == institution_id,
                PreviousYearPaper.ocr_processed == True
            )
        ).scalar()

        ocr_pending_count = self.db.query(func.count(PreviousYearPaper.id)).filter(
            and_(
                PreviousYearPaper.institution_id == institution_id,
                PreviousYearPaper.ocr_processed == False
            )
        ).scalar()

        return {
            "total_papers": total_papers or 0,
            "papers_by_board": papers_by_board,
            "papers_by_year": papers_by_year,
            "ocr_processed_count": ocr_processed_count or 0,
            "ocr_pending_count": ocr_pending_count or 0
        }

    def get_facets(self, institution_id: int) -> dict:
        boards = dict(
            self.db.query(
                PreviousYearPaper.board,
                func.count(PreviousYearPaper.id)
            ).filter(
                PreviousYearPaper.institution_id == institution_id,
                PreviousYearPaper.is_active == True
            ).group_by(PreviousYearPaper.board).all()
        )

        years = [
            year for year, in self.db.query(PreviousYearPaper.year).filter(
                PreviousYearPaper.institution_id == institution_id,
                PreviousYearPaper.is_active == True
            ).distinct().order_by(desc(PreviousYearPaper.year)).all()
        ]

        return {
            "boards": boards,
            "years": years
        }


class QuestionBankRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, question_data: QuestionBankCreate) -> QuestionBank:
        db_question = QuestionBank(**question_data.model_dump())
        self.db.add(db_question)
        self.db.commit()
        self.db.refresh(db_question)
        return db_question

    def get_by_id(self, question_id: int) -> Optional[QuestionBank]:
        return self.db.query(QuestionBank).filter(
            QuestionBank.id == question_id
        ).first()

    def update(self, question_id: int, question_data: QuestionBankUpdate) -> Optional[QuestionBank]:
        db_question = self.get_by_id(question_id)
        if not db_question:
            return None
        
        update_data = question_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_question, field, value)
        
        self.db.commit()
        self.db.refresh(db_question)
        return db_question

    def delete(self, question_id: int) -> bool:
        db_question = self.get_by_id(question_id)
        if not db_question:
            return False
        
        self.db.delete(db_question)
        self.db.commit()
        return True

    def list_questions(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        paper_id: Optional[int] = None,
        grade_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        chapter_id: Optional[int] = None,
        topic_id: Optional[int] = None,
        question_type: Optional[QuestionType] = None,
        difficulty_level: Optional[DifficultyLevel] = None,
        bloom_taxonomy_level: Optional[BloomTaxonomyLevel] = None,
        is_active: Optional[bool] = None,
        is_verified: Optional[bool] = None,
        search: Optional[str] = None
    ) -> Tuple[List[QuestionBank], int]:
        query = self.db.query(QuestionBank).filter(
            QuestionBank.institution_id == institution_id
        )

        if paper_id:
            query = query.filter(QuestionBank.paper_id == paper_id)
        if grade_id:
            query = query.filter(QuestionBank.grade_id == grade_id)
        if subject_id:
            query = query.filter(QuestionBank.subject_id == subject_id)
        if chapter_id:
            query = query.filter(QuestionBank.chapter_id == chapter_id)
        if topic_id:
            query = query.filter(QuestionBank.topic_id == topic_id)
        if question_type:
            query = query.filter(QuestionBank.question_type == question_type)
        if difficulty_level:
            query = query.filter(QuestionBank.difficulty_level == difficulty_level)
        if bloom_taxonomy_level:
            query = query.filter(QuestionBank.bloom_taxonomy_level == bloom_taxonomy_level)
        if is_active is not None:
            query = query.filter(QuestionBank.is_active == is_active)
        if is_verified is not None:
            query = query.filter(QuestionBank.is_verified == is_verified)
        if search:
            search_filter = or_(
                QuestionBank.question_text.ilike(f"%{search}%"),
                QuestionBank.tags.ilike(f"%{search}%"),
                QuestionBank.keywords.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)

        total = query.count()
        questions = query.order_by(desc(QuestionBank.created_at)).offset(skip).limit(limit).all()
        
        return questions, total

    def verify_question(
        self,
        question_id: int,
        is_verified: bool,
        verified_by: int
    ) -> Optional[QuestionBank]:
        db_question = self.get_by_id(question_id)
        if not db_question:
            return None
        
        db_question.is_verified = is_verified
        db_question.verified_by = verified_by if is_verified else None
        db_question.verified_at = datetime.utcnow() if is_verified else None
        
        self.db.commit()
        self.db.refresh(db_question)
        return db_question

    def increment_usage_count(self, question_id: int) -> bool:
        db_question = self.get_by_id(question_id)
        if not db_question:
            return False
        
        db_question.usage_count += 1
        self.db.commit()
        return True

    def update_image(
        self,
        question_id: int,
        image_url: str,
        image_s3_key: str
    ) -> Optional[QuestionBank]:
        db_question = self.get_by_id(question_id)
        if not db_question:
            return None
        
        db_question.image_url = image_url
        db_question.image_s3_key = image_s3_key
        
        self.db.commit()
        self.db.refresh(db_question)
        return db_question

    def get_statistics(self, institution_id: int) -> dict:
        total_questions = self.db.query(func.count(QuestionBank.id)).filter(
            QuestionBank.institution_id == institution_id
        ).scalar()

        questions_by_type = dict(
            self.db.query(
                QuestionBank.question_type,
                func.count(QuestionBank.id)
            ).filter(
                QuestionBank.institution_id == institution_id
            ).group_by(QuestionBank.question_type).all()
        )

        questions_by_difficulty = dict(
            self.db.query(
                QuestionBank.difficulty_level,
                func.count(QuestionBank.id)
            ).filter(
                QuestionBank.institution_id == institution_id
            ).group_by(QuestionBank.difficulty_level).all()
        )

        questions_by_bloom_level = dict(
            self.db.query(
                QuestionBank.bloom_taxonomy_level,
                func.count(QuestionBank.id)
            ).filter(
                QuestionBank.institution_id == institution_id
            ).group_by(QuestionBank.bloom_taxonomy_level).all()
        )

        verified_count = self.db.query(func.count(QuestionBank.id)).filter(
            and_(
                QuestionBank.institution_id == institution_id,
                QuestionBank.is_verified == True
            )
        ).scalar()

        unverified_count = self.db.query(func.count(QuestionBank.id)).filter(
            and_(
                QuestionBank.institution_id == institution_id,
                QuestionBank.is_verified == False
            )
        ).scalar()

        return {
            "total_questions": total_questions or 0,
            "questions_by_type": questions_by_type,
            "questions_by_difficulty": questions_by_difficulty,
            "questions_by_bloom_level": questions_by_bloom_level,
            "verified_count": verified_count or 0,
            "unverified_count": unverified_count or 0
        }

    def get_facets(self, institution_id: int) -> dict:
        question_types = dict(
            self.db.query(
                QuestionBank.question_type,
                func.count(QuestionBank.id)
            ).filter(
                QuestionBank.institution_id == institution_id,
                QuestionBank.is_active == True
            ).group_by(QuestionBank.question_type).all()
        )

        difficulty_levels = dict(
            self.db.query(
                QuestionBank.difficulty_level,
                func.count(QuestionBank.id)
            ).filter(
                QuestionBank.institution_id == institution_id,
                QuestionBank.is_active == True
            ).group_by(QuestionBank.difficulty_level).all()
        )

        bloom_levels = dict(
            self.db.query(
                QuestionBank.bloom_taxonomy_level,
                func.count(QuestionBank.id)
            ).filter(
                QuestionBank.institution_id == institution_id,
                QuestionBank.is_active == True
            ).group_by(QuestionBank.bloom_taxonomy_level).all()
        )

        return {
            "question_types": question_types,
            "difficulty_levels": difficulty_levels,
            "bloom_levels": bloom_levels
        }

    def get_by_paper(self, paper_id: int, skip: int = 0, limit: int = 100) -> Tuple[List[QuestionBank], int]:
        query = self.db.query(QuestionBank).filter(QuestionBank.paper_id == paper_id)
        total = query.count()
        questions = query.offset(skip).limit(limit).all()
        return questions, total


class TopicPredictionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, prediction_data: Dict[str, Any]) -> TopicPrediction:
        db_prediction = TopicPrediction(**prediction_data)
        self.db.add(db_prediction)
        self.db.commit()
        self.db.refresh(db_prediction)
        return db_prediction

    def bulk_create(self, predictions_data: List[Dict[str, Any]]) -> List[TopicPrediction]:
        db_predictions = [TopicPrediction(**data) for data in predictions_data]
        self.db.bulk_save_objects(db_predictions)
        self.db.commit()
        return db_predictions

    def get_by_id(self, prediction_id: int) -> Optional[TopicPrediction]:
        return self.db.query(TopicPrediction).filter(
            TopicPrediction.id == prediction_id
        ).first()

    def delete_existing_predictions(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int
    ) -> int:
        deleted = self.db.query(TopicPrediction).filter(
            and_(
                TopicPrediction.institution_id == institution_id,
                TopicPrediction.board == board,
                TopicPrediction.grade_id == grade_id,
                TopicPrediction.subject_id == subject_id
            )
        ).delete()
        self.db.commit()
        return deleted

    def get_predictions(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        skip: int = 0,
        limit: int = 100,
        order_by: str = 'probability_score'
    ) -> Tuple[List[TopicPrediction], int]:
        query = self.db.query(TopicPrediction).filter(
            and_(
                TopicPrediction.institution_id == institution_id,
                TopicPrediction.board == board,
                TopicPrediction.grade_id == grade_id,
                TopicPrediction.subject_id == subject_id
            )
        )

        total = query.count()

        if order_by == 'probability_score':
            query = query.order_by(desc(TopicPrediction.probability_score))
        elif order_by == 'prediction_rank':
            query = query.order_by(TopicPrediction.prediction_rank)
        elif order_by == 'frequency_count':
            query = query.order_by(desc(TopicPrediction.frequency_count))
        elif order_by == 'total_marks':
            query = query.order_by(desc(TopicPrediction.total_marks))
        elif order_by == 'years_since_last_appearance':
            query = query.order_by(desc(TopicPrediction.years_since_last_appearance))

        predictions = query.offset(skip).limit(limit).all()
        return predictions, total

    def get_top_predictions(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        top_n: int = 20
    ) -> List[TopicPrediction]:
        return self.db.query(TopicPrediction).filter(
            and_(
                TopicPrediction.institution_id == institution_id,
                TopicPrediction.board == board,
                TopicPrediction.grade_id == grade_id,
                TopicPrediction.subject_id == subject_id
            )
        ).order_by(desc(TopicPrediction.probability_score)).limit(top_n).all()

    def get_due_topics(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int
    ) -> List[TopicPrediction]:
        return self.db.query(TopicPrediction).filter(
            and_(
                TopicPrediction.institution_id == institution_id,
                TopicPrediction.board == board,
                TopicPrediction.grade_id == grade_id,
                TopicPrediction.subject_id == subject_id,
                TopicPrediction.is_due == True
            )
        ).order_by(desc(TopicPrediction.probability_score)).all()

    def get_by_chapter(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        chapter_id: int
    ) -> List[TopicPrediction]:
        return self.db.query(TopicPrediction).filter(
            and_(
                TopicPrediction.institution_id == institution_id,
                TopicPrediction.board == board,
                TopicPrediction.grade_id == grade_id,
                TopicPrediction.subject_id == subject_id,
                TopicPrediction.chapter_id == chapter_id
            )
        ).order_by(desc(TopicPrediction.probability_score)).all()

    def get_analysis_summary(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int
    ) -> Dict[str, Any]:
        query = self.db.query(TopicPrediction).filter(
            and_(
                TopicPrediction.institution_id == institution_id,
                TopicPrediction.board == board,
                TopicPrediction.grade_id == grade_id,
                TopicPrediction.subject_id == subject_id
            )
        )

        total_topics = query.count()
        due_topics_count = query.filter(TopicPrediction.is_due == True).count()
        
        avg_probability = self.db.query(
            func.avg(TopicPrediction.probability_score)
        ).filter(
            and_(
                TopicPrediction.institution_id == institution_id,
                TopicPrediction.board == board,
                TopicPrediction.grade_id == grade_id,
                TopicPrediction.subject_id == subject_id
            )
        ).scalar() or 0.0

        latest_analysis = query.order_by(desc(TopicPrediction.analyzed_at)).first()

        return {
            "total_topics": total_topics,
            "due_topics_count": due_topics_count,
            "avg_probability_score": float(avg_probability),
            "latest_analysis_date": latest_analysis.analyzed_at if latest_analysis else None,
            "year_range": f"{latest_analysis.analysis_year_start}-{latest_analysis.analysis_year_end}" if latest_analysis else None
        }
