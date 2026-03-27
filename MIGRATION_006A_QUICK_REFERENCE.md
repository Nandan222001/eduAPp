# Migration 006a Quick Reference Card

## 🎯 What You Need to Know

**Migration 006a** creates 3 tables for Previous Year Papers functionality:
- `previous_year_papers` - Exam paper storage
- `questions_bank` - Individual questions ⭐
- `topic_predictions` - AI-based topic predictions

---

## ⚡ Quick Commands

### Check Status
```bash
alembic current
```
✓ Should show `006a` or later if complete

### Run Migration
```bash
alembic upgrade 006a
```

### Check Table Exists (MySQL)
```sql
SHOW TABLES LIKE 'questions_bank';
```

### Full Diagnostic
```bash
mysql -u mysql -p mysql_db < check_migration_006a.sql
```

---

## 🔥 Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Connection error | Check MySQL is running, verify .env credentials |
| Version < 006a | Run `alembic upgrade 006a` |
| Some tables missing | `alembic downgrade 006` then `alembic upgrade 006a` |
| Tables exist, wrong version | `alembic stamp 006a` |
| alembic command not found | Activate virtual environment |

---

## 📁 Documentation Files

| File | When to Use |
|------|-------------|
| `MIGRATION_006A_INDEX.md` | Find any specific information |
| `MIGRATION_006A_CHECK_README.md` | Step-by-step guide (START HERE) |
| `MIGRATION_006A_FLOWCHART.md` | Visual decision-making |
| `MIGRATION_006A_DIAGNOSTIC_REPORT.md` | Technical deep-dive |
| `run_migration_006a_diagnostic.ps1` | Interactive guidance |

---

## 🚦 Decision Tree (30 Second Version)

```
Can you run: alembic current
│
├─ NO → Fix connectivity or use check_migration_006a.sql
│
└─ YES → What version?
    │
    ├─ >= 006a → ✓ DONE
    │
    └─ < 006a → Run: alembic upgrade 006a
```

---

## ✅ Success Criteria

Migration 006a is complete when:
- [x] `alembic current` shows `006a` or later
- [x] `previous_year_papers` table exists
- [x] `questions_bank` table exists
- [x] `topic_predictions` table exists

---

## 🆘 Emergency Contacts

- **Full docs:** See `MIGRATION_006A_INDEX.md`
- **Troubleshooting:** See `MIGRATION_006A_CHECK_README.md` section on troubleshooting
- **Flowchart:** See `MIGRATION_006A_FLOWCHART.md` for detailed paths
- **Migration file:** `alembic/versions/006a_create_previous_year_papers_tables.py`

---

## 🔧 Database Configuration (.env)

```
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=mysql
DATABASE_PASSWORD=mysql_password
DATABASE_NAME=mysql_db
```

---

**Need more info?** Start with `MIGRATION_006A_CHECK_README.md`
