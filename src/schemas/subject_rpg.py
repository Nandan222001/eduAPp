from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class QuestTypeEnum(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BOSS_BATTLE = "boss_battle"
    CO_OP = "co_op"


class StudentCharacterBase(BaseModel):
    character_name: str
    avatar_url: Optional[str] = None


class StudentCharacterCreate(StudentCharacterBase):
    pass


class StudentCharacterUpdate(BaseModel):
    character_name: Optional[str] = None
    avatar_url: Optional[str] = None
    equipment: Optional[Dict[str, Any]] = None


class StudentCharacterResponse(StudentCharacterBase):
    id: int
    student_id: int
    level: int
    xp: int
    health: int
    mana: int
    equipment: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SubjectWorldBase(BaseModel):
    world_name: str
    chapters_as_regions: Dict[str, Any]


class SubjectWorldCreate(SubjectWorldBase):
    subject_id: int


class SubjectWorldResponse(SubjectWorldBase):
    id: int
    subject_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BattleSessionStart(BaseModel):
    chapter_id: int


class BattleAnswers(BaseModel):
    answers: Dict[str, Any]


class BattleSessionResponse(BaseModel):
    id: int
    student_id: int
    character_id: int
    chapter_id: Optional[int]
    boss_name: str
    questions: List[Dict[str, Any]]
    answers: Optional[Dict[str, Any]] = None
    score: float
    xp_earned: int
    loot: Optional[Dict[str, Any]] = None
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class BattleResultsResponse(BaseModel):
    battle_session: BattleSessionResponse
    results: Dict[str, Any]


class SubjectPassportResponse(BaseModel):
    id: int
    student_id: int
    subject_id: int
    stamps: List[Dict[str, Any]]
    overall_progress_percent: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class QuestLogBase(BaseModel):
    description: str
    target: int
    reward_xp: int
    reward_gold: int = 0


class QuestLogCreate(QuestLogBase):
    quest_type: QuestTypeEnum
    expires_hours: Optional[int] = None


class QuestLogResponse(QuestLogBase):
    id: int
    student_id: int
    character_id: int
    quest_type: QuestTypeEnum
    progress: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class QuestProgressUpdate(BaseModel):
    progress_increment: int = 1


class CoOpPartnerResponse(BaseModel):
    character_id: int
    character_name: str
    level: int
    avatar_url: Optional[str] = None
    avg_score: float
    total_battles: int


class LeaderboardEntry(BaseModel):
    rank: int
    character_name: str
    level: int
    total_xp: int
    avatar_url: Optional[str] = None


class CharacterStatsResponse(BaseModel):
    character: StudentCharacterResponse
    total_battles: int
    avg_score: float
    total_xp_earned: int
    active_quests: int
    completed_quests: int
