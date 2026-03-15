from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import hashlib
import re

from src.repositories.content_marketplace_repository import (
    ContentPlagiarismRepository, StudentContentRepository
)
from src.models.content_marketplace import PlagiarismStatus


class ContentPlagiarismService:
    def __init__(self, db: Session):
        self.db = db
        self.plagiarism_repo = ContentPlagiarismRepository(db)
        self.content_repo = StudentContentRepository(db)
    
    def check_content_plagiarism(
        self,
        content_id: int,
        institution_id: int
    ):
        content = self.content_repo.get_by_id(content_id)
        if not content:
            raise ValueError("Content not found")
        
        self.content_repo.update(content_id, {
            'plagiarism_status': PlagiarismStatus.CHECKING
        })
        
        text_to_check = self._extract_text_for_checking(content)
        
        similarity_results = self._check_against_existing_contents(
            text_to_check,
            institution_id,
            content_id
        )
        
        external_results = self._check_external_sources(text_to_check)
        
        max_similarity = max(
            [r['similarity'] for r in similarity_results] + [0.0]
        )
        
        plagiarism_status = self._determine_plagiarism_status(max_similarity)
        
        check_data = {
            'institution_id': institution_id,
            'content_id': content_id,
            'plagiarism_status': plagiarism_status,
            'similarity_score': max_similarity,
            'sources_found': len(similarity_results),
            'matched_contents': similarity_results[:10],
            'external_sources': external_results[:5],
            'check_details': {
                'total_words': len(text_to_check.split()),
                'check_method': 'text_similarity',
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
        check = self.plagiarism_repo.create(check_data)
        
        self.content_repo.update(content_id, {
            'plagiarism_status': plagiarism_status,
            'plagiarism_score': max_similarity
        })
        
        return check
    
    def _extract_text_for_checking(self, content) -> str:
        text_parts = [
            content.title,
            content.description
        ]
        
        if content.preview_content:
            text_parts.append(content.preview_content)
        
        return " ".join(text_parts)
    
    def _check_against_existing_contents(
        self,
        text: str,
        institution_id: int,
        exclude_content_id: int
    ) -> List[Dict[str, Any]]:
        from src.models.content_marketplace import StudentContent, ContentStatus
        
        existing_contents = self.db.query(StudentContent).filter(
            StudentContent.institution_id == institution_id,
            StudentContent.id != exclude_content_id,
            StudentContent.status == ContentStatus.APPROVED
        ).all()
        
        results = []
        text_hash = self._compute_text_hash(text)
        
        for existing in existing_contents:
            existing_text = self._extract_text_for_checking(existing)
            similarity = self._calculate_similarity(text, existing_text)
            
            if similarity > 0.3:
                results.append({
                    'content_id': existing.id,
                    'title': existing.title,
                    'creator_id': existing.creator_student_id,
                    'similarity': round(similarity, 4),
                    'matched_segments': self._find_matching_segments(text, existing_text)
                })
        
        return sorted(results, key=lambda x: x['similarity'], reverse=True)
    
    def _check_external_sources(self, text: str) -> List[Dict[str, Any]]:
        results = []
        
        urls = re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', text)
        
        for url in urls[:5]:
            results.append({
                'source_type': 'url',
                'source': url,
                'detected_method': 'url_extraction'
            })
        
        return results
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        words1 = set(self._normalize_text(text1).split())
        words2 = set(self._normalize_text(text2).split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        jaccard_similarity = len(intersection) / len(union) if union else 0.0
        
        return jaccard_similarity
    
    def _normalize_text(self, text: str) -> str:
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def _compute_text_hash(self, text: str) -> str:
        normalized = self._normalize_text(text)
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def _find_matching_segments(self, text1: str, text2: str) -> List[Dict[str, str]]:
        words1 = text1.split()
        words2 = text2.split()
        
        segments = []
        window_size = 10
        
        for i in range(len(words1) - window_size + 1):
            segment1 = ' '.join(words1[i:i + window_size])
            
            for j in range(len(words2) - window_size + 1):
                segment2 = ' '.join(words2[j:j + window_size])
                
                if self._calculate_similarity(segment1, segment2) > 0.7:
                    segments.append({
                        'text': segment1,
                        'position': i,
                        'similarity': round(self._calculate_similarity(segment1, segment2), 4)
                    })
                    break
        
        return segments[:5]
    
    def _determine_plagiarism_status(self, similarity_score: float) -> PlagiarismStatus:
        if similarity_score >= 0.7:
            return PlagiarismStatus.FAILED
        elif similarity_score >= 0.5:
            return PlagiarismStatus.UNDER_REVIEW
        else:
            return PlagiarismStatus.PASSED
    
    def get_plagiarism_report(self, content_id: int):
        return self.plagiarism_repo.get_latest_by_content(content_id)
