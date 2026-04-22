from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.timetable import TimetableCreate, TimetableResponse
from app.services.auth_service import get_current_faculty
from app.database import get_db
from datetime import date

router = APIRouter()

@router.get("/today", response_model=List[TimetableResponse])
def get_today_timetable(
    day: str = None,
    current_faculty: dict = Depends(get_current_faculty),
    db=Depends(get_db)
):
    faculty_id = current_faculty['faculty_id']

    try:
        from datetime import datetime
        db = get_db()

        # Use client-provided day if available (fixes UTC vs IST timezone mismatch)
        # Frontend passes the browser's local day name e.g. ?day=Thursday
        today = day if day else datetime.now().strftime('%A')
        print(f'Fetching timetable for: {today}, faculty: {faculty_id}')

        # Step 1: Get all courses belonging to this faculty
        courses_res = db.table('courses').select(
            'id, name, code'
        ).eq('faculty_id', faculty_id).execute()

        faculty_courses = courses_res.data or []
        course_ids = [c['id'] for c in faculty_courses]
        course_map = {c['id']: c for c in faculty_courses}

        print(f'Faculty has {len(faculty_courses)} courses: {[c["name"] for c in faculty_courses]}')

        if not course_ids:
            return []

        # Step 2: Get timetable slots for today matching faculty courses
        timetable_res = db.table('timetable').select(
            'id, course_id, day_of_week, start_time, end_time, room'
        ).eq('day_of_week', today).in_(
            'course_id', course_ids
        ).execute()

        slots = timetable_res.data or []
        print(f'Found {len(slots)} slots for today')

        # Step 3: Build response with course name attached manually
        result = []
        for slot in slots:
            course = course_map.get(slot.get('course_id'), {})
            result.append({
                'id': slot['id'],
                'course_id': slot.get('course_id'),
                'day_of_week': slot.get('day_of_week'),
                'start_time': slot.get('start_time', ''),
                'end_time': slot.get('end_time', ''),
                'room': slot.get('room', ''),
                'course_name': course.get('name', 'Unknown Course'),
                'course_code': course.get('code', ''),
                'courses': {
                    'id': course.get('id', ''),
                    'name': course.get('name', 'Unknown Course'),
                    'code': course.get('code', '')
                }
            })

        print(f'Returning {len(result)} slots with course names')
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f'Timetable today error: {str(e)}'
        )

@router.get("/", response_model=List[TimetableResponse])
def get_timetable(current_faculty: dict = Depends(get_current_faculty), db=Depends(get_db)):
    faculty_id = current_faculty['faculty_id']

    try:
        db = get_db()

        # Get faculty courses
        courses_res = db.table('courses').select(
            'id, name, code'
        ).eq('faculty_id', faculty_id).execute()

        faculty_courses = courses_res.data or []
        course_ids = [c['id'] for c in faculty_courses]
        course_map = {c['id']: c for c in faculty_courses}

        if not course_ids:
            return []

        # Get all timetable slots for these courses
        timetable_res = db.table('timetable').select(
            'id, course_id, day_of_week, start_time, end_time, room'
        ).in_('course_id', course_ids).execute()

        slots = timetable_res.data or []

        result = []
        for slot in slots:
            course = course_map.get(slot.get('course_id'), {})
            result.append({
                'id': slot['id'],
                'course_id': slot.get('course_id'),
                'day_of_week': slot.get('day_of_week'),
                'start_time': slot.get('start_time', ''),
                'end_time': slot.get('end_time', ''),
                'room': slot.get('room', ''),
                'course_name': course.get('name', 'Unknown'),
                'course_code': course.get('code', ''),
                'courses': {
                    'id': course.get('id', ''),
                    'name': course.get('name', 'Unknown'),
                    'code': course.get('code', '')
                }
            })

        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f'Timetable fetch error: {str(e)}'
        )

@router.post("/", response_model=TimetableResponse, status_code=status.HTTP_201_CREATED)
def add_to_timetable(
    entry: TimetableCreate, 
    current_faculty: dict = Depends(get_current_faculty), 
    db=Depends(get_db)
):
    faculty_id = current_faculty["faculty_id"]
    
    timetable_data = entry.model_dump()
    
    response = db.table("timetable").insert(timetable_data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create timetable entry"
        )
        
    return response.data[0]

@router.delete("/{entry_id}")
def delete_timetable_entry(
    entry_id: str, 
    current_faculty: dict = Depends(get_current_faculty), 
    db=Depends(get_db)
):
    faculty_id = current_faculty["faculty_id"]
    
    courses_res = db.table("courses").select("id").eq("faculty_id", faculty_id).execute()
    course_ids = [c["id"] for c in courses_res.data]
    if not course_ids:
        raise HTTPException(status_code=404, detail="Entry not found or unauthorized")
        
    existing = db.table("timetable").select("id").eq("id", entry_id).in_("course_id", course_ids).execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found or unauthorized"
        )
        
    db.table("timetable").delete().eq("id", entry_id).execute()
    return {"message": "Entry deleted"}

