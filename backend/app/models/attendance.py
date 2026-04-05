from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AttendanceSessionStart(BaseModel):
    course_id: str

class FrameProcess(BaseModel):
    session_id: str
    frame: str

class AttendanceSessionEnd(BaseModel):
    session_id: str

class DetectedFace(BaseModel):
    student_id: Optional[str] = None
    name: Optional[str] = None
    roll_number: Optional[str] = None
    confidence: Optional[float] = None
    bbox: List[float]
    already_marked: bool = False
    is_unknown: bool = False

class FrameProcessResponse(BaseModel):
    detected: List[DetectedFace]
    total_present: int

class AttendanceSessionResponse(BaseModel):
    session_id: str
    course_name: str
    total_students: int
    started_at: datetime

class SessionEndResponse(BaseModel):
    session_id: str
    present_count: int
    absent_count: int
    duration_minutes: float