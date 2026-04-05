from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class FacultyBase(BaseModel):
    name: str
    email: EmailStr
    department: Optional[str] = "CSE"

class FacultyCreate(FacultyBase):
    password: str

class FacultyLogin(BaseModel):
    email: EmailStr
    password: str

class FacultyResponse(FacultyBase):
    id: str
    created_at: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    faculty_name: str
    faculty_id: str