from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.models.previous_year_papers import Board
from src.schemas.previous_year_papers import (
    TopicPredictionResponse,
    TopicPredictionRankingResponse,
    AnalysisRequest,
    AnalysisResponse
)
from src.services.board_exam_prediction_service import BoardExamPredictionService

router = APIRouter(prefix="/board-exam-predictions", tags=["Board Exam Predictions"])


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_exam_patterns(
    request: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = BoardExamPredictionService(db)
    
    result = await service.analyze_and_predict(
        institution_id=current_user.institution_id,
        board=request.board,
        grade_id=request.grade_id,
        subject_id=request.subject_id,
        year_start=request.year_start,
        year_end=request.year_end
    )
    
    return result


@router.get("/predictions", response_model=List[TopicPredictionResponse])
def get_topic_predictions(
    board: Board,
    grade_id: int,
    subject_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    order_by: str = Query("probability_score", regex="^(probability_score|prediction_rank|frequency_count|total_marks|years_since_last_appearance)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = BoardExamPredictionService(db)
    
    predictions, total = service.get_predictions(
        institution_id=current_user.institution_id,
        board=board,
        grade_id=grade_id,
        subject_id=subject_id,
        skip=skip,
        limit=limit,
        order_by=order_by
    )
    
    return predictions


@router.get("/top-predictions", response_model=List[TopicPredictionRankingResponse])
def get_top_topic_predictions(
    board: Board,
    grade_id: int,
    subject_id: int,
    top_n: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = BoardExamPredictionService(db)
    
    predictions = service.get_top_predictions(
        institution_id=current_user.institution_id,
        board=board,
        grade_id=grade_id,
        subject_id=subject_id,
        top_n=top_n
    )
    
    return predictions


@router.get("/due-topics", response_model=List[TopicPredictionRankingResponse])
def get_due_topics(
    board: Board,
    grade_id: int,
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = BoardExamPredictionService(db)
    
    predictions = service.get_due_topics(
        institution_id=current_user.institution_id,
        board=board,
        grade_id=grade_id,
        subject_id=subject_id
    )
    
    return predictions


@router.get("/by-chapter/{chapter_id}", response_model=List[TopicPredictionRankingResponse])
def get_predictions_by_chapter(
    chapter_id: int,
    board: Board,
    grade_id: int,
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = BoardExamPredictionService(db)
    
    predictions = service.get_by_chapter(
        institution_id=current_user.institution_id,
        board=board,
        grade_id=grade_id,
        subject_id=subject_id,
        chapter_id=chapter_id
    )
    
    return predictions


@router.get("/summary")
def get_analysis_summary(
    board: Board,
    grade_id: int,
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = BoardExamPredictionService(db)
    
    summary = service.get_analysis_summary(
        institution_id=current_user.institution_id,
        board=board,
        grade_id=grade_id,
        subject_id=subject_id
    )
    
    return summary
