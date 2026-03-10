# Board Exam Question Prediction System

> Intelligent analysis of historical board exam patterns to predict future question topics

## 🎯 What It Does

Analyzes 10 years of historical board examination papers to predict which topics are most likely to appear in upcoming exams. Uses sophisticated pattern analysis algorithms to calculate probability scores for each topic.

## ✨ Key Features

- **Frequency Analysis**: Tracks how often topics appear over time
- **Cyclical Pattern Detection**: Identifies repeating patterns in topic appearances
- **Marks Weightage Analysis**: Evaluates importance based on marks allocation
- **Trend Analysis**: Detects increasing or decreasing topic frequency
- **Due Topic Detection**: Identifies topics that are "overdue" to appear
- **Probability Ranking**: Ranks all topics by likelihood of appearance
- **Smart Caching**: Redis-based caching for fast retrieval

## 🚀 Quick Start

### 1. Setup Database
```bash
alembic upgrade head
```

### 2. Analyze Historical Data
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

### 3. Get Top Predictions
```bash
GET /api/v1/board-exam-predictions/top-predictions?board=cbse&grade_id=10&subject_id=5&top_n=20
```

## 📊 Probability Score Formula

```
Probability = 
  Frequency Score × 25% +
  Cyclical Pattern × 20% +
  Trend Score × 15% +
  Weightage Score × 20% +
  Recency Score × 20%
```

## 🎓 Confidence Levels

| Level | Criteria |
|-------|----------|
| **Very High** | 7+ appearances, 70%+ cyclical score |
| **High** | 5+ appearances, 60%+ cyclical score |
| **Medium** | 3+ appearances, 40%+ cyclical score |
| **Low** | 2+ appearances |
| **Very Low** | <2 appearances |

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analyze` | POST | Generate predictions |
| `/predictions` | GET | List all predictions |
| `/top-predictions` | GET | Get top N predictions |
| `/due-topics` | GET | Get overdue topics |
| `/by-chapter/{id}` | GET | Filter by chapter |
| `/summary` | GET | Get statistics |

## 📁 Documentation

- **[Implementation Guide](BOARD_EXAM_PREDICTION_IMPLEMENTATION.md)**: Complete technical details
- **[Quick Start](BOARD_EXAM_PREDICTION_QUICK_START.md)**: Usage examples and API reference  
- **[Summary](BOARD_EXAM_PREDICTION_SUMMARY.md)**: Overview and architecture
- **[Checklist](BOARD_EXAM_PREDICTION_CHECKLIST.md)**: Implementation verification

## 🏗️ Architecture

```
┌─────────────┐
│   FastAPI   │  ← REST API Layer
└──────┬──────┘
       │
┌──────▼──────┐
│   Service   │  ← Business Logic & Algorithms
└──────┬──────┘
       │
┌──────▼──────┐
│ Repository  │  ← Data Access Layer
└──────┬──────┘
       │
┌──────▼──────┐     ┌───────────┐
│  Database   │     │   Redis   │
│ PostgreSQL  │     │   Cache   │
└─────────────┘     └───────────┘
```

## 🔧 Technology Stack

- **FastAPI 0.109+**: Modern async web framework
- **SQLAlchemy 2.0+**: ORM for database operations
- **PostgreSQL**: Primary data storage
- **Redis**: Caching layer
- **Pydantic**: Data validation
- **Python 3.11+**: Programming language

## 📈 Example Response

```json
{
  "id": 1,
  "topic_name": "Quadratic Equations",
  "frequency_count": 8,
  "total_marks": 32.0,
  "years_since_last_appearance": 0,
  "probability_score": 85.2,
  "prediction_rank": 1,
  "is_due": false,
  "confidence_level": "Very High"
}
```

## 🎯 Use Cases

1. **Exam Preparation**: Students focus on high-probability topics
2. **Teaching Planning**: Teachers prioritize important topics
3. **Resource Allocation**: Institutions optimize study materials
4. **Question Paper Setting**: Helps create balanced question papers
5. **Performance Prediction**: Identify areas needing more attention

## 🔍 Pattern Analysis Algorithms

### 1. Frequency Analysis
Calculates appearance rate over analysis period
- **Input**: Topic appearances per year
- **Output**: Frequency score 0-100%

### 2. Cyclical Pattern Detection
Identifies repeating patterns
- **Method**: Interval consistency + Pattern adherence
- **Output**: Pattern score 0-100%

### 3. Trend Analysis
Detects increasing/decreasing trends
- **Method**: Compares recent vs. older appearances
- **Output**: Trend score 0-100%

### 4. Weightage Analysis
Evaluates importance by marks
- **Method**: Average marks + Total marks
- **Output**: Weightage score 0-100%

### 5. Recency Analysis
Prioritizes based on last appearance
- **Method**: Time-based scoring
- **Output**: Recency score 0-100%

## 💾 Database Schema

### topic_predictions Table
- **id**: Primary key
- **institution_id**: Institution reference
- **board**: Exam board (CBSE, ICSE, etc.)
- **grade_id**: Grade/class reference
- **subject_id**: Subject reference
- **topic_name**: Topic being analyzed
- **frequency_count**: Number of appearances
- **total_marks**: Total marks across all years
- **probability_score**: Final prediction score
- **prediction_rank**: Ranking by probability
- **is_due**: Whether topic is overdue
- **confidence_level**: Prediction confidence

**11 indexes** for optimal query performance

## ⚡ Performance

- **Caching**: 24-hour Redis cache
- **Bulk Operations**: Efficient batch processing
- **Indexes**: Optimized database queries
- **Pagination**: Handles large result sets
- **Async Support**: Concurrent request handling

## 🔒 Security

- Authentication required on all endpoints
- Institution-level data isolation
- No cross-institution data access
- Secure API token handling

## 📊 Monitoring

Track these metrics:
- Analysis execution time
- Cache hit rate
- API response times
- Prediction accuracy
- Database query performance

## 🚦 Getting Started Checklist

- [ ] Run database migration
- [ ] Ensure historical papers exist
- [ ] Tag questions with topics
- [ ] Run first analysis
- [ ] Verify predictions generated
- [ ] Test API endpoints
- [ ] Set up monitoring

## 🤝 Integration Example

```python
import httpx

async def get_exam_predictions(board, grade_id, subject_id):
    async with httpx.AsyncClient() as client:
        # Analyze
        await client.post(
            "http://localhost:8000/api/v1/board-exam-predictions/analyze",
            json={
                "board": board,
                "grade_id": grade_id,
                "subject_id": subject_id
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Get top 20
        response = await client.get(
            "http://localhost:8000/api/v1/board-exam-predictions/top-predictions",
            params={"board": board, "grade_id": grade_id, "subject_id": subject_id, "top_n": 20},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        return response.json()
```

## 🔮 Future Enhancements

### Phase 2
- Machine learning models
- Neural network predictions
- Ensemble methods

### Phase 3
- Multi-year cycle detection
- Cross-topic correlation
- Difficulty prediction
- Question type analysis

### Phase 4
- Study plan generation
- Email notifications
- Mobile app integration
- Real-time updates

## 📝 Files Modified/Created

### New Files (8)
- `src/services/board_exam_prediction_service.py`
- `src/api/v1/board_exam_predictions.py`
- `alembic/versions/create_topic_predictions_table.py`
- `BOARD_EXAM_PREDICTION_IMPLEMENTATION.md`
- `BOARD_EXAM_PREDICTION_QUICK_START.md`
- `BOARD_EXAM_PREDICTION_SUMMARY.md`
- `BOARD_EXAM_PREDICTION_CHECKLIST.md`
- `BOARD_EXAM_PREDICTION_README.md`

### Modified Files (5)
- `src/models/previous_year_papers.py`
- `src/schemas/previous_year_papers.py`
- `src/repositories/previous_year_papers_repository.py`
- `src/api/v1/__init__.py`
- `src/models/__init__.py`

## ✅ Status

**Phase 1 - Pattern Analysis**: ✅ **COMPLETE**

All features implemented and ready for testing:
- ✅ Frequency analysis algorithm
- ✅ Marks weightage calculator
- ✅ Cyclical pattern detection
- ✅ topic_predictions table
- ✅ Caching mechanism
- ✅ API endpoints
- ✅ Documentation

## 📞 Support

For detailed information:
- Technical details: `BOARD_EXAM_PREDICTION_IMPLEMENTATION.md`
- Usage guide: `BOARD_EXAM_PREDICTION_QUICK_START.md`
- Architecture: `BOARD_EXAM_PREDICTION_SUMMARY.md`

---

**Built with ❤️ for better exam preparation**
