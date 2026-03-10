from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from src.models.notification import Message
from src.models.user import User
from src.schemas.notification import MessageCreate
import logging

logger = logging.getLogger(__name__)


class MessagingService:
    def __init__(self, db: Session):
        self.db = db

    def send_message(
        self,
        institution_id: int,
        sender_id: int,
        message_data: MessageCreate
    ) -> Message:
        recipient = self.db.query(User).filter(
            and_(
                User.id == message_data.recipient_id,
                User.institution_id == institution_id,
                User.is_active == True
            )
        ).first()
        
        if not recipient:
            raise ValueError("Recipient not found or not in the same institution")
        
        message = Message(
            institution_id=institution_id,
            sender_id=sender_id,
            recipient_id=message_data.recipient_id,
            parent_id=message_data.parent_id,
            subject=message_data.subject,
            content=message_data.content,
            attachments=message_data.attachments
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_inbox(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
        unread_only: bool = False
    ) -> List[Message]:
        query = self.db.query(Message).filter(
            and_(
                Message.recipient_id == user_id,
                Message.is_deleted_by_recipient == False
            )
        )
        
        if unread_only:
            query = query.filter(Message.is_read == False)
        
        return query.order_by(Message.created_at.desc()).offset(skip).limit(limit).all()

    def get_sent_messages(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[Message]:
        return self.db.query(Message).filter(
            and_(
                Message.sender_id == user_id,
                Message.is_deleted_by_sender == False
            )
        ).order_by(Message.created_at.desc()).offset(skip).limit(limit).all()

    def get_message_by_id(
        self,
        message_id: int,
        user_id: int
    ) -> Optional[Message]:
        return self.db.query(Message).filter(
            and_(
                Message.id == message_id,
                or_(
                    Message.sender_id == user_id,
                    Message.recipient_id == user_id
                )
            )
        ).first()

    def mark_as_read(self, message_id: int, user_id: int) -> Optional[Message]:
        message = self.db.query(Message).filter(
            and_(
                Message.id == message_id,
                Message.recipient_id == user_id
            )
        ).first()
        
        if message and not message.is_read:
            message.is_read = True
            message.read_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(message)
        
        return message

    def mark_all_as_read(self, user_id: int) -> int:
        count = self.db.query(Message).filter(
            and_(
                Message.recipient_id == user_id,
                Message.is_read == False
            )
        ).update({
            "is_read": True,
            "read_at": datetime.utcnow()
        })
        self.db.commit()
        return count

    def delete_message(
        self,
        message_id: int,
        user_id: int,
        permanent: bool = False
    ) -> bool:
        message = self.get_message_by_id(message_id, user_id)
        if not message:
            return False
        
        if permanent:
            self.db.delete(message)
        else:
            if message.sender_id == user_id:
                message.is_deleted_by_sender = True
            if message.recipient_id == user_id:
                message.is_deleted_by_recipient = True
            
            if message.is_deleted_by_sender and message.is_deleted_by_recipient:
                self.db.delete(message)
        
        self.db.commit()
        return True

    def get_conversation(
        self,
        user_id: int,
        other_user_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[Message]:
        return self.db.query(Message).filter(
            or_(
                and_(
                    Message.sender_id == user_id,
                    Message.recipient_id == other_user_id,
                    Message.is_deleted_by_sender == False
                ),
                and_(
                    Message.sender_id == other_user_id,
                    Message.recipient_id == user_id,
                    Message.is_deleted_by_recipient == False
                )
            )
        ).order_by(Message.created_at.asc()).offset(skip).limit(limit).all()

    def get_message_thread(
        self,
        message_id: int,
        user_id: int
    ) -> List[Message]:
        message = self.get_message_by_id(message_id, user_id)
        if not message:
            return []
        
        root_id = message.parent_id or message.id
        
        thread = self.db.query(Message).filter(
            or_(
                Message.id == root_id,
                Message.parent_id == root_id
            )
        ).order_by(Message.created_at.asc()).all()
        
        return [m for m in thread if m.sender_id == user_id or m.recipient_id == user_id]

    def get_unread_count(self, user_id: int) -> int:
        return self.db.query(func.count(Message.id)).filter(
            and_(
                Message.recipient_id == user_id,
                Message.is_read == False,
                Message.is_deleted_by_recipient == False
            )
        ).scalar() or 0

    def search_messages(
        self,
        user_id: int,
        query: str,
        skip: int = 0,
        limit: int = 50
    ) -> List[Message]:
        search_pattern = f"%{query}%"
        return self.db.query(Message).filter(
            and_(
                or_(
                    Message.sender_id == user_id,
                    Message.recipient_id == user_id
                ),
                or_(
                    Message.subject.ilike(search_pattern),
                    Message.content.ilike(search_pattern)
                )
            )
        ).order_by(Message.created_at.desc()).offset(skip).limit(limit).all()
