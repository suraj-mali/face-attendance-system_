import os
import traceback
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.services.auth_service import authenticate_faculty, hash_password, create_access_token

load_dotenv()

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    department: str

@router.post("/login")
def login_faculty(req: LoginRequest):
    print("\n" + "="*30)
    print("DEBUG: LOGIN PROCESS STARTED")
    try:
        print(f"DEBUG: Attempting login for: {req.email}")

        if not req.email or not req.password:
            raise HTTPException(status_code=400, detail="Missing email or password")

        faculty = authenticate_faculty(req.email, req.password)
        
        if not faculty:
            print("DEBUG: Authentication failed. Invalid credentials.")
            raise HTTPException(status_code=401, detail="Invalid credentials. Please verify your email and password.")

        print("DEBUG: Generating JWT token...")
        token_data = {"sub": str(faculty["id"]), "email": faculty["email"], "name": faculty["name"]}
        access_token = create_access_token(data=token_data)
        print("DEBUG: JWT Created successfully")
        
        return {
            "access_token": access_token,
            "token": access_token,
            "token_type": "bearer",
            "faculty_name": faculty["name"],
            "faculty_id": str(faculty["id"])
        }

    except HTTPException:
        raise
    except Exception as e:
        print("!!! LOGIC CRASHED !!!")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@router.post("/register")
def register_faculty(req: RegisterRequest):
    try:
        db = get_db()
        existing = db.table("faculty").select("id").eq("email", req.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered")
            
        hashed = hash_password(req.password)
        
        data = {
            "name": req.name, 
            "email": req.email, 
            "password_hash": hashed, 
            "department": req.department
        }
        res = db.table("faculty").insert(data).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to register user")
            
        return {"status": "success", "id": res.data[0]["id"]}
        
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")
