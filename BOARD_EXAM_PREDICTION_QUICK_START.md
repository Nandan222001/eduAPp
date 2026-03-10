# Board Exam Prediction System - Quick Start Guide

## Overview

The Board Exam Question Prediction System analyzes 10 years of historical board exam papers to predict which topics are most likely to appear in upcoming examinations.

## Quick Setup

### 1. Run Database Migration
```bash
alembic upgrade head
```

This creates the `topic_predictions` table with all necessary indexes.

### 2. Ensure Required Data
Before running predictions, ensure you have:
- Previous year papers uploaded (`previous_year_papers` table)
- Questions extracted and tagged with topics (`questions_bank` table)
- Topics defined in your curriculum (`topics` table)

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/board-exam-predictions/analyze` | POST | Run analysis and generate predictions |
| `/board-exam-predictions/predictions` | GET | Get paginated predictions |
| `/board-exam-predictions/top-predictions` | GET | Get top N predictions |
| `/board-exam-predictions/due-topics` | GET | Get topics that are overdue |
| `/board-exam-predictions/by-chapter/{id}` | GET | Get predictions for a chapter |
| `/board-exam-predictions/summary` | GET | Get analysis summary stats |

## Common Use Cases

### 1. Generate Predictions for a Subject

```bash
POST /api/v1/board-exam-predictions/analyze
{
  "board": "cbse",
  "grade_id": 10,
  "subject_id": 5,
  "year_start": 2014,
  "year_end": 2024
}
```

**Response:**
```json
{
  "total_topics_analyzed": 45,
  "year_range": "2014-2024",
  "predictions_generated": 45,
  "cache_key": "exam_predictions:1:cbse:10:5",
  "analyzed_at": "2024-01-15T10:30:00"
}
```

### 2. Get Top 20 Most Likely Topics

```bash
GET /api/v1/board-exam-predictions/top-predictions?board=cbse&grade_id=10&subject_id=5&top_n=20
```

### 3. Get Topics That Are "Due" to Appear

```bash
GET /api/v1/board-exam-predictions/due-topics?board=cbse&grade_id=10&subject_id=5
```

### 4. Get Predictions with Custom Sorting

```bash
GET /api/v1/board-exam-predictions/predictions?board=cbse&grade_id=10&subject_id=5&order_by=years_since_last_appearance
```

Sort options:
- `probability_score` (default) - Overall prediction score
- `prediction_rank` - Numerical rank
- `frequency_count` - How often topic appears
- `total_marks` - Total marks across all years
- `years_since_last_appearance` - Recency-based

## Understanding the Scores

### Probability Score (0-100%)
Weighted combination of:
- **25%** - Frequency Score (how often it appears)
- **20%** - Cyclical Pattern Score (pattern consistency)
- **15%** - Trend Score (increasing/decreasing trend)
- **20%** - Weightage Score (marks importance)
- **20%** - Recency Score (time since last appearance)

### Confidence Levels
- **Very High**: Appeared 7+ times with strong pattern (70%+)
- **High**: Appeared 5+ times with good pattern (60%+)
- **Medium**: Appeared 3+ times with moderate pattern (40%+)
- **Low**: Appeared 2+ times
- **Very Low**: Appeared less than 2 times

### Due Topics
Topics are marked as "due" when:
1. Strong cyclical pattern AND overdue based on average interval, OR
2. Haven't appeared in 3+ years

## Response Examples

### Topic Prediction Response
```json
{
  "id": 1,
  "board": "cbse",
  "grade_id": 10,
  "subject_id": 5,
  "chapter_id": 12,
  "topic_id": 45,
  "topic_name": "Quadratic Equations",
  "frequency_count": 8,
  "appearance_years": "2015,2016,2018,2019,2020,2021,2022,2024",
  "total_marks": 32.0,
  "avg_marks_per_appearance": 4.0,
  "years_since_last_appearance": 0,
  "last_appeared_year": 2024,
  "cyclical_pattern_score": 75.5,
  "trend_score": 82.0,
  "weightage_score": 40.0,
  "probability_score": 85.2,
  "prediction_rank": 1,
  "is_due": false,
  "confidence_level": "Very High",
  "analysis_year_start": 2014,
  "analysis_year_end": 2024,
  "analyzed_at": "2024-01-15T10:30:00"
}
```

### Ranking Response (Simplified)
```json
{
  "id": 1,
  "topic_name": "Quadratic Equations",
  "chapter_id": 12,
  "topic_id": 45,
  "frequency_count": 8,
  "total_marks": 32.0,
  "years_since_last_appearance": 0,
  "last_appeared_year": 2024,
  "probability_score": 85.2,
  "prediction_rank": 1,
  "is_due": false,
  "confidence_level": "Very High"
}
```

### Summary Response
```json
{
  "total_topics": 45,
  "due_topics_count": 12,
  "avg_probability_score": 67.5,
  "latest_analysis_date": "2024-01-15T10:30:00",
  "year_range": "2014-2024"
}
```

## Caching

Predictions are automatically cached in Redis for 24 hours:
- **Key format**: `exam_predictions:{institution_id}:{board}:{grade_id}:{subject_id}`
- **TTL**: 86400 seconds (24 hours)
- Automatically updated when re-analyzing

## Best Practices

### 1. Data Quality
- Ensure all questions are properly tagged with topics
- Link questions to the correct papers and years
- Verify paper year data is accurate

### 2. Analysis Frequency
- Run analysis after adding new papers
- Re-analyze before exam season
- Cache reduces need for frequent re-analysis

### 3. Using Predictions
- Focus on "due" topics for exam preparation
- High confidence topics should be prioritized
- Consider both probability score and marks weightage

### 4. Performance
- Use pagination for large result sets
- Leverage caching for repeated queries
- Use specific endpoints (top-predictions, due-topics) over full list

## Integration Example (Python)

```python
import httpx

class BoardExamPredictor:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {token}"}
    
    async def analyze(self, board: str, grade_id: int, subject_id: int):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/board-exam-predictions/analyze",
                json={
                    "board": board,
                    "grade_id": grade_id,
                    "subject_id": subject_id
                },
                headers=self.headers
            )
            return response.json()
    
    async def get_top_predictions(self, board: str, grade_id: int, 
                                  subject_id: int, top_n: int = 20):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/board-exam-predictions/top-predictions",
                params={
                    "board": board,
                    "grade_id": grade_id,
                    "subject_id": subject_id,
                    "top_n": top_n
                },
                headers=self.headers
            )
            return response.json()

# Usage
predictor = BoardExamPredictor("http://localhost:8000/api/v1", "your_token")
result = await predictor.analyze("cbse", 10, 5)
predictions = await predictor.get_top_predictions("cbse", 10, 5, 20)
```

## Troubleshooting

### No predictions generated
- Verify questions exist for the given board/grade/subject
- Check that questions have topic_id set
- Ensure year range includes available papers

### Low confidence scores
- Add more historical data (papers from more years)
- Ensure consistent topic tagging across years
- Verify data quality in question bank

### Slow analysis
- Reduce year range if not needed (default 10 years is good)
- Check database indexes are created
- Ensure Redis is running for caching

## Architecture

```
Request → API Endpoint → Service Layer → Repository Layer → Database
                              ↓
                         Redis Cache
```

**Key Components:**
1. **API Layer** (`board_exam_predictions.py`): REST endpoints
2. **Service Layer** (`board_exam_prediction_service.py`): Business logic and algorithms
3. **Repository Layer** (`previous_year_papers_repository.py`): Database operations
4. **Models** (`previous_year_papers.py`): SQLAlchemy models
5. **Schemas** (`previous_year_papers.py`): Pydantic validation

## Next Steps

After generating predictions:
1. Create study plans based on high-probability topics
2. Generate practice questions for due topics
3. Track prediction accuracy against actual exams
4. Refine analysis parameters based on results

## Support

For issues or questions:
- Check logs for error messages
- Verify database migration completed
- Ensure Redis is accessible
- Review the full implementation guide in `BOARD_EXAM_PREDICTION_IMPLEMENTATION.md`
