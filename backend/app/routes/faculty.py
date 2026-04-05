from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.services.auth_service import get_current_faculty
from app.database import get_db

router = APIRouter(prefix="/faculty")

class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None

@router.get("/profile")
def get_profile(faculty_id: str = Depends(get_current_faculty), db=Depends(get_db)):
    response = db.table("faculty").select("*").eq("id", faculty_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty profile not found"
        )
    
    faculty = response.data[0]
    
    # Remove sensitive data
    if "password_hash" in faculty:
        del faculty["password_hash"]
        
    return faculty

@router.put("/profile")
def update_profile(
    update_data: FacultyUpdate,
    faculty_id: str = Depends(get_current_faculty),
    db=Depends(get_db)
):
    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data provided to update"
        )
        
    response = db.table("faculty").update(update_dict).eq("id", faculty_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update profile"
        )
        
    updated_faculty = response.data[0]
    
    # Remove sensitive data
    if "password_hash" in updated_faculty:
        del updated_faculty["password_hash"]
        
    return updated_faculty

@router.get("/dashboard-stats")
def get_dashboard_stats(faculty_id: str = Depends(get_current_faculty), db=Depends(get_db)):
    # 1. Total Students
    students_res = db.table("students").select("id", count="exact").execute()
    total_students = students_res.count if hasattr(students_res, "count") and students_res.count is not None else len(students_res.data)
    
    # 2. Total Courses for this faculty
    courses_res = db.table("courses").select("id", count="exact").eq("faculty_id", faculty_id).execute()
    total_courses = courses_res.count if hasattr(courses_res, "count") and courses_res.count is not None else len(courses_res.data)
    
    # 3. Today's Sessions
    today = str(date.today())
    todays_sessions_res = db.table("attendance_sessions").select("id", count="exact")\
        .eq("faculty_id", faculty_id)\
        .gte("created_at", f"{today}T00:00:00")\
        .lte("created_at", f"{today}T23:59:59")\
        .execute()
    todays_sessions = todays_sessions_res.count if hasattr(todays_sessions_res, "count") and todays_sessions_res.count is not None else len(todays_sessions_res.data)
    
    # 4. Average Attendance Percentage
    sessions_res = db.table("attendance_sessions").select("present_count, total_students").eq("faculty_id", faculty_id).execute()
    sessions = sessions_res.data
    
    avg_attendance = 0.0
    if sessions:
        total_percentage = 0.0
        valid_sessions = 0
        
        for session in sessions:
            t_students = session.get("total_students", 0)
            p_count = session.get("present_count", 0)
            
            if t_students > 0:
                total_percentage += (p_count / t_students) * 100.0
                valid_sessions += 1
                
        if valid_sessions > 0:
            avg_attendance = round(total_percentage / valid_sessions, 2)
            
    return {
        "total_students": total_students,
        "total_courses": total_courses,
        "todays_sessions": todays_sessions,
        "avg_attendance": avg_attendance
    }
