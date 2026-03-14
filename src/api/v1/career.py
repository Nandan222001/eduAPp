from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from src.database import get_db
from src.schemas.career import (
    CareerPathwayCreate,
    CareerPathwayUpdate,
    CareerPathwayResponse,
    StudentCareerProfileCreate,
    StudentCareerProfileUpdate,
    StudentCareerProfileResponse,
    CareerRecommendationResponse,
    CareerRecommendationWithPathway,
    SkillGapAnalysisResponse,
    PersonalizedLearningPathCreate,
    PersonalizedLearningPathUpdate,
    PersonalizedLearningPathResponse,
    LaborMarketDataResponse,
    IndustryMentorCreate,
    IndustryMentorUpdate,
    IndustryMentorResponse,
    IndustryMentorMatchResponse,
    GenerateRecommendationsRequest,
    SkillGapAnalysisRequest,
    CreateLearningPathRequest,
    MentorMatchRequest,
    AcceptMentorMatchRequest,
)
from src.services.career_service import CareerService
from src.dependencies.auth import get_current_user
from src.models.user import User

router = APIRouter()


@router.post("/pathways", response_model=CareerPathwayResponse, status_code=status.HTTP_201_CREATED)
async def create_career_pathway(
    pathway_data: CareerPathwayCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    pathway_dict = pathway_data.model_dump()
    return service.create_career_pathway(pathway_dict)


@router.get("/pathways", response_model=List[CareerPathwayResponse])
async def list_career_pathways(
    category: Optional[str] = None,
    industry: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    return service.list_career_pathways(
        institution_id=current_user.institution_id,
        category=category,
        industry=industry,
        limit=limit,
        offset=offset
    )


@router.get("/pathways/{pathway_id}", response_model=CareerPathwayResponse)
async def get_career_pathway(
    pathway_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    pathway = service.get_career_pathway(pathway_id)
    if not pathway:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Career pathway not found"
        )
    return pathway


@router.put("/pathways/{pathway_id}", response_model=CareerPathwayResponse)
async def update_career_pathway(
    pathway_id: int,
    update_data: CareerPathwayUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    pathway = service.update_career_pathway(
        pathway_id,
        update_data.model_dump(exclude_unset=True)
    )
    if not pathway:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Career pathway not found"
        )
    return pathway


@router.post("/profiles", response_model=StudentCareerProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_student_career_profile(
    profile_data: StudentCareerProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    profile_dict = profile_data.model_dump(exclude={'student_id', 'institution_id'})
    return service.create_or_update_student_profile(
        student_id=profile_data.student_id,
        institution_id=profile_data.institution_id,
        profile_data=profile_dict
    )


@router.put("/profiles/{student_id}", response_model=StudentCareerProfileResponse)
async def update_student_career_profile(
    student_id: int,
    profile_data: StudentCareerProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    profile_dict = profile_data.model_dump(exclude_unset=True)
    return service.create_or_update_student_profile(
        student_id=student_id,
        institution_id=current_user.institution_id,
        profile_data=profile_dict
    )


@router.get("/profiles/{student_id}", response_model=StudentCareerProfileResponse)
async def get_student_career_profile(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    profile = service.get_student_profile(student_id, current_user.institution_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student career profile not found"
        )
    return profile


@router.post("/recommendations/generate", response_model=List[CareerRecommendationResponse])
async def generate_career_recommendations(
    request: GenerateRecommendationsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    return service.generate_career_recommendations(
        student_id=request.student_id,
        institution_id=request.institution_id,
        top_n=request.top_n
    )


@router.get("/recommendations/{student_id}", response_model=List[CareerRecommendationWithPathway])
async def get_student_recommendations(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    return service.get_student_recommendations(
        student_id=student_id,
        institution_id=current_user.institution_id
    )


@router.post("/skill-gap/analyze", response_model=SkillGapAnalysisResponse)
async def analyze_skill_gap(
    request: SkillGapAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    return service.analyze_skill_gap(
        student_id=request.student_id,
        institution_id=request.institution_id,
        career_pathway_id=request.career_pathway_id
    )


@router.post("/learning-paths", response_model=PersonalizedLearningPathResponse, status_code=status.HTTP_201_CREATED)
async def create_learning_path(
    request: CreateLearningPathRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    return service.create_personalized_learning_path(
        student_id=request.student_id,
        institution_id=request.institution_id,
        career_pathway_id=request.career_pathway_id
    )


@router.get("/learning-paths/{student_id}", response_model=List[PersonalizedLearningPathResponse])
async def get_student_learning_paths(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    return service.get_student_learning_paths(
        student_id=student_id,
        institution_id=current_user.institution_id
    )


@router.put("/learning-paths/{path_id}", response_model=PersonalizedLearningPathResponse)
async def update_learning_path(
    path_id: int,
    update_data: PersonalizedLearningPathUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from src.models.career import PersonalizedLearningPath
    
    db_path = db.query(PersonalizedLearningPath).filter(
        PersonalizedLearningPath.id == path_id,
        PersonalizedLearningPath.institution_id == current_user.institution_id
    ).first()
    
    if not db_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found"
        )
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(db_path, key, value)
    
    db.commit()
    db.refresh(db_path)
    return db_path


@router.get("/labor-market/{career_pathway_id}", response_model=dict)
async def get_labor_market_data(
    career_pathway_id: int,
    api_endpoint: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    data = service.fetch_labor_market_trends(
        career_pathway_id=career_pathway_id,
        api_endpoint=api_endpoint
    )
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Labor market data not available"
        )
    return data


@router.post("/mentors", response_model=IndustryMentorResponse, status_code=status.HTTP_201_CREATED)
async def create_industry_mentor(
    mentor_data: IndustryMentorCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    mentor_dict = mentor_data.model_dump()
    return service.create_industry_mentor(mentor_dict)


@router.get("/mentors", response_model=List[IndustryMentorResponse])
async def list_industry_mentors(
    industry: Optional[str] = None,
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    return service.list_available_mentors(
        institution_id=current_user.institution_id,
        industry=industry,
        limit=limit
    )


@router.get("/mentors/{mentor_id}", response_model=IndustryMentorResponse)
async def get_industry_mentor(
    mentor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    mentor = service.get_industry_mentor(mentor_id)
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Industry mentor not found"
        )
    return mentor


@router.post("/mentor-matches", response_model=List[IndustryMentorMatchResponse])
async def match_with_mentors(
    request: MentorMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    return service.match_student_with_mentors(
        student_id=request.student_id,
        institution_id=request.institution_id,
        top_n=request.top_n
    )


@router.post("/mentor-matches/accept", response_model=IndustryMentorMatchResponse)
async def accept_mentor_match(
    request: AcceptMentorMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    return service.accept_mentor_match(
        match_id=request.match_id,
        goals=request.goals
    )


@router.get("/mentor-matches/{student_id}", response_model=List[IndustryMentorMatchResponse])
async def get_student_mentor_matches(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CareerService(db)
    return service.get_student_mentor_matches(
        student_id=student_id,
        institution_id=current_user.institution_id
    )
