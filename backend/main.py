# from dotenv import load_dotenv
# load_dotenv()

# import os
# from contextlib import asynccontextmanager
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from app.routes import auth, faculty, students, courses, timetable, attendance, reports
# from app.services.face_service import FaceService

# import traceback
# from fastapi import Request
# from fastapi.responses import JSONResponse

# # Hardcoded CORS origins (safe defaults for development)
# # Add your production URL here when deploying
# ALLOWED_ORIGINS = [
#     "http://localhost:3000",
#     "http://127.0.0.1:3000",
# ]


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     print("Starting up Face Attendance API...")
#     FaceService.initialize()
#     yield


# app = FastAPI(lifespan=lifespan)
# @app.exception_handler(Exception)
# async def global_exception_handler(request: Request, exc: Exception):
#     traceback.print_exc()
#     return JSONResponse(
#         status_code=500,
#         content={"detail": str(exc), "type": type(exc).__name__}
#     )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=ALLOWED_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
# app.include_router(faculty.router, prefix="/faculty", tags=["Faculty"])
# app.include_router(students.router, prefix="/students", tags=["Students"])
# app.include_router(courses.router, prefix="/courses", tags=["Courses"])
# app.include_router(timetable.router, prefix="/timetable", tags=["Timetable"])
# app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
# app.include_router(reports.router, prefix="/reports", tags=["Reports"])


# @app.get("/")
# async def root():
#     return {
#         "status": "ok",
#         "service": "Face Attendance API",
#         "version": "1.0.0"
#     }


import os
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from app.routes import auth, faculty, courses, timetable
# Force load dotenv at the very top
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# DEBUG: Check if env vars are actually loading
if not SUPABASE_URL or not SUPABASE_KEY:
    print(f"CRITICAL: Supabase Env Missing! URL: {SUPABASE_URL}, Key: {'Exists' if SUPABASE_KEY else 'Missing'}")
    # Don't raise ValueError here yet, let's see if the server starts
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- Models ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    department: str

# --- Helper Methods ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Adding a try-except here because bcrypt fails if the hash is malformed
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as e:
        print(f"Bcrypt verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(faculty.router, prefix="/faculty", tags=["Faculty"])
app.include_router(students.router, prefix="/students", tags=["Students"])
app.include_router(courses.router, prefix="/courses", tags=["Courses"])
app.include_router(timetable.router, prefix="/timetable", tags=["Timetable"])
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])

# --- Routes ---
@router.post("/login")
async def login_faculty(req: LoginRequest):
    print(f"Login attempt for: {req.email}")
    
    try:
        # 1. Query Supabase
        response = supabase.table("faculty").select("*").eq("email", req.email).execute()
        
        if not response.data:
            print(f"Login failed: User {req.email} not found")
            raise HTTPException(status_code=401, detail="Incorrect email or password")
            
        faculty_member = response.data[0]
        
        # 2. Verify password
        if not verify_password(req.password, faculty_member["password_hash"]):
            print(f"Login failed: Wrong password for {req.email}")
            raise HTTPException(status_code=401, detail="Incorrect email or password")
            
        # 3. Create Token
        # Convert UUID to string if necessary for the JWT payload
        token_data = {
            "sub": str(faculty_member["id"]),
            "email": faculty_member["email"]
        }
        
        access_token = create_access_token(
            data=token_data, 
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        print(f"Login successful for: {req.email}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "faculty_name": faculty_member["name"],
            "faculty_id": faculty_member["id"]
        }

    except Exception as e:
        # This will catch the 500 and finally print it to your terminal
        print(f"!!! LOGIN ROUTE CRASHED !!!: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")






