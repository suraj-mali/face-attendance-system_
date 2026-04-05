from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from typing import Optional, Dict, Any
from datetime import date
from app.services.auth_service import get_current_faculty
from app.utils.export_utils import generate_attendance_excel
from app.database import get_db

router = APIRouter()

@router.get("/summary")
def get_summary(faculty_id: str = Depends(get_current_faculty), db=Depends(get_db)):
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

def _calculate_attendance_data(
    course_id: str, 
    from_date: Optional[str], 
    to_date: Optional[str], 
    faculty_id: str, 
    db: Any
) -> Dict[str, Any]:
    # Verify course belongs to faculty
    course_res = db.table("courses").select("name, code").eq("id", course_id).eq("faculty_id", faculty_id).execute()
    if not course_res.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Course not found or unauthorized access"
        )
    course_info = course_res.data[0]

    # Fetch all students (division=B, year=SY)
    students_res = db.table("students").select("id, name, roll_number")\
        .eq("division", "B")\
        .eq("year", "SY")\
        .execute()
    students_list = students_res.data

    # Count sessions in date range for course_id
    sessions_query = db.table("attendance_sessions").select("id", count="exact").eq("course_id", course_id)
    if from_date:
        sessions_query = sessions_query.gte("created_at", f"{from_date}T00:00:00")
    if to_date:
        sessions_query = sessions_query.lte("created_at", f"{to_date}T23:59:59")
        
    sessions_res = sessions_query.execute()
    total_sessions = sessions_res.count if hasattr(sessions_res, "count") and sessions_res.count is not None else len(sessions_res.data)

    # Count present records in date range
    records_query = db.table("attendance_records").select("student_id").eq("course_id", course_id).eq("is_present", True)
    if from_date:
        records_query = records_query.gte("session_date", from_date)
    if to_date:
        records_query = records_query.lte("session_date", to_date)
        
    records_res = records_query.execute()
    
    present_counts = {}
    for record in records_res.data:
        std_id = record["student_id"]
        present_counts[std_id] = present_counts.get(std_id, 0) + 1

    student_stats = []
    for s in students_list:
        present = present_counts.get(s["id"], 0)
        percentage = round((present / total_sessions * 100.0), 2) if total_sessions > 0 else 0.0
        
        student_stats.append({
            "name": s["name"],
            "roll_number": s["roll_number"],
            "total_classes": total_sessions,
            "present": present,
            "percentage": percentage
        })

    return {
        "course_name": course_info["name"],
        "course_code": course_info["code"],
        "total_sessions": total_sessions,
        "students": student_stats
    }


@router.get("/attendance")
def get_attendance(
    course_id: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    faculty_id: str = Depends(get_current_faculty),
    db=Depends(get_db)
):
    return _calculate_attendance_data(course_id, from_date, to_date, faculty_id, db)

@router.get("/export")
def export_attendance(
    course_id: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    faculty_id: str = Depends(get_current_faculty),
    db=Depends(get_db)
):
    data = _calculate_attendance_data(course_id, from_date, to_date, faculty_id, db)
    excel_bytes = generate_attendance_excel(data)
    
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=attendance_report.xlsx"}
    )

@router.post("/send-alerts")
def send_alerts(
    course_id: str,
    faculty_id: str = Depends(get_current_faculty),
    db=Depends(get_db)
):
    # Calculate attendance without dates to get overall percentages
    data = _calculate_attendance_data(course_id, None, None, faculty_id, db)
    
    alerted_students = []
    for s in data["students"]:
        if s["percentage"] < 75.0:
            alerted_students.append({
                "name": s["name"],
                "roll_number": s["roll_number"],
                "percentage": s["percentage"]
            })
            
    # Mock sending alerts functionality
    # actual implementation would use an email/SMS provider here
            
    return {
        "alerted_students": alerted_students,
        "count": len(alerted_students)
    }
