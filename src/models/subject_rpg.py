from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, Enum, Float, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from src.database import Base


class QuestType(str, PyEnum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BOSS_BATTLE = "boss_battle"
    CO_OP = "co_op"


class StudentCharacter(Base):
    __tablename__ = "student_characters"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    character_name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    
    level = Column(Integer, default=1, nullable=False, index=True)
    xp = Column(Integer, default=0, nullable=False)
    health = Column(Integer, default=100, nullable=False)
    mana = Column(Integer, default=50, nullable=False)
    
    equipment = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    battle_sessions = relationship("BattleSession", back_populates="character", cascade="all, delete-orphan")
    quests = relationship("QuestLog", back_populates="character", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'student_id', name='uq_institution_student_character'),
        Index('idx_student_character_institution', 'institution_id'),
        Index('idx_student_character_student', 'student_id'),
        Index('idx_student_character_level', 'level'),
    )


class SubjectWorld(Base):
    __tablename__ = "subject_worlds"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    
    world_name = Column(String(200), nullable=False)
    chapters_as_regions = Column(JSON, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    subject = relationship("Subject")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'subject_id', name='uq_institution_subject_world'),
        Index('idx_subject_world_institution', 'institution_id'),
        Index('idx_subject_world_subject', 'subject_id'),
        Index('idx_subject_world_active', 'is_active'),
    )


class BattleSession(Base):
    __tablename__ = "battle_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    character_id = Column(Integer, ForeignKey('student_characters.id', ondelete='CASCADE'), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    
    boss_name = Column(String(200), nullable=False)
    questions = Column(JSON, nullable=False)
    answers = Column(JSON, nullable=True)
    
    score = Column(Float, default=0, nullable=False)
    xp_earned = Column(Integer, default=0, nullable=False)
    loot = Column(JSON, nullable=True)
    
    is_completed = Column(Boolean, default=False, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    character = relationship("StudentCharacter", back_populates="battle_sessions")
    chapter = relationship("Chapter")
    
    __table_args__ = (
        Index('idx_battle_session_institution', 'institution_id'),
        Index('idx_battle_session_student', 'student_id'),
        Index('idx_battle_session_character', 'character_id'),
        Index('idx_battle_session_chapter', 'chapter_id'),
        Index('idx_battle_session_completed', 'is_completed'),
        Index('idx_battle_session_created', 'created_at'),
    )


class SubjectPassport(Base):
    __tablename__ = "subject_passports"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    
    stamps = Column(JSON, nullable=False, default=list)
    overall_progress_percent = Column(Float, default=0.0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    subject = relationship("Subject")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'student_id', 'subject_id', name='uq_student_subject_passport'),
        Index('idx_subject_passport_institution', 'institution_id'),
        Index('idx_subject_passport_student', 'student_id'),
        Index('idx_subject_passport_subject', 'subject_id'),
        Index('idx_subject_passport_progress', 'overall_progress_percent'),
    )


class QuestLog(Base):
    __tablename__ = "quest_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    character_id = Column(Integer, ForeignKey('student_characters.id', ondelete='CASCADE'), nullable=False, index=True)
    
    quest_type = Column(Enum(QuestType), nullable=False, index=True)
    description = Column(Text, nullable=False)
    target = Column(Integer, nullable=False)
    progress = Column(Integer, default=0, nullable=False)
    reward_xp = Column(Integer, nullable=False)
    reward_gold = Column(Integer, default=0, nullable=False)
    
    is_completed = Column(Boolean, default=False, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    character = relationship("StudentCharacter", back_populates="quests")
    
    __table_args__ = (
        Index('idx_quest_log_institution', 'institution_id'),
        Index('idx_quest_log_student', 'student_id'),
        Index('idx_quest_log_character', 'character_id'),
        Index('idx_quest_log_type', 'quest_type'),
        Index('idx_quest_log_completed', 'is_completed'),
        Index('idx_quest_log_expires', 'expires_at'),
    )
