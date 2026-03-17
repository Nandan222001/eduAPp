from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, JSON, Numeric
from sqlalchemy.orm import relationship
from src.database import Base


class ParentROIReport(Base):
    __tablename__ = "parent_roi_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    
    academic_year = Column(String(20), nullable=False, index=True)
    
    # Financial metrics
    fees_paid = Column(Numeric(10, 2), nullable=False)
    money_saved = Column(Numeric(10, 2), default=0.0, nullable=False)
    tuition_cost_avoidance = Column(Numeric(10, 2), default=0.0, nullable=False)
    
    # Performance metrics (JSON storing per-child data)
    performance_improvement = Column(JSON, nullable=False)
    
    # Time metrics
    time_saved_hours = Column(Float, default=0.0, nullable=False)
    
    # Platform usage metrics
    features_used = Column(JSON, nullable=False)
    engagement_score = Column(Float, nullable=False, index=True)
    
    # ROI calculation
    roi_percentage = Column(Float, nullable=False, index=True)
    
    # Metadata
    report_generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    parent = relationship("Parent")
    
    __table_args__ = (
        Index('idx_parent_roi_institution', 'institution_id'),
        Index('idx_parent_roi_parent', 'parent_id'),
        Index('idx_parent_roi_academic_year', 'academic_year'),
        Index('idx_parent_roi_roi_percentage', 'roi_percentage'),
        Index('idx_parent_roi_engagement_score', 'engagement_score'),
        Index('idx_parent_roi_parent_year', 'parent_id', 'academic_year'),
    )
