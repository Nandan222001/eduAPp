from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from src.models.research import (
    ProjectType, PublicationStatus, DataCollectionStatus, MilestoneStatus,
    TeamMemberRole, DocumentVisibility, FeedbackStatus, ReviewDecision
)


class TeamMemberData(BaseModel):
    student_id: int
    role: TeamMemberRole


class TimelineData(BaseModel):
    milestone_title: str
    milestone_description: Optional[str] = None
    deadline: datetime


class LiteratureReferenceBase(BaseModel):
    title: str
    authors: Optional[str] = None
    publication_year: Optional[int] = None
    source: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    citation_format: Optional[str] = None
    notes: Optional[str] = None


class LiteratureReferenceCreate(LiteratureReferenceBase):
    pass


class LiteratureReferenceResponse(LiteratureReferenceBase):
    id: int
    project_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ResearchTeamMemberResponse(BaseModel):
    id: int
    project_id: int
    student_id: int
    role: TeamMemberRole
    joined_at: datetime
    
    class Config:
        from_attributes = True


class ResearchMilestoneBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: datetime
    display_order: int = 0


class ResearchMilestoneCreate(ResearchMilestoneBase):
    pass


class ResearchMilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[MilestoneStatus] = None
    display_order: Optional[int] = None


class ResearchMilestoneResponse(ResearchMilestoneBase):
    id: int
    project_id: int
    status: MilestoneStatus
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ResearchProjectBase(BaseModel):
    project_title: str
    abstract: Optional[str] = None
    research_question: str
    hypothesis: Optional[str] = None
    methodology: Optional[str] = None
    subject_area: str
    project_type: ProjectType
    advisor_teacher_id: Optional[int] = None


class ResearchProjectCreate(ResearchProjectBase):
    institution_id: int
    team_members: List[TeamMemberData] = []
    timeline: List[TimelineData] = []
    literature_references: List[LiteratureReferenceCreate] = []


class ResearchProjectUpdate(BaseModel):
    project_title: Optional[str] = None
    abstract: Optional[str] = None
    research_question: Optional[str] = None
    hypothesis: Optional[str] = None
    methodology: Optional[str] = None
    subject_area: Optional[str] = None
    project_type: Optional[ProjectType] = None
    advisor_teacher_id: Optional[int] = None
    data_collection_status: Optional[DataCollectionStatus] = None
    findings: Optional[str] = None
    conclusion: Optional[str] = None
    presentation_url: Optional[str] = None
    publication_status: Optional[PublicationStatus] = None


class ResearchProjectResponse(ResearchProjectBase):
    id: int
    institution_id: int
    data_collection_status: DataCollectionStatus
    findings: Optional[str] = None
    conclusion: Optional[str] = None
    presentation_url: Optional[str] = None
    publication_status: PublicationStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ResearchProjectDetailResponse(ResearchProjectResponse):
    team_members: List[ResearchTeamMemberResponse] = []
    milestones: List[ResearchMilestoneResponse] = []
    literature_references: List[LiteratureReferenceResponse] = []


class ResearchDocumentBase(BaseModel):
    title: str
    content: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    visibility: DocumentVisibility = DocumentVisibility.TEAM


class ResearchDocumentCreate(ResearchDocumentBase):
    project_id: int


class ResearchDocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    visibility: Optional[DocumentVisibility] = None


class ResearchDocumentResponse(ResearchDocumentBase):
    id: int
    project_id: int
    created_by_student_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DocumentVersionResponse(BaseModel):
    id: int
    document_id: int
    version_number: int
    content: Optional[str] = None
    file_url: Optional[str] = None
    changes_summary: Optional[str] = None
    created_by_student_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class DocumentVersionCreate(BaseModel):
    changes_summary: Optional[str] = None
    content: Optional[str] = None
    file_url: Optional[str] = None


class ExperimentLogBase(BaseModel):
    experiment_title: str
    experiment_date: datetime
    procedure: Optional[str] = None
    observations: Optional[str] = None
    results: Optional[str] = None
    conclusion: Optional[str] = None


class ExperimentLogCreate(ExperimentLogBase):
    project_id: int


class ExperimentLogUpdate(BaseModel):
    experiment_title: Optional[str] = None
    experiment_date: Optional[datetime] = None
    procedure: Optional[str] = None
    observations: Optional[str] = None
    results: Optional[str] = None
    conclusion: Optional[str] = None


class ExperimentLogResponse(ExperimentLogBase):
    id: int
    project_id: int
    recorded_by_student_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ResearchDataFileBase(BaseModel):
    file_name: str
    file_url: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    description: Optional[str] = None


class ResearchDataFileCreate(ResearchDataFileBase):
    project_id: int


class ResearchDataFileResponse(ResearchDataFileBase):
    id: int
    project_id: int
    uploaded_by_student_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class AdvisorFeedbackBase(BaseModel):
    feedback_text: str
    feedback_type: Optional[str] = None


class AdvisorFeedbackCreate(AdvisorFeedbackBase):
    project_id: int


class AdvisorFeedbackUpdate(BaseModel):
    feedback_text: Optional[str] = None
    feedback_type: Optional[str] = None
    status: Optional[FeedbackStatus] = None


class AdvisorFeedbackResponse(AdvisorFeedbackBase):
    id: int
    project_id: int
    teacher_id: int
    status: FeedbackStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PeerReviewBase(BaseModel):
    review_text: str
    rating: Optional[int] = Field(None, ge=1, le=5)
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    suggestions: Optional[str] = None


class PeerReviewCreate(PeerReviewBase):
    project_id: int


class PeerReviewUpdate(BaseModel):
    review_text: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    decision: Optional[ReviewDecision] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    suggestions: Optional[str] = None


class PeerReviewResponse(PeerReviewBase):
    id: int
    project_id: int
    reviewer_student_id: int
    decision: ReviewDecision
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TeamMemberAddRequest(BaseModel):
    student_id: int
    role: TeamMemberRole


class ProjectShowcaseResponse(BaseModel):
    id: int
    project_title: str
    abstract: Optional[str] = None
    subject_area: str
    project_type: ProjectType
    publication_status: PublicationStatus
    presentation_url: Optional[str] = None
    created_at: datetime
    team_size: int = 0
    avg_rating: Optional[float] = None
    
    class Config:
        from_attributes = True


class FileUploadResponse(BaseModel):
    file_url: str
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
