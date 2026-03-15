from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from src.database import get_db
from src.services.olympics_service import OlympicsService, OlympicsRedisService
from src.services.websocket_manager import websocket_manager
from src.redis_client import get_redis
from src.schemas.olympics import (
    CompetitionCreate, CompetitionUpdate, CompetitionResponse,
    CompetitionEventCreate, CompetitionEventUpdate, CompetitionEventResponse,
    CompetitionEntryCreate, CompetitionEntryUpdate, CompetitionEntryResponse,
    CompetitionTeamCreate, CompetitionTeamUpdate, CompetitionTeamResponse,
    CompetitionLeaderboardResponse, SubmitAnswerRequest, GradeSubmissionRequest,
    TeamFormationRequest, CertificateGenerateRequest, LiveLeaderboardResponse,
    LeaderboardEntry
)
from src.models.olympics import CompetitionScope, CompetitionStatus, EventType
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/competitions", response_model=CompetitionResponse, status_code=status.HTTP_201_CREATED)
def create_competition(
    competition: CompetitionCreate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return OlympicsService.create_competition(db, institution_id, competition)


@router.get("/competitions", response_model=List[CompetitionResponse])
def list_competitions(
    institution_id: int = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[CompetitionStatus] = Query(None),
    scope: Optional[CompetitionScope] = Query(None),
    db: Session = Depends(get_db)
):
    return OlympicsService.get_competitions(db, institution_id, skip, limit, status, scope)


@router.get("/competitions/{competition_id}", response_model=CompetitionResponse)
def get_competition(
    competition_id: int,
    db: Session = Depends(get_db)
):
    competition = OlympicsService.get_competition(db, competition_id)
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    return competition


@router.put("/competitions/{competition_id}", response_model=CompetitionResponse)
def update_competition(
    competition_id: int,
    competition: CompetitionUpdate,
    db: Session = Depends(get_db)
):
    updated_competition = OlympicsService.update_competition(db, competition_id, competition)
    if not updated_competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    return updated_competition


@router.post("/events", response_model=CompetitionEventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event: CompetitionEventCreate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return OlympicsService.create_event(db, institution_id, event)


@router.get("/events/{event_id}", response_model=CompetitionEventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = OlympicsService.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/competitions/{competition_id}/events", response_model=List[CompetitionEventResponse])
def list_competition_events(
    competition_id: int,
    db: Session = Depends(get_db)
):
    return OlympicsService.get_events_by_competition(db, competition_id)


@router.put("/events/{event_id}", response_model=CompetitionEventResponse)
def update_event(
    event_id: int,
    event: CompetitionEventUpdate,
    db: Session = Depends(get_db)
):
    updated_event = OlympicsService.update_event(db, event_id, event)
    if not updated_event:
        raise HTTPException(status_code=404, detail="Event not found")
    return updated_event


@router.post("/entries", response_model=CompetitionEntryResponse, status_code=status.HTTP_201_CREATED)
def create_entry(
    entry: CompetitionEntryCreate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return OlympicsService.create_entry(db, institution_id, entry)


@router.get("/entries/{entry_id}", response_model=CompetitionEntryResponse)
def get_entry(
    entry_id: int,
    db: Session = Depends(get_db)
):
    entry = OlympicsService.get_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.get("/events/{event_id}/entries", response_model=List[CompetitionEntryResponse])
def list_event_entries(
    event_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=10000),
    db: Session = Depends(get_db)
):
    return OlympicsService.get_entries_by_event(db, event_id, skip, limit)


@router.put("/entries/{entry_id}", response_model=CompetitionEntryResponse)
def update_entry(
    entry_id: int,
    entry: CompetitionEntryUpdate,
    db: Session = Depends(get_db)
):
    updated_entry = OlympicsService.update_entry(db, entry_id, entry)
    if not updated_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return updated_entry


@router.post("/entries/submit", response_model=CompetitionEntryResponse)
async def submit_answer(
    submit_data: SubmitAnswerRequest,
    db: Session = Depends(get_db)
):
    entry = OlympicsService.submit_answer(db, submit_data)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    event = OlympicsService.get_event(db, entry.event_id)
    if event:
        await OlympicsService.broadcast_score_update(
            event.competition_id,
            entry.event_id,
            entry.id,
            entry.score,
            entry.rank
        )
    
    return entry


@router.post("/entries/grade", response_model=CompetitionEntryResponse)
async def grade_submission(
    grade_data: GradeSubmissionRequest,
    db: Session = Depends(get_db)
):
    entry = OlympicsService.grade_submission(db, grade_data)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    event = OlympicsService.get_event(db, entry.event_id)
    if event:
        OlympicsService.calculate_rankings(db, entry.event_id, event.event_type == EventType.TEAM)
        
        db.refresh(entry)
        
        await OlympicsService.broadcast_score_update(
            event.competition_id,
            entry.event_id,
            entry.id,
            entry.score,
            entry.rank
        )
    
    return entry


@router.post("/teams", response_model=CompetitionTeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team: CompetitionTeamCreate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return OlympicsService.create_team(db, institution_id, team)


@router.get("/teams/{team_id}", response_model=CompetitionTeamResponse)
def get_team(
    team_id: int,
    db: Session = Depends(get_db)
):
    team = OlympicsService.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.get("/events/{event_id}/teams", response_model=List[CompetitionTeamResponse])
def list_event_teams(
    event_id: int,
    db: Session = Depends(get_db)
):
    return OlympicsService.get_teams_by_event(db, event_id)


@router.put("/teams/{team_id}", response_model=CompetitionTeamResponse)
def update_team(
    team_id: int,
    team: CompetitionTeamUpdate,
    db: Session = Depends(get_db)
):
    updated_team = OlympicsService.update_team(db, team_id, team)
    if not updated_team:
        raise HTTPException(status_code=404, detail="Team not found")
    return updated_team


@router.post("/events/{event_id}/calculate-team-scores")
def calculate_team_scores(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = OlympicsService.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    OlympicsService.calculate_team_scores(db, event_id)
    return {"message": "Team scores calculated successfully"}


@router.post("/events/{event_id}/calculate-rankings")
async def calculate_rankings(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = OlympicsService.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    is_team_event = event.event_type == EventType.TEAM
    OlympicsService.calculate_rankings(db, event_id, is_team_event)
    
    return {"message": "Rankings calculated successfully"}


@router.get("/competitions/{competition_id}/leaderboard", response_model=CompetitionLeaderboardResponse)
def get_competition_leaderboard(
    competition_id: int,
    scope: CompetitionScope = Query(...),
    db: Session = Depends(get_db)
):
    leaderboard = OlympicsService.get_leaderboard(db, competition_id, scope)
    if not leaderboard:
        raise HTTPException(status_code=404, detail="Leaderboard not found")
    return leaderboard


@router.post("/competitions/{competition_id}/leaderboard/update", response_model=CompetitionLeaderboardResponse)
async def update_competition_leaderboard(
    competition_id: int,
    scope: CompetitionScope = Query(...),
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    competition = OlympicsService.get_competition(db, competition_id)
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    leaderboard = OlympicsService.update_leaderboard(db, competition_id, scope, institution_id)
    
    leaderboard_entries = []
    for entry_data in leaderboard.rankings.get('entries', []):
        leaderboard_entries.append(LeaderboardEntry(**entry_data))
    
    await OlympicsService.broadcast_leaderboard_update(
        competition_id,
        None,
        leaderboard_entries
    )
    
    return leaderboard


@router.post("/entries/certificates/generate")
def generate_certificates(
    certificate_request: CertificateGenerateRequest,
    db: Session = Depends(get_db)
):
    certificates = []
    
    for entry_id in certificate_request.entry_ids:
        entry = OlympicsService.get_entry(db, entry_id)
        if entry:
            cert_url = OlympicsService.generate_certificate(
                db, entry, certificate_request.template
            )
            certificates.append({
                'entry_id': entry_id,
                'certificate_url': cert_url
            })
    
    return {
        'message': f"{len(certificates)} certificates generated",
        'certificates': certificates
    }


@router.websocket("/ws/competition/{competition_id}")
async def websocket_competition(
    websocket: WebSocket,
    competition_id: int,
    user_id: int = Query(...)
):
    await websocket_manager.connect(websocket, user_id)
    room = f"competition_{competition_id}"
    websocket_manager.subscribe_to_room(room, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            await websocket.send_text(f"Message received: {data}")
    
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, user_id)
        websocket_manager.unsubscribe_from_room(room, user_id)
        logger.info(f"User {user_id} disconnected from competition {competition_id}")


@router.websocket("/ws/competition/{competition_id}/event/{event_id}")
async def websocket_event(
    websocket: WebSocket,
    competition_id: int,
    event_id: int,
    user_id: int = Query(...)
):
    await websocket_manager.connect(websocket, user_id)
    room = f"competition_{competition_id}_event_{event_id}"
    websocket_manager.subscribe_to_room(room, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            await websocket.send_text(f"Message received: {data}")
    
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, user_id)
        websocket_manager.unsubscribe_from_room(room, user_id)
        logger.info(f"User {user_id} disconnected from event {event_id}")


@router.get("/events/{event_id}/live-leaderboard")
async def get_live_leaderboard(
    event_id: int,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    redis = Depends(get_redis)
):
    event = OlympicsService.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    redis_service = OlympicsRedisService(redis)
    live_data = await redis_service.get_live_leaderboard(
        event.competition_id,
        event_id,
        limit
    )
    
    from src.models.student import Student
    leaderboard_entries = []
    
    for data in live_data:
        student = db.query(Student).filter(Student.id == data['participant_id']).first()
        if student:
            leaderboard_entries.append(LeaderboardEntry(
                rank=data['rank'],
                participant_id=data['participant_id'],
                participant_name=f"{student.first_name} {student.last_name}",
                team_id=None,
                team_name=None,
                score=data['score'],
                time_taken=data.get('time_taken'),
                institution_id=student.institution_id,
                institution_name=None
            ))
    
    competition = OlympicsService.get_competition(db, event.competition_id)
    
    return LiveLeaderboardResponse(
        competition_id=event.competition_id,
        event_id=event_id,
        scope=competition.scope if competition else CompetitionScope.SCHOOL,
        entries=leaderboard_entries,
        total_participants=len(leaderboard_entries),
        last_updated=datetime.utcnow()
    )


@router.post("/events/{event_id}/live-score/update")
async def update_live_score(
    event_id: int,
    participant_id: int = Query(...),
    score: float = Query(...),
    time_taken: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    redis = Depends(get_redis)
):
    event = OlympicsService.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    redis_service = OlympicsRedisService(redis)
    await redis_service.update_live_score(
        event.competition_id,
        event_id,
        participant_id,
        score,
        time_taken
    )
    
    rank = await redis_service.get_participant_rank(
        event.competition_id,
        event_id,
        participant_id
    )
    
    await OlympicsService.broadcast_score_update(
        event.competition_id,
        event_id,
        participant_id,
        score,
        rank
    )
    
    return {
        'message': 'Live score updated',
        'participant_id': participant_id,
        'score': score,
        'rank': rank
    }
