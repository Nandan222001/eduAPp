from typing import Dict, Set, Optional
from fastapi import WebSocket
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int) -> None:
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected via WebSocket")

    def disconnect(self, websocket: WebSocket, user_id: int) -> None:
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected from WebSocket")

    async def send_personal_message(
        self,
        message: dict,
        user_id: int
    ) -> None:
        if user_id in self.active_connections:
            message["timestamp"] = datetime.utcnow().isoformat()
            json_message = json.dumps(message)
            
            disconnected = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json_message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {str(e)}")
                    disconnected.add(connection)
            
            for connection in disconnected:
                self.disconnect(connection, user_id)

    async def broadcast_to_institution(
        self,
        message: dict,
        institution_id: int,
        exclude_user: Optional[int] = None
    ) -> None:
        message["timestamp"] = datetime.utcnow().isoformat()
        json_message = json.dumps(message)
        
        for user_id, connections in list(self.active_connections.items()):
            if exclude_user and user_id == exclude_user:
                continue
            
            disconnected = set()
            for connection in connections:
                try:
                    await connection.send_text(json_message)
                except Exception as e:
                    logger.error(f"Error broadcasting to user {user_id}: {str(e)}")
                    disconnected.add(connection)
            
            for connection in disconnected:
                self.disconnect(connection, user_id)

    async def send_notification(
        self,
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        data: Optional[dict] = None
    ) -> None:
        message_data = {
            "type": "notification",
            "notification_type": notification_type,
            "title": title,
            "message": message,
            "data": data or {}
        }
        await self.send_personal_message(message_data, user_id)

    async def send_message_notification(
        self,
        user_id: int,
        message_id: int,
        sender_name: str,
        subject: str,
        preview: str
    ) -> None:
        message_data = {
            "type": "new_message",
            "message_id": message_id,
            "sender_name": sender_name,
            "subject": subject,
            "preview": preview
        }
        await self.send_personal_message(message_data, user_id)

    async def send_announcement_notification(
        self,
        user_id: int,
        announcement_id: int,
        title: str,
        priority: str
    ) -> None:
        message_data = {
            "type": "new_announcement",
            "announcement_id": announcement_id,
            "title": title,
            "priority": priority
        }
        await self.send_personal_message(message_data, user_id)

    def get_connected_users_count(self) -> int:
        return len(self.active_connections)

    def is_user_connected(self, user_id: int) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0


websocket_manager = ConnectionManager()
