# MySQL Migration Guide: PostgreSQL to MySQL Conversion

Complete guide for understanding PostgreSQL to MySQL migration differences, MySQL equivalents for common patterns, and troubleshooting migration-specific issues.

## Table of Contents

- [Overview](#overview)
- [PostgreSQL Features Removed](#postgresql-features-removed)
- [MySQL Equivalents for Common Patterns](#mysql-equivalents-for-common-patterns)
- [Migration Best Practices](#migration-best-practices)
- [Troubleshooting Common Migration Errors](#troubleshooting-common-migration-errors)
- [Performance Considerations](#performance-considerations)
- [Testing Your Migration](#testing-your-migration)

## Overview

This guide documents the key differences between PostgreSQL and MySQL 8.0, focusing on features that must be replaced or handled differently when migrating Alembic migrations from PostgreSQL to MySQL.

### Key Migration Principles

1. **No Direct Port**: PostgreSQL and MySQL have fundamental architectural differences
2. **Application-Level Replacements**: Many PostgreSQL features require application-level implementation in MySQL
3. **Test Thoroughly**: Always test migrations on a copy of production data
4. **Plan for Downtime**: Some conversions require significant schema changes

### Quick Reference

| PostgreSQL Feature | MySQL Equivalent | Implementation |
|-------------------|------------------|----------------|
| RLS Policies | Application filtering | Code-level WHERE clauses |
| Native UUID | CHAR(36) or BINARY(16) | App-generated UUIDs |
| JSONB | JSON | MySQL JSON type |
| JSONB operators (@>, ->, etc.) | JSON functions | JSON_EXTRACT(), JSON_CONTAINS() |
| pg_catalog queries | information_schema | Different query syntax |
| ENUM modification | Table rebuild or VARCHAR | CHECK constraints preferred |
| Partial indexes | Full indexes | Functional indexes in 8.0+ |
| EXCLUDE constraints | Application logic | Triggers or app validation |

---

## PostgreSQL Features Removed

### 1. Row-Level Security (RLS) Policies

#### What Was Removed

PostgreSQL Row-Level Security policies that automatically filter queries based on user context:

```sql
-- PostgreSQL RLS (NOT supported in MySQL)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON students
    USING (institution_id = current_setting('app.current_institution_id')::integer);

CREATE POLICY teacher_can_view_own_students ON students
    FOR SELECT
    TO teacher_role
    USING (teacher_id = current_setting('app.current_user_id')::integer);
```

#### Why It Was Removed

MySQL does not have a Row-Level Security feature. RLS is a PostgreSQL-specific security mechanism built into the database engine.

#### Impact on Migration

- **HIGH**: All RLS policies must be removed from migrations
- Multi-tenant data isolation must be implemented at the application level
- Security model changes from database-enforced to application-enforced

#### What to Do Instead

See [Application-Level Filtering](#application-level-filtering) in the MySQL Equivalents section.

---

### 2. Native UUID Type

#### What Was Removed

PostgreSQL's native UUID data type and associated functions:

```sql
-- PostgreSQL UUID (NOT supported in MySQL)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id UUID NOT NULL UNIQUE
);

-- PostgreSQL UUID generation
INSERT INTO users (id) VALUES (gen_random_uuid());

-- PostgreSQL UUID casting
SELECT * FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
```

#### Why It Was Removed

MySQL does not have a native UUID type. It supports storing UUIDs as strings or binary data, but not as a first-class type with built-in functions.

#### Impact on Migration

- **MEDIUM**: UUID columns must be converted to CHAR(36) or BINARY(16)
- UUID generation moves from database to application
- Indexes on UUIDs work but are less efficient than integer keys

#### What to Do Instead

See [UUID Storage and Generation](#uuid-storage-and-generation) in the MySQL Equivalents section.

---

### 3. JSONB Type and Operators

#### What Was Removed

PostgreSQL's JSONB data type and specialized operators:

```sql
-- PostgreSQL JSONB (NOT supported in MySQL)
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    attributes JSONB NOT NULL
);

-- PostgreSQL JSONB operators (NOT supported in MySQL)
-- Containment operator
SELECT * FROM products WHERE attributes @> '{"color": "red"}';

-- Path operator
SELECT * FROM products WHERE attributes -> 'specs' ->> 'weight' > '100';

-- Existence operators
SELECT * FROM products WHERE attributes ? 'color';
SELECT * FROM products WHERE attributes ?| array['color', 'size'];
SELECT * FROM products WHERE attributes ?& array['color', 'size'];

-- Key deletion
UPDATE products SET attributes = attributes - 'old_key';

-- Deep path update
UPDATE products SET attributes = jsonb_set(attributes, '{specs,weight}', '150');
```

#### Why It Was Removed

MySQL only has a JSON type (not JSONB). While MySQL 8.0 has strong JSON support, the operators and function names differ from PostgreSQL.

**Key Differences:**
- **JSONB**: Binary JSON, optimized for operations, supports indexing on keys
- **MySQL JSON**: Stored as binary but uses functions instead of operators
- **Syntax**: PostgreSQL uses operators (`@>`, `->`, `->>`, `?`), MySQL uses functions

#### Impact on Migration

- **HIGH**: All JSONB operators must be converted to MySQL JSON functions
- Query syntax changes significantly
- Performance characteristics differ

#### What to Do Instead

See [JSON Column Handling](#json-column-handling) in the MySQL Equivalents section.

---

### 4. pg_catalog System Catalog Queries

#### What Was Removed

PostgreSQL system catalog queries using `pg_*` tables:

```sql
-- PostgreSQL system catalog queries (NOT supported in MySQL)

-- Check if table exists
SELECT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'users'
);

-- Check if type exists
SELECT EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'user_status'
);

-- Check if enum value exists
SELECT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'active'
);

-- Get column information
SELECT column_name, data_type, is_nullable
FROM pg_catalog.pg_attribute
WHERE attrelid = 'users'::regclass;

-- Check if index exists
SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_users_email'
);

-- Check if constraint exists
SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_users_institution'
);
```

#### Why It Was Removed

`pg_catalog` is PostgreSQL's system catalog schema. MySQL uses `information_schema` (which PostgreSQL also supports, but with different content and structure).

#### Impact on Migration

- **HIGH**: All existence checks must be rewritten
- Migration idempotency checks need different queries
- Some PostgreSQL metadata is not available in MySQL

#### What to Do Instead

See [Existence Checks Using information_schema](#existence-checks-using-information_schema) in the MySQL Equivalents section.

---

### 5. PostgreSQL-Specific Functions and Syntax

#### What Was Removed

Various PostgreSQL-specific functions and syntax:

```sql
-- PostgreSQL-specific functions (NOT supported in MySQL)

-- String functions
SELECT regexp_replace(name, '[^a-zA-Z]', '', 'g') FROM users;
SELECT string_agg(name, ', ') FROM users;

-- Date functions
SELECT age(birth_date) FROM users;
SELECT EXTRACT(EPOCH FROM created_at) FROM users;
SELECT created_at::date FROM users;

-- Array functions
SELECT array_agg(id) FROM users;
SELECT unnest(array[1,2,3]);

-- Type casting
SELECT '123'::integer;
SELECT 'true'::boolean;

-- Sequence functions
SELECT nextval('user_id_seq');
SELECT setval('user_id_seq', 1000);

-- Transaction control in functions
BEGIN;
    -- some operations
EXCEPTION WHEN OTHERS THEN
    -- error handling
END;
```

#### Why It Was Removed

These are PostgreSQL-specific functions with different MySQL equivalents or no direct equivalent.

#### Impact on Migration

- **MEDIUM**: Function calls must be converted
- Some operations require application-level implementation
- Complex queries may need restructuring

#### What to Do Instead

Refer to MySQL 8.0 function reference and convert on a case-by-case basis.

---

### 6. Advanced PostgreSQL Features

#### What Was Removed

Additional PostgreSQL features without MySQL equivalents:

```sql
-- Partial indexes (conditional indexes)
CREATE INDEX idx_active_users ON users (email) WHERE active = true;

-- Expression indexes (MySQL 8.0 has functional indexes with different syntax)
CREATE INDEX idx_lower_email ON users (LOWER(email));

-- EXCLUDE constraints for range overlaps
ALTER TABLE bookings ADD CONSTRAINT no_overlap
    EXCLUDE USING gist (room_id WITH =, time_range WITH &&);

-- Materialized views
CREATE MATERIALIZED VIEW user_stats AS
    SELECT institution_id, COUNT(*) as user_count
    FROM users GROUP BY institution_id;

-- LISTEN/NOTIFY for pub/sub
LISTEN channel_name;
NOTIFY channel_name, 'message';

-- Table inheritance
CREATE TABLE users_archive () INHERITS (users);

-- Composite types
CREATE TYPE address AS (street TEXT, city TEXT, zip TEXT);

-- Domains
CREATE DOMAIN email AS TEXT CHECK (VALUE ~ '^[^@]+@[^@]+\.[^@]+$');
```

#### Why They Were Removed

These are advanced PostgreSQL features without direct MySQL equivalents. Most require architectural changes or application-level implementation.

#### Impact on Migration

- **VARIABLE**: Depends on feature usage
- May require significant application redesign
- Some features can be approximated with workarounds

---

## MySQL Equivalents for Common Patterns

### Application-Level Filtering

#### Problem

MySQL doesn't support Row-Level Security policies.

#### Solution

Implement tenant isolation at the application level.

##### Pattern 1: Query Filtering

```python
# Python/SQLAlchemy example
from sqlalchemy.orm import Session
from sqlalchemy import event

# Method 1: Explicit filtering in queries
def get_students(session: Session, institution_id: int):
    return session.query(Student)\
        .filter(Student.institution_id == institution_id)\
        .all()

# Method 2: Global query filter using SQLAlchemy events
@event.listens_for(Session, "after_attach")
def receive_after_attach(session, instance):
    """Automatically add institution filter to queries"""
    if hasattr(instance, 'institution_id'):
        # Add filter based on current context
        current_institution_id = get_current_institution_id()
        if instance.institution_id != current_institution_id:
            raise SecurityError("Cross-tenant access denied")

# Method 3: Base query mixin
class TenantMixin:
    @classmethod
    def tenant_query(cls, session: Session, institution_id: int):
        return session.query(cls).filter(
            cls.institution_id == institution_id
        )

class Student(Base, TenantMixin):
    # ...
    pass

# Usage
students = Student.tenant_query(session, current_institution_id).all()
```

##### Pattern 2: Middleware/Interceptor

```python
# FastAPI dependency example
from fastapi import Depends, HTTPException

async def get_current_institution(
    current_user: User = Depends(get_current_user)
) -> int:
    return current_user.institution_id

def filter_by_tenant(
    query,
    institution_id: int = Depends(get_current_institution)
):
    """Automatically add tenant filter"""
    return query.filter_by(institution_id=institution_id)

# Usage in endpoint
@app.get("/students/")
async def list_students(
    session: Session = Depends(get_db),
    institution_id: int = Depends(get_current_institution)
):
    students = session.query(Student)\
        .filter(Student.institution_id == institution_id)\
        .all()
    return students
```

##### Pattern 3: Database Views with DEFINER

```sql
-- Create view that restricts access
CREATE DEFINER='app_user'@'localhost'
SQL SECURITY DEFINER
VIEW student_view AS
SELECT * FROM students
WHERE institution_id = CAST(SUBSTRING_INDEX(USER(), '@', 1) AS UNSIGNED);

-- Application accesses through view instead of table
SELECT * FROM student_view;
```

**Note**: This approach requires managing institution context through user names or session variables.

---

### UUID Storage and Generation

#### Problem

MySQL doesn't have a native UUID type.

#### Solution

Use CHAR(36) or BINARY(16) for storage, generate UUIDs in application code.

##### Option 1: CHAR(36) - Human Readable

```python
# Migration
def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('uuid', sa.CHAR(36), nullable=False, unique=True),
        sa.Column('external_uuid', sa.CHAR(36), nullable=True)
    )
    op.create_index('ix_users_uuid', 'users', ['uuid'])

# Application code
import uuid

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    uuid = Column(CHAR(36), nullable=False, unique=True)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.uuid:
            self.uuid = str(uuid.uuid4())

# Usage
new_user = User(name="John")
# new_user.uuid is automatically set to something like:
# '550e8400-e29b-41d4-a716-446655440000'
```

**Pros:**
- Human-readable in database
- Easy to debug
- Can be copied/pasted
- Standard UUID string format

**Cons:**
- 36 bytes storage (vs 16 for binary)
- Slower comparisons than binary
- Index size is larger

##### Option 2: BINARY(16) - Efficient Storage

```python
# Migration
def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('uuid', sa.LargeBinary(16), nullable=False, unique=True),
    )
    op.create_index('ix_users_uuid', 'users', ['uuid'])

# Application code
import uuid

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    uuid = Column(LargeBinary(16), nullable=False, unique=True)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.uuid:
            self.uuid = uuid.uuid4().bytes
    
    @property
    def uuid_str(self):
        """Get UUID as string"""
        return str(uuid.UUID(bytes=self.uuid))
    
    @uuid_str.setter
    def uuid_str(self, value):
        """Set UUID from string"""
        self.uuid = uuid.UUID(value).bytes

# Usage
new_user = User(name="John")
# new_user.uuid is 16 bytes
# new_user.uuid_str is '550e8400-e29b-41d4-a716-446655440000'

# Query by UUID string
target_uuid = uuid.UUID('550e8400-e29b-41d4-a716-446655440000')
user = session.query(User).filter(User.uuid == target_uuid.bytes).first()
```

**Pros:**
- 16 bytes storage (vs 36 for string)
- Faster comparisons
- Smaller indexes
- More efficient

**Cons:**
- Not human-readable in database
- Requires conversion for display
- Harder to debug

##### Option 3: MySQL 8.0 UUID Functions (Limited)

```sql
-- MySQL has UUID() function but it generates UUID v1
-- Not recommended for primary keys due to timestamp-based generation

-- In migration
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) DEFAULT (UUID())  -- MySQL 8.0.13+
);

-- However, UUID() generates version 1 (timestamp-based)
-- For version 4 (random), still use application code
```

**Recommendation**: Use BINARY(16) for production (efficiency) or CHAR(36) for development (debuggability).

---

### JSON Column Handling

#### Problem

MySQL doesn't support JSONB type or PostgreSQL JSONB operators.

#### Solution

Use MySQL JSON type with JSON functions.

##### Basic JSON Operations

```sql
-- Create table with JSON column
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attributes JSON,
    metadata JSON
);

-- Insert JSON data
INSERT INTO products (attributes) VALUES 
    ('{"color": "red", "size": "large", "specs": {"weight": 100}}');

-- PostgreSQL: attributes @> '{"color": "red"}'
-- MySQL equivalent:
SELECT * FROM products 
WHERE JSON_CONTAINS(attributes, '{"color": "red"}');

-- PostgreSQL: attributes -> 'specs' ->> 'weight'
-- MySQL equivalent:
SELECT JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.specs.weight')) as weight
FROM products;
-- Or shorter: attributes->>'$.specs.weight'

-- PostgreSQL: attributes ? 'color'
-- MySQL equivalent:
SELECT * FROM products 
WHERE JSON_CONTAINS_PATH(attributes, 'one', '$.color');

-- PostgreSQL: attributes ?| array['color', 'size']
-- MySQL equivalent:
SELECT * FROM products 
WHERE JSON_CONTAINS_PATH(attributes, 'one', '$.color', '$.size');

-- PostgreSQL: attributes ?& array['color', 'size']
-- MySQL equivalent:
SELECT * FROM products 
WHERE JSON_CONTAINS_PATH(attributes, 'all', '$.color', '$.size');
```

##### Migration Examples

```python
# Alembic migration with JSON column
def upgrade():
    op.create_table(
        'products',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('attributes', sa.JSON(), nullable=True),
        # Note: JSON columns cannot have default values in MySQL
        # sa.Column('metadata', sa.JSON(), server_default='{}')  # ✗ ERROR
        sa.Column('metadata', sa.JSON(), nullable=True)  # ✓ OK
    )
```

##### Indexing JSON Columns

MySQL cannot directly index JSON columns. Use generated/virtual columns:

```python
# Migration: Create generated column for indexing
def upgrade():
    # Create table with JSON
    op.create_table(
        'products',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('attributes', sa.JSON(), nullable=True)
    )
    
    # Add generated column for a frequently-queried JSON path
    op.execute("""
        ALTER TABLE products 
        ADD COLUMN color VARCHAR(50) AS (attributes->>'$.color') STORED
    """)
    
    # Index the generated column
    op.create_index('ix_products_color', 'products', ['color'])

# Query using the indexed generated column
# SELECT * FROM products WHERE color = 'red';
# This will use the index efficiently
```

##### JSON Function Reference

| PostgreSQL | MySQL | Notes |
|-----------|-------|-------|
| `data @> '{"a":1}'` | `JSON_CONTAINS(data, '{"a":1}')` | Containment check |
| `data -> 'key'` | `JSON_EXTRACT(data, '$.key')` or `data->'$.key'` | Get JSON object |
| `data ->> 'key'` | `JSON_UNQUOTE(JSON_EXTRACT(data, '$.key'))` or `data->>'$.key'` | Get as text |
| `data ? 'key'` | `JSON_CONTAINS_PATH(data, 'one', '$.key')` | Key exists |
| `data ?| array['a','b']` | `JSON_CONTAINS_PATH(data, 'one', '$.a', '$.b')` | Any key exists |
| `data ?& array['a','b']` | `JSON_CONTAINS_PATH(data, 'one', '$.a', '$.b')` | All keys exist |
| `jsonb_set(data, '{a}', '1')` | `JSON_SET(data, '$.a', 1)` | Set value |
| `data - 'key'` | `JSON_REMOVE(data, '$.key')` | Remove key |
| `jsonb_array_length(data)` | `JSON_LENGTH(data)` | Array length |
| `jsonb_each(data)` | No direct equivalent | Use JSON_TABLE() |

##### Application Code Example

```python
from sqlalchemy import func, text

# Query JSON in SQLAlchemy
products = session.query(Product).filter(
    func.json_contains(Product.attributes, '{"color": "red"}')
).all()

# Extract JSON value
products = session.query(
    Product.id,
    func.json_unquote(
        func.json_extract(Product.attributes, '$.color')
    ).label('color')
).all()

# Check if key exists
products = session.query(Product).filter(
    func.json_contains_path(Product.attributes, 'one', '$.color')
).all()
```

---

### Existence Checks Using information_schema

#### Problem

PostgreSQL pg_catalog queries don't work in MySQL.

#### Solution

Use information_schema with MySQL-specific queries.

##### Check if Table Exists

```python
# PostgreSQL (removed)
result = conn.execute(
    "SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users')"
).scalar()

# MySQL equivalent
conn = op.get_bind()
db_name = conn.execute(sa.text("SELECT DATABASE()")).scalar()

result = conn.execute(
    sa.text("""
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = :db_name 
        AND table_name = :table_name
    """),
    {"db_name": db_name, "table_name": "users"}
).scalar()

if result > 0:
    print("Table exists")
```

##### Check if Column Exists

```python
# PostgreSQL (removed)
result = conn.execute(
    """
    SELECT EXISTS (
        SELECT 1 FROM pg_attribute 
        WHERE attrelid = 'users'::regclass 
        AND attname = 'email'
    )
    """
).scalar()

# MySQL equivalent
result = conn.execute(
    sa.text("""
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = :db_name 
        AND table_name = :table_name 
        AND column_name = :column_name
    """),
    {"db_name": db_name, "table_name": "users", "column_name": "email"}
).scalar()

if result > 0:
    print("Column exists")
```

##### Check if Index Exists

```python
# PostgreSQL (removed)
result = conn.execute(
    "SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email')"
).scalar()

# MySQL equivalent
result = conn.execute(
    sa.text("""
        SELECT COUNT(*) 
        FROM information_schema.statistics 
        WHERE table_schema = :db_name 
        AND index_name = :index_name
    """),
    {"db_name": db_name, "index_name": "idx_users_email"}
).scalar()

if result > 0:
    print("Index exists")
```

##### Check if Foreign Key Exists

```python
# PostgreSQL (removed)
result = conn.execute(
    """
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_students_institution'
    )
    """
).scalar()

# MySQL equivalent
result = conn.execute(
    sa.text("""
        SELECT COUNT(*) 
        FROM information_schema.table_constraints 
        WHERE constraint_schema = :db_name 
        AND constraint_name = :constraint_name
        AND constraint_type = 'FOREIGN KEY'
    """),
    {"db_name": db_name, "constraint_name": "fk_students_institution"}
).scalar()

if result > 0:
    print("Foreign key exists")
```

##### Check if ENUM Value Exists (MySQL approach)

```python
# PostgreSQL (removed)
result = conn.execute(
    "SELECT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'active')"
).scalar()

# MySQL equivalent - Check column type definition
result = conn.execute(
    sa.text("""
        SELECT column_type 
        FROM information_schema.columns 
        WHERE table_schema = :db_name 
        AND table_name = :table_name 
        AND column_name = :column_name
    """),
    {"db_name": db_name, "table_name": "users", "column_name": "status"}
).scalar()

# Result will be like: "enum('active','inactive','pending')"
if result and 'active' in result:
    print("ENUM value exists")
```

##### Complete Existence Check Helper

```python
# Reusable helper for migrations
def table_exists(conn, table_name: str) -> bool:
    """Check if table exists"""
    db_name = conn.execute(sa.text("SELECT DATABASE()")).scalar()
    result = conn.execute(
        sa.text("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = :db_name AND table_name = :table_name
        """),
        {"db_name": db_name, "table_name": table_name}
    ).scalar()
    return result > 0

def column_exists(conn, table_name: str, column_name: str) -> bool:
    """Check if column exists"""
    db_name = conn.execute(sa.text("SELECT DATABASE()")).scalar()
    result = conn.execute(
        sa.text("""
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_schema = :db_name 
            AND table_name = :table_name 
            AND column_name = :column_name
        """),
        {"db_name": db_name, "table_name": table_name, "column_name": column_name}
    ).scalar()
    return result > 0

def index_exists(conn, index_name: str) -> bool:
    """Check if index exists"""
    db_name = conn.execute(sa.text("SELECT DATABASE()")).scalar()
    result = conn.execute(
        sa.text("""
            SELECT COUNT(*) FROM information_schema.statistics 
            WHERE table_schema = :db_name AND index_name = :index_name
        """),
        {"db_name": db_name, "index_name": index_name}
    ).scalar()
    return result > 0

def constraint_exists(conn, constraint_name: str, constraint_type: str) -> bool:
    """Check if constraint exists. Type: 'FOREIGN KEY', 'UNIQUE', 'CHECK', 'PRIMARY KEY'"""
    db_name = conn.execute(sa.text("SELECT DATABASE()")).scalar()
    result = conn.execute(
        sa.text("""
            SELECT COUNT(*) FROM information_schema.table_constraints 
            WHERE constraint_schema = :db_name 
            AND constraint_name = :constraint_name
            AND constraint_type = :constraint_type
        """),
        {"db_name": db_name, "constraint_name": constraint_name, "constraint_type": constraint_type}
    ).scalar()
    return result > 0

# Usage in migration
def upgrade():
    conn = op.get_bind()
    
    if not table_exists(conn, 'users'):
        op.create_table('users', ...)
    
    if not column_exists(conn, 'users', 'email'):
        op.add_column('users', sa.Column('email', sa.String(255)))
    
    if not index_exists(conn, 'ix_users_email'):
        op.create_index('ix_users_email', 'users', ['email'])
```

---

### ENUM Type Handling

#### Problem

PostgreSQL and MySQL handle ENUMs differently. MySQL ENUMs are harder to modify.

#### Solution

Use VARCHAR with CHECK constraints for flexibility, or use MySQL native ENUMs with caution.

##### Option 1: VARCHAR + CHECK Constraint (Recommended)

```python
# Migration
def upgrade():
    conn = op.get_bind()
    db_name = conn.execute(sa.text("SELECT DATABASE()")).scalar()
    
    # Create table with VARCHAR instead of ENUM
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.CheckConstraint(
            "status IN ('pending', 'active', 'inactive', 'suspended')",
            name='ck_users_status'
        )
    )

# To add a new status value later (easy with CHECK constraints)
def upgrade():
    conn = op.get_bind()
    
    # Drop old constraint
    op.drop_constraint('ck_users_status', 'users', type_='check')
    
    # Create new constraint with additional value
    op.create_check_constraint(
        'ck_users_status',
        'users',
        "status IN ('pending', 'active', 'inactive', 'suspended', 'archived')"
    )

def downgrade():
    # Remove the new value from data first
    conn = op.get_bind()
    conn.execute(sa.text(
        "UPDATE users SET status = 'inactive' WHERE status = 'archived'"
    ))
    
    # Update constraint
    op.drop_constraint('ck_users_status', 'users', type_='check')
    op.create_check_constraint(
        'ck_users_status',
        'users',
        "status IN ('pending', 'active', 'inactive', 'suspended')"
    )
```

**Pros:**
- Easy to add/remove values
- No table rebuild required
- Better for evolving schemas
- Standard SQL

**Cons:**
- Slightly larger storage than ENUM
- No ordering guarantees
- Application must maintain valid values

##### Option 2: MySQL Native ENUM (Use with Caution)

```python
# Migration
def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('status', 
                  sa.Enum('pending', 'active', 'inactive', 'suspended', 
                          name='user_status_enum'),
                  nullable=False, 
                  server_default='pending')
    )

# To add a new ENUM value (requires table alteration)
def upgrade():
    # MySQL doesn't support "ADD VALUE IF NOT EXISTS" like PostgreSQL
    # Must rebuild the column definition
    op.execute("""
        ALTER TABLE users 
        MODIFY COLUMN status 
        ENUM('pending', 'active', 'inactive', 'suspended', 'archived') 
        NOT NULL DEFAULT 'pending'
    """)

def downgrade():
    # Remove data with new value first
    op.execute("UPDATE users SET status = 'inactive' WHERE status = 'archived'")
    
    # Modify column back to old ENUM
    op.execute("""
        ALTER TABLE users 
        MODIFY COLUMN status 
        ENUM('pending', 'active', 'inactive', 'suspended') 
        NOT NULL DEFAULT 'pending'
    """)
```

**Pros:**
- More efficient storage (stored as integers)
- Enforced at database level
- Sorted by definition order

**Cons:**
- Hard to modify (requires ALTER TABLE)
- Table lock during modification
- Removing values is complex
- Maximum 65,535 values

##### Checking ENUM Values

```python
def get_enum_values(conn, table_name: str, column_name: str) -> list:
    """Get current ENUM values for a column"""
    db_name = conn.execute(sa.text("SELECT DATABASE()")).scalar()
    
    result = conn.execute(
        sa.text("""
            SELECT column_type 
            FROM information_schema.columns 
            WHERE table_schema = :db_name 
            AND table_name = :table_name 
            AND column_name = :column_name
        """),
        {"db_name": db_name, "table_name": table_name, "column_name": column_name}
    ).scalar()
    
    # Parse "enum('value1','value2','value3')"
    if result and result.startswith('enum('):
        enum_str = result[5:-1]  # Remove "enum(" and ")"
        values = [v.strip("'") for v in enum_str.split(',')]
        return values
    
    return []

# Usage
def upgrade():
    conn = op.get_bind()
    current_values = get_enum_values(conn, 'users', 'status')
    
    if 'archived' not in current_values:
        # Add new value
        new_values = current_values + ['archived']
        values_str = ','.join(f"'{v}'" for v in new_values)
        
        op.execute(f"""
            ALTER TABLE users 
            MODIFY COLUMN status ENUM({values_str}) NOT NULL DEFAULT 'pending'
        """)
```

---

## Migration Best Practices

### 1. Always Use Existence Checks

Make migrations idempotent by checking if objects exist before creating them:

```python
def upgrade():
    conn = op.get_bind()
    db_name = conn.execute(sa.text("SELECT DATABASE()")).scalar()
    
    # Check before creating table
    if not table_exists(conn, 'new_table'):
        op.create_table('new_table', ...)
    
    # Check before adding column
    if not column_exists(conn, 'users', 'new_column'):
        op.add_column('users', sa.Column('new_column', sa.String(100)))
    
    # Check before creating index
    if not index_exists(conn, 'ix_users_email'):
        op.create_index('ix_users_email', 'users', ['email'])
```

### 2. Handle Character Sets Properly

Always use utf8mb4 for full Unicode support:

```python
def upgrade():
    # Specify character set in table creation
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
```

Database connection string should include charset:
```
mysql+pymysql://user:pass@localhost:3306/dbname?charset=utf8mb4
```

### 3. Be Careful with TEXT Column Defaults

MySQL does not allow default values for TEXT/BLOB columns:

```python
# ✗ WRONG - Will fail
op.add_column('users', 
    sa.Column('bio', sa.Text(), nullable=False, server_default='')
)

# ✓ CORRECT - Make nullable or populate after adding
op.add_column('users', 
    sa.Column('bio', sa.Text(), nullable=True)
)

# Or add as nullable, populate, then make NOT NULL
op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))
conn.execute(sa.text("UPDATE users SET bio = '' WHERE bio IS NULL"))
op.alter_column('users', 'bio', nullable=False)
```

### 4. Use Numeric Defaults for Boolean Columns

MySQL represents Boolean as TINYINT(1) and requires numeric defaults:

```python
# ✗ WRONG - String boolean defaults will fail
op.add_column('users', 
    sa.Column('is_active', sa.Boolean(), server_default='true')
)
op.add_column('users', 
    sa.Column('is_verified', sa.Boolean(), server_default=sa.text('false'))
)

# ✓ CORRECT - Use numeric defaults with sa.text()
op.add_column('users', 
    sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1'))
)
op.add_column('users', 
    sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('0'))
)

# ✓ ALSO CORRECT - Python bool for application-level default
op.add_column('users', 
    sa.Column('is_active', sa.Boolean(), nullable=False, default=True)
)

# ✓ BEST PRACTICE - Both server and application defaults
op.add_column('users', 
    sa.Column('is_active', sa.Boolean(), nullable=False, 
              default=True, server_default=sa.text('1'))
)
```

**Validation Tool**: Use `make validate-migrations` to automatically check for Boolean column issues:
```bash
# Validate all migrations
make validate-migrations

# Validate with verbose output
make validate-migrations-verbose

# Or directly
poetry run python scripts/validate_migrations.py
```

See [scripts/MIGRATION_VALIDATION_README.md](../scripts/MIGRATION_VALIDATION_README.md) for details.

### 5. Index Long Columns with Prefix Length

MySQL has index key length limits:

```python
# ✗ May fail if text is too long
op.create_index('ix_users_bio', 'users', ['bio'])

# ✓ Use prefix length for long text columns
op.execute("CREATE INDEX ix_users_bio ON users(bio(191))")

# ✓ Or use generated column for full-text search
op.execute("""
    ALTER TABLE users 
    ADD COLUMN bio_prefix VARCHAR(191) AS (LEFT(bio, 191)) STORED
""")
op.create_index('ix_users_bio_prefix', 'users', ['bio_prefix'])
```

### 5. Create Parent Tables Before Child Tables

Foreign keys require parent table to exist:

```python
def upgrade():
    # ✓ CORRECT ORDER
    # Create parent first
    op.create_table('institutions', ...)
    
    # Then create child with foreign key
    op.create_table(
        'users',
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'])
    )

# ✗ WRONG ORDER - Will fail
# op.create_table('users', ..., ForeignKey to institutions)
# op.create_table('institutions', ...)  # Too late!
```

### 6. Test Both Upgrade and Downgrade

Always implement and test downgrade:

```python
def upgrade():
    op.create_table('new_table', ...)
    op.add_column('users', sa.Column('new_col', sa.String(100)))
    op.create_index('ix_users_new_col', 'users', ['new_col'])

def downgrade():
    # Reverse in opposite order
    op.drop_index('ix_users_new_col', 'users')
    op.drop_column('users', 'new_col')
    op.drop_table('new_table')
```

Test the cycle:
```bash
alembic upgrade head
alembic downgrade -1
alembic upgrade +1
```

### 7. Document MySQL-Specific Behaviors

Add comments for non-obvious MySQL behaviors:

```python
def upgrade():
    # Note: MySQL ENUM requires table rebuild to modify values
    # Consider using VARCHAR + CHECK constraint for flexibility
    op.create_table(
        'users',
        sa.Column('status', sa.Enum('active', 'inactive', name='user_status'))
    )
    
    # Note: JSON columns cannot have default values in MySQL
    op.add_column('users', sa.Column('metadata', sa.JSON(), nullable=True))
    
    # Note: Using prefix length due to MySQL index size limits
    op.execute("CREATE INDEX ix_users_bio ON users(bio(191))")
```

---

## Troubleshooting Common Migration Errors

### Error: "Specified key was too long"

#### Error Message

```
sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError) 
(1071, 'Specified key was too long; max key length is 3072 bytes')
```

#### Cause

MySQL has index key length limits:
- Default: 767 bytes (InnoDB without large prefix)
- With `innodb_large_prefix`: 3072 bytes
- For utf8mb4: 191 characters (767/4) or 768 characters (3072/4)

#### Solution

```python
# ✗ Problem: Indexing long VARCHAR or TEXT
op.create_index('ix_users_description', 'users', ['description'])

# ✓ Solution 1: Use prefix length
op.execute("CREATE INDEX ix_users_description ON users(description(191))")

# ✓ Solution 2: Reduce column size
op.create_table(
    'users',
    sa.Column('email', sa.String(191), nullable=False)  # Instead of 255
)

# ✓ Solution 3: Use generated column for long fields
op.execute("""
    ALTER TABLE users 
    ADD COLUMN description_short VARCHAR(191) 
    AS (LEFT(description, 191)) STORED
""")
op.create_index('ix_users_description', 'users', ['description_short'])
```

#### Prevention

- Keep indexed VARCHAR columns under 191 characters
- Use prefix indexes for TEXT columns
- Consider composite index total length

---

### Error: "BLOB/TEXT column can't have a default value"

#### Error Message

```
sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError) 
(1101, "BLOB/TEXT column 'description' can't have a default value")
```

#### Cause

MySQL does not allow default values for TEXT, BLOB, MEDIUMTEXT, LONGTEXT, or JSON columns.

#### Solution

```python
# ✗ Problem: TEXT column with default
op.add_column('users', 
    sa.Column('bio', sa.Text(), nullable=False, server_default='')
)

# ✓ Solution 1: Make nullable (recommended)
op.add_column('users', 
    sa.Column('bio', sa.Text(), nullable=True)
)

# ✓ Solution 2: Add nullable, populate, then make NOT NULL
def upgrade():
    # Add as nullable
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))
    
    # Populate existing rows
    conn = op.get_bind()
    conn.execute(sa.text("UPDATE users SET bio = '' WHERE bio IS NULL"))
    
    # Make NOT NULL (requires full column definition in MySQL)
    op.alter_column('users', 'bio', nullable=False, existing_type=sa.Text())

# ✓ Solution 3: Use VARCHAR if content is short enough
op.add_column('users', 
    sa.Column('bio', sa.String(1000), nullable=False, server_default='')
)
```

#### Prevention

- Never use `server_default` with TEXT/BLOB/JSON columns
- Make TEXT columns nullable or handle defaults in application
- Use VARCHAR for short text with defaults

---

### Error: "Cannot add foreign key constraint"

#### Error Message

```
sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError) 
(1215, 'Cannot add foreign key constraint')
```

#### Cause

Multiple possible causes:
1. Parent table doesn't exist
2. Referenced column doesn't exist
3. Data types don't match
4. Referenced column is not indexed
5. Orphaned records exist
6. Character set/collation mismatch

#### Solution

```python
# Check 1: Parent table exists
def upgrade():
    conn = op.get_bind()
    
    # Create parent first
    if not table_exists(conn, 'institutions'):
        op.create_table('institutions', ...)
    
    # Then create child
    op.create_table(
        'users',
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'])
    )

# Check 2: Data types match exactly
# ✗ Wrong: Integer vs BigInteger mismatch
# institutions.id = sa.BigInteger()
# users.institution_id = sa.Integer()  # Mismatch!

# ✓ Correct: Same types
# institutions.id = sa.Integer()
# users.institution_id = sa.Integer()

# Check 3: No orphaned records
def upgrade():
    conn = op.get_bind()
    
    # Check for orphaned records
    orphans = conn.execute(sa.text("""
        SELECT COUNT(*) FROM users 
        WHERE institution_id NOT IN (SELECT id FROM institutions)
    """)).scalar()
    
    if orphans > 0:
        # Fix orphaned records
        conn.execute(sa.text("""
            DELETE FROM users 
            WHERE institution_id NOT IN (SELECT id FROM institutions)
        """))
        # Or update to a valid ID
        # conn.execute(sa.text("UPDATE users SET institution_id = 1 WHERE ..."))
    
    # Now add foreign key
    op.create_foreign_key(
        'fk_users_institution',
        'users', 'institutions',
        ['institution_id'], ['id']
    )

# Check 4: Referenced column is indexed
# MySQL automatically creates index if needed, but explicit is better
op.create_index('ix_users_institution_id', 'users', ['institution_id'])
```

#### Diagnostic Query

```python
# Check why FK creation fails
def check_fk_issues(conn, child_table, parent_table, child_col, parent_col):
    """Diagnose foreign key constraint issues"""
    
    # Check parent table exists
    if not table_exists(conn, parent_table):
        print(f"ERROR: Parent table {parent_table} doesn't exist")
        return
    
    # Check data types match
    child_type = conn.execute(sa.text(f"""
        SELECT data_type, column_type 
        FROM information_schema.columns 
        WHERE table_schema = DATABASE()
        AND table_name = '{child_table}' 
        AND column_name = '{child_col}'
    """)).fetchone()
    
    parent_type = conn.execute(sa.text(f"""
        SELECT data_type, column_type 
        FROM information_schema.columns 
        WHERE table_schema = DATABASE()
        AND table_name = '{parent_table}' 
        AND column_name = '{parent_col}'
    """)).fetchone()
    
    if child_type != parent_type:
        print(f"ERROR: Type mismatch - {child_col}: {child_type} vs {parent_col}: {parent_type}")
    
    # Check for orphaned records
    orphans = conn.execute(sa.text(f"""
        SELECT COUNT(*) FROM {child_table} 
        WHERE {child_col} NOT IN (SELECT {parent_col} FROM {parent_table})
    """)).scalar()
    
    if orphans > 0:
        print(f"ERROR: {orphans} orphaned records in {child_table}.{child_col}")
```

#### Prevention

- Create parent tables before child tables
- Ensure data types match exactly
- Clean up orphaned records before adding FKs
- Use existence checks in migrations

---

### Error: "Duplicate entry" when adding unique constraint

#### Error Message

```
sqlalchemy.exc.IntegrityError: (pymysql.err.IntegrityError) 
(1062, "Duplicate entry 'value' for key 'unique_constraint_name'")
```

#### Cause

Attempting to add UNIQUE constraint when duplicate data exists.

#### Solution

```python
def upgrade():
    conn = op.get_bind()
    
    # Check for duplicates first
    duplicates = conn.execute(sa.text("""
        SELECT institution_id, email, COUNT(*) as cnt
        FROM users 
        GROUP BY institution_id, email 
        HAVING COUNT(*) > 1
    """)).fetchall()
    
    if duplicates:
        print(f"Found {len(duplicates)} duplicate records")
        
        # Option 1: Fail fast and require manual cleanup
        raise Exception(f"Cannot add unique constraint - {len(duplicates)} duplicates exist")
        
        # Option 2: Automatically clean up duplicates (careful!)
        for dup in duplicates:
            # Keep first record, delete others
            conn.execute(sa.text("""
                DELETE FROM users 
                WHERE institution_id = :inst_id AND email = :email
                AND id NOT IN (
                    SELECT * FROM (
                        SELECT MIN(id) FROM users 
                        WHERE institution_id = :inst_id AND email = :email
                    ) as temp
                )
            """), {"inst_id": dup.institution_id, "email": dup.email})
        
        print(f"Cleaned up {len(duplicates)} duplicate records")
    
    # Now add unique constraint
    op.create_unique_constraint(
        'uq_users_institution_email',
        'users',
        ['institution_id', 'email']
    )
```

#### Prevention

- Check for duplicates before adding UNIQUE constraints
- Add data validation in application before migration
- Consider soft deletes instead of hard deletes to preserve history

---

### Error: "Lock wait timeout exceeded"

#### Error Message

```
sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError) 
(1205, 'Lock wait timeout exceeded; try restarting transaction')
```

#### Cause

Migration is waiting for locks on tables being used by other connections.

#### Solution

```bash
# Solution 1: Run migration during maintenance window
# Stop application servers first
# Then run migration
alembic upgrade head

# Solution 2: Kill blocking connections (production - careful!)
mysql> SHOW PROCESSLIST;
mysql> KILL <process_id>;

# Solution 3: Increase lock wait timeout temporarily
mysql> SET GLOBAL innodb_lock_wait_timeout = 300;  # 5 minutes

# Solution 4: Use pt-online-schema-change for large tables
pt-online-schema-change \
  --alter "ADD COLUMN new_col VARCHAR(100)" \
  D=mydb,t=large_table \
  --execute
```

#### Prevention

- Run migrations during low-traffic periods
- Use maintenance windows for schema changes
- For large tables, consider online schema change tools
- Test migrations on production copy first

---

### Error: "Invalid use of NULL value"

#### Error Message

```
sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError) 
(1048, "Column 'column_name' cannot be null")
```

#### Cause

Trying to insert NULL into NOT NULL column, or making column NOT NULL when NULLs exist.

#### Solution

```python
def upgrade():
    conn = op.get_bind()
    
    # Check for NULL values before making column NOT NULL
    null_count = conn.execute(sa.text("""
        SELECT COUNT(*) FROM users WHERE email IS NULL
    """)).scalar()
    
    if null_count > 0:
        # Option 1: Populate NULLs with default value
        conn.execute(sa.text("""
            UPDATE users 
            SET email = CONCAT('user_', id, '@example.com') 
            WHERE email IS NULL
        """))
        
        # Option 2: Delete rows with NULLs (careful!)
        # conn.execute(sa.text("DELETE FROM users WHERE email IS NULL"))
        
        # Option 3: Fail and require manual intervention
        # raise Exception(f"{null_count} NULL values exist in email column")
    
    # Now safe to make NOT NULL
    op.alter_column('users', 'email', 
                   nullable=False, 
                   existing_type=sa.String(255))
```

#### Prevention

- Always check for NULLs before making columns NOT NULL
- Populate default values first
- Add NOT NULL to new columns from the start

---

### Error: "Table doesn't exist" during downgrade

#### Error Message

```
sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError) 
(1051, "Unknown table 'database_name.table_name'")
```

#### Cause

Downgrade function tries to drop table that doesn't exist (migration already rolled back).

#### Solution

```python
def downgrade():
    conn = op.get_bind()
    
    # Check if table exists before dropping
    if table_exists(conn, 'my_table'):
        op.drop_table('my_table')
    else:
        print("Table my_table doesn't exist, skipping drop")
    
    # Same for indexes
    if index_exists(conn, 'ix_my_table_column'):
        op.drop_index('ix_my_table_column', 'my_table')
    
    # Same for constraints
    if constraint_exists(conn, 'fk_my_table_parent', 'FOREIGN KEY'):
        op.drop_constraint('fk_my_table_parent', 'my_table', type_='foreignkey')
```

#### Prevention

- Always use existence checks in downgrade functions
- Test downgrade paths thoroughly
- Make migrations idempotent

---

## Performance Considerations

### Index Selection

MySQL uses different index types:

```python
# B-Tree index (default, most common)
op.create_index('ix_users_email', 'users', ['email'])

# Full-text index for text search
op.execute("CREATE FULLTEXT INDEX ft_users_bio ON users(bio)")

# Spatial index for geographic data
# op.execute("CREATE SPATIAL INDEX sp_locations_point ON locations(point)")
```

### Composite Index Order

Order matters for MySQL indexes:

```python
# Good: Queries can use this for:
# WHERE institution_id = ? AND status = ?
# WHERE institution_id = ?
op.create_index('ix_users_inst_status', 'users', 
               ['institution_id', 'status'])

# Bad: Can't efficiently use for WHERE status = ?
# Because institution_id is first in index
```

### Covering Indexes

Include frequently-accessed columns in index:

```python
# Query: SELECT id, name, email FROM users WHERE institution_id = ?
# Index can serve entire query without accessing table
op.execute("""
    CREATE INDEX ix_users_covering 
    ON users(institution_id, id, name, email)
""")
```

### Index Statistics

Keep statistics updated:

```bash
# Analyze table after large data changes
mysql> ANALYZE TABLE users;
mysql> OPTIMIZE TABLE users;
```

---

## Testing Your Migration

### Local Testing

```bash
# 1. Create test database
mysql -u root -p -e "CREATE DATABASE test_migration CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# 2. Set database URL
export DATABASE_URL="mysql+pymysql://root:password@localhost:3306/test_migration?charset=utf8mb4"

# 3. Run migration
alembic upgrade head

# 4. Verify schema
mysql -u root -p test_migration -e "SHOW TABLES"
mysql -u root -p test_migration -e "SHOW CREATE TABLE users\G"

# 5. Test downgrade
alembic downgrade base

# 6. Test upgrade again
alembic upgrade head
```

### Automated Testing

```python
# tests/test_migrations.py
def test_migration_cycle():
    """Test upgrade and downgrade cycle"""
    # Clean database
    alembic.command.downgrade(alembic_cfg, "base")
    
    # Upgrade to head
    alembic.command.upgrade(alembic_cfg, "head")
    
    # Verify tables exist
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert 'users' in tables
    assert 'institutions' in tables
    
    # Verify indexes
    indexes = inspector.get_indexes('users')
    index_names = [idx['name'] for idx in indexes]
    assert 'ix_users_email' in index_names
    
    # Verify foreign keys
    fks = inspector.get_foreign_keys('users')
    assert len(fks) > 0
    
    # Test downgrade
    alembic.command.downgrade(alembic_cfg, "base")
    
    # Verify tables removed
    tables = inspector.get_table_names()
    assert 'users' not in tables
```

### Comprehensive Test

Use the provided comprehensive test script:

```bash
# Run comprehensive MySQL migration test
python scripts/test_mysql_migrations_comprehensive.py

# Check results
cat backups/migration_test/mysql_migration_test_report.md
```

See [MYSQL_MIGRATION_QUICK_START.md](MYSQL_MIGRATION_QUICK_START.md) for detailed testing instructions.

---

## Additional Resources

### Documentation

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
- [SQLAlchemy MySQL Dialect](https://docs.sqlalchemy.org/en/14/dialects/mysql.html)
- [Main Alembic README](README.md)
- [MySQL Migration Quick Start](MYSQL_MIGRATION_QUICK_START.md)

### Migration Templates

- [TEMPLATE_autogenerated_migration.py](versions/TEMPLATE_autogenerated_migration.py) - Comprehensive migration template with MySQL best practices

### Helper Scripts

- `scripts/test_mysql_migrations_comprehensive.py` - Comprehensive migration testing
- `scripts/migration_test/` - Additional testing utilities

---

**Last Updated**: 2024-01-20  
**Maintained By**: Development Team  
**Version**: MySQL 8.0+

For questions or issues, refer to the [Troubleshooting](#troubleshooting-common-migration-errors) section or contact the development team.
