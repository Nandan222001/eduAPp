from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from openai import OpenAI
import json

from src.models.study_buddy import (
    StudyBuddySession, StudyBuddyInsight, StudyBuddyPreference, InsightType
)
from src.models.student import Student
from src.models.attendance import Attendance, AttendanceStatus, AttendanceSummary
from src.models.examination import ExamResult, ExamMarks, Exam, ExamSchedule
from src.models.assignment import Assignment, Submission, SubmissionStatus
from src.schemas.study_buddy import (
    ChatRequest, ChatResponse, StudyBuddyPreferenceCreate, 
    StudyBuddyPreferenceUpdate, DailyBriefingResponse, WeeklyReviewResponse
)
from src.config import settings


class StudyBuddyService:
    def __init__(self, db: Session, openai_api_key: Optional[str] = None):
        self.db = db
        self.openai_client = OpenAI(api_key=openai_api_key) if openai_api_key else None
    
    def get_or_create_session(
        self, 
        student_id: int, 
        institution_id: int
    ) -> StudyBuddySession:
        session = self.db.query(StudyBuddySession).filter(
            StudyBuddySession.student_id == student_id,
            StudyBuddySession.institution_id == institution_id
        ).first()
        
        if not session:
            session = StudyBuddySession(
                student_id=student_id,
                institution_id=institution_id,
                conversation_history=[],
                study_patterns={},
                optimal_study_times=[],
                streak_data={
                    'current_streak': 0,
                    'longest_streak': 0,
                    'total_study_days': 0
                },
                mood_tracking=[]
            )
            self.db.add(session)
            self.db.commit()
            self.db.refresh(session)
        
        return session
    
    def chat(
        self, 
        student_id: int, 
        institution_id: int, 
        chat_request: ChatRequest
    ) -> ChatResponse:
        session = self.get_or_create_session(student_id, institution_id)
        preferences = self.get_preferences(student_id, institution_id)
        
        student = self.db.query(Student).filter(Student.id == student_id).first()
        
        conversation_history = session.conversation_history or []
        
        context_data = self._build_student_context(student_id, institution_id)
        
        system_prompt = self._build_system_prompt(student, preferences, context_data)
        
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in conversation_history[-10:]:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        messages.append({
            "role": "user",
            "content": chat_request.message
        })
        
        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=500
                )
                assistant_message = response.choices[0].message.content
            except Exception as e:
                assistant_message = f"I'm having trouble connecting right now. How can I help you with your studies?"
        else:
            assistant_message = "AI Study Buddy is not configured. Please set up OpenAI API key."
        
        conversation_history.append({
            "role": "user",
            "content": chat_request.message,
            "timestamp": datetime.utcnow().isoformat()
        })
        conversation_history.append({
            "role": "assistant",
            "content": assistant_message,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        session.conversation_history = conversation_history
        session.last_interaction = datetime.utcnow()
        self.db.commit()
        
        suggestions = self._generate_suggestions(context_data)
        
        return ChatResponse(
            message=assistant_message,
            suggestions=suggestions[:3] if suggestions else None
        )
    
    def _build_system_prompt(
        self, 
        student: Student, 
        preferences: Optional[StudyBuddyPreference],
        context_data: Dict[str, Any]
    ) -> str:
        personality = preferences.ai_personality if preferences else 'friendly'
        
        personality_traits = {
            'friendly': 'warm, encouraging, and supportive',
            'professional': 'focused, direct, and goal-oriented',
            'motivational': 'energetic, inspiring, and enthusiastic',
            'calm': 'patient, reassuring, and thoughtful'
        }
        
        trait = personality_traits.get(personality, 'warm and supportive')
        
        prompt = f"""You are an AI Study Buddy assistant for {student.first_name} {student.last_name}. 
You are {trait} in your responses.

Current Academic Context:
- Attendance Rate: {context_data.get('attendance_rate', 'N/A')}%
- Recent Exam Average: {context_data.get('recent_exam_average', 'N/A')}%
- Pending Assignments: {context_data.get('pending_assignments', 0)}
- Upcoming Exams: {context_data.get('upcoming_exams_count', 0)}

Your role is to:
1. Help with study planning and organization
2. Provide motivation and encouragement
3. Suggest study strategies based on their performance
4. Help manage stress and workload
5. Celebrate achievements and progress

Keep responses concise (2-3 sentences), actionable, and personalized. Focus on one topic at a time.
"""
        
        if context_data.get('weak_subjects'):
            prompt += f"\nWeak Areas to Focus On: {', '.join(context_data['weak_subjects'])}"
        
        return prompt
    
    def _build_student_context(self, student_id: int, institution_id: int) -> Dict[str, Any]:
        context = {}
        
        attendance_summary = self.db.query(AttendanceSummary).filter(
            AttendanceSummary.student_id == student_id,
            AttendanceSummary.institution_id == institution_id
        ).order_by(desc(AttendanceSummary.updated_at)).first()
        
        if attendance_summary:
            context['attendance_rate'] = float(attendance_summary.attendance_percentage)
        
        recent_results = self.db.query(ExamResult).filter(
            ExamResult.student_id == student_id,
            ExamResult.institution_id == institution_id
        ).order_by(desc(ExamResult.generated_at)).limit(5).all()
        
        if recent_results:
            avg_percentage = sum(float(r.percentage) for r in recent_results) / len(recent_results)
            context['recent_exam_average'] = round(avg_percentage, 2)
        
        pending_assignments = self.db.query(Submission).join(Assignment).filter(
            Submission.student_id == student_id,
            Assignment.institution_id == institution_id,
            or_(
                Submission.status == SubmissionStatus.NOT_SUBMITTED,
                Submission.status == SubmissionStatus.SUBMITTED
            ),
            Assignment.due_date >= datetime.utcnow()
        ).count()
        
        context['pending_assignments'] = pending_assignments
        
        upcoming_exams = self.db.query(ExamSchedule).join(Exam).filter(
            Exam.institution_id == institution_id,
            ExamSchedule.exam_date >= date.today(),
            ExamSchedule.exam_date <= date.today() + timedelta(days=14)
        ).count()
        
        context['upcoming_exams_count'] = upcoming_exams
        
        weak_subjects = []
        subject_marks = self.db.query(ExamMarks).filter(
            ExamMarks.student_id == student_id,
            ExamMarks.institution_id == institution_id
        ).all()
        
        if subject_marks:
            subject_performance = {}
            for mark in subject_marks:
                if mark.exam_subject and mark.exam_subject.subject:
                    subject_name = mark.exam_subject.subject.name
                    total_obtained = (mark.theory_marks_obtained or 0) + (mark.practical_marks_obtained or 0)
                    total_max = (mark.exam_subject.theory_max_marks or 0) + (mark.exam_subject.practical_max_marks or 0)
                    
                    if total_max > 0:
                        percentage = (float(total_obtained) / float(total_max)) * 100
                        if subject_name not in subject_performance:
                            subject_performance[subject_name] = []
                        subject_performance[subject_name].append(percentage)
            
            for subject, percentages in subject_performance.items():
                avg = sum(percentages) / len(percentages)
                if avg < 60:
                    weak_subjects.append(subject)
        
        context['weak_subjects'] = weak_subjects
        
        return context
    
    def _generate_suggestions(self, context_data: Dict[str, Any]) -> List[str]:
        suggestions = []
        
        if context_data.get('pending_assignments', 0) > 0:
            suggestions.append("Review pending assignments")
        
        if context_data.get('upcoming_exams_count', 0) > 0:
            suggestions.append("Check upcoming exam schedule")
        
        if context_data.get('weak_subjects'):
            suggestions.append(f"Focus on {context_data['weak_subjects'][0]}")
        
        if context_data.get('attendance_rate', 100) < 75:
            suggestions.append("Improve attendance rate")
        
        suggestions.append("Set today's study goals")
        suggestions.append("Track your mood")
        
        return suggestions
    
    def analyze_study_patterns(self, student_id: int, institution_id: int) -> Dict[str, Any]:
        session = self.get_or_create_session(student_id, institution_id)
        
        conversation_history = session.conversation_history or []
        
        if len(conversation_history) < 5:
            return {}
        
        interaction_times = []
        for msg in conversation_history:
            if msg.get('role') == 'user' and msg.get('timestamp'):
                try:
                    timestamp = datetime.fromisoformat(msg['timestamp'])
                    interaction_times.append(timestamp)
                except:
                    pass
        
        if not interaction_times:
            return {}
        
        hours = [dt.hour for dt in interaction_times]
        hour_counts = {}
        for hour in hours:
            hour_counts[hour] = hour_counts.get(hour, 0) + 1
        
        most_active_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        patterns = {
            'most_active_hours': [h[0] for h in most_active_hours],
            'total_interactions': len(conversation_history) // 2,
            'average_session_duration': 15,
            'study_frequency': {
                'morning': sum(1 for h in hours if 6 <= h < 12),
                'afternoon': sum(1 for h in hours if 12 <= h < 18),
                'evening': sum(1 for h in hours if 18 <= h < 24),
                'night': sum(1 for h in hours if h < 6)
            }
        }
        
        session.study_patterns = patterns
        self.db.commit()
        
        return patterns
    
    def detect_optimal_study_times(self, student_id: int, institution_id: int) -> List[Dict[str, Any]]:
        patterns = self.analyze_study_patterns(student_id, institution_id)
        
        if not patterns or not patterns.get('most_active_hours'):
            return []
        
        optimal_times = []
        
        for hour in patterns['most_active_hours']:
            time_slot = self._hour_to_time_slot(hour)
            optimal_times.append({
                'day_of_week': 'weekday',
                'time_slot': time_slot,
                'productivity_score': 0.8
            })
        
        session = self.get_or_create_session(student_id, institution_id)
        session.optimal_study_times = optimal_times
        self.db.commit()
        
        return optimal_times
    
    def _hour_to_time_slot(self, hour: int) -> str:
        if 6 <= hour < 12:
            return f"Morning ({hour}:00 AM)"
        elif 12 <= hour < 18:
            if hour == 12:
                return f"Afternoon (12:00 PM)"
            else:
                return f"Afternoon ({hour - 12}:00 PM)"
        elif 18 <= hour < 24:
            return f"Evening ({hour - 12}:00 PM)"
        else:
            return f"Night ({hour}:00 AM)"
    
    def generate_daily_plan(self, student_id: int, institution_id: int) -> DailyBriefingResponse:
        context_data = self._build_student_context(student_id, institution_id)
        session = self.get_or_create_session(student_id, institution_id)
        preferences = self.get_preferences(student_id, institution_id)
        
        student = self.db.query(Student).filter(Student.id == student_id).first()
        
        time_of_day = datetime.now().hour
        if time_of_day < 12:
            greeting = f"Good morning, {student.first_name}! 🌅"
        elif time_of_day < 18:
            greeting = f"Good afternoon, {student.first_name}! ☀️"
        else:
            greeting = f"Good evening, {student.first_name}! 🌙"
        
        upcoming_tasks = []
        
        pending_submissions = self.db.query(Submission, Assignment).join(Assignment).filter(
            Submission.student_id == student_id,
            Assignment.institution_id == institution_id,
            Submission.status == SubmissionStatus.NOT_SUBMITTED,
            Assignment.due_date >= datetime.utcnow(),
            Assignment.due_date <= datetime.utcnow() + timedelta(days=7)
        ).order_by(Assignment.due_date).limit(5).all()
        
        for submission, assignment in pending_submissions:
            upcoming_tasks.append({
                'type': 'assignment',
                'title': assignment.title,
                'subject': assignment.subject.name if assignment.subject else 'General',
                'due_date': assignment.due_date.isoformat() if assignment.due_date else None,
                'priority': 'high' if assignment.due_date and assignment.due_date < datetime.utcnow() + timedelta(days=2) else 'medium'
            })
        
        exam_reminders = []
        upcoming_exam_schedules = self.db.query(ExamSchedule, Exam).join(Exam).filter(
            Exam.institution_id == institution_id,
            ExamSchedule.exam_date >= date.today(),
            ExamSchedule.exam_date <= date.today() + timedelta(days=14)
        ).order_by(ExamSchedule.exam_date).limit(5).all()
        
        for schedule, exam in upcoming_exam_schedules:
            exam_reminders.append({
                'exam_name': exam.name,
                'subject': schedule.subject.name if schedule.subject else 'General',
                'date': schedule.exam_date.isoformat(),
                'time': schedule.start_time.isoformat() if schedule.start_time else None,
                'days_until': (schedule.exam_date - date.today()).days
            })
        
        weak_areas_focus = []
        if context_data.get('weak_subjects'):
            for subject in context_data['weak_subjects'][:3]:
                weak_areas_focus.append({
                    'subject': subject,
                    'suggestion': f"Spend 30 minutes reviewing {subject}",
                    'resources': []
                })
        
        motivational_message = self.generate_motivational_message(student_id, institution_id, context_data)
        
        study_suggestions = [
            "Start with your most challenging subject",
            "Take a 10-minute break every hour",
            "Review class notes from today"
        ]
        
        if session.streak_data:
            streak_info = session.streak_data
        else:
            streak_info = {
                'current_streak': 0,
                'longest_streak': 0,
                'total_study_days': 0
            }
        
        return DailyBriefingResponse(
            greeting=greeting,
            upcoming_tasks=upcoming_tasks,
            exam_reminders=exam_reminders,
            weak_areas_focus=weak_areas_focus,
            motivational_message=motivational_message,
            study_suggestions=study_suggestions,
            streak_info=streak_info
        )
    
    def generate_weekly_review(self, student_id: int, institution_id: int) -> WeeklyReviewResponse:
        week_start = date.today() - timedelta(days=date.today().weekday())
        week_end = week_start + timedelta(days=6)
        
        achievements = []
        areas_for_improvement = []
        
        attendance_records = self.db.query(Attendance).filter(
            Attendance.student_id == student_id,
            Attendance.institution_id == institution_id,
            Attendance.date >= week_start,
            Attendance.date <= week_end
        ).all()
        
        if attendance_records:
            present_count = sum(1 for a in attendance_records if a.status == AttendanceStatus.PRESENT)
            total_count = len(attendance_records)
            attendance_rate = (present_count / total_count * 100) if total_count > 0 else 0
            
            attendance_summary = {
                'total_days': total_count,
                'present_days': present_count,
                'attendance_rate': round(attendance_rate, 2)
            }
            
            if attendance_rate >= 90:
                achievements.append(f"Excellent attendance: {attendance_rate:.0f}%!")
            elif attendance_rate < 75:
                areas_for_improvement.append(f"Attendance needs improvement ({attendance_rate:.0f}%)")
        else:
            attendance_summary = None
        
        completed_submissions = self.db.query(Submission).filter(
            Submission.student_id == student_id,
            Submission.submitted_at >= datetime.combine(week_start, datetime.min.time()),
            Submission.submitted_at <= datetime.combine(week_end, datetime.max.time())
        ).all()
        
        if completed_submissions:
            on_time = sum(1 for s in completed_submissions if not s.is_late)
            assignment_completion = {
                'total_submitted': len(completed_submissions),
                'on_time': on_time,
                'late': len(completed_submissions) - on_time
            }
            
            if on_time == len(completed_submissions):
                achievements.append(f"All {len(completed_submissions)} assignments submitted on time!")
        else:
            assignment_completion = None
        
        exam_performance = None
        
        patterns = self.analyze_study_patterns(student_id, institution_id)
        
        if patterns.get('total_interactions', 0) > 10:
            achievements.append(f"Engaged with study buddy {patterns['total_interactions']} times this week!")
        
        if not achievements:
            achievements.append("Keep pushing forward! Every step counts.")
        
        if not areas_for_improvement:
            areas_for_improvement.append("You're doing great! Keep up the good work.")
        
        next_week_goals = [
            "Maintain or improve attendance",
            "Complete all assignments on time",
            "Review weak subject areas daily"
        ]
        
        motivational_message = "Great work this week! Remember, consistency is key to success. Keep up the momentum! 💪"
        
        summary = f"This week you attended {attendance_summary['present_days'] if attendance_summary else 0} days of class"
        if assignment_completion:
            summary += f" and submitted {assignment_completion['total_submitted']} assignments"
        summary += ". Keep up the great work!"
        
        return WeeklyReviewResponse(
            summary=summary,
            achievements=achievements,
            areas_for_improvement=areas_for_improvement,
            attendance_summary=attendance_summary,
            exam_performance=exam_performance,
            assignment_completion=assignment_completion,
            study_patterns=patterns,
            next_week_goals=next_week_goals,
            motivational_message=motivational_message
        )
    
    def generate_motivational_message(
        self, 
        student_id: int, 
        institution_id: int,
        context_data: Optional[Dict[str, Any]] = None
    ) -> str:
        if not context_data:
            context_data = self._build_student_context(student_id, institution_id)
        
        session = self.get_or_create_session(student_id, institution_id)
        streak = session.streak_data.get('current_streak', 0) if session.streak_data else 0
        
        messages = []
        
        if streak >= 7:
            messages.append(f"🔥 Amazing! You're on a {streak}-day streak! Keep it going!")
        elif streak >= 3:
            messages.append(f"⭐ Great job! {streak} days in a row!")
        
        if context_data.get('attendance_rate', 0) >= 90:
            messages.append("👏 Your attendance is excellent!")
        
        if context_data.get('recent_exam_average', 0) >= 80:
            messages.append("🎯 Your exam scores are impressive!")
        
        if context_data.get('pending_assignments', 0) == 0:
            messages.append("✅ All caught up on assignments!")
        
        if not messages:
            messages = [
                "You're doing great! Keep pushing forward!",
                "Every study session brings you closer to your goals!",
                "Believe in yourself - you've got this!",
                "Small progress is still progress. Keep going!",
                "Your future self will thank you for the effort you put in today!"
            ]
            import random
            return random.choice(messages)
        
        return " ".join(messages[:2])
    
    def create_insight(
        self,
        student_id: int,
        institution_id: int,
        insight_type: InsightType,
        content: str,
        priority: int = 1
    ) -> StudyBuddyInsight:
        session = self.get_or_create_session(student_id, institution_id)
        
        insight = StudyBuddyInsight(
            institution_id=institution_id,
            session_id=session.id,
            student_id=student_id,
            insight_type=insight_type,
            content=content,
            priority=priority,
            is_read=False
        )
        
        self.db.add(insight)
        self.db.commit()
        self.db.refresh(insight)
        
        return insight
    
    def get_insights(
        self,
        student_id: int,
        institution_id: int,
        unread_only: bool = False
    ) -> List[StudyBuddyInsight]:
        query = self.db.query(StudyBuddyInsight).filter(
            StudyBuddyInsight.student_id == student_id,
            StudyBuddyInsight.institution_id == institution_id
        )
        
        if unread_only:
            query = query.filter(StudyBuddyInsight.is_read == False)
        
        return query.order_by(desc(StudyBuddyInsight.priority), desc(StudyBuddyInsight.delivered_at)).all()
    
    def mark_insight_read(self, insight_id: int) -> Optional[StudyBuddyInsight]:
        insight = self.db.query(StudyBuddyInsight).filter(
            StudyBuddyInsight.id == insight_id
        ).first()
        
        if insight:
            insight.is_read = True
            self.db.commit()
            self.db.refresh(insight)
        
        return insight
    
    def get_preferences(self, student_id: int, institution_id: int) -> Optional[StudyBuddyPreference]:
        return self.db.query(StudyBuddyPreference).filter(
            StudyBuddyPreference.student_id == student_id,
            StudyBuddyPreference.institution_id == institution_id
        ).first()
    
    def create_preferences(
        self,
        student_id: int,
        institution_id: int,
        preferences_data: StudyBuddyPreferenceCreate
    ) -> StudyBuddyPreference:
        preferences = StudyBuddyPreference(
            student_id=student_id,
            institution_id=institution_id,
            **preferences_data.model_dump()
        )
        
        self.db.add(preferences)
        self.db.commit()
        self.db.refresh(preferences)
        
        return preferences
    
    def update_preferences(
        self,
        student_id: int,
        institution_id: int,
        preferences_data: StudyBuddyPreferenceUpdate
    ) -> Optional[StudyBuddyPreference]:
        preferences = self.get_preferences(student_id, institution_id)
        
        if not preferences:
            create_data = StudyBuddyPreferenceCreate(**preferences_data.model_dump(exclude_unset=True))
            return self.create_preferences(student_id, institution_id, create_data)
        
        update_data = preferences_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(preferences, field, value)
        
        self.db.commit()
        self.db.refresh(preferences)
        
        return preferences
    
    def track_mood(
        self,
        student_id: int,
        institution_id: int,
        mood: str,
        energy_level: int,
        stress_level: int,
        notes: Optional[str] = None
    ) -> StudyBuddySession:
        session = self.get_or_create_session(student_id, institution_id)
        
        mood_tracking = session.mood_tracking or []
        
        mood_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'mood': mood,
            'energy_level': energy_level,
            'stress_level': stress_level,
            'notes': notes
        }
        
        mood_tracking.append(mood_entry)
        session.mood_tracking = mood_tracking
        
        if stress_level >= 4:
            self.create_insight(
                student_id=student_id,
                institution_id=institution_id,
                insight_type=InsightType.STRESS_CHECK,
                content=f"Your stress level seems high. Consider taking a break or talking to someone. Remember to practice self-care!",
                priority=3
            )
        
        self.db.commit()
        self.db.refresh(session)
        
        return session
    
    def update_streak(self, student_id: int, institution_id: int) -> Dict[str, int]:
        session = self.get_or_create_session(student_id, institution_id)
        
        streak_data = session.streak_data or {
            'current_streak': 0,
            'longest_streak': 0,
            'total_study_days': 0,
            'last_study_date': None
        }
        
        today = date.today().isoformat()
        last_date = streak_data.get('last_study_date')
        
        if last_date:
            last_date_obj = date.fromisoformat(last_date)
            days_diff = (date.today() - last_date_obj).days
            
            if days_diff == 0:
                pass
            elif days_diff == 1:
                streak_data['current_streak'] += 1
                streak_data['total_study_days'] += 1
                streak_data['last_study_date'] = today
                
                if streak_data['current_streak'] > streak_data.get('longest_streak', 0):
                    streak_data['longest_streak'] = streak_data['current_streak']
            else:
                streak_data['current_streak'] = 1
                streak_data['total_study_days'] += 1
                streak_data['last_study_date'] = today
        else:
            streak_data = {
                'current_streak': 1,
                'longest_streak': 1,
                'total_study_days': 1,
                'last_study_date': today
            }
        
        session.streak_data = streak_data
        self.db.commit()
        
        if streak_data['current_streak'] in [3, 7, 14, 30, 60, 100]:
            self.create_insight(
                student_id=student_id,
                institution_id=institution_id,
                insight_type=InsightType.CELEBRATION,
                content=f"🎉 Congratulations! You've maintained a {streak_data['current_streak']}-day study streak!",
                priority=2
            )
        
        return streak_data
