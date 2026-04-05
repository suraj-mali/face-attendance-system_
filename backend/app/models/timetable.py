from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TimetableBase(BaseModel):
    course_id: str
    day_of_week: str
    start_time: str
    end_time: str
    room: Optional[str] = None

class TimetableCreate(TimetableBase):
    pass

class TimetableResponse(TimetableBase):
    id: str
    created_at: Optional[datetime] = None
    course_name: Optional[str] = None
    course_code: Optional[str] = None