# Board Exam Question Prediction System - Phase 1 Implementation

## Overview

This document describes the implementation of the Board Exam Question Prediction System (Phase 1 - Pattern Analysis). The system analyzes historical question paper data to predict which topics are likely to appear in upcoming board examinations.

## Features Implemented

### 1. Pattern Analysis Algorithms

#### Frequency Analysis
- **Function**: `_calculate_frequency_score()`
- **Purpose**: Calculates how often a topic appears across the analysis period
- **Formula**: `(frequency_count / total_years) * 100`
- **Range**: 0-100%

#### Marks Weightage Distribution
- **Function**: `_calculate_weightage_score()`
- **Purpose**: Evaluates the importance of a topic based on marks allocation
- **Factors**:
  - Average marks per appearance (70% weight)
  - Total marks across all appearances (30% weight)
- **Range**: 0-100%

#### Cyclical Pattern Detection
- **Function**: `_detect_cyclical_pattern()`
- **Purpose**: Identifies repeating patterns in topic appearances
- **Algorithm**:
  1. Calculate intervals between consecutive appearances
  2. Compute average interval and standard deviation
  3. Determine consistency score using coefficient of variation
  4. Calculate adherence to expected pattern
  5. Combine scores: 60% consistency + 40% adherence
- **Range**: 0-100%

#### Trend Score Analysis
- **Function**: `_calculate_trend_score()`
- **Purpose**: Identifies increasing or decreasing trends in topic frequency
- **Method**: Compares recent vs. older appearances (splits analysis period at midpoint)
- **Range**: 0-100%

#### Recency Score
- **Function**: `_calculate_recency_score()`
- **Purpose**: Prioritizes topics based on time since last appearance
- **Scoring**:
  - 0 years: 20% (just appeared)
  - 1 year: 40%
  - 2 years: 70%
  - 3 years: 90%
  - 4+ years: 100% (overdue)

### 2. Database Schema

#### TopicPrediction Table
```sql
CREATE TABLE topic_predictions (
    id INTEGER PRIMARY KEY,
    institution_id INTEGER NOT NULL,
    board VARCHAR(50) NOT NULL,
    grade_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    chapter_id INTEGER,
    topic_id INTEGER,
    topic_name VARCHAR(200) NOT NULL,
    
    -- Frequency Analysis
    frequency_count INTEGER DEFAULT 0,
    appearance_years TEXT,
    
    -- Marks Weightage
    total_marks FLOAT DEFAULT 0.0,
    avg_marks_per_appearance FLOAT DEFAULT 0.0,
    
    -- Recency
    years_since_last_appearance INTEGER DEFAULT 0,
    last_appeared_year INTEGER,
    
    -- Pattern Scores
    cyclical_pattern_score FLOAT DEFAULT 0.0,
    trend_score FLOAT DEFAULT 0.0,
    weightage_score FLOAT DEFAULT 0.0,
    
    -- Final Prediction
    probability_score FLOAT DEFAULT 0.0,
    prediction_rank INTEGER,
    is_due BOOLEAN DEFAULT FALSE,
    confidence_level VARCHAR(50),
    
    -- Metadata
    analysis_metadata TEXT,
    analysis_year_start INTEGER,
    analysis_year_end INTEGER,
    analyzed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Indexes
- `idx_tp_institution`: For institution-level queries
- `idx_tp_board_grade_subject`: Composite index for filtering
- `idx_tp_probability_score`: For ranking by probability
- `idx_tp_prediction_rank`: For top-N queries
- `idx_tp_is_due`: For due topics filtering

### 3. Probability Score Calculation

The final probability score is a weighted combination of all factors:

```python
probability_score = (
    frequency_score * 0.25 +        # 25% weight
    cyclical_pattern_score * 0.20 + # 20% weight
    trend_score * 0.15 +             # 15% weight
    weightage_score * 0.20 +         # 20% weight
    recency_score * 0.20             # 20% weight
)
```

### 4. Due Topic Detection

Topics are marked as "due" when:
- Strong cyclical pattern (score > 60%) AND years since last appearance >= average interval
- OR years since last appearance >= 3 years

### 5. Confidence Levels

- **Very High**: Frequency ≥ 7 appearances, Cyclical score ≥ 70%
- **High**: Frequency ≥ 5 appearances, Cyclical score ≥ 60%
- **Medium**: Frequency ≥ 3 appearances, Cyclical score ≥ 40%
- **Low**: Frequency ≥ 2 appearances
- **Very Low**: Frequency < 2 appearances

### 6. Caching Mechanism

Predictions are cached in Redis with:
- **Cache Key Format**: `exam_predictions:{institution_id}:{board}:{grade_id}:{subject_id}`
- **TTL**: 24 hours (86400 seconds)
- **Data**: Complete JSON of all predictions with metadata

## API Endpoints

### POST `/api/v1/board-exam-predictions/analyze`
Analyze historical data and generate predictions.

**Request Body**:
```json
{
    "board": "cbse",
    "grade_id": 1,
    "subject_id": 1,
    "year_start": 2014,
    "year_end": 2024
}
```

**Response**:
```json
{
    "total_topics_analyzed": 45,
    "year_range": "2014-2024",
    "predictions_generated": 45,
    "cache_key": "exam_predictions:1:cbse:1:1",
    "analyzed_at": "2024-01-15T10:30:00"
}
```

### GET `/api/v1/board-exam-predictions/predictions`
Get paginated predictions with optional ordering.

**Query Parameters**:
- `board` (required): Board type (cbse, icse, etc.)
- `grade_id` (required): Grade ID
- `subject_id` (required): Subject ID
- `skip` (optional): Pagination offset (default: 0)
- `limit` (optional): Items per page (default: 100, max: 500)
- `order_by` (optional): Sort field (default: probability_score)
  - Options: probability_score, prediction_rank, frequency_count, total_marks, years_since_last_appearance

**Response**: Array of TopicPredictionResponse

### GET `/api/v1/board-exam-predictions/top-predictions`
Get top N predictions by probability score.

**Query Parameters**:
- `board` (required)
- `grade_id` (required)
- `subject_id` (required)
- `top_n` (optional): Number of results (default: 20, max: 100)

**Response**: Array of TopicPredictionRankingResponse

### GET `/api/v1/board-exam-predictions/due-topics`
Get topics that are marked as "due".

**Query Parameters**:
- `board` (required)
- `grade_id` (required)
- `subject_id` (required)

**Response**: Array of TopicPredictionRankingResponse

### GET `/api/v1/board-exam-predictions/by-chapter/{chapter_id}`
Get predictions filtered by chapter.

**Path Parameters**:
- `chapter_id`: Chapter ID

**Query Parameters**:
- `board` (required)
- `grade_id` (required)
- `subject_id` (required)

**Response**: Array of TopicPredictionRankingResponse

### GET `/api/v1/board-exam-predictions/summary`
Get analysis summary statistics.

**Query Parameters**:
- `board` (required)
- `grade_id` (required)
- `subject_id` (required)

**Response**:
```json
{
    "total_topics": 45,
    "due_topics_count": 12,
    "avg_probability_score": 67.5,
    "latest_analysis_date": "2024-01-15T10:30:00",
    "year_range": "2014-2024"
}
```

## File Structure

```
src/
├── models/
│   └── previous_year_papers.py          # TopicPrediction model added
├── schemas/
│   └── previous_year_papers.py          # Prediction schemas added
├── repositories/
│   └── previous_year_papers_repository.py  # TopicPredictionRepository added
├── services/
│   └── board_exam_prediction_service.py    # New service with all algorithms
└── api/
    └── v1/
        ├── board_exam_predictions.py       # New API endpoints
        └── __init__.py                      # Router registration

alembic/versions/
└── create_topic_predictions_table.py       # Migration file
```

## Usage Example

### 1. Analyze Historical Data
```bash
curl -X POST http://localhost:8000/api/v1/board-exam-predictions/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "board": "cbse",
    "grade_id": 10,
    "subject_id": 5,
    "year_start": 2014,
    "year_end": 2024
  }'
```

### 2. Get Top 20 Predictions
```bash
curl -X GET "http://localhost:8000/api/v1/board-exam-predictions/top-predictions?board=cbse&grade_id=10&subject_id=5&top_n=20" \
  -H "Authorization: Bearer {token}"
```

### 3. Get Due Topics
```bash
curl -X GET "http://localhost:8000/api/v1/board-exam-predictions/due-topics?board=cbse&grade_id=10&subject_id=5" \
  -H "Authorization: Bearer {token}"
```

## Algorithm Details

### Data Collection Process
1. Query all questions from question bank for given board/grade/subject
2. Filter by year range (default: last 10 years)
3. Group questions by topic
4. Extract appearance years, marks, and metadata

### Analysis Workflow
1. **Collect Data**: Gather historical question data
2. **Calculate Metrics**: For each topic:
   - Frequency analysis
   - Marks weightage
   - Cyclical patterns
   - Trends
   - Recency
3. **Compute Probability**: Weighted combination of all scores
4. **Rank Topics**: Sort by probability score
5. **Identify Due Topics**: Apply due topic detection rules
6. **Assign Confidence**: Based on data quality and patterns
7. **Store Results**: Save to database
8. **Cache**: Store in Redis for fast access

### Performance Considerations
- Bulk insert for predictions (reduces DB calls)
- Delete-and-recreate strategy for updates
- Redis caching for 24 hours
- Indexed fields for fast querying
- Composite indexes for common filters

## Future Enhancements (Phase 2+)

1. **Machine Learning Models**
   - Train predictive models on historical data
   - Use neural networks for pattern recognition
   - Implement ensemble methods

2. **Advanced Pattern Detection**
   - Seasonal patterns
   - Multi-year cycles
   - Correlation between topics

3. **Difficulty Prediction**
   - Predict question difficulty levels
   - Estimate marks distribution

4. **Question Type Analysis**
   - Predict likely question formats
   - Suggest preparation strategies

5. **Cross-Board Analysis**
   - Compare patterns across boards
   - Identify common trends

6. **Real-time Updates**
   - Automatic re-analysis when new papers added
   - Incremental updates vs. full re-calculation

## Dependencies

- SQLAlchemy 2.0+
- FastAPI 0.109+
- Redis (for caching)
- Pydantic (for schemas)
- Python 3.11+

## Database Migration

Run the migration to create the topic_predictions table:

```bash
alembic upgrade head
```

## Testing Recommendations

1. **Unit Tests**: Test individual algorithm functions
2. **Integration Tests**: Test full analysis workflow
3. **Performance Tests**: Test with large datasets (1000+ questions)
4. **Accuracy Tests**: Validate predictions against actual exam papers
5. **Cache Tests**: Verify Redis caching behavior

## Monitoring

Key metrics to monitor:
- Analysis execution time
- Prediction accuracy (when actual exams occur)
- Cache hit rates
- API response times
- Number of topics analyzed per request
