import requests
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from src.models.notification import UserDevice


class PushNotificationSender:
    EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
    
    def __init__(self, db: Session):
        self.db = db
    
    def send_to_user(
        self,
        user_id: int,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        priority: str = "high",
        sound: str = "default"
    ) -> List[Dict[str, Any]]:
        devices = self.db.query(UserDevice).filter(
            UserDevice.user_id == user_id,
            UserDevice.is_active == True
        ).all()
        
        if not devices:
            return []
        
        results = []
        for device in devices:
            result = self.send_notification(
                device.device_token,
                title,
                body,
                data,
                priority,
                sound
            )
            results.append(result)
        
        return results
    
    def send_to_devices(
        self,
        device_tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        priority: str = "high",
        sound: str = "default"
    ) -> List[Dict[str, Any]]:
        results = []
        for token in device_tokens:
            result = self.send_notification(
                token,
                title,
                body,
                data,
                priority,
                sound
            )
            results.append(result)
        
        return results
    
    def send_notification(
        self,
        device_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        priority: str = "high",
        sound: str = "default",
        badge: Optional[int] = None,
        category_id: Optional[str] = None
    ) -> Dict[str, Any]:
        payload = {
            "to": device_token,
            "title": title,
            "body": body,
            "priority": priority,
            "sound": sound,
        }
        
        if data:
            payload["data"] = data
        
        if badge is not None:
            payload["badge"] = badge
        
        if category_id:
            payload["categoryId"] = category_id
        
        try:
            response = requests.post(
                self.EXPO_PUSH_URL,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                json=payload,
                timeout=10
            )
            
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    def send_bulk_notifications(
        self,
        messages: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        if not messages:
            return {"status": "error", "message": "No messages to send"}
        
        try:
            response = requests.post(
                self.EXPO_PUSH_URL,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                json=messages,
                timeout=30
            )
            
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    def send_to_topic(
        self,
        topic: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        user_ids: Optional[List[int]] = None,
        priority: str = "high",
        sound: str = "default"
    ) -> List[Dict[str, Any]]:
        query = self.db.query(UserDevice).filter(
            UserDevice.is_active == True
        )
        
        if user_ids:
            query = query.filter(UserDevice.user_id.in_(user_ids))
        
        devices = query.all()
        
        subscribed_devices = [
            device for device in devices
            if device.topics and device.topics.get(topic, False)
        ]
        
        if not subscribed_devices:
            return []
        
        messages = []
        for device in subscribed_devices:
            message = {
                "to": device.device_token,
                "title": title,
                "body": body,
                "priority": priority,
                "sound": sound,
            }
            
            if data:
                message["data"] = data
            
            messages.append(message)
        
        return self.send_bulk_notifications(messages)
    
    def send_assignment_notification(
        self,
        user_id: int,
        assignment_id: int,
        assignment_title: str,
        due_date: str
    ) -> List[Dict[str, Any]]:
        return self.send_to_user(
            user_id=user_id,
            title="New Assignment Posted",
            body=f"{assignment_title} - Due: {due_date}",
            data={
                "type": "assignment",
                "assignmentId": assignment_id
            }
        )
    
    def send_grade_notification(
        self,
        user_id: int,
        subject: str,
        grade: str
    ) -> List[Dict[str, Any]]:
        return self.send_to_user(
            user_id=user_id,
            title="New Grade Posted",
            body=f"{subject}: {grade}",
            data={
                "type": "grade"
            }
        )
    
    def send_attendance_notification(
        self,
        user_id: int,
        status: str,
        date: str
    ) -> List[Dict[str, Any]]:
        return self.send_to_user(
            user_id=user_id,
            title="Attendance Update",
            body=f"Your attendance for {date}: {status}",
            data={
                "type": "attendance"
            }
        )
    
    def send_announcement_notification(
        self,
        user_ids: List[int],
        title: str,
        message: str
    ) -> List[Dict[str, Any]]:
        results = []
        for user_id in user_ids:
            result = self.send_to_user(
                user_id=user_id,
                title=title,
                body=message,
                data={
                    "type": "announcement"
                }
            )
            results.extend(result)
        
        return results
