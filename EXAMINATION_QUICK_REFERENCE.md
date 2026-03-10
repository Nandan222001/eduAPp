# Examination Management Module - Quick Reference

## Quick Start

### 1. Create Grade Configuration
```bash
POST /api/v1/exams/grade-configurations
{
  "institution_id": 1,
  "name": "Excellent",
  "grade": "A+",
  "min_percentage": 90,
  "max_percentage": 100,
  "grade_point": 4.0,
  "is_passing": true
}
```

### 2. Create Exam
```bash
POST /api/v1/exams
{
  "institution_id": 1,
  "academic_year_id": 1,
  "grade_id": 1,
  "name": "First Term Exam",
  "exam_type": "mid_term",
  "start_date": "2024-03-01",
  "end_date": "2024-03-15"
}
```

### 3. Add Subject to Exam
```bash
POST /api/v1/exams/1/subjects
{
  "institution_id": 1,
  "exam_id": 1,
  "subject_id": 1,
  "theory_max_marks": 80,
  "practical_max_marks": 20,
  "theory_passing_marks": 32,
  "practical_passing_marks": 8
}
```

### 4. Create Exam Schedule
```bash
POST /api/v1/exams/1/schedules
{
  "institution_id": 1,
  "exam_id": 1,
  "subject_id": 1,
  "section_id": 1,
  "exam_date": "2024-03-05",
  "start_time": "09:00:00",
  "end_time": "12:00:00",
  "room_number": "Room 101"
}
```

### 5. Bulk Enter Marks
```bash
POST /api/v1/exams/marks/bulk?institution_id=1&entered_by=5
{
  "exam_subject_id": 1,
  "marks_entries": [
    {
      "student_id": 1,
      "theory_marks_obtained": 75,
      "practical_marks_obtained": 18
    }
  ]
}
```

### 6. Generate Results
```bash
POST /api/v1/exams/1/results/generate?institution_id=1
```

### 7. Generate Analytics
```bash
POST /api/v1/exams/1/analytics/generate?institution_id=1
```

## Exam Types
- `unit` - Unit test
- `mid_term` - Mid-term exam
- `final` - Final exam
- `mock` - Mock exam

## Exam Status
- `scheduled` - Not yet started
- `ongoing` - Currently running
- `completed` - Finished
- `cancelled` - Cancelled

## Common Queries

### List Exams by Type
```bash
GET /api/v1/exams?institution_id=1&exam_type=mid_term
```

### List Exams by Grade
```bash
GET /api/v1/exams?institution_id=1&grade_id=1
```

### Get Student Result
```bash
GET /api/v1/exams/1/results/student/5?institution_id=1
```

### Get Section Results
```bash
GET /api/v1/exams/1/results?institution_id=1&section_id=1
```

### Get Subject-wise Analytics
```bash
GET /api/v1/exams/1/analytics?institution_id=1&subject_id=1
```

### Compare Multiple Exams
```bash
POST /api/v1/exams/analytics/compare?institution_id=1
{
  "exam_ids": [1, 2, 3],
  "section_id": 1
}
```

## Data Models

### Exam
- id, institution_id, academic_year_id, grade_id
- name, exam_type, description
- start_date, end_date, status
- total_marks, passing_marks, is_published

### ExamSubject
- id, exam_id, subject_id
- theory_max_marks, practical_max_marks
- theory_passing_marks, practical_passing_marks
- weightage, question_paper_path

### ExamSchedule
- id, exam_id, subject_id, section_id
- exam_date, start_time, end_time
- room_number, invigilator_id

### ExamMarks
- id, exam_subject_id, student_id
- theory_marks_obtained, practical_marks_obtained
- is_absent, remarks
- entered_by, entered_at

### ExamResult
- id, exam_id, student_id, section_id
- total_marks_obtained, total_max_marks
- percentage, grade, grade_point
- is_pass, rank_in_section, rank_in_grade
- subjects_passed, subjects_failed

## Workflow Examples

### Complete Exam Flow
1. Create grade configurations (once per institution)
2. Create exam
3. Add all subjects to exam
4. Create schedules for all subjects
5. Enter marks for all students
6. Generate results
7. Generate analytics
8. Publish results (update exam.is_published)

### Marks Entry Flow
1. Get exam subjects list
2. For each subject:
   - Get students in section(s)
   - Prepare marks entries
   - Bulk enter marks
3. Verify all marks entered
4. Generate results

### Analytics Flow
1. Generate overall analytics
2. Generate section-wise analytics
3. Generate subject-wise analytics
4. Compare with previous exams
5. Export/display reports

## Conflict Detection

### Schedule Conflicts Checked
- Same section at same time
- Same invigilator at same time
- Overlapping time slots

### Response on Conflict
```json
{
  "schedule": { ... },
  "conflicts": [
    {
      "schedule_id": 123,
      "conflict_type": "section",
      "message": "Section has another exam..."
    }
  ],
  "has_conflicts": true
}
```

## Performance Tips

1. Use bulk marks entry for efficiency
2. Generate analytics after all marks entered
3. Cache frequently accessed results
4. Use pagination for large result sets
5. Filter queries by section/subject when possible

## Error Handling

### Common Errors
- 404: Exam/subject/student not found
- 400: Invalid marks (exceeds max)
- 409: Duplicate marks entry
- 400: Schedule conflicts

### Best Practices
- Validate marks before entry
- Check schedule conflicts before confirming
- Ensure all subjects have marks before generating results
- Configure grades before creating exams

## Ranking Logic

### Section Ranking
- Ranks students within same section
- Based on percentage
- Tied scores get same rank

### Grade Ranking
- Ranks all students in grade
- Across all sections
- Based on percentage

## Analytics Metrics

### Overall Metrics
- Total students
- Students appeared
- Pass percentage
- Average marks
- Highest/lowest marks
- Median, standard deviation

### Subject Metrics
- Same as overall but per subject
- Theory vs practical breakdown

### Section Metrics
- Same as overall but per section
- Compare sections within exam

## Integration Points

### Required Data
- Students with sections
- Subjects configured
- Teachers for invigilators
- Academic year and grades

### Provides Data To
- Report generation
- Parent portals
- Student dashboards
- Teacher analytics

## Security Notes

- Always pass institution_id for isolation
- Validate teacher permissions for marks entry
- Control result publication
- Audit all marks modifications

## Common Use Cases

### Case 1: Mid-term Exam
1. Type: `mid_term`
2. Duration: 2 weeks
3. All subjects, theory + practical
4. Generate results, ranks, analytics

### Case 2: Unit Test
1. Type: `unit`
2. Duration: 1 day
3. Single subject or few subjects
4. Quick marks entry and results

### Case 3: Mock Exam
1. Type: `mock`
2. Practice for final exam
3. Full subject coverage
4. Compare with actual exam later

### Case 4: Final Exam
1. Type: `final`
2. Comprehensive assessment
3. Full analytics and comparison
4. Historical tracking important
