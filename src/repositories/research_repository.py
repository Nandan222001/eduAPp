from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from datetime import datetime
from src.models.research import (
    ResearchProject, ResearchTeamMember, ResearchMilestone, LiteratureReference,
    ResearchDocument, DocumentVersion, ExperimentLog, ResearchDataFile,
    AdvisorFeedback, PeerReview, ProjectType, PublicationStatus,
    DataCollectionStatus, MilestoneStatus
)


class ResearchProjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> ResearchProject:
        project = ResearchProject(**kwargs)
        self.db.add(project)
        self.db.flush()
        return project

    def get_by_id(self, project_id: int) -> Optional[ResearchProject]:
        return self.db.query(ResearchProject).filter(ResearchProject.id == project_id).first()

    def get_with_details(self, project_id: int) -> Optional[ResearchProject]:
        return self.db.query(ResearchProject).options(
            joinedload(ResearchProject.team_members),
            joinedload(ResearchProject.milestones),
            joinedload(ResearchProject.literature_references)
        ).filter(ResearchProject.id == project_id).first()

    def list_by_institution(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        subject_area: Optional[str] = None,
        project_type: Optional[ProjectType] = None,
        publication_status: Optional[PublicationStatus] = None,
        advisor_id: Optional[int] = None,
        student_id: Optional[int] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[ResearchProject]:
        query = self.db.query(ResearchProject).filter(
            ResearchProject.institution_id == institution_id
        )

        if subject_area:
            query = query.filter(ResearchProject.subject_area == subject_area)

        if project_type:
            query = query.filter(ResearchProject.project_type == project_type)

        if publication_status:
            query = query.filter(ResearchProject.publication_status == publication_status)

        if advisor_id:
            query = query.filter(ResearchProject.advisor_teacher_id == advisor_id)

        if student_id:
            query = query.join(ResearchTeamMember).filter(
                ResearchTeamMember.student_id == student_id
            )

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    ResearchProject.project_title.ilike(search_pattern),
                    ResearchProject.abstract.ilike(search_pattern),
                    ResearchProject.research_question.ilike(search_pattern)
                )
            )

        if is_active is not None:
            query = query.filter(ResearchProject.is_active == is_active)

        return query.order_by(ResearchProject.created_at.desc()).offset(skip).limit(limit).all()

    def count_by_institution(
        self,
        institution_id: int,
        subject_area: Optional[str] = None,
        project_type: Optional[ProjectType] = None,
        publication_status: Optional[PublicationStatus] = None,
        advisor_id: Optional[int] = None,
        student_id: Optional[int] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> int:
        query = self.db.query(func.count(ResearchProject.id)).filter(
            ResearchProject.institution_id == institution_id
        )

        if subject_area:
            query = query.filter(ResearchProject.subject_area == subject_area)

        if project_type:
            query = query.filter(ResearchProject.project_type == project_type)

        if publication_status:
            query = query.filter(ResearchProject.publication_status == publication_status)

        if advisor_id:
            query = query.filter(ResearchProject.advisor_teacher_id == advisor_id)

        if student_id:
            query = query.join(ResearchTeamMember).filter(
                ResearchTeamMember.student_id == student_id
            )

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    ResearchProject.project_title.ilike(search_pattern),
                    ResearchProject.abstract.ilike(search_pattern),
                    ResearchProject.research_question.ilike(search_pattern)
                )
            )

        if is_active is not None:
            query = query.filter(ResearchProject.is_active == is_active)

        return query.scalar()

    def update(self, project_id: int, **kwargs) -> Optional[ResearchProject]:
        project = self.get_by_id(project_id)
        if project:
            for key, value in kwargs.items():
                if value is not None:
                    setattr(project, key, value)
            project.updated_at = datetime.utcnow()
            self.db.flush()
        return project

    def delete(self, project_id: int) -> bool:
        project = self.get_by_id(project_id)
        if project:
            self.db.delete(project)
            self.db.flush()
            return True
        return False


class ResearchTeamMemberRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> ResearchTeamMember:
        member = ResearchTeamMember(**kwargs)
        self.db.add(member)
        self.db.flush()
        return member

    def get_by_id(self, member_id: int) -> Optional[ResearchTeamMember]:
        return self.db.query(ResearchTeamMember).filter(ResearchTeamMember.id == member_id).first()

    def list_by_project(self, project_id: int) -> List[ResearchTeamMember]:
        return self.db.query(ResearchTeamMember).filter(
            ResearchTeamMember.project_id == project_id
        ).all()

    def get_by_project_and_student(self, project_id: int, student_id: int) -> Optional[ResearchTeamMember]:
        return self.db.query(ResearchTeamMember).filter(
            ResearchTeamMember.project_id == project_id,
            ResearchTeamMember.student_id == student_id
        ).first()

    def delete(self, member_id: int) -> bool:
        member = self.get_by_id(member_id)
        if member:
            self.db.delete(member)
            self.db.flush()
            return True
        return False


class ResearchMilestoneRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> ResearchMilestone:
        milestone = ResearchMilestone(**kwargs)
        self.db.add(milestone)
        self.db.flush()
        return milestone

    def get_by_id(self, milestone_id: int) -> Optional[ResearchMilestone]:
        return self.db.query(ResearchMilestone).filter(ResearchMilestone.id == milestone_id).first()

    def list_by_project(self, project_id: int) -> List[ResearchMilestone]:
        return self.db.query(ResearchMilestone).filter(
            ResearchMilestone.project_id == project_id
        ).order_by(ResearchMilestone.display_order, ResearchMilestone.deadline).all()

    def get_overdue_milestones(self, project_id: int) -> List[ResearchMilestone]:
        return self.db.query(ResearchMilestone).filter(
            ResearchMilestone.project_id == project_id,
            ResearchMilestone.deadline < datetime.utcnow(),
            ResearchMilestone.status != MilestoneStatus.COMPLETED
        ).all()

    def update(self, milestone_id: int, **kwargs) -> Optional[ResearchMilestone]:
        milestone = self.get_by_id(milestone_id)
        if milestone:
            for key, value in kwargs.items():
                if value is not None:
                    setattr(milestone, key, value)
            milestone.updated_at = datetime.utcnow()
            self.db.flush()
        return milestone

    def delete(self, milestone_id: int) -> bool:
        milestone = self.get_by_id(milestone_id)
        if milestone:
            self.db.delete(milestone)
            self.db.flush()
            return True
        return False


class LiteratureReferenceRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> LiteratureReference:
        reference = LiteratureReference(**kwargs)
        self.db.add(reference)
        self.db.flush()
        return reference

    def get_by_id(self, reference_id: int) -> Optional[LiteratureReference]:
        return self.db.query(LiteratureReference).filter(LiteratureReference.id == reference_id).first()

    def list_by_project(self, project_id: int) -> List[LiteratureReference]:
        return self.db.query(LiteratureReference).filter(
            LiteratureReference.project_id == project_id
        ).order_by(LiteratureReference.created_at.desc()).all()

    def delete(self, reference_id: int) -> bool:
        reference = self.get_by_id(reference_id)
        if reference:
            self.db.delete(reference)
            self.db.flush()
            return True
        return False


class ResearchDocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> ResearchDocument:
        document = ResearchDocument(**kwargs)
        self.db.add(document)
        self.db.flush()
        return document

    def get_by_id(self, document_id: int) -> Optional[ResearchDocument]:
        return self.db.query(ResearchDocument).filter(ResearchDocument.id == document_id).first()

    def get_with_versions(self, document_id: int) -> Optional[ResearchDocument]:
        return self.db.query(ResearchDocument).options(
            joinedload(ResearchDocument.versions)
        ).filter(ResearchDocument.id == document_id).first()

    def list_by_project(self, project_id: int) -> List[ResearchDocument]:
        return self.db.query(ResearchDocument).filter(
            ResearchDocument.project_id == project_id
        ).order_by(ResearchDocument.created_at.desc()).all()

    def update(self, document_id: int, **kwargs) -> Optional[ResearchDocument]:
        document = self.get_by_id(document_id)
        if document:
            for key, value in kwargs.items():
                if value is not None:
                    setattr(document, key, value)
            document.updated_at = datetime.utcnow()
            self.db.flush()
        return document

    def delete(self, document_id: int) -> bool:
        document = self.get_by_id(document_id)
        if document:
            self.db.delete(document)
            self.db.flush()
            return True
        return False


class DocumentVersionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> DocumentVersion:
        version = DocumentVersion(**kwargs)
        self.db.add(version)
        self.db.flush()
        return version

    def get_by_id(self, version_id: int) -> Optional[DocumentVersion]:
        return self.db.query(DocumentVersion).filter(DocumentVersion.id == version_id).first()

    def list_by_document(self, document_id: int) -> List[DocumentVersion]:
        return self.db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document_id
        ).order_by(DocumentVersion.version_number.desc()).all()

    def get_latest_version_number(self, document_id: int) -> int:
        result = self.db.query(func.max(DocumentVersion.version_number)).filter(
            DocumentVersion.document_id == document_id
        ).scalar()
        return result or 0


class ExperimentLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> ExperimentLog:
        log = ExperimentLog(**kwargs)
        self.db.add(log)
        self.db.flush()
        return log

    def get_by_id(self, log_id: int) -> Optional[ExperimentLog]:
        return self.db.query(ExperimentLog).filter(ExperimentLog.id == log_id).first()

    def list_by_project(self, project_id: int) -> List[ExperimentLog]:
        return self.db.query(ExperimentLog).filter(
            ExperimentLog.project_id == project_id
        ).order_by(ExperimentLog.experiment_date.desc()).all()

    def update(self, log_id: int, **kwargs) -> Optional[ExperimentLog]:
        log = self.get_by_id(log_id)
        if log:
            for key, value in kwargs.items():
                if value is not None:
                    setattr(log, key, value)
            log.updated_at = datetime.utcnow()
            self.db.flush()
        return log

    def delete(self, log_id: int) -> bool:
        log = self.get_by_id(log_id)
        if log:
            self.db.delete(log)
            self.db.flush()
            return True
        return False


class ResearchDataFileRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> ResearchDataFile:
        data_file = ResearchDataFile(**kwargs)
        self.db.add(data_file)
        self.db.flush()
        return data_file

    def get_by_id(self, file_id: int) -> Optional[ResearchDataFile]:
        return self.db.query(ResearchDataFile).filter(ResearchDataFile.id == file_id).first()

    def list_by_project(self, project_id: int) -> List[ResearchDataFile]:
        return self.db.query(ResearchDataFile).filter(
            ResearchDataFile.project_id == project_id
        ).order_by(ResearchDataFile.created_at.desc()).all()

    def delete(self, file_id: int) -> bool:
        data_file = self.get_by_id(file_id)
        if data_file:
            self.db.delete(data_file)
            self.db.flush()
            return True
        return False


class AdvisorFeedbackRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> AdvisorFeedback:
        feedback = AdvisorFeedback(**kwargs)
        self.db.add(feedback)
        self.db.flush()
        return feedback

    def get_by_id(self, feedback_id: int) -> Optional[AdvisorFeedback]:
        return self.db.query(AdvisorFeedback).filter(AdvisorFeedback.id == feedback_id).first()

    def list_by_project(self, project_id: int) -> List[AdvisorFeedback]:
        return self.db.query(AdvisorFeedback).filter(
            AdvisorFeedback.project_id == project_id
        ).order_by(AdvisorFeedback.created_at.desc()).all()

    def update(self, feedback_id: int, **kwargs) -> Optional[AdvisorFeedback]:
        feedback = self.get_by_id(feedback_id)
        if feedback:
            for key, value in kwargs.items():
                if value is not None:
                    setattr(feedback, key, value)
            feedback.updated_at = datetime.utcnow()
            self.db.flush()
        return feedback

    def delete(self, feedback_id: int) -> bool:
        feedback = self.get_by_id(feedback_id)
        if feedback:
            self.db.delete(feedback)
            self.db.flush()
            return True
        return False


class PeerReviewRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> PeerReview:
        review = PeerReview(**kwargs)
        self.db.add(review)
        self.db.flush()
        return review

    def get_by_id(self, review_id: int) -> Optional[PeerReview]:
        return self.db.query(PeerReview).filter(PeerReview.id == review_id).first()

    def list_by_project(self, project_id: int) -> List[PeerReview]:
        return self.db.query(PeerReview).filter(
            PeerReview.project_id == project_id
        ).order_by(PeerReview.created_at.desc()).all()

    def get_by_reviewer(self, project_id: int, reviewer_id: int) -> Optional[PeerReview]:
        return self.db.query(PeerReview).filter(
            PeerReview.project_id == project_id,
            PeerReview.reviewer_student_id == reviewer_id
        ).first()

    def get_average_rating(self, project_id: int) -> Optional[float]:
        result = self.db.query(func.avg(PeerReview.rating)).filter(
            PeerReview.project_id == project_id,
            PeerReview.rating.isnot(None)
        ).scalar()
        return float(result) if result else None

    def update(self, review_id: int, **kwargs) -> Optional[PeerReview]:
        review = self.get_by_id(review_id)
        if review:
            for key, value in kwargs.items():
                if value is not None:
                    setattr(review, key, value)
            review.updated_at = datetime.utcnow()
            self.db.flush()
        return review

    def delete(self, review_id: int) -> bool:
        review = self.get_by_id(review_id)
        if review:
            self.db.delete(review)
            self.db.flush()
            return True
        return False
