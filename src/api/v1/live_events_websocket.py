from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
import json

from src.database import get_db
from src.models.live_events import LiveEvent, EventViewer, EventChatMessage
from src.models.user import User
from src.services.chat_moderation_service import ChatModerationService

router = APIRouter()


class ConnectionManager:
    """Manage WebSocket connections for live events."""
    
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, event_id: int):
        """Connect a client to an event's chat."""
        await websocket.accept()
        if event_id not in self.active_connections:
            self.active_connections[event_id] = set()
        self.active_connections[event_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, event_id: int):
        """Disconnect a client from an event's chat."""
        if event_id in self.active_connections:
            self.active_connections[event_id].discard(websocket)
            if not self.active_connections[event_id]:
                del self.active_connections[event_id]
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific client."""
        await websocket.send_text(message)
    
    async def broadcast(self, message: dict, event_id: int, exclude: WebSocket = None):
        """Broadcast a message to all clients watching an event."""
        if event_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[event_id]:
                if connection != exclude:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        disconnected.add(connection)
            
            # Clean up disconnected clients
            for connection in disconnected:
                self.active_connections[event_id].discard(connection)


manager = ConnectionManager()


@router.websocket("/ws/{event_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    event_id: int,
    token: str = Query(...),
):
    """
    WebSocket endpoint for real-time event chat and updates.
    Clients should connect with their auth token as a query parameter.
    """
    db: Session = next(get_db())
    
    try:
        # Verify event exists
        event = db.query(LiveEvent).filter(LiveEvent.id == event_id).first()
        if not event:
            await websocket.close(code=1008, reason="Event not found")
            return
        
        # TODO: Verify token and get user
        # For now, we'll accept the connection
        user_id = 1  # Placeholder
        
        await manager.connect(websocket, event_id)
        
        # Send connection confirmation
        await manager.send_personal_message(
            json.dumps({
                "type": "connected",
                "event_id": event_id,
                "message": "Connected to live event"
            }),
            websocket
        )
        
        # Update viewer session
        viewer = db.query(EventViewer).filter(
            EventViewer.live_event_id == event_id,
            EventViewer.user_id == user_id,
            EventViewer.is_currently_watching == True
        ).first()
        
        if not viewer:
            viewer = EventViewer(
                live_event_id=event_id,
                user_id=user_id,
                is_currently_watching=True
            )
            db.add(viewer)
            db.commit()
        
        # Main message loop
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            message_type = message_data.get("type")
            
            if message_type == "chat_message":
                # Handle chat message
                message_text = message_data.get("message", "")
                
                if not event.chat_enabled:
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "error",
                            "message": "Chat is disabled for this event"
                        }),
                        websocket
                    )
                    continue
                
                # Moderate message if needed
                if event.chat_moderated:
                    moderator = ChatModerationService(db, event.institution_id)
                    moderation_result = moderator.moderate_message(message_text)
                    
                    if not moderation_result["is_allowed"]:
                        await manager.send_personal_message(
                            json.dumps({
                                "type": "error",
                                "message": f"Message blocked: {moderation_result['reason']}"
                            }),
                            websocket
                        )
                        continue
                    
                    message_text = moderation_result["modified_message"]
                
                # Save message to database
                chat_message = EventChatMessage(
                    live_event_id=event_id,
                    user_id=user_id,
                    message=message_text,
                    message_type=message_data.get("message_type", "text")
                )
                db.add(chat_message)
                
                # Update viewer message count
                if viewer:
                    viewer.messages_sent += 1
                
                db.commit()
                db.refresh(chat_message)
                
                # Broadcast message to all viewers
                await manager.broadcast(
                    {
                        "type": "chat_message",
                        "message_id": chat_message.id,
                        "user_id": user_id,
                        "message": message_text,
                        "message_type": chat_message.message_type,
                        "timestamp": chat_message.created_at.isoformat(),
                    },
                    event_id
                )
            
            elif message_type == "viewer_update":
                # Update viewer metrics
                if viewer:
                    watch_duration = message_data.get("watch_duration")
                    if watch_duration is not None:
                        viewer.watch_duration = watch_duration
                    db.commit()
            
            elif message_type == "ping":
                # Keep-alive ping
                await manager.send_personal_message(
                    json.dumps({"type": "pong"}),
                    websocket
                )
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, event_id)
        
        # Update viewer session
        if viewer:
            viewer.is_currently_watching = False
            viewer.left_at = datetime.utcnow()
            db.commit()
        
        # Update event viewer count
        current_viewers = db.query(EventViewer).filter(
            EventViewer.live_event_id == event_id,
            EventViewer.is_currently_watching == True
        ).count()
        
        event.viewer_count = current_viewers
        db.commit()
        
        # Broadcast viewer count update
        await manager.broadcast(
            {
                "type": "viewer_count_update",
                "viewer_count": current_viewers
            },
            event_id
        )
    
    except Exception as e:
        manager.disconnect(websocket, event_id)
        await websocket.close(code=1011, reason=str(e))
    
    finally:
        db.close()


@router.websocket("/ws/{event_id}/moderator")
async def moderator_websocket_endpoint(
    websocket: WebSocket,
    event_id: int,
    token: str = Query(...),
):
    """
    WebSocket endpoint for moderators to receive real-time moderation alerts.
    """
    db: Session = next(get_db())
    
    try:
        # Verify event exists
        event = db.query(LiveEvent).filter(LiveEvent.id == event_id).first()
        if not event:
            await websocket.close(code=1008, reason="Event not found")
            return
        
        # TODO: Verify token and check moderator permissions
        
        await websocket.accept()
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "event_id": event_id,
            "message": "Connected as moderator"
        })
        
        # Main message loop for moderator actions
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            action_type = message_data.get("type")
            
            if action_type == "delete_message":
                message_id = message_data.get("message_id")
                reason = message_data.get("reason", "")
                
                chat_message = db.query(EventChatMessage).filter(
                    EventChatMessage.id == message_id,
                    EventChatMessage.live_event_id == event_id
                ).first()
                
                if chat_message:
                    chat_message.is_deleted = True
                    chat_message.moderation_reason = reason
                    chat_message.moderated_at = datetime.utcnow()
                    db.commit()
                    
                    # Broadcast deletion to all viewers
                    await manager.broadcast(
                        {
                            "type": "message_deleted",
                            "message_id": message_id
                        },
                        event_id
                    )
            
            elif action_type == "mute_chat":
                event.chat_enabled = False
                db.commit()
                
                await manager.broadcast(
                    {
                        "type": "chat_disabled",
                        "message": "Chat has been disabled by moderator"
                    },
                    event_id
                )
            
            elif action_type == "unmute_chat":
                event.chat_enabled = True
                db.commit()
                
                await manager.broadcast(
                    {
                        "type": "chat_enabled",
                        "message": "Chat has been enabled"
                    },
                    event_id
                )
    
    except WebSocketDisconnect:
        pass
    
    except Exception as e:
        await websocket.close(code=1011, reason=str(e))
    
    finally:
        db.close()
