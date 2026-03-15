import secrets
from typing import Dict, Optional, Any
from datetime import datetime
import httpx
from src.config import settings


class YouTubeLiveService:
    """
    Service for integrating with YouTube Live API.
    Requires YouTube Data API v3 credentials.
    """
    
    def __init__(self):
        self.api_key = getattr(settings, 'youtube_api_key', '')
        self.base_url = "https://www.googleapis.com/youtube/v3"
    
    async def create_live_broadcast(
        self,
        title: str,
        description: str,
        scheduled_start_time: datetime,
        privacy_status: str = "unlisted"
    ) -> Dict[str, Any]:
        """
        Create a YouTube Live broadcast.
        
        Args:
            title: Broadcast title
            description: Broadcast description
            scheduled_start_time: When the broadcast should start
            privacy_status: public, private, or unlisted
            
        Returns:
            Dictionary with broadcast details including stream key
        """
        if not self.api_key:
            return self._mock_create_broadcast(title)
        
        async with httpx.AsyncClient() as client:
            # Create broadcast
            broadcast_data = {
                "snippet": {
                    "title": title,
                    "description": description,
                    "scheduledStartTime": scheduled_start_time.isoformat(),
                },
                "status": {
                    "privacyStatus": privacy_status,
                    "selfDeclaredMadeForKids": False
                },
                "contentDetails": {
                    "enableAutoStart": True,
                    "enableAutoStop": True,
                    "recordFromStart": True,
                    "enableDvr": True,
                    "enableContentEncryption": False,
                    "enableEmbed": True,
                }
            }
            
            broadcast_response = await client.post(
                f"{self.base_url}/liveBroadcasts",
                params={"part": "snippet,status,contentDetails", "key": self.api_key},
                json=broadcast_data
            )
            broadcast = broadcast_response.json()
            
            # Create live stream
            stream_data = {
                "snippet": {
                    "title": f"Stream for {title}"
                },
                "cdn": {
                    "frameRate": "variable",
                    "ingestionType": "rtmp",
                    "resolution": "variable"
                }
            }
            
            stream_response = await client.post(
                f"{self.base_url}/liveStreams",
                params={"part": "snippet,cdn", "key": self.api_key},
                json=stream_data
            )
            stream = stream_response.json()
            
            # Bind broadcast to stream
            await client.post(
                f"{self.base_url}/liveBroadcasts/bind",
                params={
                    "part": "snippet",
                    "id": broadcast["id"],
                    "streamId": stream["id"],
                    "key": self.api_key
                }
            )
            
            return {
                "broadcast_id": broadcast["id"],
                "stream_id": stream["id"],
                "stream_key": stream["cdn"]["ingestionInfo"]["streamName"],
                "rtmp_url": stream["cdn"]["ingestionInfo"]["ingestionAddress"],
                "stream_url": f"https://www.youtube.com/watch?v={broadcast['id']}",
                "embed_url": f"https://www.youtube.com/embed/{broadcast['id']}",
                "status": broadcast["status"]["lifeCycleStatus"]
            }
    
    async def start_broadcast(self, broadcast_id: str) -> Dict[str, Any]:
        """Start a YouTube Live broadcast."""
        if not self.api_key:
            return {"status": "live", "broadcast_id": broadcast_id}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/liveBroadcasts/transition",
                params={
                    "broadcastStatus": "live",
                    "id": broadcast_id,
                    "part": "status",
                    "key": self.api_key
                }
            )
            return response.json()
    
    async def end_broadcast(self, broadcast_id: str) -> Dict[str, Any]:
        """End a YouTube Live broadcast."""
        if not self.api_key:
            return {"status": "complete", "broadcast_id": broadcast_id}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/liveBroadcasts/transition",
                params={
                    "broadcastStatus": "complete",
                    "id": broadcast_id,
                    "part": "status",
                    "key": self.api_key
                }
            )
            return response.json()
    
    async def get_broadcast_statistics(self, broadcast_id: str) -> Dict[str, Any]:
        """Get statistics for a YouTube Live broadcast."""
        if not self.api_key:
            return self._mock_statistics()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/videos",
                params={
                    "part": "statistics,liveStreamingDetails",
                    "id": broadcast_id,
                    "key": self.api_key
                }
            )
            data = response.json()
            if data.get("items"):
                return data["items"][0]
            return {}
    
    async def delete_broadcast(self, broadcast_id: str) -> bool:
        """Delete a YouTube Live broadcast."""
        if not self.api_key:
            return True
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/liveBroadcasts",
                params={"id": broadcast_id, "key": self.api_key}
            )
            return response.status_code == 204
    
    def _mock_create_broadcast(self, title: str) -> Dict[str, Any]:
        """Mock response when API key is not configured."""
        mock_id = secrets.token_urlsafe(16)
        stream_key = secrets.token_urlsafe(32)
        
        return {
            "broadcast_id": mock_id,
            "stream_id": f"stream_{mock_id}",
            "stream_key": stream_key,
            "rtmp_url": f"rtmp://a.rtmp.youtube.com/live2/{stream_key}",
            "stream_url": f"https://www.youtube.com/watch?v={mock_id}",
            "embed_url": f"https://www.youtube.com/embed/{mock_id}",
            "status": "ready"
        }
    
    def _mock_statistics(self) -> Dict[str, Any]:
        """Mock statistics when API key is not configured."""
        return {
            "statistics": {
                "viewCount": "0",
                "likeCount": "0",
                "commentCount": "0"
            },
            "liveStreamingDetails": {
                "actualStartTime": datetime.utcnow().isoformat(),
                "concurrentViewers": "0"
            }
        }
