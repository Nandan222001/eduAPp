# Virtual Classroom Olympics Backend Implementation

## Overview
Complete implementation of the Virtual Classroom Olympics backend system with real-time scoring, leaderboards, team management, and result certification.

## Files Created

### 1. Models (`src/models/olympics.py`)
- **Competition**: Main competition entity with title, type (math_olympiad, speed_challenge, quiz_battle, coding_contest, essay, science_experiment), scope (class, school, inter_school, national), dates, rules, prize pool, and participating institutions
- **CompetitionEvent**: Individual events within a competition with event type (individual, team, relay), question sets, scoring rules, and time limits
- **CompetitionEntry**: Individual participant entries with scores, ranks, time taken, and submission data
- **CompetitionTeam**: Team entities with members array, team leader, total score, and rank
- **CompetitionLeaderboard**: Real-time leaderboard with rankings JSON and scope-based filtering

### 2. Schemas (`src/schemas/olympics.py`)
Pydantic models for request/response validation:
- Competition CRUD schemas
- Event CRUD schemas
- Entry and Team management schemas
- Leaderboard response schemas
- Submission and grading request schemas
- WebSocket message schemas

### 3. Service Layer (`src/services/olympics_service.py`)

#### OlympicsService
Core business logic:
- Competition, Event, Entry, and Team CRUD operations
- Score submission and grading
- Ranking calculation (individual and team-based)
- Leaderboard generation and updates
- Real-time score broadcasting via WebSocket
- Certificate generation

#### OlympicsRedisService
Real-time leaderboard management using Redis sorted sets:
- Live score updates
- Real-time leaderboard retrieval
- Participant rank tracking
- Automatic expiration of leaderboard data

### 4. API Endpoints (`src/api/v1/olympics.py`)

#### Competition Management
- `POST /olympics/competitions` - Create competition
- `GET /olympics/competitions` - List competitions with filters
- `GET /olympics/competitions/{id}` - Get competition details
- `PUT /olympics/competitions/{id}` - Update competition

#### Event Management
- `POST /olympics/events` - Create event
- `GET /olympics/events/{id}` - Get event details
- `GET /olympics/competitions/{id}/events` - List competition events
- `PUT /olympics/events/{id}` - Update event

#### Entry Management
- `POST /olympics/entries` - Register participant
- `GET /olympics/entries/{id}` - Get entry details
- `GET /olympics/events/{id}/entries` - List event entries
- `PUT /olympics/entries/{id}` - Update entry
- `POST /olympics/entries/submit` - Submit answers
- `POST /olympics/entries/grade` - Grade submission

#### Team Management
- `POST /olympics/teams` - Create team
- `GET /olympics/teams/{id}` - Get team details
- `GET /olympics/events/{id}/teams` - List event teams
- `PUT /olympics/teams/{id}` - Update team
- `POST /olympics/events/{id}/calculate-team-scores` - Calculate team scores
- `POST /olympics/events/{id}/calculate-rankings` - Calculate rankings

#### Leaderboard & Real-time Features
- `GET /olympics/competitions/{id}/leaderboard` - Get competition leaderboard
- `POST /olympics/competitions/{id}/leaderboard/update` - Update leaderboard
- `GET /olympics/events/{id}/live-leaderboard` - Get real-time leaderboard (Redis)
- `POST /olympics/events/{id}/live-score/update` - Update live score (Redis)

#### WebSocket Endpoints
- `WS /olympics/ws/competition/{id}` - Real-time competition updates
- `WS /olympics/ws/competition/{id}/event/{event_id}` - Real-time event updates

#### Certificates
- `POST /olympics/entries/certificates/generate` - Generate certificates

### 5. Database Migration (`alembic/versions/031_create_olympics_tables.py`)
Complete database schema with:
- All tables with proper indexes and foreign keys
- Enums for competition types, scopes, statuses, and event types
- ARRAY and JSON column types for flexible data storage
- Proper cascade delete and update constraints

## Key Features

### Real-time Scoring
- WebSocket integration for instant score updates
- Redis sorted sets for sub-millisecond leaderboard queries
- Broadcast notifications to all connected clients

### Leaderboard System
- Multiple scope levels (class, school, inter-school, national)
- Real-time updates via Redis
- Historical rankings stored in PostgreSQL
- Automatic rank calculation based on score and time

### Team Support
- Team formation with member management
- Team leader assignment
- Aggregate team scoring
- Team-based rankings

### Result Certification
- Automatic certificate generation
- Customizable templates
- Secure certificate URLs
- Batch certificate generation

### Flexible Competition Types
- Math Olympiad
- Speed Challenge
- Quiz Battle
- Coding Contest
- Essay
- Science Experiment

### Multi-institutional Support
- Class-level competitions
- School-wide competitions
- Inter-school competitions
- National competitions
- Participating institutions tracking

## Integration Points

### WebSocket Manager
Integrated with existing WebSocket manager for:
- User connections
- Room subscriptions
- Real-time broadcasts

### Redis
Leverages Redis for:
- Live leaderboard caching
- Score updates with expiration
- High-performance rank queries

### Database
PostgreSQL features:
- JSON columns for flexible data (rules, prize pool, questions, submissions)
- ARRAY columns for member lists and institutions
- Proper indexing for performance
- Transaction support for data consistency

## API Router Registration
- Added to `src/api/v1/__init__.py`
- Prefix: `/olympics`
- Tags: `["olympics"]`

## Usage Example

```python
# Create a competition
POST /api/v1/olympics/competitions?institution_id=1
{
    "title": "National Math Olympiad 2024",
    "competition_type": "math_olympiad",
    "scope": "national",
    "start_date": "2024-02-01T00:00:00",
    "end_date": "2024-02-15T00:00:00",
    "rules": {
        "max_attempts": 3,
        "time_limit_minutes": 120
    },
    "prize_pool": {
        "first": "Gold Medal + $1000",
        "second": "Silver Medal + $500",
        "third": "Bronze Medal + $250"
    }
}

# Create an event
POST /api/v1/olympics/events?institution_id=1
{
    "competition_id": 1,
    "event_name": "Round 1: Algebra",
    "event_type": "individual",
    "max_participants": 100,
    "duration_minutes": 60
}

# Register participant
POST /api/v1/olympics/entries?institution_id=1
{
    "event_id": 1,
    "participant_student_id": 123
}

# Submit answers (with real-time update)
POST /api/v1/olympics/entries/submit
{
    "entry_id": 1,
    "answer_data": {"q1": "42", "q2": "pi"},
    "time_taken": 3500
}

# Get live leaderboard
GET /api/v1/olympics/events/1/live-leaderboard?limit=50
```

## Notes
- All timestamps use UTC
- Scores use Decimal type for precision
- Leaderboard rankings are cached in Redis with 24-hour expiration
- WebSocket rooms use format: `competition_{id}` and `competition_{id}_event_{event_id}`
- Certificate URLs are generated with format: `/certificates/CERT-{competition_id}-{event_id}-{entry_id}.pdf`
