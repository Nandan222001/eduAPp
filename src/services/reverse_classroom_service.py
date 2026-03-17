from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
import logging
from openai import OpenAI
import json

from src.config import settings
from src.models.reverse_classroom import TeachingSession, TeachingChallenge, ExplanationType, DifficultyLevel
from src.models.academic import Topic, Chapter, Subject
from src.models.student import Student

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=settings.openai_api_key)


class ReverseClassroomService:
    """Service for analyzing student explanations and generating teaching challenges"""

    @staticmethod
    def transcribe_audio(audio_url: str) -> str:
        """Transcribe audio using OpenAI Whisper API"""
        try:
            # Note: In production, you'd download the audio file first
            # For now, assuming the audio_url points to a local file or accessible URL
            with open(audio_url, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
                return transcript.text
        except Exception as e:
            logger.error(f"Audio transcription failed: {str(e)}")
            raise Exception(f"Failed to transcribe audio: {str(e)}")

    @staticmethod
    def get_topic_knowledge_base(db: Session, topic_id: int) -> Dict[str, Any]:
        """Retrieve topic information including related concepts"""
        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        if not topic:
            return {}

        chapter = db.query(Chapter).filter(Chapter.id == topic.chapter_id).first()
        subject = db.query(Subject).filter(Subject.id == chapter.subject_id).first() if chapter else None

        return {
            "topic_name": topic.name,
            "topic_description": topic.description or "",
            "chapter_name": chapter.name if chapter else "",
            "subject_name": subject.name if subject else "",
            "key_concepts": ReverseClassroomService._extract_key_concepts(topic),
        }

    @staticmethod
    def _extract_key_concepts(topic: Topic) -> List[str]:
        """Extract key concepts that should be covered in the topic"""
        # This is a simplified version. In production, you might have
        # a more sophisticated knowledge base or curriculum mapping
        concepts = []
        if topic.description:
            # Simple extraction based on description
            concepts = [topic.name]
        return concepts if concepts else [topic.name]

    @staticmethod
    def analyze_student_explanation(
        db: Session,
        session_id: int,
        explanation_content: str,
        topic_knowledge: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze student explanation using OpenAI"""
        try:
            # Build the prompt for GPT
            prompt = f"""You are an AI tutor analyzing a student's explanation of a topic. 
Your task is to evaluate how well the student understands and can explain the concept.

Topic: {topic_knowledge.get('topic_name', 'Unknown')}
Subject: {topic_knowledge.get('subject_name', 'Unknown')}
Chapter: {topic_knowledge.get('chapter_name', 'Unknown')}
Key Concepts: {', '.join(topic_knowledge.get('key_concepts', []))}

Student's Explanation:
{explanation_content}

Please analyze the explanation and provide:
1. Correctly explained concepts (as an array of strings)
2. Missing concepts that should have been covered (as an array of strings)
3. Confused or incorrectly explained concepts (as an array of strings)
4. Understanding level as a percentage (0-100)
5. Clarity score as a percentage (0-100) - how clearly they explained
6. Detailed feedback (a paragraph)
7. Follow-up questions to test deeper understanding (array of 3-5 questions)
8. Suggestions for improvement (array of strings)

Respond in JSON format with these exact keys:
{{
    "correctly_explained": [],
    "missing_concepts": [],
    "confused_concepts": [],
    "understanding_level_percent": 0,
    "clarity_score": 0,
    "detailed_feedback": "",
    "follow_up_questions": [],
    "suggestions": []
}}"""

            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert AI tutor specializing in evaluating student understanding through their explanations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500
            )

            analysis_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            try:
                analysis = json.loads(analysis_text)
            except json.JSONDecodeError:
                # If response isn't valid JSON, extract what we can
                logger.warning("GPT response wasn't valid JSON, using fallback")
                analysis = {
                    "correctly_explained": [],
                    "missing_concepts": [],
                    "confused_concepts": [],
                    "understanding_level_percent": 50.0,
                    "clarity_score": 50.0,
                    "detailed_feedback": analysis_text,
                    "follow_up_questions": [],
                    "suggestions": []
                }

            # Update the session with analysis results
            session = db.query(TeachingSession).filter(TeachingSession.id == session_id).first()
            if session:
                session.ai_analysis = analysis
                session.correctly_explained = analysis.get("correctly_explained", [])
                session.missing_concepts = analysis.get("missing_concepts", [])
                session.confused_concepts = analysis.get("confused_concepts", [])
                session.understanding_level_percent = analysis.get("understanding_level_percent", 0.0)
                session.clarity_score = analysis.get("clarity_score", 0.0)
                session.is_analyzed = True
                session.word_count = len(explanation_content.split())
                db.commit()

            return analysis

        except Exception as e:
            logger.error(f"Analysis failed: {str(e)}")
            raise Exception(f"Failed to analyze explanation: {str(e)}")

    @staticmethod
    def generate_challenge(
        db: Session,
        session_id: int,
        difficulty: DifficultyLevel,
        topic_knowledge: Dict[str, Any],
        previous_analysis: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate a teaching challenge based on difficulty level"""
        try:
            difficulty_prompts = {
                DifficultyLevel.EXPLAIN_TO_5YO: "Explain this topic as if you're teaching a 5-year-old child. Use very simple words and fun examples.",
                DifficultyLevel.EXPLAIN_TO_10YO: "Explain this topic as if you're teaching a 10-year-old. Keep it simple but more detailed than for a young child.",
                DifficultyLevel.EXPLAIN_TO_COLLEGE: "Explain this topic at a college level with technical accuracy and depth.",
                DifficultyLevel.EXPLAIN_IN_30S: "Explain this topic in 30 seconds or less. Be concise but cover the key points.",
            }

            context = ""
            if previous_analysis:
                if previous_analysis.get("missing_concepts"):
                    context = f"\nFocus on these concepts that were missing from your previous explanation: {', '.join(previous_analysis['missing_concepts'])}"
                if previous_analysis.get("confused_concepts"):
                    context += f"\nClarify these concepts you seemed confused about: {', '.join(previous_analysis['confused_concepts'])}"

            prompt = f"""Generate a teaching challenge for the following topic:

Topic: {topic_knowledge.get('topic_name', 'Unknown')}
Subject: {topic_knowledge.get('subject_name', 'Unknown')}

Challenge Type: {difficulty_prompts.get(difficulty, '')}
{context}

Generate a clear, engaging prompt that asks the student to explain the topic according to the difficulty level.
The prompt should be 2-3 sentences and encourage the student to teach the concept."""

            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert educator creating teaching challenges for students."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=200
            )

            challenge_prompt = response.choices[0].message.content.strip()
            return challenge_prompt

        except Exception as e:
            logger.error(f"Challenge generation failed: {str(e)}")
            raise Exception(f"Failed to generate challenge: {str(e)}")

    @staticmethod
    def evaluate_challenge_response(
        db: Session,
        challenge_id: int,
        student_response: str,
        difficulty: DifficultyLevel,
        topic_knowledge: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Evaluate student's response to a challenge"""
        try:
            prompt = f"""Evaluate this student's response to a teaching challenge.

Topic: {topic_knowledge.get('topic_name', 'Unknown')}
Challenge Difficulty: {difficulty.value}

Student's Response:
{student_response}

Evaluate the response and provide:
1. A score from 0-100
2. Strengths (array of specific things done well)
3. Areas for improvement (array of specific suggestions)
4. Overall feedback

Respond in JSON format:
{{
    "score": 0,
    "strengths": [],
    "areas_for_improvement": [],
    "feedback": ""
}}"""

            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert educator evaluating student explanations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )

            evaluation_text = response.choices[0].message.content.strip()
            
            try:
                evaluation = json.loads(evaluation_text)
            except json.JSONDecodeError:
                logger.warning("GPT response wasn't valid JSON for evaluation")
                evaluation = {
                    "score": 50.0,
                    "strengths": [],
                    "areas_for_improvement": [],
                    "feedback": evaluation_text
                }

            # Update challenge with evaluation
            challenge = db.query(TeachingChallenge).filter(TeachingChallenge.id == challenge_id).first()
            if challenge:
                challenge.score = evaluation.get("score", 0.0)
                challenge.ai_feedback = evaluation
                challenge.strengths = evaluation.get("strengths", [])
                challenge.areas_for_improvement = evaluation.get("areas_for_improvement", [])
                challenge.completed = True
                db.commit()

            return evaluation

        except Exception as e:
            logger.error(f"Challenge evaluation failed: {str(e)}")
            raise Exception(f"Failed to evaluate challenge response: {str(e)}")

    @staticmethod
    def get_student_progress(db: Session, student_id: int, institution_id: int) -> Dict[str, Any]:
        """Get comprehensive progress for a student"""
        sessions = db.query(TeachingSession).filter(
            TeachingSession.student_id == student_id,
            TeachingSession.institution_id == institution_id
        ).all()

        challenges = db.query(TeachingChallenge).filter(
            TeachingChallenge.student_id == student_id,
            TeachingChallenge.institution_id == institution_id
        ).all()

        completed_challenges = [c for c in challenges if c.completed]

        # Calculate averages
        avg_understanding = 0.0
        avg_clarity = 0.0
        analyzed_sessions = [s for s in sessions if s.is_analyzed]
        
        if analyzed_sessions:
            avg_understanding = sum(s.understanding_level_percent or 0 for s in analyzed_sessions) / len(analyzed_sessions)
            avg_clarity = sum(s.clarity_score or 0 for s in analyzed_sessions) / len(analyzed_sessions)

        # Group by topics
        topic_map = {}
        for session in sessions:
            topic_id = session.topic_id
            if topic_id not in topic_map:
                topic = db.query(Topic).filter(Topic.id == topic_id).first()
                topic_map[topic_id] = {
                    "topic_id": topic_id,
                    "topic_name": topic.name if topic else "Unknown",
                    "session_count": 0
                }
            topic_map[topic_id]["session_count"] += 1

        return {
            "student_id": student_id,
            "total_sessions": len(sessions),
            "total_challenges": len(challenges),
            "completed_challenges": len(completed_challenges),
            "average_understanding": round(avg_understanding, 2),
            "average_clarity": round(avg_clarity, 2),
            "topics_covered": list(topic_map.values()),
            "recent_sessions": sessions[-5:] if sessions else []
        }

    @staticmethod
    def get_topic_progress(db: Session, topic_id: int, institution_id: int) -> Dict[str, Any]:
        """Get progress analytics for a specific topic"""
        sessions = db.query(TeachingSession).filter(
            TeachingSession.topic_id == topic_id,
            TeachingSession.institution_id == institution_id,
            TeachingSession.is_analyzed == True
        ).all()

        if not sessions:
            topic = db.query(Topic).filter(Topic.id == topic_id).first()
            return {
                "topic_id": topic_id,
                "topic_name": topic.name if topic else "Unknown",
                "total_sessions": 0,
                "average_understanding": 0.0,
                "average_clarity": 0.0,
                "student_count": 0,
                "concept_mastery": {}
            }

        # Calculate statistics
        avg_understanding = sum(s.understanding_level_percent or 0 for s in sessions) / len(sessions)
        avg_clarity = sum(s.clarity_score or 0 for s in sessions) / len(sessions)
        unique_students = len(set(s.student_id for s in sessions))

        # Analyze concept mastery
        concept_mastery = {}
        for session in sessions:
            if session.correctly_explained:
                for concept in session.correctly_explained:
                    concept_mastery[concept] = concept_mastery.get(concept, 0) + 1

        # Convert to percentages
        for concept in concept_mastery:
            concept_mastery[concept] = round((concept_mastery[concept] / len(sessions)) * 100, 2)

        topic = db.query(Topic).filter(Topic.id == topic_id).first()

        return {
            "topic_id": topic_id,
            "topic_name": topic.name if topic else "Unknown",
            "total_sessions": len(sessions),
            "average_understanding": round(avg_understanding, 2),
            "average_clarity": round(avg_clarity, 2),
            "student_count": unique_students,
            "concept_mastery": concept_mastery
        }


reverse_classroom_service = ReverseClassroomService()
