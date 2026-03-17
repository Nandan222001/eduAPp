"""
Example integration of push notifications in existing services.

This file demonstrates how to integrate push notifications into your existing services
like assignment_service, grade_service, etc.
"""

from sqlalchemy.orm import Session
from src.utils.push_notification_sender import PushNotificationSender
from src.models.notification import UserDevice


# Example 1: Send notification when a new assignment is created
def create_assignment_with_notification(db: Session, assignment_data: dict, student_ids: list):
    """
    Example of creating an assignment and sending push notifications to students.
    """
    # Create the assignment (simplified example)
    # assignment = AssignmentService.create(db, assignment_data)
    
    # Send push notifications
    push_sender = PushNotificationSender(db)
    
    for student_id in student_ids:
        push_sender.send_assignment_notification(
            user_id=student_id,
            assignment_id=assignment_data['id'],
            assignment_title=assignment_data['title'],
            due_date=assignment_data['due_date']
        )


# Example 2: Send notification when grades are posted
def post_grade_with_notification(db: Session, student_id: int, subject: str, grade: str):
    """
    Example of posting a grade and notifying the student.
    """
    # Save grade to database
    # GradeService.create(db, grade_data)
    
    # Send push notification
    push_sender = PushNotificationSender(db)
    push_sender.send_grade_notification(
        user_id=student_id,
        subject=subject,
        grade=grade
    )


# Example 3: Send notification for attendance
def mark_attendance_with_notification(db: Session, student_id: int, status: str, date: str):
    """
    Example of marking attendance and notifying the student.
    """
    # Mark attendance in database
    # AttendanceService.mark(db, attendance_data)
    
    # Send push notification
    push_sender = PushNotificationSender(db)
    push_sender.send_attendance_notification(
        user_id=student_id,
        status=status,
        date=date
    )


# Example 4: Send announcement to multiple users
def create_announcement_with_notification(
    db: Session,
    title: str,
    message: str,
    target_users: list
):
    """
    Example of creating an announcement and notifying multiple users.
    """
    # Create announcement in database
    # AnnouncementService.create(db, announcement_data)
    
    # Send push notifications
    push_sender = PushNotificationSender(db)
    push_sender.send_announcement_notification(
        user_ids=target_users,
        title=title,
        message=message
    )


# Example 5: Send notification to users subscribed to a specific topic
def send_topic_notification(
    db: Session,
    topic: str,
    title: str,
    message: str,
    data: dict = None
):
    """
    Example of sending a notification to all users subscribed to a specific topic.
    """
    push_sender = PushNotificationSender(db)
    push_sender.send_to_topic(
        topic=topic,
        title=title,
        body=message,
        data=data
    )


# Example 6: Integration in assignment service
"""
In src/services/assignment_service.py, you would add:

from src.utils.push_notification_sender import PushNotificationSender

class AssignmentService:
    def __init__(self, db: Session):
        self.db = db
        self.push_sender = PushNotificationSender(db)
    
    def create_assignment(self, assignment_data: dict, student_ids: list):
        # Create assignment
        assignment = Assignment(**assignment_data)
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        
        # Send notifications to subscribed students
        for student_id in student_ids:
            # Check if student is subscribed to assignment notifications
            devices = self.db.query(UserDevice).filter(
                UserDevice.user_id == student_id,
                UserDevice.is_active == True
            ).all()
            
            for device in devices:
                if device.topics and device.topics.get('assignments', False):
                    self.push_sender.send_assignment_notification(
                        user_id=student_id,
                        assignment_id=assignment.id,
                        assignment_title=assignment.title,
                        due_date=str(assignment.due_date)
                    )
        
        return assignment
"""


# Example 7: Bulk notification sending
def send_bulk_assignment_reminders(db: Session, assignments: list):
    """
    Example of sending bulk notifications for assignment reminders.
    """
    push_sender = PushNotificationSender(db)
    
    messages = []
    for assignment in assignments:
        for student_id in assignment['student_ids']:
            # Get active devices for student
            devices = db.query(UserDevice).filter(
                UserDevice.user_id == student_id,
                UserDevice.is_active == True
            ).all()
            
            for device in devices:
                if device.topics and device.topics.get('assignments', False):
                    messages.append({
                        "to": device.device_token,
                        "title": "Assignment Due Soon",
                        "body": f"{assignment['title']} is due in 24 hours",
                        "data": {
                            "type": "assignment",
                            "assignmentId": assignment['id']
                        },
                        "priority": "high",
                        "sound": "default"
                    })
    
    if messages:
        push_sender.send_bulk_notifications(messages)


# Example 8: Scheduled notification using Celery task
"""
In src/tasks/notification_tasks.py, you would add:

from celery import shared_task
from src.database import SessionLocal
from src.utils.push_notification_sender import PushNotificationSender

@shared_task
def send_assignment_reminder(assignment_id: int, student_ids: list):
    db = SessionLocal()
    try:
        push_sender = PushNotificationSender(db)
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        
        if not assignment:
            return
        
        for student_id in student_ids:
            push_sender.send_assignment_notification(
                user_id=student_id,
                assignment_id=assignment.id,
                assignment_title=assignment.title,
                due_date=str(assignment.due_date)
            )
    finally:
        db.close()
"""
