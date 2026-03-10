# Academic Structure Implementation

## Overview

This document describes the implementation of the academic structure database models and services for managing educational content hierarchy in the multi-tenant education management system.

## Database Models

### Hierarchical Structure

The academic structure follows this hierarchy:

```
Institution
  └── Academic Year
        └── Grade
              ├── Section
              └── Subject (via GradeSubject)
                    └── Chapter
                          └── Topic
```

### Tables

#### 1. academic_years
Represents academic/school years for an institution.

**Columns:**
- `id` (PK): Integer
- `institution_id` (FK): References institutions.id, CASCADE delete
- `name`: String(100), unique per institution
- `start_date`: Date
- `end_date`: Date
- `is_active`: Boolean, default True
- `is_current`: Boolean, default False (only one current per institution)
- `description`: Text, nullable
- `created_at`: DateTime
- `updated_at`: DateTime

**Indexes:**
- `idx_academic_year_institution` on institution_id
- `idx_academic_year_current` on is_current
- `idx_academic_year_active` on is_active

**Constraints:**
- `uq_institution_academic_year_name`: UNIQUE(institution_id, name)

---

#### 2. grades
Represents grade levels (e.g., Grade 1, Grade 2, Class 10).

**Columns:**
- `id` (PK): Integer
- `institution_id` (FK): References institutions.id, CASCADE delete
- `academic_year_id` (FK): References academic_years.id, CASCADE delete
- `name`: String(100)
- `display_order`: Integer, default 0
- `description`: Text, nullable
- `is_active`: Boolean, default True
- `created_at`: DateTime
- `updated_at`: DateTime

**Indexes:**
- `idx_grade_institution` on institution_id
- `idx_grade_academic_year` on academic_year_id
- `idx_grade_active` on is_active

**Constraints:**
- `uq_institution_year_grade_name`: UNIQUE(institution_id, academic_year_id, name)

---

#### 3. sections
Represents class sections within a grade (e.g., Section A, Section B).

**Columns:**
- `id` (PK): Integer
- `institution_id` (FK): References institutions.id, CASCADE delete
- `grade_id` (FK): References grades.id, CASCADE delete
- `name`: String(100)
- `capacity`: Integer, nullable
- `description`: Text, nullable
- `is_active`: Boolean, default True
- `created_at`: DateTime
- `updated_at`: DateTime

**Indexes:**
- `idx_section_institution` on institution_id
- `idx_section_grade` on grade_id
- `idx_section_active` on is_active

**Constraints:**
- `uq_grade_section_name`: UNIQUE(grade_id, name)

---

#### 4. subjects
Represents subjects/courses (e.g., Mathematics, Science).

**Columns:**
- `id` (PK): Integer
- `institution_id` (FK): References institutions.id, CASCADE delete
- `name`: String(200), unique per institution
- `code`: String(50), unique per institution, nullable
- `description`: Text, nullable
- `is_active`: Boolean, default True
- `created_at`: DateTime
- `updated_at`: DateTime

**Indexes:**
- `idx_subject_institution` on institution_id
- `idx_subject_active` on is_active

**Constraints:**
- `uq_institution_subject_name`: UNIQUE(institution_id, name)
- `uq_institution_subject_code`: UNIQUE(institution_id, code)

---

#### 5. grade_subjects
Junction table linking subjects to grades.

**Columns:**
- `id` (PK): Integer
- `institution_id` (FK): References institutions.id, CASCADE delete
- `grade_id` (FK): References grades.id, CASCADE delete
- `subject_id` (FK): References subjects.id, CASCADE delete
- `is_compulsory`: Boolean, default True
- `created_at`: DateTime

**Indexes:**
- `idx_grade_subject_institution` on institution_id
- `idx_grade_subject_grade` on grade_id
- `idx_grade_subject_subject` on subject_id

**Constraints:**
- `uq_grade_subject`: UNIQUE(grade_id, subject_id)

---

#### 6. chapters (NEW)
Represents chapters within a subject for a specific grade.

**Columns:**
- `id` (PK): Integer
- `institution_id` (FK): References institutions.id, CASCADE delete
- `subject_id` (FK): References subjects.id, CASCADE delete
- `grade_id` (FK): References grades.id, CASCADE delete
- `name`: String(200)
- `code`: String(50), nullable
- `display_order`: Integer, default 0
- `description`: Text, nullable
- `is_active`: Boolean, default True
- `created_at`: DateTime
- `updated_at`: DateTime

**Indexes:**
- `idx_chapter_institution` on institution_id
- `idx_chapter_subject` on subject_id
- `idx_chapter_grade` on grade_id
- `idx_chapter_active` on is_active

**Constraints:**
- `uq_subject_grade_chapter_name`: UNIQUE(subject_id, grade_id, name)
- `uq_subject_grade_chapter_code`: UNIQUE(subject_id, grade_id, code)

---

#### 7. topics (NEW)
Represents topics within a chapter.

**Columns:**
- `id` (PK): Integer
- `institution_id` (FK): References institutions.id, CASCADE delete
- `chapter_id` (FK): References chapters.id, CASCADE delete
- `name`: String(200)
- `code`: String(50), nullable
- `display_order`: Integer, default 0
- `description`: Text, nullable
- `is_active`: Boolean, default True
- `created_at`: DateTime
- `updated_at`: DateTime

**Indexes:**
- `idx_topic_institution` on institution_id
- `idx_topic_chapter` on chapter_id
- `idx_topic_active` on is_active

**Constraints:**
- `uq_chapter_topic_name`: UNIQUE(chapter_id, name)
- `uq_chapter_topic_code`: UNIQUE(chapter_id, code)

---

## Cascade Delete Behavior

All foreign keys use `ondelete='CASCADE'` to ensure proper cleanup:

1. **Deleting Institution** → Cascades to all academic_years, grades, sections, subjects, grade_subjects, chapters, topics
2. **Deleting Academic Year** → Cascades to all grades (and their children)
3. **Deleting Grade** → Cascades to sections, grade_subjects, chapters (and their topics)
4. **Deleting Subject** → Cascades to grade_subjects, chapters (and their topics)
5. **Deleting Chapter** → Cascades to all topics

## Service Layer

### Available Services

All services are located in `src/services/academic_service.py`:

1. **AcademicYearService** - Manage academic years
2. **GradeService** - Manage grades
3. **SectionService** - Manage sections
4. **SubjectService** - Manage subjects, grade-subject assignments
5. **ChapterService** - Manage chapters (NEW)
6. **TopicService** - Manage topics (NEW)

### Service Methods

Each service provides:
- `create_*()` - Create single entity
- `create_*_bulk()` - Bulk create entities
- `get_*()` - Get by ID
- `list_*()` - List with filters, pagination
- `update_*()` - Update single entity
- `update_*_bulk()` - Bulk update entities (Chapter & Topic only)
- `delete_*()` - Delete single entity
- `delete_*_bulk()` - Bulk delete entities (Chapter & Topic only)

### Example Usage

```python
from sqlalchemy.orm import Session
from src.services.academic_service import ChapterService, TopicService
from src.schemas.academic import ChapterCreate, TopicCreate

# Create Chapter Service
chapter_service = ChapterService(db)

# Create a single chapter
chapter_data = ChapterCreate(
    institution_id=1,
    subject_id=5,
    grade_id=10,
    name="Algebra",
    code="ALG-01",
    display_order=1,
    description="Introduction to Algebra"
)
chapter = chapter_service.create_chapter(chapter_data)

# Create multiple chapters at once
chapters_data = [
    ChapterCreate(
        institution_id=1,
        subject_id=5,
        grade_id=10,
        name="Geometry",
        code="GEO-01",
        display_order=2
    ),
    ChapterCreate(
        institution_id=1,
        subject_id=5,
        grade_id=10,
        name="Trigonometry",
        code="TRIG-01",
        display_order=3
    )
]
chapters = chapter_service.create_chapters_bulk(chapters_data)

# List chapters with filters
chapters, total = chapter_service.list_chapters(
    institution_id=1,
    subject_id=5,
    grade_id=10,
    search="algebra",
    is_active=True,
    skip=0,
    limit=10
)

# Create topics for a chapter
topic_service = TopicService(db)
topics_data = [
    TopicCreate(
        institution_id=1,
        chapter_id=chapter.id,
        name="Linear Equations",
        code="LE-01",
        display_order=1
    ),
    TopicCreate(
        institution_id=1,
        chapter_id=chapter.id,
        name="Quadratic Equations",
        code="QE-01",
        display_order=2
    )
]
topics = topic_service.create_topics_bulk(topics_data)
```

## Repository Layer

### Available Repositories

All repositories are located in `src/repositories/academic_repository.py`:

1. **AcademicYearRepository**
2. **GradeRepository**
3. **SectionRepository**
4. **SubjectRepository**
5. **ChapterRepository**
6. **TopicRepository**

### Repository Methods

Each repository provides direct database access methods:

#### Core CRUD Operations
- `create(**kwargs)` - Create single record
- `create_bulk(items: List[Dict])` - Bulk create records
- `get_by_id(id: int)` - Get by primary key
- `update(entity, **kwargs)` - Update record
- `update_bulk(updates: List[Dict])` - Bulk update records
- `delete(entity)` - Delete record
- `delete_bulk(ids: List[int])` - Bulk delete by IDs

#### Specialized Query Methods
- `get_by_*()` - Get by specific criteria
- `list_by_institution()` - List with filters and pagination
- `count_by_institution()` - Count with filters

#### Relationship Methods
- `get_with_*()` - Eager load relationships

### Repository vs Service

- **Repositories**: Direct database access, no business logic
- **Services**: Business logic, validation, error handling, uses repositories

### Example Usage

```python
from src.repositories.academic_repository import ChapterRepository, TopicRepository

# Using repositories directly
chapter_repo = ChapterRepository(db)

# Create chapter
chapter = chapter_repo.create(
    institution_id=1,
    subject_id=5,
    grade_id=10,
    name="Algebra",
    code="ALG-01",
    display_order=1
)

# Bulk create
chapters = chapter_repo.create_bulk([
    {"institution_id": 1, "subject_id": 5, "grade_id": 10, "name": "Geometry", "display_order": 2},
    {"institution_id": 1, "subject_id": 5, "grade_id": 10, "name": "Trigonometry", "display_order": 3}
])

# List with filters
chapters = chapter_repo.list_by_institution(
    institution_id=1,
    subject_id=5,
    grade_id=10,
    skip=0,
    limit=10
)

# Get with relationships
chapter = chapter_repo.get_with_topics(chapter_id=1)

# Bulk update
updates = [
    {"id": 1, "display_order": 5},
    {"id": 2, "display_order": 6}
]
updated_chapters = chapter_repo.update_bulk(updates)

# Bulk delete
deleted_count = chapter_repo.delete_bulk([1, 2, 3])
db.commit()  # Remember to commit when using repositories
```

## Schemas

All Pydantic schemas are in `src/schemas/academic.py`:

### Chapter Schemas
- `ChapterBase` - Base fields
- `ChapterCreate` - For creation
- `ChapterUpdate` - For updates (all optional)
- `ChapterResponse` - For API responses
- `ChapterWithTopicsResponse` - Include related topics

### Topic Schemas
- `TopicBase` - Base fields
- `TopicCreate` - For creation
- `TopicUpdate` - For updates (all optional)
- `TopicResponse` - For API responses

### Additional Schemas
- `SubjectWithChaptersResponse` - Subject with chapters list

## Migration

Migration file: `alembic/versions/006_create_chapters_and_topics_tables.py`

To apply the migration:
```bash
alembic upgrade head
```

To rollback:
```bash
alembic downgrade -1
```

## Bulk Operations

### Service Level Bulk Operations

#### Create Bulk
```python
# Chapters
chapters_data = [ChapterCreate(...), ChapterCreate(...)]
chapters = chapter_service.create_chapters_bulk(chapters_data)

# Topics
topics_data = [TopicCreate(...), TopicCreate(...)]
topics = topic_service.create_topics_bulk(topics_data)
```

#### Update Bulk
```python
# Chapters
updates = [
    {"id": 1, "name": "Updated Name", "display_order": 5},
    {"id": 2, "is_active": False}
]
chapters = chapter_service.update_chapters_bulk(updates)

# Topics
updates = [
    {"id": 10, "name": "Updated Topic", "display_order": 3},
    {"id": 11, "is_active": False}
]
topics = topic_service.update_topics_bulk(updates)
```

#### Delete Bulk
```python
# Chapters - returns dict with deleted_count and errors
result = chapter_service.delete_chapters_bulk([1, 2, 3])
# {"deleted_count": 3, "errors": []}

# Topics
result = topic_service.delete_topics_bulk([10, 11, 12])
# {"deleted_count": 3, "errors": []}
```

### Repository Level Bulk Operations

```python
# Create
chapters = chapter_repo.create_bulk([{...}, {...}])
db.commit()

# Update
updated = chapter_repo.update_bulk([{"id": 1, ...}, {"id": 2, ...}])
db.commit()

# Delete
count = chapter_repo.delete_bulk([1, 2, 3])
db.commit()
```

## Testing

Example test scenarios to implement:

1. **Cascade Delete Tests**
   - Delete institution → verify all related data deleted
   - Delete grade → verify chapters and topics deleted
   - Delete subject → verify chapters and topics deleted
   - Delete chapter → verify topics deleted

2. **Unique Constraint Tests**
   - Duplicate chapter names in same subject/grade
   - Duplicate chapter codes in same subject/grade
   - Duplicate topic names in same chapter
   - Duplicate topic codes in same chapter

3. **Bulk Operation Tests**
   - Bulk create with validation errors
   - Bulk update with non-existent IDs
   - Bulk delete with mixed valid/invalid IDs

4. **Query Performance Tests**
   - List operations with large datasets
   - Eager loading relationships
   - Filter combinations

## Future Enhancements

Potential additions to consider:

1. **Content Management**
   - Add learning objectives to topics
   - Add resources/materials to chapters/topics
   - Add difficulty levels

2. **Progress Tracking**
   - Student progress per topic
   - Chapter completion status
   - Assessment linkage

3. **Versioning**
   - Chapter/topic versioning
   - Historical changes tracking
   - Draft/published states

4. **Ordering**
   - Drag-and-drop reordering API
   - Automatic order calculation
   - Order validation

5. **Import/Export**
   - Bulk import from CSV/Excel
   - Export curriculum structure
   - Template generation
