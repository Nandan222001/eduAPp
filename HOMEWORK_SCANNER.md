# Homework Scanner Implementation

## Overview
Smart Homework Scanner backend implementation with OCR, math expression evaluation, and AI feedback generation.

## Components

### 1. Database Models (`src/models/homework_scanner.py`)
- **HomeworkScan**: Main model storing scan information
  - `student_id`: Foreign key to students table
  - `subject_id`: Foreign key to subjects table
  - `scan_image_urls`: JSON array of uploaded image URLs
  - `ocr_text`: Extracted text from images
  - `processed_results`: JSON with processing results and statistics
  - `total_score`: Overall score (0-100)
  - `scan_date`: Timestamp of scan

- **HomeworkFeedback**: Per-question feedback
  - `scan_id`: Foreign key to homework_scans
  - `question_number`: Question identifier
  - `student_answer`: Extracted student answer
  - `correct_answer`: Expected correct answer
  - `is_correct`: Boolean correctness flag
  - `mistake_type`: Enum (calculation, sign_error, concept, unit, incomplete)
  - `ai_feedback`: Generated feedback text
  - `remedial_content_url`: Link to learning resources

### 2. Service Layer (`src/services/homework_scanner_service.py`)

#### OCR Processing
- **Tesseract Integration**: Uses pytesseract for handwriting recognition
- Supports multiple image pages with page break markers
- PSM mode 6 for uniform block of text

#### Math Evaluation
- **SymPy Integration**: Evaluates mathematical expressions
- Supports implicit multiplication
- Compares expressions symbolically
- Numeric comparison with tolerance for floating-point answers

#### Mistake Detection
- **Calculation Errors**: Detects arithmetic mistakes
- **Sign Errors**: Identifies incorrect positive/negative values
- **Conceptual Errors**: Flags fundamental misunderstandings
- **Unit Errors**: Catches incorrect or missing units
- **Incomplete Answers**: Detects missing responses

#### Feedback Generation
- Context-specific feedback based on mistake type
- Remedial content URLs mapped to learning resources
- Positive reinforcement for correct answers

### 3. API Endpoints (`src/api/v1/homework_scanner.py`)

#### POST `/api/v1/homework-scanner/upload-image`
Upload homework images to S3
- **Query Params**: `student_id`
- **Body**: Multipart file upload
- **Returns**: Image URL and S3 key

#### POST `/api/v1/homework-scanner/scans`
Create a new homework scan
- **Body**: `HomeworkScanCreate` (student_id, subject_id)
- **Query Params**: `image_urls` (array)
- **Returns**: Created scan object

#### POST `/api/v1/homework-scanner/scans/process`
Process a scan with OCR and evaluation
- **Body**: `ScanProcessRequest` (scan_id, answer_key dict)
- **Returns**: Complete scan with feedback

#### GET `/api/v1/homework-scanner/scans/{scan_id}`
Retrieve scan with all feedback
- **Returns**: Scan with nested feedback array

#### GET `/api/v1/homework-scanner/scans/student/{student_id}`
List all scans for a student
- **Query Params**: `skip`, `limit`, `subject_id` (optional)
- **Returns**: Paginated list of scans

#### GET `/api/v1/homework-scanner/students/{student_id}/mistake-patterns`
Analyze student's common mistakes
- **Query Params**: `subject_id` (optional)
- **Returns**: Aggregated mistake statistics

#### POST `/api/v1/homework-scanner/notify-teacher`
Send notification to teacher about scan completion
- **Body**: `TeacherNotificationRequest` (scan_id, teacher_id, message)
- **Returns**: Notification confirmation

### 4. Database Migration (`alembic/versions/030_create_homework_scanner_tables.py`)
- Creates `homework_scans` table
- Creates `homework_feedbacks` table
- Creates `mistaketype` enum
- Adds appropriate indexes for performance

## Dependencies Added
- `pytesseract ^0.3.10`: Python wrapper for Tesseract OCR
- `sympy ^1.12`: Symbolic mathematics library

## External Requirements
- **Tesseract OCR**: Must be installed on the system
  - Ubuntu/Debian: `apt-get install tesseract-ocr`
  - macOS: `brew install tesseract`
  - Windows: Download from GitHub releases

## Environment Variables
- `APP_URL`: Base URL for remedial content links (default: http://localhost:8000)
- `AWS_ACCESS_KEY_ID`: AWS credentials for S3
- `AWS_SECRET_ACCESS_KEY`: AWS secret
- `S3_BUCKET_NAME`: S3 bucket for image storage

## Usage Flow

1. **Upload Images**: Student uploads homework images
2. **Create Scan**: System creates scan record with image URLs
3. **Process Scan**: 
   - OCR extracts text from images
   - Answers are parsed and matched to question numbers
   - Each answer is evaluated against the answer key
   - Mistakes are classified by type
   - AI feedback is generated
   - Remedial resources are linked
4. **Review Results**: Student/teacher views scan with detailed feedback
5. **Analyze Patterns**: Track recurring mistake types for targeted learning

## Answer Key Format
```json
{
  "1": "42",
  "2": "x^2 + 2x + 1",
  "3": "9.8 m/s^2",
  "4": "mitochondria"
}
```

## Example Response
```json
{
  "id": 1,
  "student_id": 123,
  "subject_id": 5,
  "total_score": 75.0,
  "processed_results": {
    "total_questions": 4,
    "correct_answers": 3,
    "incorrect_answers": 1,
    "score_percentage": 75.0
  },
  "feedbacks": [
    {
      "question_number": 1,
      "student_answer": "42",
      "correct_answer": "42",
      "is_correct": true,
      "ai_feedback": "Excellent! Your answer is correct.",
      "mistake_type": null
    },
    {
      "question_number": 2,
      "student_answer": "x^2 - 2x + 1",
      "correct_answer": "x^2 + 2x + 1",
      "is_correct": false,
      "mistake_type": "sign_error",
      "ai_feedback": "You have a sign error in your answer...",
      "remedial_content_url": "http://localhost:8000/learning-resources/signs-and-operations"
    }
  ]
}
```

## Notes
- OCR accuracy depends on image quality and handwriting clarity
- Math evaluation supports standard algebraic expressions
- Boolean (0/1) used for `is_correct` field for database compatibility
- Remedial URLs are placeholders and should be configured per institution
