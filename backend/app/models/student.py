from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class StudentBase(BaseModel):
    name: str
    roll_number: str
    email: Optional[str] = None
    division: Optional[str] = "B"
    year: Optional[str] = "SY"

class StudentCreate(StudentBase):
    pass

class StudentEnroll(BaseModel):
    photos: List[str]  # list of base64 encoded images

class StudentResponse(StudentBase):
    id: str
    is_enrolled: bool
    enrollment_photo_url: Optional[str] = None
    enrolled_at: Optional[datetime] = None
    created_at: Optional[datetime] = None