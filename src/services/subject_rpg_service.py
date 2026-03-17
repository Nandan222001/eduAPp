from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import random
import json

from src.models.subject_rpg import (
    StudentCharacter, SubjectWorld, BattleSession, SubjectPassport, QuestLog, QuestType
)
from src.models.previous_year_papers import QuestionBank, DifficultyLevel
from src.models.gamification import UserPoints
from src.models.student import Student
from src.models.academic import Chapter


class SubjectRPGService:
    
    @staticmethod
    def get_or_create_character(db: Session, student_id: int, institution_id: int) -> StudentCharacter:
        character = db.query(StudentCharacter).filter(
            StudentCharacter.student_id == student_id,
            StudentCharacter.institution_id == institution_id
        ).first()
        
        if not character:
            student = db.query(Student).filter(Student.id == student_id).first()
            character_name = f"{student.first_name}'s Hero" if student else "Hero"
            
            character = StudentCharacter(
                institution_id=institution_id,
                student_id=student_id,
                character_name=character_name,
                level=1,
                xp=0,
                health=100,
                mana=50,
                equipment={
                    "weapon": {"name": "Wooden Sword", "power": 5},
                    "armor": {"name": "Cloth Armor", "defense": 3},
                    "accessory": {"name": "Basic Ring", "bonus": 1}
                }
            )
            db.add(character)
            db.commit()
            db.refresh(character)
        
        return character
    
    @staticmethod
    def update_character(
        db: Session, 
        character_id: int, 
        character_name: Optional[str] = None,
        avatar_url: Optional[str] = None,
        equipment: Optional[Dict] = None
    ) -> StudentCharacter:
        character = db.query(StudentCharacter).filter(StudentCharacter.id == character_id).first()
        if not character:
            return None
        
        if character_name:
            character.character_name = character_name
        if avatar_url:
            character.avatar_url = avatar_url
        if equipment:
            character.equipment = equipment
        
        db.commit()
        db.refresh(character)
        return character
    
    @staticmethod
    def get_or_create_subject_world(
        db: Session, 
        subject_id: int, 
        institution_id: int,
        world_name: Optional[str] = None
    ) -> SubjectWorld:
        world = db.query(SubjectWorld).filter(
            SubjectWorld.subject_id == subject_id,
            SubjectWorld.institution_id == institution_id
        ).first()
        
        if not world:
            chapters = db.query(Chapter).filter(
                Chapter.subject_id == subject_id,
                Chapter.institution_id == institution_id,
                Chapter.is_active == True
            ).order_by(Chapter.display_order).all()
            
            chapters_as_regions = {}
            for chapter in chapters:
                chapters_as_regions[str(chapter.id)] = {
                    "name": chapter.name,
                    "description": chapter.description or f"Explore the realm of {chapter.name}",
                    "boss": f"{chapter.name} Guardian",
                    "region_level": chapter.display_order,
                    "unlocked": chapter.display_order == 1
                }
            
            world = SubjectWorld(
                institution_id=institution_id,
                subject_id=subject_id,
                world_name=world_name or f"World of Knowledge",
                chapters_as_regions=chapters_as_regions,
                is_active=True
            )
            db.add(world)
            db.commit()
            db.refresh(world)
        
        return world
    
    @staticmethod
    def generate_battle_questions(
        db: Session,
        institution_id: int,
        chapter_id: int,
        num_questions: int = 5,
        difficulty_mix: Optional[Dict[str, int]] = None
    ) -> List[Dict[str, Any]]:
        if not difficulty_mix:
            difficulty_mix = {
                DifficultyLevel.EASY.value: 2,
                DifficultyLevel.MEDIUM.value: 2,
                DifficultyLevel.HARD.value: 1
            }
        
        questions = []
        
        for difficulty, count in difficulty_mix.items():
            db_questions = db.query(QuestionBank).filter(
                QuestionBank.institution_id == institution_id,
                QuestionBank.chapter_id == chapter_id,
                QuestionBank.difficulty_level == difficulty,
                QuestionBank.is_active == True
            ).limit(count * 2).all()
            
            selected = random.sample(db_questions, min(count, len(db_questions)))
            
            for q in selected:
                questions.append({
                    "question_id": q.id,
                    "question_text": q.question_text,
                    "question_type": q.question_type.value,
                    "difficulty": q.difficulty_level.value,
                    "options": q.options,
                    "correct_option": q.correct_option,
                    "marks": q.marks or 1.0,
                    "image_url": q.image_url
                })
        
        return questions[:num_questions]
    
    @staticmethod
    def start_battle_session(
        db: Session,
        institution_id: int,
        student_id: int,
        chapter_id: int,
        character_id: int
    ) -> BattleSession:
        chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
        boss_name = f"{chapter.name} Boss" if chapter else "Chapter Boss"
        
        questions = SubjectRPGService.generate_battle_questions(
            db, institution_id, chapter_id, num_questions=5
        )
        
        session = BattleSession(
            institution_id=institution_id,
            student_id=student_id,
            character_id=character_id,
            chapter_id=chapter_id,
            boss_name=boss_name,
            questions=questions,
            answers={},
            score=0,
            xp_earned=0,
            loot={},
            is_completed=False
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        return session
    
    @staticmethod
    def complete_battle_session(
        db: Session,
        battle_session_id: int,
        answers: Dict[str, Any]
    ) -> Dict[str, Any]:
        session = db.query(BattleSession).filter(BattleSession.id == battle_session_id).first()
        if not session or session.is_completed:
            return None
        
        session.answers = answers
        
        correct_count = 0
        total_marks = 0
        earned_marks = 0
        
        for question in session.questions:
            q_id = str(question['question_id'])
            total_marks += question.get('marks', 1.0)
            
            if q_id in answers:
                user_answer = answers[q_id]
                correct_answer = question.get('correct_option')
                
                if user_answer == correct_answer:
                    correct_count += 1
                    earned_marks += question.get('marks', 1.0)
        
        session.score = (earned_marks / total_marks * 100) if total_marks > 0 else 0
        
        xp_earned = SubjectRPGService.calculate_xp(
            score=session.score,
            num_questions=len(session.questions),
            difficulty_bonus=1.5
        )
        session.xp_earned = xp_earned
        
        loot = SubjectRPGService.generate_loot(db, session.student_id, session.institution_id, session.score)
        session.loot = loot
        
        session.is_completed = True
        session.completed_at = datetime.utcnow()
        
        character = db.query(StudentCharacter).filter(StudentCharacter.id == session.character_id).first()
        if character:
            character.xp += xp_earned
            new_level = SubjectRPGService.calculate_level(character.xp)
            if new_level > character.level:
                character.level = new_level
                character.health += 10
                character.mana += 5
        
        if session.score >= 70:
            SubjectRPGService.update_passport_stamp(
                db, session.student_id, session.institution_id, session.chapter_id, session.score
            )
        
        db.commit()
        db.refresh(session)
        
        return {
            "battle_session": session,
            "results": {
                "score": session.score,
                "correct_answers": correct_count,
                "total_questions": len(session.questions),
                "xp_earned": xp_earned,
                "loot": loot,
                "level_up": new_level > character.level if character else False
            }
        }
    
    @staticmethod
    def calculate_xp(score: float, num_questions: int, difficulty_bonus: float = 1.0) -> int:
        base_xp = num_questions * 10
        score_multiplier = score / 100
        total_xp = int(base_xp * score_multiplier * difficulty_bonus)
        return max(total_xp, 10)
    
    @staticmethod
    def calculate_level(xp: int) -> int:
        level = 1
        xp_required = 100
        current_xp = xp
        
        while current_xp >= xp_required:
            level += 1
            current_xp -= xp_required
            xp_required = int(xp_required * 1.5)
        
        return level
    
    @staticmethod
    def generate_loot(db: Session, student_id: int, institution_id: int, score: float) -> Dict[str, Any]:
        loot = {
            "gold": 0,
            "items": [],
            "gamification_points": 0
        }
        
        gold = int(score / 10) * 5
        loot["gold"] = gold
        
        if score >= 90:
            loot["items"].append({"name": "Epic Sword", "type": "weapon", "power": 20, "rarity": "epic"})
        elif score >= 70:
            loot["items"].append({"name": "Steel Shield", "type": "armor", "defense": 15, "rarity": "rare"})
        else:
            loot["items"].append({"name": "Health Potion", "type": "consumable", "healing": 20, "rarity": "common"})
        
        user_points = db.query(UserPoints).filter(
            UserPoints.user_id == student_id,
            UserPoints.institution_id == institution_id
        ).first()
        
        if user_points:
            gamification_points = int(score / 10) * 2
            loot["gamification_points"] = gamification_points
        
        return loot
    
    @staticmethod
    def update_passport_stamp(
        db: Session,
        student_id: int,
        institution_id: int,
        chapter_id: int,
        score: float
    ):
        chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
        if not chapter:
            return
        
        passport = db.query(SubjectPassport).filter(
            SubjectPassport.student_id == student_id,
            SubjectPassport.subject_id == chapter.subject_id,
            SubjectPassport.institution_id == institution_id
        ).first()
        
        if not passport:
            passport = SubjectPassport(
                institution_id=institution_id,
                student_id=student_id,
                subject_id=chapter.subject_id,
                stamps=[],
                overall_progress_percent=0.0
            )
            db.add(passport)
        
        stamps = passport.stamps if isinstance(passport.stamps, list) else []
        
        mastery_level = "master" if score >= 90 else "proficient" if score >= 70 else "beginner"
        
        existing_stamp = None
        for stamp in stamps:
            if stamp.get("chapter_id") == chapter_id:
                existing_stamp = stamp
                break
        
        new_stamp = {
            "chapter_id": chapter_id,
            "chapter_name": chapter.name,
            "completion_date": datetime.utcnow().isoformat(),
            "mastery_level": mastery_level,
            "score": score,
            "special_visas": []
        }
        
        if score >= 95:
            new_stamp["special_visas"].append("Perfect Score")
        if score == 100:
            new_stamp["special_visas"].append("Flawless Victory")
        
        if existing_stamp:
            stamps.remove(existing_stamp)
        stamps.append(new_stamp)
        
        passport.stamps = stamps
        
        total_chapters = db.query(Chapter).filter(
            Chapter.subject_id == chapter.subject_id,
            Chapter.institution_id == institution_id,
            Chapter.is_active == True
        ).count()
        
        completed_chapters = len([s for s in stamps if s.get("mastery_level") in ["proficient", "master"]])
        passport.overall_progress_percent = (completed_chapters / total_chapters * 100) if total_chapters > 0 else 0
        
        db.commit()
    
    @staticmethod
    def get_passport(db: Session, student_id: int, subject_id: int, institution_id: int) -> SubjectPassport:
        passport = db.query(SubjectPassport).filter(
            SubjectPassport.student_id == student_id,
            SubjectPassport.subject_id == subject_id,
            SubjectPassport.institution_id == institution_id
        ).first()
        
        if not passport:
            passport = SubjectPassport(
                institution_id=institution_id,
                student_id=student_id,
                subject_id=subject_id,
                stamps=[],
                overall_progress_percent=0.0
            )
            db.add(passport)
            db.commit()
            db.refresh(passport)
        
        return passport
    
    @staticmethod
    def create_quest(
        db: Session,
        institution_id: int,
        student_id: int,
        character_id: int,
        quest_type: QuestType,
        description: str,
        target: int,
        reward_xp: int,
        reward_gold: int = 0,
        expires_hours: Optional[int] = None
    ) -> QuestLog:
        expires_at = None
        if expires_hours:
            expires_at = datetime.utcnow() + timedelta(hours=expires_hours)
        
        quest = QuestLog(
            institution_id=institution_id,
            student_id=student_id,
            character_id=character_id,
            quest_type=quest_type,
            description=description,
            target=target,
            progress=0,
            reward_xp=reward_xp,
            reward_gold=reward_gold,
            expires_at=expires_at,
            is_completed=False
        )
        
        db.add(quest)
        db.commit()
        db.refresh(quest)
        return quest
    
    @staticmethod
    def update_quest_progress(db: Session, quest_id: int, progress_increment: int = 1) -> QuestLog:
        quest = db.query(QuestLog).filter(QuestLog.id == quest_id).first()
        if not quest or quest.is_completed:
            return None
        
        quest.progress += progress_increment
        
        if quest.progress >= quest.target:
            quest.progress = quest.target
            quest.is_completed = True
            quest.completed_at = datetime.utcnow()
            
            character = db.query(StudentCharacter).filter(StudentCharacter.id == quest.character_id).first()
            if character:
                character.xp += quest.reward_xp
                new_level = SubjectRPGService.calculate_level(character.xp)
                if new_level > character.level:
                    character.level = new_level
                    character.health += 10
                    character.mana += 5
        
        db.commit()
        db.refresh(quest)
        return quest
    
    @staticmethod
    def get_active_quests(db: Session, student_id: int, institution_id: int) -> List[QuestLog]:
        return db.query(QuestLog).filter(
            QuestLog.student_id == student_id,
            QuestLog.institution_id == institution_id,
            QuestLog.is_completed == False,
            or_(QuestLog.expires_at == None, QuestLog.expires_at > datetime.utcnow())
        ).all()
    
    @staticmethod
    def generate_daily_quests(db: Session, student_id: int, institution_id: int, character_id: int) -> List[QuestLog]:
        existing_daily = db.query(QuestLog).filter(
            QuestLog.student_id == student_id,
            QuestLog.institution_id == institution_id,
            QuestLog.quest_type == QuestType.DAILY,
            QuestLog.is_completed == False,
            QuestLog.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        ).first()
        
        if existing_daily:
            return SubjectRPGService.get_active_quests(db, student_id, institution_id)
        
        daily_quest_templates = [
            {"description": "Complete 3 battle sessions", "target": 3, "reward_xp": 100, "reward_gold": 50},
            {"description": "Answer 10 questions correctly", "target": 10, "reward_xp": 80, "reward_gold": 40},
            {"description": "Achieve 80% score in any battle", "target": 1, "reward_xp": 150, "reward_gold": 75}
        ]
        
        template = random.choice(daily_quest_templates)
        
        SubjectRPGService.create_quest(
            db=db,
            institution_id=institution_id,
            student_id=student_id,
            character_id=character_id,
            quest_type=QuestType.DAILY,
            description=template["description"],
            target=template["target"],
            reward_xp=template["reward_xp"],
            reward_gold=template["reward_gold"],
            expires_hours=24
        )
        
        return SubjectRPGService.get_active_quests(db, student_id, institution_id)
    
    @staticmethod
    def find_co_op_partners(
        db: Session,
        institution_id: int,
        student_id: int,
        chapter_id: int,
        max_partners: int = 3
    ) -> List[Dict[str, Any]]:
        character = db.query(StudentCharacter).filter(
            StudentCharacter.student_id == student_id,
            StudentCharacter.institution_id == institution_id
        ).first()
        
        if not character:
            return []
        
        level_range = 5
        potential_partners = db.query(StudentCharacter).filter(
            StudentCharacter.institution_id == institution_id,
            StudentCharacter.student_id != student_id,
            StudentCharacter.level >= character.level - level_range,
            StudentCharacter.level <= character.level + level_range
        ).limit(max_partners * 2).all()
        
        partners = []
        for partner in potential_partners[:max_partners]:
            recent_battles = db.query(BattleSession).filter(
                BattleSession.character_id == partner.id,
                BattleSession.chapter_id == chapter_id,
                BattleSession.is_completed == True
            ).order_by(BattleSession.completed_at.desc()).limit(5).all()
            
            avg_score = sum([b.score for b in recent_battles]) / len(recent_battles) if recent_battles else 0
            
            partners.append({
                "character_id": partner.id,
                "character_name": partner.character_name,
                "level": partner.level,
                "avatar_url": partner.avatar_url,
                "avg_score": round(avg_score, 2),
                "total_battles": len(recent_battles)
            })
        
        return sorted(partners, key=lambda x: x["avg_score"], reverse=True)
