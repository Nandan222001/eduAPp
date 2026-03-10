#!/usr/bin/env python
"""
Celery beat scheduler for periodic tasks
Run with: celery -A beat.celery_app beat --loglevel=info
"""
from src.celery_app import celery_app

if __name__ == '__main__':
    celery_app.start()
