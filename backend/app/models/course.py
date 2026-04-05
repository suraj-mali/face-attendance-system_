from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CourseBase(BaseModel):
    name: str
    code: str
    semester: int
    division: Optional[str] = "B"
    year: Optional[str] = "SY"

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: str
    faculty_id: str
    is_active: bool
    created_at: Optional[datetime] = None