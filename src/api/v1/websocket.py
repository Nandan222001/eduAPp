from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy.orm import Session
import json
import logging

from src.database import get_db
from src.services.websocket_manager import websocket_manager
from src.dependencies.auth import get_current_user_ws

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    db: Session = Depends(get_db)
):
    try:
        user = await get_current_user_ws(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        await websocket_manager.connect(websocket, user.id)
        
        try:
            await websocket_manager.send_personal_message(
                {
                    "type": "connection",
                    "message": "Connected to notification service",
                    "user_id": user.id
                },
                user.id
            )
            
            while True:
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                    
                    if message.get("type") == "ping":
                        await websocket.send_json({
                            "type": "pong",
                            "timestamp": message.get("timestamp")
                        })
                    elif message.get("type") == "subscribe":
                        channels = message.get("channels", [])
                        await websocket.send_json({
                            "type": "subscribed",
                            "channels": channels
                        })
                    
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON received from user {user.id}")
                    
        except WebSocketDisconnect:
            websocket_manager.disconnect(websocket, user.id)
            logger.info(f"User {user.id} disconnected")
            
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass
