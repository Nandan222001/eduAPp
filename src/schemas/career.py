from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from decimal import Decimal


class CareerPathwayBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str
    category: str
    industry: str
    required_education: str
    optional_education: Optional[List[Dict[str, Any]]] = None
    required_skills: List[Dict[str, Any]]
    preferred_skills: Optional[List[Dict[str, Any]]] = None
    personality_match: Optional[List[Dict[str, Any]]] = None
    average_salary_min: Optional[Decimal] = None
    average_salary_max: Optional[Decimal] = None
    salary_currency: str = "USD"
    job_growth_rate: Optional[Decimal] = None
    demand_level: Optional[str] = None
    market_outlook: Optional[str] = None
    typical_courses: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[Dict[str, Any]]] = None
    extracurricular_activities: Optional[List[Dict[str, Any]]] = None
    work_environment: Optional[str] = None
    typical_tasks: Optional[List[str]] = None
    career_progression: Optional[List[Dict[str, Any]]] = None
    related_careers: Optional[List[str]] = None


class CareerPathwayCreate(CareerPathwayBase):
    institution_id: Optional[int] = None


class CareerPathwayUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    industry: Optional[str] = None
    required_education: Optional[str] = None
    optional_education: Optional[List[Dict[str, Any]]] = None
    required_skills: Optional[List[Dict[str, Any]]] = None
    preferred_skills: Optional[List[Dict[str, Any]]] = None
    personality_match: Optional[List[Dict[str, Any]]] = None
    average_salary_min: Optional[Decimal] = None
    average_salary_max: Optional[Decimal] = None
    job_growth_rate: Optional[Decimal] = None
    demand_level: Optional[str] = None
    market_outlook: Optional[str] = None
    typical_courses: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[Dict[str, Any]]] = None
    extracurricular_activities: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None


class CareerPathwayResponse(CareerPathwayBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class StudentCareerProfileBase(BaseModel):
    interests: Optional[List[Dict[str, Any]]] = None
    strengths: Optional[List[str]] = None
    personality_type: Optional[str] = None
    personality_assessment_data: Optional[Dict[str, Any]] = None
    current_skills: Optional[List[Dict[str, Any]]] = None
    skill_proficiency: Optional[Dict[str, str]] = None
    career_goals: Optional[List[str]] = None
    preferred_industries: Optional[List[str]] = None
    preferred_work_environment: Optional[List[str]] = None
    academic_performance_summary: Optional[Dict[str, Any]] = None
    top_subjects: Optional[List[Dict[str, Any]]] = None
    extracurricular_activities: Optional[List[Dict[str, Any]]] = None
    achievements: Optional[List[Dict[str, Any]]] = None
    work_experience: Optional[List[Dict[str, Any]]] = None
    volunteer_experience: Optional[List[Dict[str, Any]]] = None
    geographic_preferences: Optional[List[str]] = None
    salary_expectations: Optional[Dict[str, Any]] = None


class StudentCareerProfileCreate(StudentCareerProfileBase):
    student_id: int
    institution_id: int


class StudentCareerProfileUpdate(StudentCareerProfileBase):
    pass


class StudentCareerProfileResponse(StudentCareerProfileBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    profile_completeness: Decimal
    last_assessment_date: Optional[date] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CareerRecommendationBase(BaseModel):
    match_score: Decimal
    confidence_level: Decimal
    skill_match_score: Optional[Decimal] = None
    interest_match_score: Optional[Decimal] = None
    personality_match_score: Optional[Decimal] = None
    academic_match_score: Optional[Decimal] = None
    matching_factors: Optional[List[Dict[str, Any]]] = None
    recommendation_reasons: Optional[List[str]] = None
    estimated_preparation_time: Optional[str] = None
    difficulty_level: Optional[str] = None


class CareerRecommendationResponse(CareerRecommendationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_profile_id: int
    career_pathway_id: int
    status: str
    student_feedback: Optional[str] = None
    student_rating: Optional[int] = None
    rank: Optional[int] = None
    recommendation_date: date
    expires_at: Optional[date] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    career_pathway: Optional[CareerPathwayResponse] = None


class CareerRecommendationWithPathway(CareerRecommendationResponse):
    career_pathway: CareerPathwayResponse


class SkillGapAnalysisBase(BaseModel):
    required_skills: List[Dict[str, Any]]
    current_skills: List[Dict[str, Any]]
    skill_gaps: List[Dict[str, Any]]
    gap_severity: Optional[str] = None
    estimated_time_to_close: Optional[str] = None
    priority_skills: Optional[List[Dict[str, Any]]] = None
    foundational_skills: Optional[List[Dict[str, Any]]] = None
    advanced_skills: Optional[List[Dict[str, Any]]] = None
    recommended_actions: Optional[List[Dict[str, str]]] = None
    learning_resources: Optional[List[Dict[str, Any]]] = None


class SkillGapAnalysisResponse(SkillGapAnalysisBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_profile_id: int
    career_pathway_id: int
    analysis_date: date
    last_updated: datetime
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PersonalizedLearningPathBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    target_career: Optional[str] = None
    recommended_courses: List[Dict[str, Any]]
    recommended_certifications: Optional[List[Dict[str, Any]]] = None
    recommended_extracurriculars: Optional[List[Dict[str, Any]]] = None
    milestones: Optional[List[Dict[str, Any]]] = None
    timeline: Optional[Dict[str, Any]] = None
    difficulty_level: Optional[str] = None
    priority: int = 1


class PersonalizedLearningPathCreate(PersonalizedLearningPathBase):
    student_profile_id: int
    institution_id: int


class PersonalizedLearningPathUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    current_progress: Optional[Decimal] = None
    completed_items: Optional[List[Dict[str, Any]]] = None
    in_progress_items: Optional[List[Dict[str, Any]]] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None


class PersonalizedLearningPathResponse(PersonalizedLearningPathBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_profile_id: int
    current_progress: Decimal
    completed_items: Optional[List[Dict[str, Any]]] = None
    in_progress_items: Optional[List[Dict[str, Any]]] = None
    estimated_completion_date: Optional[date] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class LaborMarketDataBase(BaseModel):
    career_title: str = Field(..., max_length=200)
    occupation_code: Optional[str] = Field(None, max_length=50)
    industry: Optional[str] = Field(None, max_length=100)
    total_jobs: Optional[int] = None
    job_growth_rate: Optional[Decimal] = None
    projected_job_openings: Optional[int] = None
    median_salary: Optional[Decimal] = None
    salary_range_min: Optional[Decimal] = None
    salary_range_max: Optional[Decimal] = None
    top_skills_demand: Optional[List[Dict[str, Any]]] = None
    emerging_skills: Optional[List[str]] = None
    geographic_data: Optional[Dict[str, Any]] = None
    industry_trends: Optional[Dict[str, Any]] = None
    automation_risk: Optional[Decimal] = None
    remote_work_potential: Optional[Decimal] = None
    data_source: Optional[str] = None
    region: Optional[str] = None


class LaborMarketDataResponse(LaborMarketDataBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    data_collection_date: date
    is_active: bool
    created_at: datetime
    updated_at: datetime


class IndustryMentorBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    current_position: str = Field(..., max_length=200)
    company: str = Field(..., max_length=200)
    industry: str
    years_of_experience: Optional[int] = None
    expertise_areas: List[str]
    career_path: Optional[List[Dict[str, Any]]] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = Field(None, max_length=500)
    mentoring_capacity: int = 5
    preferred_communication: Optional[List[str]] = None
    availability_schedule: Optional[Dict[str, Any]] = None
    personality_type: Optional[str] = None
    mentoring_style: Optional[List[str]] = None


class IndustryMentorCreate(IndustryMentorBase):
    institution_id: Optional[int] = None


class IndustryMentorUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    current_position: Optional[str] = Field(None, max_length=200)
    company: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = None
    linkedin_url: Optional[str] = Field(None, max_length=500)
    mentoring_capacity: Optional[int] = None
    available_for_mentoring: Optional[bool] = None
    is_active: Optional[bool] = None


class IndustryMentorResponse(IndustryMentorBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: Optional[int] = None
    photo_url: Optional[str] = None
    current_mentees: int
    available_for_mentoring: bool
    total_mentorships: int
    average_rating: Optional[Decimal] = None
    is_active: bool
    is_verified: bool
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class IndustryMentorMatchBase(BaseModel):
    match_score: Decimal
    matching_criteria: Optional[List[Dict[str, Any]]] = None


class IndustryMentorMatchCreate(IndustryMentorMatchBase):
    student_profile_id: int
    mentor_id: int
    institution_id: int


class IndustryMentorMatchUpdate(BaseModel):
    status: Optional[str] = None
    goals: Optional[List[Dict[str, Any]]] = None
    meeting_frequency: Optional[str] = None
    progress_notes: Optional[List[Dict[str, Any]]] = None
    student_feedback: Optional[str] = None
    mentor_feedback: Optional[str] = None
    student_rating: Optional[int] = None
    mentor_rating: Optional[int] = None


class IndustryMentorMatchResponse(IndustryMentorMatchBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_profile_id: int
    mentor_id: int
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_weeks: Optional[int] = None
    goals: Optional[List[Dict[str, Any]]] = None
    meeting_frequency: Optional[str] = None
    total_meetings: int
    progress_notes: Optional[List[Dict[str, Any]]] = None
    student_feedback: Optional[str] = None
    mentor_feedback: Optional[str] = None
    student_rating: Optional[int] = None
    mentor_rating: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    mentor: Optional[IndustryMentorResponse] = None


class GenerateRecommendationsRequest(BaseModel):
    student_id: int
    institution_id: int
    top_n: int = 10


class SkillGapAnalysisRequest(BaseModel):
    student_id: int
    institution_id: int
    career_pathway_id: int


class CreateLearningPathRequest(BaseModel):
    student_id: int
    institution_id: int
    career_pathway_id: int


class MentorMatchRequest(BaseModel):
    student_id: int
    institution_id: int
    top_n: int = 5


class AcceptMentorMatchRequest(BaseModel):
    match_id: int
    goals: Optional[List[Dict[str, Any]]] = None
