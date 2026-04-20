from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.models.student import StudentCreate, StudentResponse, StudentEnroll
from app.services.auth_service import get_current_faculty
from app.services.enrollment_service import EnrollmentService
from app.database import get_db

router = APIRouter(dependencies=[Depends(get_current_faculty)])
enrollment_service = EnrollmentService()

@router.get("/")
def get_students(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    current_faculty: dict = Depends(get_current_faculty),
    db=Depends(get_db)
):
    faculty_id = current_faculty["faculty_id"]
    query = db.table("students").select("*", count="exact")
    
    if search:
        search_term = f"%{search}%"
        # Supabase filtering with or condition
        query = query.or_(f"name.ilike.{search_term},roll_number.ilike.{search_term}")
        
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page - 1
    
    response = query.range(start_idx, end_idx).execute()
    
    # postgrest-py sets count property explicitly if count="exact" is requested in select
    total = response.count if hasattr(response, "count") and response.count is not None else len(response.data)
    
    return {
        "students": response.data,
        "total": total,
        "page": page,
        "per_page": per_page
    }

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(student: StudentCreate, current_faculty: dict = Depends(get_current_faculty), db=Depends(get_db)):
    faculty_id = current_faculty["faculty_id"]
    # Check if roll_number is mutually unique constraint
    existing = db.table("students").select("id").eq("roll_number", student.roll_number).execute()
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this roll number already exists"
        )
        
    response = db.table("students").insert(student.model_dump()).execute()
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create student"
        )
        
    return response.data[0]

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, current_faculty: dict = Depends(get_current_faculty), db=Depends(get_db)):
    faculty_id = current_faculty["faculty_id"]
    response = db.table("students").select("*").eq("id", student_id).execute()
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    return response.data[0]

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: str, student_data: StudentCreate, current_faculty: dict = Depends(get_current_faculty), db=Depends(get_db)):
    faculty_id = current_faculty["faculty_id"]
    payload = student_data.model_dump(exclude_unset=True)
    response = db.table("students").update(payload).eq("id", student_id).execute()
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found or failed to update"
        )
    return response.data[0]

@router.delete("/{student_id}")
def delete_student(student_id: str, current_faculty: dict = Depends(get_current_faculty), db=Depends(get_db)):
    faculty_id = current_faculty["faculty_id"]
    response = db.table("students").delete().eq("id", student_id).execute()
    # Supabase usually returns the deleted record or nothing based on settings, handle gracefully
    if not response.data:
        # In a real environment, you might verify if existence first, or accept empty if ok
        pass
        
    return {"message": "Student deleted"}

@router.post("/{student_id}/enroll")
def enroll_student(student_id: str, payload: StudentEnroll, current_faculty: dict = Depends(get_current_faculty)):
    faculty_id = current_faculty["faculty_id"]
    try:
        # Photos expects List[str] base64 encoded
        enrollment_service.enroll_student(student_id, payload.photos)
        return {
            "message": "Enrolled successfully", 
            "student_id": student_id
        }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during enrollment: {str(e)}"
        )

