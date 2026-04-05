# import os
# import base64
# from datetime import datetime, timezone
# from typing import Optional, List, Dict, Any

# from fastapi import APIRouter, Depends, HTTPException, status
# from pydantic import BaseModel
# from supabase import create_client, Client
# from dotenv import load_dotenv

# # Ensure we import the authentication dependency
# from routers.auth import get_current_faculty

# # Import FaceService from services module
# from services.face_service import FaceService

# # Load environment variables
# load_dotenv()
# SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# if not SUPABASE_URL or not SUPABASE_KEY:
#     raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")

# supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# router = APIRouter()

# # --- Pydantic Models ---
# class StartSessionRequest(BaseModel):
#     course_id: str

# class ProcessFrameRequest(BaseModel):
#     session_id: str
#     frame: str  # Base64 encoded JPEG

# class EndSessionRequest(BaseModel):
#     session_id: str


# # --- Endpoints ---

# @router.post("/start")
# async def start_session(req: StartSessionRequest, current_faculty: dict = Depends(get_current_faculty)):
#     """
#     Creates a new attendance_session in Supabase.
#     """
#     # 1. Fetch course details to get the name
#     course_res = supabase.table("courses").select("name").eq("id", req.course_id).execute()
#     if not course_res.data:
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid course ID")
    
#     course_name = course_res.data[0]["name"]
    
#     # 2. Fetch total active students (assuming all enrolled students take all courses, or adjust based on your schema)
#     # Here we count students where is_enrolled = True
#     students_res = supabase.table("students").select("id", count="exact").eq("is_enrolled", True).execute()
#     total_students = students_res.count if students_res.count is not None else len(students_res.data)
    
#     started_at = datetime.now(timezone.utc).isoformat()
    
#     # 3. Create the session
#     session_data = {
#         "course_id": req.course_id,
#         "faculty_id": current_faculty["id"],
#         "course_name": course_name,
#         "total_students": total_students,
#         "started_at": started_at,
#     }
    
#     res = supabase.table("attendance_sessions").insert(session_data).execute()
#     if not res.data:
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to start attendance session.")
        
#     session = res.data[0]
    
#     return {
#         "session_id": session["id"],
#         "course_name": session["course_name"],
#         "total_students": session["total_students"],
#         "started_at": session["started_at"]
#     }


# @router.post("/process-frame")
# async def process_frame(req: ProcessFrameRequest, current_faculty: dict = Depends(get_current_faculty)):
#     """
#     Processes a base64 frame, detects faces, matches them to the database, 
#     and dynamically inserts valid records for the session.
#     """
#     # Strip basic base64 data wrapper if it originated directly from canvas/frontend
#     frame_data = req.frame
#     if "," in frame_data:
#         frame_data = frame_data.split(",")[1]
        
#     try:
#         frame_bytes = base64.b64decode(frame_data)
#     except Exception:
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid base64 frame data.")
        
#     # Get embeddings & bounding boxes from computer vision service
#     detected_faces = FaceService.detect_all_faces(frame_bytes)
    
#     if not detected_faces:
#         return {"detected": []}
        
#     # 1. Fetch all enrolled students' face_embedding from Supabase
#     # In production, this data should be cached in Redis or Memory per session
#     students_res = supabase.table("students").select("id", "name", "roll_number", "face_embedding").eq("is_enrolled", True).execute()
#     enrolled_students = students_res.data or []
    
#     # Fetch already existing records to deduplicate
#     records_res = supabase.table("attendance_records").select("student_id").eq("session_id", req.session_id).execute()
#     already_marked_ids = {r["student_id"] for r in (records_res.data or [])}
    
#     results = []
    
#     for face in detected_faces:
#         face_emb = face.get("embedding")
#         bbox = face.get("bbox")
        
#         # 2. Find best match for this specific face
#         best_match = FaceService.match_embedding(face_emb, enrolled_students)
        
#         if best_match:
#             student_id = best_match["id"]
#             confidence = best_match.get("confidence", 0)
            
#             # Check Deduplication
#             already_marked = student_id in already_marked_ids
            
#             if not already_marked:
#                 # 3. Valid match & not marked yet: Insert into attendance_records
#                 supabase.table("attendance_records").insert({
#                     "session_id": req.session_id,
#                     "student_id": student_id,
#                     "status": "present",
#                     "marked_at": datetime.now(timezone.utc).isoformat()
#                 }).execute()
                
#                 already_marked_ids.add(student_id)
            
#             # 4. Map output format
#             results.append({
#                 "student_id": student_id,
#                 "name": best_match["name"],
#                 "roll_number": best_match["roll_number"],
#                 "confidence": confidence,
#                 "bbox": bbox,
#                 "already_marked": already_marked # Indicates if they were PREVIOUSLY marked before this request
#             })
#         else:
#             # Face wasn't recognized against the enrolled datastore
#             results.append({
#                 "student_id": None,
#                 "name": "Unknown",
#                 "roll_number": "N/A",
#                 "confidence": 0,
#                 "bbox": bbox,
#                 "already_marked": False
#             })
            
#     return {"detected": results}


# @router.post("/end")
# async def end_session(req: EndSessionRequest, current_faculty: dict = Depends(get_current_faculty)):
#     """
#     Finalizes the attendance session, generating 'absent' records 
#     for all students unaccounted for.
#     """
#     # Verify session existence
#     session_res = supabase.table("attendance_sessions").select("*").eq("id", req.session_id).execute()
#     if not session_res.data:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
        
#     session = session_res.data[0]
    
#     # Calculate total 'Present'
#     present_res = supabase.table("attendance_records").select("student_id", count="exact").eq("session_id", req.session_id).eq("status", "present").execute()
#     present_count = present_res.count if present_res.count is not None else len(present_res.data)
    
#     # Calculate 'Absent' by diffing (All Students - Present Students)
#     all_students_res = supabase.table("students").select("id").eq("is_enrolled", True).execute()
#     all_student_ids = {s["id"] for s in (all_students_res.data or [])}
    
#     present_records_res = supabase.table("attendance_records").select("student_id").eq("session_id", req.session_id).eq("status", "present").execute()
#     present_student_ids = {r["student_id"] for r in (present_records_res.data or [])}
    
#     absent_student_ids = all_student_ids - present_student_ids
#     absent_count = len(absent_student_ids)
    
#     # Bulk insert absent records
#     absent_records = [{
#         "session_id": req.session_id,
#         "student_id": sid,
#         "status": "absent",
#         "marked_at": datetime.now(timezone.utc).isoformat()
#     } for sid in absent_student_ids]
    
#     if absent_records:
#         supabase.table("attendance_records").insert(absent_records).execute()
        
#     # Calculate duration
#     ended_at = datetime.now(timezone.utc)
#     try:
#         # Standardize iso string for 3.11 backward compatibility
#         started_str = session["started_at"].replace("Z", "+00:00")
#         started_at = datetime.fromisoformat(started_str)
#         duration_minutes = max(0, int((ended_at - started_at).total_seconds() / 60))
#     except Exception:
#         duration_minutes = 0
        
#     # Update attendance_session logic
#     update_data = {
#         "ended_at": ended_at.isoformat(),
#         "present_count": present_count,
#         "absent_count": absent_count,
#         "duration_minutes": duration_minutes
#     }
    
#     supabase.table("attendance_sessions").update(update_data).eq("id", req.session_id).execute()
    
#     return {
#         "session_id": req.session_id,
#         "present_count": present_count,
#         "absent_count": absent_count,
#         "duration_minutes": duration_minutes
#     }


# @router.get("/history")
# async def get_history(course_id: Optional[str] = None, current_faculty: dict = Depends(get_current_faculty)):
#     """
#     Returns a listing of historically closed sessions for the logged-in faculty.
#     """
#     query = supabase.table("attendance_sessions").select("*").eq("faculty_id", current_faculty["id"])
    
#     if course_id:
#         query = query.eq("course_id", course_id)
        
#     # Requires Supabase strictly ordering
#     try:
#         res = query.order("started_at", desc=True).execute()
#         return res.data or []
#     except Exception as e:
#         print(f"Error fetching history: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Could not retrieve attendance history."
#         )

from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.models.attendance import (AttendanceSessionStart, FrameProcess, AttendanceSessionEnd,
                                   AttendanceSessionResponse, FrameProcessResponse, SessionEndResponse, DetectedFace)
from app.services.auth_service import get_current_faculty
from app.services.face_service import FaceService
from app.services.attendance_service import AttendanceService
from app.database import get_db
from datetime import datetime, date
from typing import Optional, List, Any, Dict

face_service = FaceService()
attendance_service = AttendanceService()
router = APIRouter()

@router.post("/start", response_model=AttendanceSessionResponse, status_code=status.HTTP_201_CREATED)
def start_session(
    payload: AttendanceSessionStart, 
    faculty_id: str = Depends(get_current_faculty), 
    db=Depends(get_db)
):
    # Verify course belongs to faculty
    course_res = db.table("courses").select("id").eq("id", payload.course_id).eq("faculty_id", faculty_id).execute()
    if not course_res.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Course not found or unauthorized access"
        )
        
    # Count enrolled students
    students_res = db.table("students").select("id", count="exact").eq("is_enrolled", True).execute()
    total_students = students_res.count if hasattr(students_res, "count") and students_res.count is not None else len(students_res.data)
    
    session_data = payload.model_dump()
    session_data["faculty_id"] = faculty_id
    session_data["total_students"] = total_students
    session_data["created_at"] = datetime.now().isoformat()
    session_data["status"] = "active"
    
    response = db.table("attendance_sessions").insert(session_data).execute()
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start attendance session"
        )
        
    return response.data[0]

@router.post("/process-frame", response_model=FrameProcessResponse)
def process_frame(
    payload: FrameProcess, 
    faculty_id: str = Depends(get_current_faculty), 
    db=Depends(get_db)
):
    # Validate session exists and is active
    session_res = db.table("attendance_sessions").select("*").eq("id", payload.session_id).eq("faculty_id", faculty_id).execute()
    if not session_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or unauthorized"
        )
        
    session = session_res.data[0]
    if session.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is no longer active"
        )
        
    # Detect all faces
    faces = face_service.detect_all_faces(payload.frame)
    detected_faces_resp = []
    
    for face in faces:
        embedding = face.get("embedding")
        bbox = face.get("bbox")
        det_score = face.get("det_score")
        
        student = attendance_service.match_face(embedding)
        student_id = student.get("id") if student else None
        student_name = student.get("name") if student else "Unknown"
        is_recognized = student is not None
        
        # Mark attendance if matched and not already marked
        if is_recognized and not attendance_service.is_already_marked(payload.session_id, student_id):
            record = {
                "session_id": payload.session_id,
                "student_id": student_id,
                "course_id": session.get("course_id"),
                "session_date": str(date.today()),
                "confidence_score": det_score,
                "is_present": True,
                "marked_by": "camera"
            }
            db.table("attendance_records").insert(record).execute()
            
        detected_faces_resp.append(DetectedFace(
            bbox=bbox, 
            det_score=det_score, 
            student_id=student_id, 
            student_name=student_name,
            is_recognized=is_recognized
        ))
        
    # Get current total present count
    present_res = db.table("attendance_records").select("id", count="exact")\
        .eq("session_id", payload.session_id)\
        .eq("is_present", True)\
        .execute()
    total_present = present_res.count if hasattr(present_res, "count") and present_res.count is not None else len(present_res.data)
    
    return FrameProcessResponse(
        detected_faces=detected_faces_resp,
        total_present=total_present
    )

@router.post("/end", response_model=SessionEndResponse)
def end_session(
    payload: AttendanceSessionEnd, 
    faculty_id: str = Depends(get_current_faculty), 
    db=Depends(get_db)
):
    # Fetch session
    session_res = db.table("attendance_sessions").select("*").eq("id", payload.session_id).eq("faculty_id", faculty_id).execute()
    if not session_res.data:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = session_res.data[0]
    course_id = session.get("course_id")
    session_date = str(date.today())
    
    # Calculate duration
    start_time_str = session.get("created_at")
    ended_at = datetime.now()
    duration_minutes = 0
    if start_time_str:
        try:
            start_time = datetime.fromisoformat(start_time_str.replace("Z", "+00:00"))
            duration_minutes = int((ended_at.timestamp() - start_time.timestamp()) / 60)
        except ValueError:
            pass

    # Count present students
    present_res = db.table("attendance_records").select("student_id").eq("session_id", payload.session_id).eq("is_present", True).execute()
    present_ids = {record["student_id"] for record in present_res.data}
    present_count = len(present_ids)

    # Find enrolled students not in attendance_records
    # Assuming all "is_enrolled=True" students in the DB belong to the cohort if no specific course mapping exist,
    # if there is a specific mapping, adjust the query accordingly.
    all_students_res = db.table("students").select("id").eq("is_enrolled", True).execute()
    absent_records = []
    
    for s in all_students_res.data:
        if s["id"] not in present_ids:
            absent_records.append({
                "session_id": payload.session_id,
                "student_id": s["id"],
                "course_id": course_id,
                "session_date": session_date,
                "is_present": False,
                "marked_by": "auto_absent"
            })
            
    if absent_records:
        # Supabase restricts insert size, potentially chunking needed for thousands
        db.table("attendance_records").insert(absent_records).execute()
        
    # Update session
    update_data = {
        "ended_at": ended_at.isoformat(),
        "present_count": present_count,
        "duration_minutes": duration_minutes,
        "status": "ended"
    }
    
    updated_session = db.table("attendance_sessions").update(update_data).eq("id", payload.session_id).execute()
    
    return updated_session.data[0]

@router.get("/history", response_model=List[Any])
def get_history(
    course_id: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    faculty_id: str = Depends(get_current_faculty),
    db=Depends(get_db)
):
    query = db.table("attendance_sessions").select("*, courses!inner(name, code)").eq("faculty_id", faculty_id)
    
    if course_id:
        query = query.eq("course_id", course_id)
        
    response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    
    # Flatten course information
    result = []
    for row in response.data:
        course = row.pop("courses", {})
        if course:
            row["course_name"] = course.get("name")
            row["course_code"] = course.get("code")
        result.append(row)
        
    return result

@router.get("/session/{session_id}/records", response_model=List[Any])
def get_session_records(
    session_id: str,
    faculty_id: str = Depends(get_current_faculty),
    db=Depends(get_db)
):
    # Verify session ownership
    session_res = db.table("attendance_sessions").select("id").eq("id", session_id).eq("faculty_id", faculty_id).execute()
    if not session_res.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized or session not found"
        )
        
    response = db.table("attendance_records")\
        .select("*, students!inner(name, roll_number)")\
        .eq("session_id", session_id)\
        .execute()
        
    result = []
    for row in response.data:
        student = row.pop("students", {})
        if student:
            row["student_name"] = student.get("name")
            row["roll_number"] = student.get("roll_number")
        result.append(row)
        
    return result
