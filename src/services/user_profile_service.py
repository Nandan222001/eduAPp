from typing import Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from src.models.user import User
from src.models.teacher import Teacher
from src.models.student import Student
from src.schemas.user import UserUpdate


class UserProfileService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_profile(self, user_id: int) -> Optional[dict]:
        user = self.db.query(User).options(
            joinedload(User.institution),
            joinedload(User.role),
            joinedload(User.teacher_profile),
            joinedload(User.student_profile)
        ).filter(User.id == user_id).first()
        
        if not user:
            return None
        
        profile = {
            "id": user.id,
            "institution_id": user.institution_id,
            "role_id": user.role_id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "email_verified": user.email_verified,
            "last_login": user.last_login,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "institution": {
                "id": user.institution.id,
                "name": user.institution.name,
                "slug": user.institution.slug,
            } if user.institution else None,
            "role": {
                "id": user.role.id,
                "name": user.role.name,
                "slug": user.role.slug,
            } if user.role else None,
        }
        
        if user.teacher_profile:
            teacher = user.teacher_profile
            profile["teacher_profile"] = {
                "id": teacher.id,
                "employee_id": teacher.employee_id,
                "first_name": teacher.first_name,
                "last_name": teacher.last_name,
                "email": teacher.email,
                "phone": teacher.phone,
                "date_of_birth": teacher.date_of_birth,
                "gender": teacher.gender,
                "address": teacher.address,
                "qualification": teacher.qualification,
                "specialization": teacher.specialization,
                "joining_date": teacher.joining_date,
                "is_active": teacher.is_active,
            }
        
        if user.student_profile:
            student = user.student_profile
            profile["student_profile"] = {
                "id": student.id,
                "admission_number": student.admission_number,
                "roll_number": student.roll_number,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "email": student.email,
                "phone": student.phone,
                "date_of_birth": student.date_of_birth,
                "gender": student.gender,
                "blood_group": student.blood_group,
                "address": student.address,
                "parent_name": student.parent_name,
                "parent_email": student.parent_email,
                "parent_phone": student.parent_phone,
                "admission_date": student.admission_date,
                "section_id": student.section_id,
                "is_active": student.is_active,
            }
        
        return profile

    def update_user_profile(self, user_id: int, data: UserUpdate) -> Optional[User]:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        
        if 'email' in update_data:
            existing = self.db.query(User).filter(
                User.institution_id == user.institution_id,
                User.email == update_data['email'],
                User.id != user_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this email already exists"
                )
        
        if 'username' in update_data:
            existing = self.db.query(User).filter(
                User.institution_id == user.institution_id,
                User.username == update_data['username'],
                User.id != user_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this username already exists"
                )
        
        if 'password' in update_data:
            from src.utils.security import get_password_hash
            update_data['hashed_password'] = get_password_hash(update_data.pop('password'))
        
        for key, value in update_data.items():
            setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user
