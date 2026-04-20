from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.course import CourseCreate, CourseResponse
from app.services.auth_service import get_current_faculty
from app.database import get_db

router = APIRouter()

@router.get("/", response_model=List[CourseResponse])
def get_courses(current_faculty: dict = Depends(get_current_faculty), db=Depends(get_db)):
    faculty_id = current_faculty["faculty_id"]
    
    response = db.table("courses").select("*").eq("faculty_id", faculty_id).execute()
    return response.data

@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course: CourseCreate, 
    current_faculty: dict = Depends(get_current_faculty), 
    db=Depends(get_db)
):
    faculty_id = current_faculty["faculty_id"]
    
    # Check for existing code
    existing = db.table("courses").select("id").eq("code", course.code).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Course with this code already exists")
        
    course_data = course.model_dump()
    course_data["faculty_id"] = faculty_id # Now passing a string, not a dict
    
    response = db.table("courses").insert(course_data).execute()
    return response.data[0]

@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: str, 
    current_faculty: dict = Depends(get_current_faculty), 
    db=Depends(get_db)
):
    faculty_id = current_faculty["faculty_id"]
    response = db.table("courses").select("*").eq("id", course_id).eq("faculty_id", faculty_id).execute()
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or unauthorized"
        )
        
    return response.data[0]

@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: str, 
    course_data: CourseCreate, 
    current_faculty: dict = Depends(get_current_faculty), 
    db=Depends(get_db)
):
    faculty_id = current_faculty["faculty_id"]
    # Verify ownership
    existing = db.table("courses").select("id").eq("id", course_id).eq("faculty_id", faculty_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or unauthorized"
        )
    
    update_payload = course_data.model_dump(exclude_unset=True)
    response = db.table("courses").update(update_payload).eq("id", course_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update course"
        )
        
    return response.data[0]

@router.delete("/{course_id}")
def delete_course(
    course_id: str, 
    current_faculty: dict = Depends(get_current_faculty), 
    db=Depends(get_db)
):
    faculty_id = current_faculty["faculty_id"]
    existing = db.table("courses").select("id").eq("id", course_id).eq("faculty_id", faculty_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or unauthorized"
        )
        
    response = db.table("courses").delete().eq("id", course_id).execute()
    return {"message": "Course deleted"}

@router.patch("/{course_id}/toggle")
def toggle_course(
    course_id: str, 
    current_faculty: dict = Depends(get_current_faculty), 
    db=Depends(get_db)
):
    faculty_id = current_faculty["faculty_id"]
    existing = db.table("courses").select("is_active").eq("id", course_id).eq("faculty_id", faculty_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or unauthorized"
        )
        
    current_status = existing.data[0].get("is_active", True)
    new_status = not current_status
    
    response = db.table("courses").update({"is_active": new_status}).eq("id", course_id).execute()
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle course status"
        )
        
    return {
        "course_id": course_id,
        "is_active": new_status
    }

