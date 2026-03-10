#!/usr/bin/env python
"""
Celery worker for background tasks
Run with: celery -A worker.celery_app worker --loglevel=info
"""
from src.celery_app import celery_app

if __name__ == '__main__':
    celery_app.start()
