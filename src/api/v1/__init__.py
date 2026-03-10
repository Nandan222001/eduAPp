from fastapi import APIRouter
from src.api.v1 import (
    users, 
    auth, 
    subscriptions, 
    webhooks, 
    institutions, 
    academic_years, 
    grades, 
    sections, 
    subjects, 
    teachers, 
    students, 
    profile
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(institutions.router, prefix="/institutions", tags=["institutions"])
api_router.include_router(academic_years.router, prefix="/academic-years", tags=["academic-years"])
api_router.include_router(grades.router, prefix="/grades", tags=["grades"])
api_router.include_router(sections.router, prefix="/sections", tags=["sections"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["subjects"])
api_router.include_router(teachers.router, prefix="/teachers", tags=["teachers"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
