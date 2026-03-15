import secrets
from typing import Dict, Optional, Any
from datetime import datetime
import httpx
from src.config import settings


class VimeoLiveService:
    """
    Service for integrating with Vimeo Live API.
    Requires Vimeo API access token.
    """
    
    def __init__(self):
        self.access_token = getattr(settings, 'vimeo_access_token', '')
        self.base_url = "https://api.vimeo.com"
    
    async def create_live_event(
        self,
        title: str,
        description: str,
        scheduled_start_time: datetime,
        privacy: str = "unlisted"
    ) -> Dict[str, Any]:
        """
        Create a Vimeo Live event.
        
        Args:
            title: Event title
            description: Event description
            scheduled_start_time: When the event should start
            privacy: anybody, nobody, unlisted
            
        Returns:
            Dictionary with event details including stream key
        """
        if not self.access_token:
            return self._mock_create_event(title)
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "Accept": "application/vnd.vimeo.*+json;version=3.4"
        }
        
        async with httpx.AsyncClient() as client:
            # Create live event
            event_data = {
                "title": title,
                "description": description,
                "privacy": {
                    "view": privacy,
                    "embed": "whitelist"
                },
                "embed": {
                    "autopause": False,
                    "color": "#00adef",
                    "title": {
                        "name": "show",
                        "owner": "show",
                        "portrait": "show"
                    }
                },
                "schedule": {
                    "type": "single",
                    "daily_time": None,
                    "weekdays": None
                }
            }
            
            response = await client.post(
                f"{self.base_url}/me/videos",
                headers=headers,
                json=event_data
            )
            event = response.json()
            
            # Get RTMP details
            rtmp_response = await client.get(
                f"{self.base_url}{event['uri']}/live",
                headers=headers
            )
            rtmp_data = rtmp_response.json()
            
            return {
                "event_id": event["uri"].split("/")[-1],
                "stream_key": rtmp_data.get("key", ""),
                "rtmp_url": rtmp_data.get("link", ""),
                "stream_url": event["link"],
                "embed_url": event["embed"]["html"],
                "player_embed_url": event["player_embed_url"],
                "status": event["status"]
            }
    
    async def start_event(self, event_id: str) -> Dict[str, Any]:
        """Start streaming a Vimeo Live event."""
        if not self.access_token:
            return {"status": "streaming", "event_id": event_id}
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.base_url}/videos/{event_id}",
                headers=headers,
                json={"privacy": {"view": "unlisted"}}
            )
            return response.json()
    
    async def end_event(self, event_id: str) -> Dict[str, Any]:
        """End a Vimeo Live event."""
        if not self.access_token:
            return {"status": "available", "event_id": event_id}
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            # Vimeo automatically saves the recording
            response = await client.get(
                f"{self.base_url}/videos/{event_id}",
                headers=headers
            )
            return response.json()
    
    async def get_event_statistics(self, event_id: str) -> Dict[str, Any]:
        """Get statistics for a Vimeo Live event."""
        if not self.access_token:
            return self._mock_statistics()
        
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/videos/{event_id}",
                headers=headers,
                params={"fields": "stats,metadata"}
            )
            return response.json()
    
    async def delete_event(self, event_id: str) -> bool:
        """Delete a Vimeo Live event."""
        if not self.access_token:
            return True
        
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/videos/{event_id}",
                headers=headers
            )
            return response.status_code == 204
    
    async def get_chat_messages(self, event_id: str) -> list:
        """Get chat messages from a Vimeo Live event."""
        if not self.access_token:
            return []
        
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/videos/{event_id}/comments",
                headers=headers
            )
            data = response.json()
            return data.get("data", [])
    
    def _mock_create_event(self, title: str) -> Dict[str, Any]:
        """Mock response when access token is not configured."""
        mock_id = secrets.token_urlsafe(16)
        stream_key = secrets.token_urlsafe(32)
        
        return {
            "event_id": mock_id,
            "stream_key": stream_key,
            "rtmp_url": f"rtmp://rtmp.vimeo.com/live/{stream_key}",
            "stream_url": f"https://vimeo.com/{mock_id}",
            "embed_url": f'<iframe src="https://player.vimeo.com/video/{mock_id}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture"></iframe>',
            "player_embed_url": f"https://player.vimeo.com/video/{mock_id}",
            "status": "available"
        }
    
    def _mock_statistics(self) -> Dict[str, Any]:
        """Mock statistics when access token is not configured."""
        return {
            "stats": {
                "plays": 0
            },
            "metadata": {
                "connections": {
                    "comments": {
                        "total": 0
                    }
                }
            }
        }
