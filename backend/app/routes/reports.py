from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from typing import Optional, Dict, Any
from datetime import date
from app.services.auth_service import get_current_faculty
from app.utils.export_utils import generate_attendance_excel
from app.database import get_db

router = APIRouter()

@router.get("/summary")
def get_summary(current_faculty: dict = Depends(get_current_faculty), db=Depends(get_db)):
    faculty_id = current_faculty["faculty_id"]
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
        .gte("started_at", f"{today}T00:00:00")\
        .lte("started_at", f"{today}T23:59:59")\
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
        sessions_query = sessions_query.gte("started_at", f"{from_date}T00:00:00")
    if to_date:
        sessions_query = sessions_query.lte("started_at", f"{to_date}T23:59:59")
        
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
    from_date: str = None,
    to_date: str = None,
    current_faculty: dict = Depends(get_current_faculty)
):
    faculty_id = current_faculty['faculty_id']

    try:
        from datetime import date
        db = get_db()

        # Validate course belongs to faculty
        course_res = db.table('courses').select(
            'id, name, code'
        ).eq('id', course_id).eq('faculty_id', faculty_id).execute()

        if not course_res.data:
            raise HTTPException(
                status_code=404,
                detail='Course not found or does not belong to you'
            )
        course = course_res.data[0]

        # Default date range if not provided
        if not from_date:
            from_date = '2024-01-01'
        if not to_date:
            to_date = date.today().isoformat()

        # Get all sessions for this course in date range
        sessions_res = db.table('attendance_sessions').select(
            'id'
        ).eq('course_id', course_id).gte(
            'session_date', from_date
        ).lte('session_date', to_date).execute()

        session_ids = [s['id'] for s in (sessions_res.data or [])]
        total_sessions = len(session_ids)

        # Get all enrolled students
        students_res = db.table('students').select(
            'id, name, roll_number'
        ).eq('is_enrolled', True).execute()
        students = students_res.data or []

        result = []
        for student in students:
            if not session_ids:
                present_count = 0
            else:
                records_res = db.table('attendance_records').select(
                    'id', count='exact'
                ).eq('student_id', student['id']).eq(
                    'is_present', True
                ).in_('session_id', session_ids).execute()
                present_count = records_res.count or len(
                    records_res.data or []
                )

            absent_count = total_sessions - present_count
            percentage = round(
                present_count / total_sessions * 100, 1
            ) if total_sessions > 0 else 0.0

            import math
            if percentage < 75 and total_sessions > 0:
                needed = math.ceil(
                    (0.75 * total_sessions - present_count) / 0.25
                )
                shortfall = max(0, needed)
            else:
                shortfall = 0

            result.append({
                'id': student['id'],
                'name': student['name'],
                'roll_number': student['roll_number'],
                'total_classes': total_sessions,
                'present': present_count,
                'absent': absent_count,
                'percentage': percentage,
                'is_defaulter': percentage < 75,
                'shortfall': shortfall
            })

        result.sort(key=lambda x: x['percentage'])

        defaulters = [s for s in result if s['is_defaulter']]

        avg = round(
            sum(s['percentage'] for s in result) / len(result), 1
        ) if result else 0.0

        return {
            'course_name': course['name'],
            'course_code': course['code'],
            'total_sessions': total_sessions,
            'from_date': from_date,
            'to_date': to_date,
            'students': result,
            'defaulters': defaulters,
            'defaulter_count': len(defaulters),
            'class_average': avg
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f'Report error: {str(e)}'
        )

@router.get("/export")
def export_attendance(
    course_id: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_faculty: dict = Depends(get_current_faculty),
    db=Depends(get_db)
):
    faculty_id = current_faculty["faculty_id"]
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
    current_faculty: dict = Depends(get_current_faculty),
    db=Depends(get_db)
):
    faculty_id = current_faculty["faculty_id"]
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

