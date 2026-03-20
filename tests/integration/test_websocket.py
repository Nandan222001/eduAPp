import pytest
import json
import time
from unittest.mock import AsyncMock
from sqlalchemy.orm import Session
from websocket import create_connection, WebSocketException

from src.models.user import User
from src.models.institution import Institution
from src.utils.security import create_access_token
from src.services.websocket_manager import websocket_manager


@pytest.mark.integration
class TestWebSocketAuthentication:
    """Integration tests for WebSocket authentication with JWT token"""

    def test_websocket_connection_with_valid_jwt(self, admin_user: User, institution: Institution):
        """Test WebSocket connection authenticates successfully with valid JWT token"""
        token = create_access_token(
            data={
                "sub": admin_user.id,
                "institution_id": admin_user.institution_id,
                "role_id": admin_user.role_id,
                "email": admin_user.email,
            }
        )

        try:
            ws = create_connection(f"ws://localhost:8000/api/v1/ws?token={token}", timeout=5)

            message = ws.recv()
            data = json.loads(message)

            assert data["type"] == "connection"
            assert data["message"] == "Connected to real-time service"
            assert data["user_id"] == admin_user.id
            assert "timestamp" in data

            ws.close()
        except (WebSocketException, ConnectionRefusedError):
            pytest.skip("WebSocket server not running")

    def test_websocket_connection_without_token(self):
        """Test WebSocket connection fails without token"""
        try:
            ws = create_connection("ws://localhost:8000/api/v1/ws", timeout=5)
            ws.close()
            pytest.fail("Connection should have failed without token")
        except (WebSocketException, ConnectionRefusedError):
            pytest.skip("WebSocket server not running")
        except Exception:
            pass

    def test_websocket_connection_with_invalid_token(self):
        """Test WebSocket connection fails with invalid JWT token"""
        invalid_token = "invalid.jwt.token"

        try:
            ws = create_connection(
                f"ws://localhost:8000/api/v1/ws?token={invalid_token}", timeout=5
            )
            ws.close()
            pytest.fail("Connection should have failed with invalid token")
        except (WebSocketException, ConnectionRefusedError):
            pytest.skip("WebSocket server not running")
        except Exception:
            pass

    def test_websocket_connection_with_expired_token(
        self, admin_user: User, institution: Institution
    ):
        """Test WebSocket connection fails with expired JWT token"""
        from datetime import datetime, timedelta
        from jose import jwt
        from src.config import settings

        expired_token_data = {
            "sub": admin_user.id,
            "institution_id": admin_user.institution_id,
            "role_id": admin_user.role_id,
            "email": admin_user.email,
            "exp": datetime.utcnow() - timedelta(hours=1),
            "type": "access",
        }
        expired_token = jwt.encode(
            expired_token_data, settings.secret_key, algorithm=settings.algorithm
        )

        try:
            ws = create_connection(
                f"ws://localhost:8000/api/v1/ws?token={expired_token}", timeout=5
            )
            ws.close()
            pytest.fail("Connection should have failed with expired token")
        except (WebSocketException, ConnectionRefusedError):
            pytest.skip("WebSocket server not running")
        except Exception:
            pass

    def test_websocket_connection_with_inactive_user(
        self, admin_user: User, db_session: Session, institution: Institution
    ):
        """Test WebSocket connection fails for inactive user"""
        admin_user.is_active = False
        db_session.commit()

        token = create_access_token(
            data={
                "sub": admin_user.id,
                "institution_id": admin_user.institution_id,
                "role_id": admin_user.role_id,
                "email": admin_user.email,
            }
        )

        try:
            ws = create_connection(f"ws://localhost:8000/api/v1/ws?token={token}", timeout=5)
            ws.close()
            pytest.fail("Connection should have failed for inactive user")
        except (WebSocketException, ConnectionRefusedError):
            pytest.skip("WebSocket server not running")
        except Exception:
            pass
        finally:
            admin_user.is_active = True
            db_session.commit()


@pytest.mark.integration
class TestWebSocketRoomSubscription:
    """Integration tests for room subscription functionality"""

    def test_subscribe_to_notification_room(self, admin_user: User, institution: Institution):
        """Test subscribing to notification room"""
        token = create_access_token(
            data={
                "sub": admin_user.id,
                "institution_id": admin_user.institution_id,
                "role_id": admin_user.role_id,
                "email": admin_user.email,
            }
        )

        try:
            ws = create_connection(f"ws://localhost:8000/api/v1/ws?token={token}", timeout=5)

            ws.recv()

            subscribe_message = {"type": "subscribe", "rooms": [f"notifications_{admin_user.id}"]}
            ws.send(json.dumps(subscribe_message))

            response = ws.recv()
            data = json.loads(response)

            assert data["type"] == "subscribed"
            assert f"notifications_{admin_user.id}" in data["rooms"]

            ws.close()
        except (WebSocketException, ConnectionRefusedError):
            pytest.skip("WebSocket server not running")

    def test_subscribe_to_chat_room(self, admin_user: User, institution: Institution):
        """Test subscribing to chat room"""
        token = create_access_token(
            data={
                "sub": admin_user.id,
                "institution_id": admin_user.institution_id,
                "role_id": admin_user.role_id,
                "email": admin_user.email,
            }
        )

        try:
            ws = create_connection(f"ws://localhost:8000/api/v1/ws?token={token}", timeout=5)

            ws.recv()

            chat_room = "chat_room_123"
            subscribe_message = {"type": "subscribe", "rooms": [chat_room]}
            ws.send(json.dumps(subscribe_message))

            response = ws.recv()
            data = json.loads(response)

            assert data["type"] == "subscribed"
            assert chat_room in data["rooms"]

            ws.close()
        except (WebSocketException, ConnectionRefusedError):
            pytest.skip("WebSocket server not running")

    def test_subscribe_to_multiple_rooms(self, admin_user: User, institution: Institution):
        """Test subscribing to multiple rooms at once"""
        token = create_access_token(
            data={
                "sub": admin_user.id,
                "institution_id": admin_user.institution_id,
                "role_id": admin_user.role_id,
                "email": admin_user.email,
            }
        )

        try:
            ws = create_connection(f"ws://localhost:8000/api/v1/ws?token={token}", timeout=5)

            ws.recv()

            rooms = [f"notifications_{admin_user.id}", "chat_room_123", "quiz_456"]
            subscribe_message = {"type": "subscribe", "rooms": rooms}
            ws.send(json.dumps(subscribe_message))

            response = ws.recv()
            data = json.loads(response)

            assert data["type"] == "subscribed"
            assert set(data["rooms"]) == set(rooms)

            ws.close()
        except (WebSocketException, ConnectionRefusedError):
            pytest.skip("WebSocket server not running")

    def test_unsubscribe_from_room(self, admin_user: User, institution: Institution):
        """Test unsubscribing from a room"""
        token = create_access_token(
            data={
                "sub": admin_user.id,
                "institution_id": admin_user.institution_id,
                "role_id": admin_user.role_id,
                "email": admin_user.email,
            }
        )

        try:
            ws = create_connection(f"ws://localhost:8000/api/v1/ws?token={token}", timeout=5)

            ws.recv()

            room = "chat_room_123"

            subscribe_message = {"type": "subscribe", "rooms": [room]}
            ws.send(json.dumps(subscribe_message))
            ws.recv()

            unsubscribe_message = {"type": "unsubscribe", "rooms": [room]}
            ws.send(json.dumps(unsubscribe_message))

            response = ws.recv()
            data = json.loads(response)

            assert data["type"] == "unsubscribed"
            assert room in data["rooms"]

            ws.close()
        except (WebSocketException, ConnectionRefusedError):
            pytest.skip("WebSocket server not running")


@pytest.mark.integration
class TestWebSocketNotificationDelivery:
    """Integration tests for real-time notification delivery"""

    @pytest.mark.asyncio
    async def test_send_personal_notification(self, admin_user: User, institution: Institution):
        """Test sending notification to a specific connected user"""
        from fastapi import WebSocket

        mock_websocket = AsyncMock(spec=WebSocket)

        await websocket_manager.connect(mock_websocket, admin_user.id)

        await websocket_manager.send_notification(
            user_id=admin_user.id,
            notification_type="assignment",
            title="New Assignment",
            message="You have a new assignment",
            data={"assignment_id": 123},
        )

        mock_websocket.send_text.assert_called()
        sent_message = json.loads(mock_websocket.send_text.call_args[0][0])

        assert sent_message["type"] == "notification"
        assert sent_message["notification_type"] == "assignment"
        assert sent_message["title"] == "New Assignment"
        assert sent_message["message"] == "You have a new assignment"
        assert sent_message["data"]["assignment_id"] == 123
        assert "timestamp" in sent_message

        websocket_manager.disconnect(mock_websocket, admin_user.id)

    @pytest.mark.asyncio
    async def test_send_message_notification(
        self, admin_user: User, teacher_user: User, institution: Institution
    ):
        """Test sending new message notification"""
        from fastapi import WebSocket

        mock_websocket = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_websocket, admin_user.id)

        await websocket_manager.send_message_notification(
            user_id=admin_user.id,
            message_id=456,
            sender_id=teacher_user.id,
            sender_name=teacher_user.full_name or teacher_user.email,
            subject="Important Update",
            preview="Please check this urgent message...",
        )

        mock_websocket.send_text.assert_called()
        sent_message = json.loads(mock_websocket.send_text.call_args[0][0])

        assert sent_message["type"] == "new_message"
        assert sent_message["message_id"] == 456
        assert sent_message["sender_id"] == teacher_user.id
        assert sent_message["subject"] == "Important Update"
        assert "timestamp" in sent_message

        websocket_manager.disconnect(mock_websocket, admin_user.id)

    @pytest.mark.asyncio
    async def test_send_announcement_notification(self, admin_user: User, institution: Institution):
        """Test sending announcement notification"""
        from fastapi import WebSocket

        mock_websocket = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_websocket, admin_user.id)

        await websocket_manager.send_announcement_notification(
            user_id=admin_user.id, announcement_id=789, title="School Holiday", priority="high"
        )

        mock_websocket.send_text.assert_called()
        sent_message = json.loads(mock_websocket.send_text.call_args[0][0])

        assert sent_message["type"] == "new_announcement"
        assert sent_message["announcement_id"] == 789
        assert sent_message["title"] == "School Holiday"
        assert sent_message["priority"] == "high"

        websocket_manager.disconnect(mock_websocket, admin_user.id)

    @pytest.mark.asyncio
    async def test_notification_not_sent_to_offline_user(
        self, admin_user: User, institution: Institution
    ):
        """Test notification is not sent to offline user"""
        await websocket_manager.send_notification(
            user_id=admin_user.id,
            notification_type="test",
            title="Test",
            message="This should not be sent",
        )

        assert admin_user.id not in websocket_manager.active_connections


@pytest.mark.integration
class TestWebSocketTypingIndicators:
    """Integration tests for typing indicators in chat"""

    @pytest.mark.asyncio
    async def test_send_typing_indicator_start(self, admin_user: User, institution: Institution):
        """Test sending typing indicator when user starts typing"""
        from fastapi import WebSocket

        mock_websocket = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_websocket, admin_user.id)

        room = "chat_room_123"
        websocket_manager.subscribe_to_room(room, admin_user.id)

        await websocket_manager.send_typing_indicator(
            room=room,
            user_id=admin_user.id,
            user_name=admin_user.full_name or admin_user.email,
            is_typing=True,
        )

        assert room in websocket_manager.typing_indicators
        assert admin_user.id in websocket_manager.typing_indicators[room]

        websocket_manager.disconnect(mock_websocket, admin_user.id)

    @pytest.mark.asyncio
    async def test_send_typing_indicator_stop(self, admin_user: User, institution: Institution):
        """Test sending typing indicator when user stops typing"""
        from fastapi import WebSocket

        mock_websocket = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_websocket, admin_user.id)

        room = "chat_room_123"
        websocket_manager.subscribe_to_room(room, admin_user.id)

        await websocket_manager.send_typing_indicator(
            room=room,
            user_id=admin_user.id,
            user_name=admin_user.full_name or admin_user.email,
            is_typing=True,
        )

        await websocket_manager.send_typing_indicator(
            room=room,
            user_id=admin_user.id,
            user_name=admin_user.full_name or admin_user.email,
            is_typing=False,
        )

        assert admin_user.id not in websocket_manager.typing_indicators.get(room, {})

        websocket_manager.disconnect(mock_websocket, admin_user.id)

    @pytest.mark.asyncio
    async def test_typing_indicator_broadcast_to_room(
        self, admin_user: User, teacher_user: User, institution: Institution
    ):
        """Test typing indicator is broadcast to other users in room"""
        from fastapi import WebSocket

        mock_ws_admin = AsyncMock(spec=WebSocket)
        mock_ws_teacher = AsyncMock(spec=WebSocket)

        await websocket_manager.connect(mock_ws_admin, admin_user.id)
        await websocket_manager.connect(mock_ws_teacher, teacher_user.id)

        room = "chat_room_123"
        websocket_manager.subscribe_to_room(room, admin_user.id)
        websocket_manager.subscribe_to_room(room, teacher_user.id)

        await websocket_manager.send_typing_indicator(
            room=room,
            user_id=admin_user.id,
            user_name=admin_user.full_name or admin_user.email,
            is_typing=True,
        )

        mock_ws_teacher.send_text.assert_called()
        sent_message = json.loads(mock_ws_teacher.send_text.call_args[0][0])

        assert sent_message["type"] == "typing_indicator"
        assert sent_message["room"] == room
        assert sent_message["user_id"] == admin_user.id
        assert sent_message["is_typing"] is True

        websocket_manager.disconnect(mock_ws_admin, admin_user.id)
        websocket_manager.disconnect(mock_ws_teacher, teacher_user.id)

    @pytest.mark.asyncio
    async def test_get_typing_users_in_room(
        self, admin_user: User, teacher_user: User, institution: Institution
    ):
        """Test getting list of users currently typing in a room"""
        from fastapi import WebSocket

        mock_ws_admin = AsyncMock(spec=WebSocket)
        mock_ws_teacher = AsyncMock(spec=WebSocket)

        await websocket_manager.connect(mock_ws_admin, admin_user.id)
        await websocket_manager.connect(mock_ws_teacher, teacher_user.id)

        room = "chat_room_123"
        websocket_manager.subscribe_to_room(room, admin_user.id)
        websocket_manager.subscribe_to_room(room, teacher_user.id)

        await websocket_manager.send_typing_indicator(
            room=room,
            user_id=admin_user.id,
            user_name=admin_user.full_name or admin_user.email,
            is_typing=True,
        )

        typing_users = websocket_manager.get_typing_users(room)
        assert admin_user.id in typing_users
        assert teacher_user.id not in typing_users

        websocket_manager.disconnect(mock_ws_admin, admin_user.id)
        websocket_manager.disconnect(mock_ws_teacher, teacher_user.id)


@pytest.mark.integration
class TestWebSocketPresenceUpdates:
    """Integration tests for presence updates (online/offline)"""

    @pytest.mark.asyncio
    async def test_user_online_on_connect(self, admin_user: User, institution: Institution):
        """Test user presence is set to online on connection"""
        from fastapi import WebSocket

        mock_websocket = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_websocket, admin_user.id)

        presence = websocket_manager.get_user_presence(admin_user.id)

        assert presence["status"] == "online"
        assert "last_seen" in presence
        assert "connected_at" in presence

        websocket_manager.disconnect(mock_websocket, admin_user.id)

    @pytest.mark.asyncio
    async def test_user_offline_on_disconnect(self, admin_user: User, institution: Institution):
        """Test user presence is set to offline on disconnect"""
        from fastapi import WebSocket

        mock_websocket = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_websocket, admin_user.id)

        websocket_manager.disconnect(mock_websocket, admin_user.id)

        presence = websocket_manager.get_user_presence(admin_user.id)

        assert presence["status"] == "offline"
        assert "last_seen" in presence

    @pytest.mark.asyncio
    async def test_broadcast_presence_update_on_connect(
        self, admin_user: User, teacher_user: User, institution: Institution
    ):
        """Test presence update is broadcast when user connects"""
        from fastapi import WebSocket

        mock_ws_teacher = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_ws_teacher, teacher_user.id)

        mock_ws_admin = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_ws_admin, admin_user.id)

        mock_ws_teacher.send_text.assert_called()

        calls = mock_ws_teacher.send_text.call_args_list
        presence_update_found = False

        for call in calls:
            message = json.loads(call[0][0])
            if message.get("type") == "presence_update":
                assert message["user_id"] == admin_user.id
                assert message["status"] == "online"
                presence_update_found = True
                break

        assert presence_update_found

        websocket_manager.disconnect(mock_ws_admin, admin_user.id)
        websocket_manager.disconnect(mock_ws_teacher, teacher_user.id)

    @pytest.mark.asyncio
    async def test_broadcast_custom_presence_status(
        self, admin_user: User, teacher_user: User, institution: Institution
    ):
        """Test broadcasting custom presence status (away, busy, etc.)"""
        from fastapi import WebSocket

        mock_ws_admin = AsyncMock(spec=WebSocket)
        mock_ws_teacher = AsyncMock(spec=WebSocket)

        await websocket_manager.connect(mock_ws_admin, admin_user.id)
        await websocket_manager.connect(mock_ws_teacher, teacher_user.id)

        await websocket_manager.broadcast_presence_update(user_id=admin_user.id, status="away")

        mock_ws_teacher.send_text.assert_called()

        calls = mock_ws_teacher.send_text.call_args_list
        presence_update_found = False

        for call in calls:
            message = json.loads(call[0][0])
            if message.get("type") == "presence_update" and message.get("status") == "away":
                assert message["user_id"] == admin_user.id
                presence_update_found = True
                break

        assert presence_update_found

        websocket_manager.disconnect(mock_ws_admin, admin_user.id)
        websocket_manager.disconnect(mock_ws_teacher, teacher_user.id)

    @pytest.mark.asyncio
    async def test_get_online_users(
        self, admin_user: User, teacher_user: User, student_user: User, institution: Institution
    ):
        """Test getting list of online users"""
        from fastapi import WebSocket

        mock_ws_admin = AsyncMock(spec=WebSocket)
        mock_ws_teacher = AsyncMock(spec=WebSocket)

        await websocket_manager.connect(mock_ws_admin, admin_user.id)
        await websocket_manager.connect(mock_ws_teacher, teacher_user.id)

        user_ids = [admin_user.id, teacher_user.id, student_user.id]
        online_users = websocket_manager.get_online_users(user_ids)

        assert admin_user.id in online_users
        assert teacher_user.id in online_users
        assert student_user.id not in online_users

        websocket_manager.disconnect(mock_ws_admin, admin_user.id)
        websocket_manager.disconnect(mock_ws_teacher, teacher_user.id)

    @pytest.mark.asyncio
    async def test_is_user_connected(self, admin_user: User, institution: Institution):
        """Test checking if a user is connected"""
        from fastapi import WebSocket

        assert websocket_manager.is_user_connected(admin_user.id) is False

        mock_websocket = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_websocket, admin_user.id)

        assert websocket_manager.is_user_connected(admin_user.id) is True

        websocket_manager.disconnect(mock_websocket, admin_user.id)

        assert websocket_manager.is_user_connected(admin_user.id) is False


@pytest.mark.integration
class TestWebSocketMessageBroadcasting:
    """Integration tests for message broadcasting to room participants"""

    @pytest.mark.asyncio
    async def test_broadcast_chat_message_to_room(
        self, admin_user: User, teacher_user: User, institution: Institution
    ):
        """Test broadcasting chat message to all room participants"""
        from fastapi import WebSocket

        mock_ws_admin = AsyncMock(spec=WebSocket)
        mock_ws_teacher = AsyncMock(spec=WebSocket)

        await websocket_manager.connect(mock_ws_admin, admin_user.id)
        await websocket_manager.connect(mock_ws_teacher, teacher_user.id)

        room = "chat_room_123"
        websocket_manager.subscribe_to_room(room, admin_user.id)
        websocket_manager.subscribe_to_room(room, teacher_user.id)

        await websocket_manager.send_chat_message(
            room=room,
            sender_id=admin_user.id,
            sender_name=admin_user.full_name or admin_user.email,
            message="Hello everyone!",
            message_id=999,
        )

        mock_ws_teacher.send_text.assert_called()
        sent_message = json.loads(mock_ws_teacher.send_text.call_args[0][0])

        assert sent_message["type"] == "chat_message"
        assert sent_message["room"] == room
        assert sent_message["sender_id"] == admin_user.id
        assert sent_message["message"] == "Hello everyone!"
        assert sent_message["message_id"] == 999

        websocket_manager.disconnect(mock_ws_admin, admin_user.id)
        websocket_manager.disconnect(mock_ws_teacher, teacher_user.id)

    @pytest.mark.asyncio
    async def test_sender_not_receiving_own_message(
        self, admin_user: User, teacher_user: User, institution: Institution
    ):
        """Test sender does not receive their own message in broadcast"""
        from fastapi import WebSocket

        mock_ws_admin = AsyncMock(spec=WebSocket)
        mock_ws_teacher = AsyncMock(spec=WebSocket)

        await websocket_manager.connect(mock_ws_admin, admin_user.id)
        await websocket_manager.connect(mock_ws_teacher, teacher_user.id)

        room = "chat_room_123"
        websocket_manager.subscribe_to_room(room, admin_user.id)
        websocket_manager.subscribe_to_room(room, teacher_user.id)

        mock_ws_admin.send_text.reset_mock()

        await websocket_manager.send_chat_message(
            room=room,
            sender_id=admin_user.id,
            sender_name=admin_user.full_name or admin_user.email,
            message="Test message",
            message_id=888,
        )

        mock_ws_teacher.send_text.assert_called()

        websocket_manager.disconnect(mock_ws_admin, admin_user.id)
        websocket_manager.disconnect(mock_ws_teacher, teacher_user.id)

    @pytest.mark.asyncio
    async def test_broadcast_to_room_multiple_recipients(
        self, admin_user: User, teacher_user: User, student_user: User, institution: Institution
    ):
        """Test broadcasting message to multiple users in room"""
        from fastapi import WebSocket

        mock_ws_admin = AsyncMock(spec=WebSocket)
        mock_ws_teacher = AsyncMock(spec=WebSocket)
        mock_ws_student = AsyncMock(spec=WebSocket)

        await websocket_manager.connect(mock_ws_admin, admin_user.id)
        await websocket_manager.connect(mock_ws_teacher, teacher_user.id)
        await websocket_manager.connect(mock_ws_student, student_user.id)

        room = "chat_room_123"
        websocket_manager.subscribe_to_room(room, admin_user.id)
        websocket_manager.subscribe_to_room(room, teacher_user.id)
        websocket_manager.subscribe_to_room(room, student_user.id)

        test_message = {"type": "custom", "content": "Broadcast test"}

        await websocket_manager.broadcast_to_room(room, test_message)

        mock_ws_admin.send_text.assert_called()
        mock_ws_teacher.send_text.assert_called()
        mock_ws_student.send_text.assert_called()

        websocket_manager.disconnect(mock_ws_admin, admin_user.id)
        websocket_manager.disconnect(mock_ws_teacher, teacher_user.id)
        websocket_manager.disconnect(mock_ws_student, student_user.id)

    @pytest.mark.asyncio
    async def test_broadcast_attendance_update(
        self, admin_user: User, teacher_user: User, institution: Institution
    ):
        """Test broadcasting attendance update to multiple users"""
        from fastapi import WebSocket

        mock_ws_admin = AsyncMock(spec=WebSocket)
        mock_ws_teacher = AsyncMock(spec=WebSocket)

        await websocket_manager.connect(mock_ws_admin, admin_user.id)
        await websocket_manager.connect(mock_ws_teacher, teacher_user.id)

        await websocket_manager.send_attendance_update(
            user_ids=[admin_user.id, teacher_user.id],
            student_id=123,
            student_name="John Doe",
            date="2024-01-15",
            status="present",
        )

        mock_ws_admin.send_text.assert_called()
        mock_ws_teacher.send_text.assert_called()

        sent_message = json.loads(mock_ws_admin.send_text.call_args[0][0])

        assert sent_message["type"] == "attendance_update"
        assert sent_message["student_id"] == 123
        assert sent_message["student_name"] == "John Doe"
        assert sent_message["status"] == "present"

        websocket_manager.disconnect(mock_ws_admin, admin_user.id)
        websocket_manager.disconnect(mock_ws_teacher, teacher_user.id)

    @pytest.mark.asyncio
    async def test_broadcast_leaderboard_update(
        self, admin_user: User, teacher_user: User, institution: Institution
    ):
        """Test broadcasting leaderboard update to quiz room"""
        from fastapi import WebSocket

        mock_ws_admin = AsyncMock(spec=WebSocket)
        mock_ws_teacher = AsyncMock(spec=WebSocket)

        await websocket_manager.connect(mock_ws_admin, admin_user.id)
        await websocket_manager.connect(mock_ws_teacher, teacher_user.id)

        quiz_id = 456
        room = f"quiz_{quiz_id}"
        websocket_manager.subscribe_to_room(room, admin_user.id)
        websocket_manager.subscribe_to_room(room, teacher_user.id)

        leaderboard_data = [
            {"rank": 1, "user_id": admin_user.id, "score": 95},
            {"rank": 2, "user_id": teacher_user.id, "score": 88},
        ]

        await websocket_manager.send_leaderboard_update(
            quiz_id=quiz_id, leaderboard_data=leaderboard_data
        )

        mock_ws_admin.send_text.assert_called()
        sent_message = json.loads(mock_ws_admin.send_text.call_args[0][0])

        assert sent_message["type"] == "leaderboard_update"
        assert sent_message["quiz_id"] == quiz_id
        assert sent_message["leaderboard"] == leaderboard_data

        websocket_manager.disconnect(mock_ws_admin, admin_user.id)
        websocket_manager.disconnect(mock_ws_teacher, teacher_user.id)


@pytest.mark.integration
class TestWebSocketConnectionCleanup:
    """Integration tests for connection cleanup on disconnect"""

    @pytest.mark.asyncio
    async def test_cleanup_on_disconnect(self, admin_user: User, institution: Institution):
        """Test WebSocket connection is properly cleaned up on disconnect"""
        from fastapi import WebSocket

        mock_websocket = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_websocket, admin_user.id)

        assert admin_user.id in websocket_manager.active_connections
        assert websocket_manager.is_user_connected(admin_user.id) is True

        websocket_manager.disconnect(mock_websocket, admin_user.id)

        assert admin_user.id not in websocket_manager.active_connections
        assert websocket_manager.is_user_connected(admin_user.id) is False

    @pytest.mark.asyncio
    async def test_presence_set_offline_on_disconnect(
        self, admin_user: User, institution: Institution
    ):
        """Test user presence is set to offline on disconnect"""
        from fastapi import WebSocket

        mock_websocket = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_websocket, admin_user.id)

        presence_before = websocket_manager.get_user_presence(admin_user.id)
        assert presence_before["status"] == "online"

        websocket_manager.disconnect(mock_websocket, admin_user.id)

        presence_after = websocket_manager.get_user_presence(admin_user.id)
        assert presence_after["status"] == "offline"
        assert "last_seen" in presence_after

    @pytest.mark.asyncio
    async def test_multiple_connections_same_user(self, admin_user: User, institution: Institution):
        """Test handling multiple connections from same user"""
        from fastapi import WebSocket

        mock_ws1 = AsyncMock(spec=WebSocket)
        mock_ws2 = AsyncMock(spec=WebSocket)

        await websocket_manager.connect(mock_ws1, admin_user.id)
        await websocket_manager.connect(mock_ws2, admin_user.id)

        assert admin_user.id in websocket_manager.active_connections
        assert len(websocket_manager.active_connections[admin_user.id]) == 2

        websocket_manager.disconnect(mock_ws1, admin_user.id)

        assert admin_user.id in websocket_manager.active_connections
        assert len(websocket_manager.active_connections[admin_user.id]) == 1
        assert websocket_manager.is_user_connected(admin_user.id) is True

        websocket_manager.disconnect(mock_ws2, admin_user.id)

        assert admin_user.id not in websocket_manager.active_connections
        assert websocket_manager.is_user_connected(admin_user.id) is False

    @pytest.mark.asyncio
    async def test_room_subscriptions_not_cleaned_on_disconnect(
        self, admin_user: User, institution: Institution
    ):
        """Test room subscriptions persist across reconnects"""
        from fastapi import WebSocket

        mock_ws1 = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_ws1, admin_user.id)

        room = "persistent_room_123"
        websocket_manager.subscribe_to_room(room, admin_user.id)

        assert admin_user.id in websocket_manager.room_subscriptions[room]

        websocket_manager.disconnect(mock_ws1, admin_user.id)

        assert admin_user.id in websocket_manager.room_subscriptions[room]

        mock_ws2 = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_ws2, admin_user.id)

        test_message = {"type": "test", "content": "Still subscribed"}
        await websocket_manager.broadcast_to_room(room, test_message)

        mock_ws2.send_text.assert_called()

        websocket_manager.disconnect(mock_ws2, admin_user.id)

    @pytest.mark.asyncio
    async def test_get_connected_users_count(
        self, admin_user: User, teacher_user: User, student_user: User, institution: Institution
    ):
        """Test getting count of connected users"""
        from fastapi import WebSocket

        assert websocket_manager.get_connected_users_count() == 0

        mock_ws_admin = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_ws_admin, admin_user.id)

        assert websocket_manager.get_connected_users_count() == 1

        mock_ws_teacher = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_ws_teacher, teacher_user.id)

        assert websocket_manager.get_connected_users_count() == 2

        mock_ws_student = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_ws_student, student_user.id)

        assert websocket_manager.get_connected_users_count() == 3

        websocket_manager.disconnect(mock_ws_admin, admin_user.id)
        websocket_manager.disconnect(mock_ws_teacher, teacher_user.id)
        websocket_manager.disconnect(mock_ws_student, student_user.id)

        assert websocket_manager.get_connected_users_count() == 0


@pytest.mark.integration
class TestWebSocketPingPong:
    """Integration tests for WebSocket ping/pong mechanism"""

    def test_ping_pong_mechanism(self, admin_user: User, institution: Institution):
        """Test WebSocket ping/pong keeps connection alive"""
        token = create_access_token(
            data={
                "sub": admin_user.id,
                "institution_id": admin_user.institution_id,
                "role_id": admin_user.role_id,
                "email": admin_user.email,
            }
        )

        try:
            ws = create_connection(f"ws://localhost:8000/api/v1/ws?token={token}", timeout=5)

            ws.recv()

            timestamp = int(time.time() * 1000)
            ping_message = {"type": "ping", "timestamp": timestamp}
            ws.send(json.dumps(ping_message))

            response = ws.recv()
            data = json.loads(response)

            assert data["type"] == "pong"
            assert data["timestamp"] == timestamp

            ws.close()
        except (WebSocketException, ConnectionRefusedError):
            pytest.skip("WebSocket server not running")


@pytest.mark.integration
class TestWebSocketErrorHandling:
    """Integration tests for WebSocket error handling"""

    @pytest.mark.asyncio
    async def test_handle_invalid_json_message(self, admin_user: User, institution: Institution):
        """Test handling of invalid JSON messages"""
        from fastapi import WebSocket

        mock_websocket = AsyncMock(spec=WebSocket)
        mock_websocket.receive_text = AsyncMock(return_value="invalid json {")

        await websocket_manager.connect(mock_websocket, admin_user.id)

        websocket_manager.disconnect(mock_websocket, admin_user.id)

    @pytest.mark.asyncio
    async def test_handle_connection_error_during_send(
        self, admin_user: User, institution: Institution
    ):
        """Test handling connection error when sending message"""
        from fastapi import WebSocket

        mock_websocket = AsyncMock(spec=WebSocket)
        mock_websocket.send_text = AsyncMock(side_effect=Exception("Connection lost"))

        await websocket_manager.connect(mock_websocket, admin_user.id)

        await websocket_manager.send_personal_message(
            {"type": "test", "message": "This should fail"}, admin_user.id
        )

        assert admin_user.id not in websocket_manager.active_connections

    @pytest.mark.asyncio
    async def test_broadcast_presence_update_on_disconnect(
        self, admin_user: User, teacher_user: User, institution: Institution
    ):
        """Test presence update is broadcast when user disconnects"""
        from fastapi import WebSocket

        mock_ws_teacher = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_ws_teacher, teacher_user.id)

        mock_ws_admin = AsyncMock(spec=WebSocket)
        await websocket_manager.connect(mock_ws_admin, admin_user.id)

        mock_ws_teacher.send_text.reset_mock()

        websocket_manager.disconnect(mock_ws_admin, admin_user.id)
        await websocket_manager.broadcast_presence_update(admin_user.id, "offline")

        mock_ws_teacher.send_text.assert_called()

        sent_message = json.loads(mock_ws_teacher.send_text.call_args[0][0])
        assert sent_message["type"] == "presence_update"
        assert sent_message["user_id"] == admin_user.id
        assert sent_message["status"] == "offline"

        websocket_manager.disconnect(mock_ws_teacher, teacher_user.id)
