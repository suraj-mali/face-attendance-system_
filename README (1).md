# Face Recognition Attendance System
### SY B.CSE — ~80 Students | Faculty Portal | Multi-Face Detection
> Stack: FastAPI + Next.js 14 + InsightFace + Supabase | Windows 10/11 | No Docker

---

## COVERAGE KEY
- `[CODE]` = full code written here, paste directly into the file
- `[PROMPT]` = paste into Google Antigravity to generate the file
- `[AUTO]` = created automatically by framework, no action needed

---

## Table of Contents
1. [Folder Structure](#1-folder-structure)
2. [Prerequisites & Installation](#2-prerequisites--installation)
3. [Supabase Setup](#3-supabase-setup)
4. [Environment Variables](#4-environment-variables)
5. [Backend Files — CODE](#5-backend-files--code)
6. [Backend Files — PROMPTS](#6-backend-files--prompts)
7. [Frontend Files — CODE](#7-frontend-files--code)
8. [Frontend Files — PROMPTS](#8-frontend-files--prompts)
9. [Face Recognition — No Training](#9-face-recognition--no-training)
10. [Student Enrollment — 80 Students](#10-student-enrollment--80-students)
11. [4-Week Plan](#11-4-week-plan)
12. [Running the Project](#12-running-the-project)
13. [All Dependencies](#13-all-dependencies)

---

## 1. Folder Structure

Every file below is marked with what to do with it.

```
face-attendance-system/
│
├── README.md                          [this file]
├── .gitignore                         [CODE → Section 4]
│
├── backend/
│   ├── main.py                        [PROMPT → Prompt B1]
│   ├── requirements.txt               [CODE → Section 13]
│   ├── .env                           [CODE → Section 4]
│   │
│   ├── app/
│   │   ├── __init__.py                [CODE → empty file]
│   │   ├── config.py                  [CODE → Section 5]
│   │   ├── database.py                [CODE → Section 5]
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py            [CODE → empty file]
│   │   │   ├── user.py                [CODE → Section 5]
│   │   │   ├── student.py             [CODE → Section 5]
│   │   │   ├── course.py              [CODE → Section 5]
│   │   │   ├── timetable.py           [CODE → Section 5]
│   │   │   └── attendance.py          [CODE → Section 5]
│   │   │
│   │   ├── routes/
│   │   │   ├── __init__.py            [CODE → empty file]
│   │   │   ├── auth.py                [PROMPT → Prompt B2]
│   │   │   ├── faculty.py             [PROMPT → Prompt B3]
│   │   │   ├── students.py            [PROMPT → Prompt B4]
│   │   │   ├── courses.py             [PROMPT → Prompt B5]
│   │   │   ├── timetable.py           [PROMPT → Prompt B6]
│   │   │   ├── attendance.py          [PROMPT → Prompt B7]
│   │   │   └── reports.py             [PROMPT → Prompt B8]
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py            [CODE → empty file]
│   │   │   ├── auth_service.py        [CODE → Section 5]
│   │   │   ├── face_service.py        [CODE → Section 9]
│   │   │   ├── enrollment_service.py  [PROMPT → Prompt B9]
│   │   │   └── attendance_service.py  [PROMPT → Prompt B10]
│   │   │
│   │   └── utils/
│   │       ├── __init__.py            [CODE → empty file]
│   │       ├── image_utils.py         [CODE → Section 5]
│   │       └── export_utils.py        [CODE → Section 5]
│   │
│   ├── scripts/
│   │   └── bulk_import_students.py    [CODE → Section 10]
│   │
│   ├── face_models/
│   │   └── .gitkeep                   [CODE → empty file]
│   │
│   └── venv/                          [AUTO → python -m venv venv]
│
├── frontend/
│   ├── package.json                   [AUTO → create-next-app]
│   ├── tailwind.config.js             [AUTO → create-next-app]
│   ├── next.config.js                 [AUTO → create-next-app]
│   ├── .env.local                     [CODE → Section 4]
│   │
│   ├── public/
│   │   ├── models/                    [MANUAL → download face-api.js weights]
│   │   └── logo.png                   [MANUAL → any logo image]
│   │
│   └── app/
│       ├── layout.tsx                 [CODE → Section 7]
│       ├── page.tsx                   [CODE → Section 7]
│       │
│       ├── login/
│       │   └── page.tsx               [PROMPT → Prompt F1]
│       │
│       ├── dashboard/
│       │   ├── layout.tsx             [PROMPT → Prompt F2]
│       │   ├── page.tsx               [PROMPT → Prompt F3]
│       │   │
│       │   ├── courses/
│       │   │   ├── page.tsx           [PROMPT → Prompt F4]
│       │   │   └── [id]/
│       │   │       └── page.tsx       [PROMPT → Prompt F5]
│       │   │
│       │   ├── students/
│       │   │   ├── page.tsx           [PROMPT → Prompt F6]
│       │   │   └── enroll/
│       │   │       └── page.tsx       [PROMPT → Prompt F7]
│       │   │
│       │   ├── timetable/
│       │   │   └── page.tsx           [PROMPT → Prompt F8]
│       │   │
│       │   ├── attendance/
│       │   │   ├── page.tsx           [PROMPT → Prompt F9]
│       │   │   └── history/
│       │   │       └── page.tsx       [PROMPT → Prompt F10]
│       │   │
│       │   └── reports/
│       │       └── page.tsx           [PROMPT → Prompt F11]
│       │
│       └── components/
│           ├── Sidebar.tsx            [PROMPT → Prompt F2 — included]
│           ├── Navbar.tsx             [PROMPT → Prompt F12]
│           ├── CameraFeed.tsx         [PROMPT → Prompt F13]
│           ├── StudentCard.tsx        [PROMPT → Prompt F14]
│           ├── AttendanceTable.tsx    [PROMPT → Prompt F15]
│           ├── AttendancePieChart.tsx [PROMPT → Prompt F16]
│           └── EnrollmentForm.tsx     [PROMPT → Prompt F17]
│
└── supabase/
    └── schema.sql                     [CODE → Section 3]
```

---

## 2. Prerequisites & Installation

### Open PowerShell as Administrator:

```powershell
winget install OpenJS.NodeJS.LTS
winget install Python.Python.3.11
winget install Git.Git
winget install Microsoft.VisualStudioCode
```

Restart PowerShell. Verify:
```powershell
node --version      # v20.x.x
python --version    # 3.11.x
git --version       # 2.x.x
```

### Create folder structure:
```powershell
cd $HOME\Documents
mkdir face-attendance-system
cd face-attendance-system
mkdir backend, frontend, supabase
cd backend
mkdir app, scripts, face_models
cd app
mkdir models, routes, services, utils
cd ..\..\..\
```

### Backend venv + packages:
```powershell
cd $HOME\Documents\face-attendance-system\backend
python -m venv venv
venv\Scripts\activate
pip install fastapi==0.111.0 uvicorn==0.29.0 insightface==0.7.3 onnxruntime==1.18.0 opencv-python==4.9.0.80 numpy==1.26.4 supabase==2.4.0 "python-jose[cryptography]==3.3.0" "passlib[bcrypt]==1.7.4" python-multipart==0.0.9 Pillow==10.3.0 openpyxl==3.1.2 python-dotenv==1.0.1 httpx==0.27.0
pip freeze > requirements.txt
```

### Create all empty __init__.py files:
```powershell
cd $HOME\Documents\face-attendance-system\backend
echo. > app\__init__.py
echo. > app\models\__init__.py
echo. > app\routes\__init__.py
echo. > app\services\__init__.py
echo. > app\utils\__init__.py
echo. > face_models\.gitkeep
echo. > scripts\__init__.py
```

### Frontend setup:
```powershell
cd $HOME\Documents\face-attendance-system\frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
npm install axios zustand react-webcam recharts face-api.js @supabase/supabase-js lucide-react
```

---

## 3. Supabase Setup

### Step 1
1. Go to https://supabase.com → sign up free
2. New Project → name: `face-attendance-db` → region: Singapore → save password
3. Wait ~2 minutes

### Step 2 — Enable pgvector
SQL Editor → run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 3 — Full schema (save as `supabase/schema.sql` AND run in Supabase SQL Editor)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100) DEFAULT 'CSE',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    semester INTEGER NOT NULL,
    division VARCHAR(10) DEFAULT 'B',
    year VARCHAR(10) DEFAULT 'SY',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    division VARCHAR(10) DEFAULT 'B',
    year VARCHAR(10) DEFAULT 'SY',
    face_embedding vector(512),
    enrollment_photo_url TEXT,
    is_enrolled BOOLEAN DEFAULT FALSE,
    enrolled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    timetable_id UUID REFERENCES timetable(id),
    faculty_id UUID REFERENCES faculty(id),
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    total_students INTEGER DEFAULT 0,
    present_count INTEGER DEFAULT 0
);

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id),
    course_id UUID REFERENCES courses(id),
    session_date DATE NOT NULL,
    is_present BOOLEAN DEFAULT TRUE,
    confidence_score FLOAT,
    marked_at TIMESTAMP DEFAULT NOW(),
    marked_by VARCHAR(20) DEFAULT 'face_recognition',
    UNIQUE(session_id, student_id)
);

CREATE INDEX ON students USING ivfflat (face_embedding vector_cosine_ops) WITH (lists = 10);
CREATE INDEX idx_attendance_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_date ON attendance_records(session_date);
```

### Step 4 — Get credentials
Supabase → Settings → API → copy Project URL, anon key, service_role key

---

## 4. Environment Variables

### `backend/.env`
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key-here
JWT_SECRET=change-this-to-a-long-random-string-minimum-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24
ALLOWED_ORIGINS=http://localhost:3000
DEBUG=True
```

### `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### `.gitignore`
```
backend/venv/
backend/__pycache__/
backend/**/__pycache__/
backend/.env
backend/face_models/
frontend/node_modules/
frontend/.env.local
frontend/.next/
.DS_Store
*.pyc
```

---

## 5. Backend Files — CODE

### `backend/app/config.py`
```python
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET", "fallback-secret-change-this")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
DEBUG = os.getenv("DEBUG", "True") == "True"
```

---

### `backend/app/database.py`
```python
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_db() -> Client:
    return supabase
```

---

### `backend/app/models/user.py`
```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class FacultyBase(BaseModel):
    name: str
    email: EmailStr
    department: Optional[str] = "CSE"

class FacultyCreate(FacultyBase):
    password: str

class FacultyLogin(BaseModel):
    email: EmailStr
    password: str

class FacultyResponse(FacultyBase):
    id: str
    created_at: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    faculty_name: str
    faculty_id: str
```

---

### `backend/app/models/student.py`
```python
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class StudentBase(BaseModel):
    name: str
    roll_number: str
    email: Optional[str] = None
    division: Optional[str] = "B"
    year: Optional[str] = "SY"

class StudentCreate(StudentBase):
    pass

class StudentEnroll(BaseModel):
    photos: List[str]  # list of base64 encoded images

class StudentResponse(StudentBase):
    id: str
    is_enrolled: bool
    enrollment_photo_url: Optional[str] = None
    enrolled_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
```

---

### `backend/app/models/course.py`
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CourseBase(BaseModel):
    name: str
    code: str
    semester: int
    division: Optional[str] = "B"
    year: Optional[str] = "SY"

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: str
    faculty_id: str
    is_active: bool
    created_at: Optional[datetime] = None
```

---

### `backend/app/models/timetable.py`
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TimetableBase(BaseModel):
    course_id: str
    day_of_week: str
    start_time: str
    end_time: str
    room: Optional[str] = None

class TimetableCreate(TimetableBase):
    pass

class TimetableResponse(TimetableBase):
    id: str
    created_at: Optional[datetime] = None
    course_name: Optional[str] = None
    course_code: Optional[str] = None
```

---

### `backend/app/models/attendance.py`
```python
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
```

---

### `backend/app/services/auth_service.py`
```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRY_HOURS

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token",
                            headers={"WWW-Authenticate": "Bearer"})

def get_current_faculty(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    payload = decode_token(credentials.credentials)
    faculty_id = payload.get("sub")
    if not faculty_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return {"faculty_id": faculty_id, "email": payload.get("email"), "name": payload.get("name")}
```

---

### `backend/app/utils/image_utils.py`
```python
import base64
import numpy as np
import cv2

def base64_to_numpy(base64_string: str) -> np.ndarray:
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    img_bytes = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

def bytes_to_numpy(image_bytes: bytes) -> np.ndarray:
    nparr = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

def numpy_to_base64(img: np.ndarray) -> str:
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')

def resize_image(img: np.ndarray, max_width: int = 640) -> np.ndarray:
    h, w = img.shape[:2]
    if w > max_width:
        ratio = max_width / w
        img = cv2.resize(img, (max_width, int(h * ratio)))
    return img

def validate_image_quality(img: np.ndarray) -> tuple[bool, str]:
    if img is None:
        return False, "Could not decode image"
    h, w = img.shape[:2]
    if w < 200 or h < 200:
        return False, "Image too small — minimum 200x200"
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    if cv2.Laplacian(gray, cv2.CV_64F).var() < 50:
        return False, "Image too blurry — improve lighting"
    return True, "OK"
```

---

### `backend/app/utils/export_utils.py`
```python
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from io import BytesIO

def generate_attendance_excel(course_name, course_code, report_data, from_date, to_date) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Attendance Report"

    ws.merge_cells("A1:F1")
    ws["A1"] = f"Attendance Report — {course_name} ({course_code})"
    ws["A1"].font = Font(bold=True, size=14)
    ws["A1"].alignment = Alignment(horizontal="center")

    ws.merge_cells("A2:F2")
    ws["A2"] = f"Period: {from_date} to {to_date}"
    ws["A2"].alignment = Alignment(horizontal="center")

    headers = ["Roll No", "Student Name", "Total Classes", "Present", "Absent", "Attendance %"]
    hdr_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    hdr_font = Font(color="FFFFFF", bold=True)
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=4, column=col, value=h)
        cell.fill = hdr_fill
        cell.font = hdr_font
        cell.alignment = Alignment(horizontal="center")

    red_fill = PatternFill(start_color="FFE4E4", end_color="FFE4E4", fill_type="solid")
    green_fill = PatternFill(start_color="E4FFE4", end_color="E4FFE4", fill_type="solid")

    for i, s in enumerate(report_data, 5):
        absent = s["total_classes"] - s["present"]
        fill = red_fill if s["percentage"] < 75 else green_fill
        for col, val in enumerate([s["roll_number"], s["name"], s["total_classes"],
                                    s["present"], absent, f"{s['percentage']:.1f}%"], 1):
            cell = ws.cell(row=i, column=col, value=val)
            cell.fill = fill
            cell.alignment = Alignment(horizontal="center")

    for col, w in zip(["A","B","C","D","E","F"], [12,25,15,10,10,15]):
        ws.column_dimensions[col].width = w

    out = BytesIO()
    wb.save(out)
    out.seek(0)
    return out.read()
```

---

## 6. Backend Files — PROMPTS

Paste each prompt into Google Antigravity. Save output to the path shown.

---

### Prompt B1 — `backend/main.py`

```
You are a senior Python FastAPI developer.

Create main.py for a Face Recognition Attendance System.

Requirements:
- Import routers and include with these prefixes:
  app/routes/auth.py      → prefix="/auth",       tags=["Authentication"]
  app/routes/faculty.py   → prefix="/faculty",     tags=["Faculty"]
  app/routes/students.py  → prefix="/students",    tags=["Students"]
  app/routes/courses.py   → prefix="/courses",     tags=["Courses"]
  app/routes/timetable.py → prefix="/timetable",   tags=["Timetable"]
  app/routes/attendance.py→ prefix="/attendance",   tags=["Attendance"]
  app/routes/reports.py   → prefix="/reports",     tags=["Reports"]

- CORSMiddleware: allow origins from config.ALLOWED_ORIGINS, all methods, all headers, credentials=True

- lifespan context manager (asynccontextmanager):
  On startup: print startup message, call FaceService.initialize() from app.services.face_service

- GET "/" returns {"status": "ok", "service": "Face Attendance API", "version": "1.0.0"}

- Load .env with python-dotenv at top of file

Python 3.11, FastAPI 0.111. No SQLAlchemy. Return only complete main.py. No explanation.
```

---

### Prompt B2 — `backend/app/routes/auth.py`

```
You are a senior Python FastAPI developer.

Create app/routes/auth.py for a Face Recognition Attendance System.

Import from these existing files:
  from app.models.user import FacultyCreate, FacultyLogin, FacultyResponse, TokenResponse
  from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_faculty
  from app.database import get_db

Endpoints:

POST /register — Body: FacultyCreate
  Check email exists in Supabase "faculty" table → 400 if yes
  Hash password, insert into faculty table
  Return {"message": "Faculty registered successfully", "faculty_id": id}

POST /login — Body: FacultyLogin
  Query Supabase faculty by email → 401 if not found
  verify_password() → 401 if wrong
  create_access_token({"sub": id, "email": email, "name": name})
  Return TokenResponse

GET /me — Depends(get_current_faculty)
  Fetch faculty from Supabase by faculty_id, return without password_hash

Use APIRouter(). Python 3.11. Return only complete auth.py. No explanation.
```

---

### Prompt B3 — `backend/app/routes/faculty.py`

```
You are a senior Python FastAPI developer.

Create app/routes/faculty.py for a Face Recognition Attendance System.

Imports:
  from app.services.auth_service import get_current_faculty
  from app.database import get_db

All endpoints protected with Depends(get_current_faculty):

GET /profile — return current faculty from Supabase "faculty" table by faculty_id from token

PUT /profile — Body: {"name": str optional, "department": str optional}
  Update faculty in Supabase, return updated record

GET /dashboard-stats — return:
  { total_students: int, total_courses: int, todays_sessions: int, avg_attendance: float }
  total_students: count all students
  total_courses: count courses where faculty_id matches
  todays_sessions: count attendance_sessions today for this faculty
  avg_attendance: average of (present_count/total_students*100) across all sessions for this faculty

Use APIRouter(prefix="/faculty"). Python 3.11. Supabase client. Return complete file. No explanation.
```

---

### Prompt B4 — `backend/app/routes/students.py`

```
You are a senior Python FastAPI developer.

Create app/routes/students.py for a Face Recognition Attendance System.

Imports:
  from app.models.student import StudentCreate, StudentResponse, StudentEnroll
  from app.services.auth_service import get_current_faculty
  from app.services.enrollment_service import EnrollmentService
  from app.database import get_db

enrollment_service = EnrollmentService()

Endpoints (all protected):

GET / — params: page=1, per_page=20, search=""
  Fetch from Supabase "students" table
  If search: filter name ILIKE or roll_number ILIKE
  Return {"students": [...], "total": int, "page": int, "per_page": int}

POST / — Body: StudentCreate
  Check roll_number unique → 400 if not
  Insert into students, return StudentResponse

GET /{student_id} — fetch by id, return StudentResponse

PUT /{student_id} — update student, return StudentResponse

DELETE /{student_id} — delete from Supabase, return {"message": "Student deleted"}

POST /{student_id}/enroll — Body: StudentEnroll (photos: List[str] base64)
  Call enrollment_service.enroll_student(student_id, photos)
  Return {"message": "Enrolled successfully", "student_id": student_id}

Use APIRouter(). Python 3.11. Return complete file. No explanation.
```

---

### Prompt B5 — `backend/app/routes/courses.py`

```
You are a senior Python FastAPI developer.

Create app/routes/courses.py for a Face Recognition Attendance System.

Imports:
  from app.models.course import CourseCreate, CourseResponse
  from app.services.auth_service import get_current_faculty
  from app.database import get_db

Endpoints (all protected):

GET / — return all courses for this faculty from Supabase

POST / — Body: CourseCreate
  Check code unique → 400 if exists
  Insert with faculty_id from token, return CourseResponse

GET /{course_id} — verify faculty owns it, return CourseResponse

PUT /{course_id} — verify ownership, update, return CourseResponse

DELETE /{course_id} — verify ownership, delete, return {"message": "Course deleted"}

PATCH /{course_id}/toggle — flip is_active boolean, return {"course_id", "is_active": new_value}

Use APIRouter(). Python 3.11. Return complete file. No explanation.
```

---

### Prompt B6 — `backend/app/routes/timetable.py`

```
You are a senior Python FastAPI developer.

Create app/routes/timetable.py for a Face Recognition Attendance System.

Imports:
  from app.models.timetable import TimetableCreate, TimetableResponse
  from app.services.auth_service import get_current_faculty
  from app.database import get_db
  from datetime import datetime

Endpoints (all protected):

GET / — return all timetable entries for this faculty's courses
  JOIN with courses to include course_name, course_code

GET /today — return entries for today's day name (use datetime.now().strftime("%A"))
  Only for this faculty's courses, include course_name, course_code

POST / — Body: TimetableCreate
  Verify course belongs to faculty → 403 if not
  Check time conflict on same day + room → 400 if conflict
  Insert into timetable, return TimetableResponse

PUT /{timetable_id} — verify ownership via course, update, return TimetableResponse

DELETE /{timetable_id} — verify ownership, delete, return {"message": "Slot deleted"}

Use APIRouter(). Python 3.11. Return complete file. No explanation.
```

---

### Prompt B7 — `backend/app/routes/attendance.py`

```
You are a senior Python FastAPI developer with computer vision expertise.

Create app/routes/attendance.py for a Face Recognition Attendance System.

Imports:
  from app.models.attendance import (AttendanceSessionStart, FrameProcess, AttendanceSessionEnd,
    AttendanceSessionResponse, FrameProcessResponse, SessionEndResponse, DetectedFace)
  from app.services.auth_service import get_current_faculty
  from app.services.face_service import FaceService
  from app.services.attendance_service import AttendanceService
  from app.database import get_db
  from datetime import datetime, date

face_service = FaceService()
attendance_service = AttendanceService()

Endpoints (all protected):

POST /start — Body: AttendanceSessionStart
  Verify course belongs to faculty
  Count enrolled students (is_enrolled=True) in Supabase
  Insert attendance_session, return AttendanceSessionResponse

POST /process-frame — Body: FrameProcess (session_id, frame base64)
  Validate session exists
  Call face_service.detect_all_faces(frame) → list of {embedding, bbox, det_score}
  For each detected face:
    Call attendance_service.match_face(embedding) → student dict or None
    If matched and not attendance_service.is_already_marked(session_id, student_id):
      Insert into attendance_records (session_id, student_id, course_id, session_date, confidence_score)
  Return FrameProcessResponse with detected list and total_present count

POST /end — Body: AttendanceSessionEnd
  Update session: ended_at=now, present_count
  Find enrolled students not in attendance_records for this session
  Insert absent records (is_present=False, marked_by="auto_absent")
  Calculate duration_minutes
  Return SessionEndResponse

GET /history — params: course_id optional, limit=20, offset=0
  Fetch sessions for this faculty, newest first, join courses for name

GET /session/{session_id}/records
  Fetch all records, join students for name and roll_number

Use APIRouter(). Python 3.11. Return complete file. No explanation.
```

---

### Prompt B8 — `backend/app/routes/reports.py`

```
You are a senior Python FastAPI developer.

Create app/routes/reports.py for a Face Recognition Attendance System.

Imports:
  from app.services.auth_service import get_current_faculty
  from app.utils.export_utils import generate_attendance_excel
  from app.database import get_db
  from fastapi.responses import Response

Endpoints (all protected):

GET /summary
  Return { total_students, total_courses, todays_sessions, avg_attendance }
  avg_attendance: mean of present_count/total_students*100 for faculty's sessions

GET /attendance — params: course_id (required), from_date, to_date (YYYY-MM-DD strings)
  Verify course belongs to faculty
  Fetch all students (division=B, year=SY)
  Count sessions in date range for course_id
  For each student: count present records in date range
  Return { course_name, course_code, total_sessions, students: [{name, roll_number, total_classes, present, percentage}] }

GET /export — params: course_id, from_date, to_date
  Same calc as /attendance
  Call generate_attendance_excel(...) from export_utils
  Return Response with Excel bytes:
    media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    headers={"Content-Disposition": "attachment; filename=attendance_report.xlsx"}

POST /send-alerts — param: course_id
  Find students with attendance < 75%
  Return {"alerted_students": [{name, roll_number, percentage}], "count": int}

Use APIRouter(). Python 3.11. Return complete file. No explanation.
```

---

### Prompt B9 — `backend/app/services/enrollment_service.py`

```
You are a senior Python developer with face recognition expertise.

Create app/services/enrollment_service.py for a Face Recognition Attendance System.

Imports:
  import numpy as np
  from datetime import datetime
  from app.utils.image_utils import base64_to_numpy, validate_image_quality
  from app.database import get_db
  from app.services.face_service import FaceService

face_service = FaceService()

Create class EnrollmentService:

def enroll_student(self, student_id: str, photos: list[str]) -> dict:
  For each base64 photo:
    Convert with base64_to_numpy()
    validate_image_quality() — skip if bad
    face_service.extract_embedding(img) — skip if no face
    Collect valid embeddings
  If no valid embeddings: raise ValueError("No face detected in any photo")
  Average embeddings: np.mean(embeddings, axis=0)
  Normalize: embedding / np.linalg.norm(embedding)
  Convert to list
  Update Supabase students table: face_embedding=list, is_enrolled=True, enrolled_at=now
  Return {"success": True, "embeddings_used": count, "student_id": student_id}

def get_all_embeddings(self) -> list[dict]:
  Fetch all students where is_enrolled=True from Supabase
  Select: id, name, roll_number, face_embedding
  Return list of dicts

Python 3.11. Handle exceptions. Return complete file. No explanation.
```

---

### Prompt B10 — `backend/app/services/attendance_service.py`

```
You are a senior Python developer with vector similarity expertise.

Create app/services/attendance_service.py for a Face Recognition Attendance System.

Imports:
  import numpy as np
  from app.database import get_db
  from app.services.enrollment_service import EnrollmentService

enrollment_service = EnrollmentService()

Create class AttendanceService:

def match_face(self, query_embedding: np.ndarray, threshold: float = 0.5) -> dict | None:
  Call enrollment_service.get_all_embeddings()
  For each student: cosine similarity = np.dot(q, s) / (norm(q) * norm(s))
  Return student with highest score if >= threshold, else None

def is_already_marked(self, session_id: str, student_id: str) -> bool:
  Query attendance_records where session_id AND student_id match
  Return True if exists

def get_session_present_count(self, session_id: str) -> int:
  Count records where session_id matches AND is_present=True

Python 3.11. Supabase client. Return complete file. No explanation.
```

---

## 7. Frontend Files — CODE

### `frontend/app/layout.tsx`
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Face Attendance System — SY B.CSE',
  description: 'Automated attendance using face recognition',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### `frontend/app/page.tsx`
```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/login')
}
```

---

## 8. Frontend Files — PROMPTS

---

### Prompt F1 — `frontend/app/login/page.tsx`
```
You are an expert Next.js 14 App Router developer using TypeScript and TailwindCSS.

Create the faculty login page. File: app/login/page.tsx

- "use client"
- Fields: Email (required), Password (required)
- On submit: POST to process.env.NEXT_PUBLIC_API_URL + "/auth/login" with { email, password }
- Use axios
- On success: save to localStorage — "faculty_token", "faculty_name", "faculty_id" — redirect to /dashboard with useRouter
- On error: show red error message "Invalid email or password"
- Loading spinner on button while submitting
- Layout: full screen, centered white card (max-w-md), gray background
- Logo placeholder: gray 80x80 square, text "FACE ATTENDANCE"
- Title: "Faculty Login"
- No external libraries. TypeScript, TailwindCSS only.
Return complete component. No explanation.
```

---

### Prompt F2 — `frontend/app/dashboard/layout.tsx` + `frontend/app/components/Sidebar.tsx`
```
You are an expert Next.js 14 developer using TypeScript and TailwindCSS.

Create TWO files:

FILE 1 — app/dashboard/layout.tsx
- "use client"
- On mount: check localStorage "faculty_token" — if missing redirect to /login
- Flex layout: <Sidebar /> left (240px fixed), {children} right (flex-1, overflow-y-auto, h-screen)

FILE 2 — app/components/Sidebar.tsx
- "use client"
- Background: #1e293b, full height, 240px wide
- Top: faculty name from localStorage "faculty_name", small gray subtitle "Faculty"
- Nav items with simple inline SVG icons (basic shapes only):
  Dashboard → /dashboard
  Courses → /dashboard/courses
  Students → /dashboard/students
  Timetable → /dashboard/timetable
  Take Attendance → /dashboard/attendance
  Reports → /dashboard/reports
- Active: bg #0f766e, white text (detect with usePathname)
- Inactive: gray-400 text, hover bg #334155
- Bottom: Logout button — clear localStorage, redirect /login

TypeScript, TailwindCSS only. Return both files clearly labeled. No explanation.
```

---

### Prompt F3 — `frontend/app/dashboard/page.tsx`
```
You are an expert Next.js 14 developer using TypeScript and TailwindCSS.

Create dashboard overview page. File: app/dashboard/page.tsx

- "use client"
- GET /faculty/dashboard-stats → { total_students, total_courses, todays_sessions, avg_attendance }
- GET /timetable/today → [{id, course_name, course_code, start_time, end_time, room}]
- Both with Authorization: Bearer {localStorage.faculty_token}
- 4 stat cards grid (2 col mobile, 4 col desktop): Total Students | Total Courses | Today Sessions | Avg Attendance %
- Section "Today's Timetable": table/list of slots with "Take Attendance" button → /dashboard/attendance?course_id={id}
- Loading skeleton while fetching
- axios, TypeScript, TailwindCSS only. Return complete page. No explanation.
```

---

### Prompt F4 — `frontend/app/dashboard/courses/page.tsx`
```
You are an expert Next.js 14 developer using TypeScript and TailwindCSS.

Create Courses page. File: app/dashboard/courses/page.tsx

- "use client"
- GET /courses with Bearer auth → list of courses
- Table: Code | Name | Semester | Division | Status (green/gray badge) | Actions
- Actions: "View" → /dashboard/courses/{id} | "Toggle" → PATCH /courses/{id}/toggle | "Delete" → DELETE /courses/{id} with confirm
- "Add Course" button → modal with fields: Name, Code, Semester, Division, Year → POST /courses
- Loading, error, empty states
- TypeScript, TailwindCSS, axios only. Return complete page. No explanation.
```

---

### Prompt F5 — `frontend/app/dashboard/courses/[id]/page.tsx`
```
You are an expert Next.js 14 developer using TypeScript and TailwindCSS.

Create Course Detail page. File: app/dashboard/courses/[id]/page.tsx

- "use client"
- useParams() to get id
- GET /courses/{id} → show course details (name, code, semester, division, year, status)
- GET /attendance/history?course_id={id} → table: Date | Present | Total | %
- GET /students → filter locally, show table: Roll No | Name | Enrolled status
- Show "X / 80 students enrolled" count
- Back button → /dashboard/courses
- TypeScript, TailwindCSS, axios only. Return complete page. No explanation.
```

---

### Prompt F6 — `frontend/app/dashboard/students/page.tsx`
```
You are an expert Next.js 14 developer using TypeScript and TailwindCSS.

Create Students list page. File: app/dashboard/students/page.tsx

- "use client"
- GET /students?page=1&per_page=20 with Bearer auth
- Search bar → GET /students?search={query}
- Table: Roll No | Name | Division | Year | Enrolled (green/red badge) | Actions
- Actions: "Enroll Face" → /dashboard/students/enroll?id={id}
- "Add Student" button → modal (Name, Roll Number, Email, Division, Year) → POST /students
- Pagination (Previous/Next)
- Loading skeleton, error state, empty state
- TypeScript, TailwindCSS, axios only. Return complete page. No explanation.
```

---

### Prompt F7 — `frontend/app/dashboard/students/enroll/page.tsx`
```
You are an expert Next.js 14 developer using TypeScript, TailwindCSS, and react-webcam.

Create Face Enrollment page. File: app/dashboard/students/enroll/page.tsx

- "use client"
- useSearchParams to get student id
- GET /students/{id} → show student name and roll number
- Two tabs: "Webcam Capture" | "Upload Photo"

WEBCAM TAB:
- react-webcam live feed (640x480)
- "Start Capture" auto-takes 5 screenshots with 1s delay (setInterval)
- Show 5 thumbnail previews
- "Enroll Student" button (disabled until 5 photos) → POST /students/{id}/enroll body { photos: [base64...] }

UPLOAD TAB:
- File input accept="image/*"
- Preview image
- Convert to base64 with FileReader
- POST /students/{id}/enroll body { photos: [base64] }

On success: green banner "Enrolled successfully!" + "Enroll Another" button → /dashboard/students
On error: red message
TypeScript, TailwindCSS, axios, react-webcam only. Return complete page. No explanation.
```

---

### Prompt F8 — `frontend/app/dashboard/timetable/page.tsx`
```
You are an expert Next.js 14 developer using TypeScript and TailwindCSS.

Create Timetable Builder page. File: app/dashboard/timetable/page.tsx

- "use client"
- GET /timetable and GET /courses on mount with Bearer auth
- Weekly grid: rows = 08:00–18:00 (hourly), columns = Mon–Sat
- Entries shown as colored cards (6 soft colors rotating by course)
- Clicking a slot card shows delete option → DELETE /timetable/{id}
- "Add Slot" button → modal: Course dropdown, Day dropdown, start_time, end_time, room → POST /timetable
- On success: refresh timetable
- TypeScript, TailwindCSS, axios only. Return complete page. No explanation.
```

---

### Prompt F9 — `frontend/app/dashboard/attendance/page.tsx`
```
You are an expert Next.js 14 developer using TypeScript, TailwindCSS, and react-webcam.

Create Live Attendance page. File: app/dashboard/attendance/page.tsx

- "use client"
- useSearchParams for course_id
- POST /attendance/start → { session_id, course_name, total_students }
- Left (2/3): react-webcam (640x480) with canvas overlay for bounding boxes
- Every 2s: getScreenshot() → POST /attendance/process-frame { session_id, frame }
  Response: { detected: [{student_id, name, roll_number, confidence, bbox, already_marked, is_unknown}], total_present }
  Draw green rect on canvas for matched, red for unknown. Show name below rect.
- Right (1/3): live list of present students (name, roll, confidence %, time)
- Counter "X / total_students present"
- "End Session" → POST /attendance/end { session_id } → show summary → /dashboard/attendance/history
- TypeScript, TailwindCSS, axios, react-webcam only. Return complete page. No explanation.
```

---

### Prompt F10 — `frontend/app/dashboard/attendance/history/page.tsx`
```
You are an expert Next.js 14 developer using TypeScript and TailwindCSS.

Create Attendance History page. File: app/dashboard/attendance/history/page.tsx

- "use client"
- GET /attendance/history with Bearer auth
- Course filter dropdown (GET /courses)
- Table: Date | Course | Start | End | Present | Total | % | "View Records"
- "View Records" expands inline panel → GET /attendance/session/{id}/records
  Sub-table: Roll No | Name | Present/Absent badge | Time | Confidence
- Pagination 10 per page
- TypeScript, TailwindCSS, axios only. Return complete page. No explanation.
```

---

### Prompt F11 — `frontend/app/dashboard/reports/page.tsx`
```
You are an expert Next.js 14 developer using TypeScript, TailwindCSS, and recharts.

Create Reports page. File: app/dashboard/reports/page.tsx

- "use client"
- Filters: course dropdown (GET /courses), from_date, to_date → "Generate Report" button
- GET /reports/attendance?course_id=X&from_date=Y&to_date=Z
  Response: { course_name, course_code, total_sessions, students: [{name, roll_number, total_classes, present, percentage}] }
- 3 summary cards: Total Classes | Average % | Students Below 75%
- BarChart (recharts): X = roll_number, Y = percentage, green if >=75 red if <75 (use Cell)
- Table: Roll No | Name | Present | Total | % | Status badge (Regular/Shortage)
- "Download Excel" → GET /reports/export?course_id=X&from_date=Y&to_date=Z (file download via fetch + blob)
- TypeScript, TailwindCSS, recharts, axios only. Return complete page. No explanation.
```

---

### Prompt F12 — `frontend/app/components/Navbar.tsx`
```
You are an expert Next.js 14 developer using TypeScript and TailwindCSS.

Create Navbar component. File: app/components/Navbar.tsx

Props: { title?: string }
- White bg, border-b, h-14, full width, flex items-center px-6
- Left: title prop in font-medium
- Right: faculty name from localStorage "faculty_name" + avatar circle (initials, teal bg #0f766e, white text, 36px)
- "use client". TypeScript, TailwindCSS only. Return complete component. No explanation.
```

---

### Prompt F13 — `frontend/app/components/CameraFeed.tsx`
```
You are an expert Next.js 14 developer using TypeScript, TailwindCSS, and react-webcam.

Create CameraFeed component. File: app/components/CameraFeed.tsx

Props:
  onCapture?: (screenshot: string) => void
  showOverlay?: boolean
  detectedFaces?: Array<{bbox: number[], name?: string, is_unknown?: boolean}>
  width?: number   (default 640)
  height?: number  (default 480)

- "use client"
- react-webcam with given dimensions
- If showOverlay: canvas absolutely over webcam, same size
  useEffect on detectedFaces: clear canvas, draw green rect if name, red if unknown, name text below
- forwardRef to expose webcam ref (getScreenshot)
- Show "Camera not available" on onUserMediaError
- TypeScript, TailwindCSS, react-webcam. Return complete component with forwardRef. No explanation.
```

---

### Prompt F14 — `frontend/app/components/StudentCard.tsx`
```
You are an expert Next.js 14 developer using TypeScript and TailwindCSS.

Create StudentCard component. File: app/components/StudentCard.tsx

Props: { id, name, roll_number, email?, division, year, is_enrolled, onEnroll?, onDelete? }

- White card, border, rounded-lg, p-4
- Avatar circle with initials (teal bg), name, roll number, email
- Division + Year badges
- "Enrolled" green badge or "Not Enrolled" red badge
- "Enroll Face"/"Re-enroll" button (teal outline) + "Delete" button (red, with confirm)
- TypeScript, TailwindCSS only. Return complete component. No explanation.
```

---

### Prompt F15 — `frontend/app/components/AttendanceTable.tsx`
```
You are an expert Next.js 14 developer using TypeScript and TailwindCSS.

Create AttendanceTable component. File: app/components/AttendanceTable.tsx

Props:
  records: Array<{student_id, name, roll_number, is_present, confidence_score?, marked_at?, marked_by?}>
  showConfidence?: boolean

- Full width table, bordered, striped
- Columns: Roll No | Name | Status (Present/Absent badge) | Confidence | Marked At | Method
- Confidence: show as "96.4%" or "—" if not available
- Marked At: time only (HH:MM)
- Method: "Face AI" | "Manual" | "Auto"
- Present students first, then Absent
- Empty state: "No records found"
- TypeScript, TailwindCSS only. Return complete component. No explanation.
```

---

### Prompt F16 — `frontend/app/components/AttendancePieChart.tsx`
```
You are an expert Next.js 14 developer using TypeScript, TailwindCSS, and recharts.

Create AttendancePieChart component. File: app/components/AttendancePieChart.tsx

Props: { present: number, absent: number, title?: string }

- PieChart donut (innerRadius=60, outerRadius=90) from recharts
- Present: #16a34a (green), Absent: #dc2626 (red)
- Center label showing attendance percentage (1 decimal)
- Below: "X Present" green pill | "X Absent" red pill
- Title above if provided. Height: 220px.
- TypeScript, TailwindCSS, recharts. Return complete component. No explanation.
```

---

### Prompt F17 — `frontend/app/components/EnrollmentForm.tsx`
```
You are an expert Next.js 14 developer using TypeScript and TailwindCSS.

Create EnrollmentForm modal component. File: app/components/EnrollmentForm.tsx

Props: { isOpen: boolean, onClose: () => void, onSuccess: (student: any) => void }

- Modal overlay (fixed inset-0 bg-black/50) when isOpen
- White card centered, max-w-md, p-6
- Title: "Add New Student"
- Fields: Full Name (required), Roll Number (required, placeholder "23CSB001"), Email (optional), Division (select A/B/C default B), Year (select FY/SY/TY/BTech default SY)
- Submit: POST to NEXT_PUBLIC_API_URL + "/students" with Bearer token from localStorage
- On success: onSuccess(data), reset form, onClose()
- On error: red error text
- Close X button top right. Click overlay to close.
- TypeScript, TailwindCSS, axios only. Return complete component. No explanation.
```

---

## 9. Face Recognition — No Training

**Copy this exactly into `backend/app/services/face_service.py`:**

```python
import insightface
import numpy as np
import cv2
import base64
from app.utils.image_utils import base64_to_numpy, resize_image

class FaceService:
    _app = None

    @classmethod
    def initialize(cls):
        if cls._app is None:
            print("Loading InsightFace buffalo_l model...")
            cls._app = insightface.app.FaceAnalysis(
                name='buffalo_l',
                root='./face_models'
            )
            cls._app.prepare(ctx_id=-1)  # CPU mode, no GPU needed
            print("InsightFace loaded OK.")

    def __init__(self):
        if FaceService._app is None:
            FaceService.initialize()
        self.app = FaceService._app

    def extract_embedding(self, img: np.ndarray) -> np.ndarray | None:
        if img is None:
            return None
        img = resize_image(img, 640)
        faces = self.app.get(img)
        if not faces:
            return None
        largest = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]))
        return largest.embedding

    def detect_all_faces(self, frame_base64: str) -> list[dict]:
        img = base64_to_numpy(frame_base64)
        if img is None:
            return []
        img = resize_image(img, 640)
        results = []
        for face in self.app.get(img):
            if face.det_score < 0.5:
                continue
            results.append({
                "embedding": face.embedding,
                "bbox": face.bbox.tolist(),
                "det_score": float(face.det_score)
            })
        return results

    def match_embedding(self, query_embedding: np.ndarray, stored_records: list[dict], threshold: float = 0.5) -> dict | None:
        best_score = -1.0
        best_match = None
        for record in stored_records:
            stored = np.array(record['face_embedding'])
            nq, ns = np.linalg.norm(query_embedding), np.linalg.norm(stored)
            if nq == 0 or ns == 0:
                continue
            score = float(np.dot(query_embedding, stored) / (nq * ns))
            if score > best_score:
                best_score = score
                best_match = record
        if best_score >= threshold and best_match:
            return {"student_id": best_match["id"], "name": best_match["name"],
                    "roll_number": best_match["roll_number"], "confidence": round(best_score, 4)}
        return None
```

### Verify InsightFace:
```powershell
cd $HOME\Documents\face-attendance-system\backend
venv\Scripts\activate
python -c "from app.services.face_service import FaceService; FaceService.initialize(); print('OK')"
```
Expected: downloads model first run (~300MB), then prints `OK`.

---

## 10. Student Enrollment — 80 Students

### `backend/scripts/bulk_import_students.py`
```python
import csv, os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()
from app.database import get_db

def bulk_import(csv_path: str = "students_list.csv"):
    db = get_db()
    inserted = skipped = 0
    with open(csv_path, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            if db.table('students').select('id').eq('roll_number', row['roll_number']).execute().data:
                print(f"SKIP — {row['roll_number']}"); skipped += 1; continue
            db.table('students').insert({
                "name": row['name'].strip(), "roll_number": row['roll_number'].strip(),
                "email": row.get('email', '').strip() or None,
                "division": row.get('division', 'B').strip(),
                "year": row.get('year', 'SY').strip(), "is_enrolled": False
            }).execute()
            print(f"INSERTED — {row['roll_number']} {row['name']}"); inserted += 1
    print(f"\nDone. Inserted: {inserted} | Skipped: {skipped}")

if __name__ == "__main__":
    bulk_import()
```

### CSV format — `backend/students_list.csv`
```
name,roll_number,email,division,year
Rahul Sharma,23CSB001,rahul@college.edu,B,SY
Priya Mehta,23CSB002,priya@college.edu,B,SY
```
Fill all 80 rows, then run:
```powershell
cd $HOME\Documents\face-attendance-system\backend
venv\Scripts\activate
python scripts/bulk_import_students.py
```

---

## 11. 4-Week Plan

### Week 1 — Foundation (Days 1–7)
| Day | Task | Source |
|---|---|---|
| 1 | Install software, create folders, empty __init__ files | Section 2 |
| 2 | Supabase project + run schema.sql + get credentials | Section 3 |
| 2 | Create all .env files | Section 4 |
| 3 | Write config.py, database.py, all models (5 files) | Section 5 |
| 3 | Write auth_service.py, image_utils.py, export_utils.py | Section 5 |
| 3 | Antigravity: Prompt B1 (main.py), Prompt B2 (auth.py) | Section 6 |
| 4 | Antigravity: Prompt B3 (faculty.py), Prompt B5 (courses.py) | Section 6 |
| 4 | Test Postman: register → login → get token | Postman |
| 5 | Antigravity: Prompt F1 (login page), Prompt F2 (layout+sidebar) | Section 8 |
| 5 | Test login flow end-to-end in browser | Browser |
| 6 | Antigravity: Prompt F3 (dashboard), Prompt F4 (courses), Prompt F5 (course detail) | Section 8 |
| 7 | Antigravity: Prompt F12 (Navbar) — fix all bugs | Section 8 |

### Week 2 — Students & Enrollment (Days 8–14)
| Day | Task | Source |
|---|---|---|
| 8 | Write face_service.py (copy from Section 9), test InsightFace loads | Section 9 |
| 8 | Antigravity: Prompt B9 (enrollment_service.py), Prompt B4 (students.py) | Section 6 |
| 9 | Antigravity: Prompt F6 (students page), Prompt F7 (enroll page) | Section 8 |
| 9 | Antigravity: Prompt F17 (EnrollmentForm), Prompt F14 (StudentCard) | Section 8 |
| 10 | Create students_list.csv with all 80 SY B CSE students | Excel |
| 11 | Run bulk_import_students.py — verify 80 rows in Supabase | Terminal |
| 11 | Test webcam enrollment for 5 students | Browser |
| 12 | Enrollment lab session — all 80 students (~3 hours) | Lab |
| 13 | Verify all 80 have is_enrolled=true in Supabase dashboard | Supabase |
| 14 | Re-enroll failed students, fix lighting issues | Lab |

### Week 3 — Attendance & Timetable (Days 15–21)
| Day | Task | Source |
|---|---|---|
| 15 | Antigravity: Prompt B10 (attendance_service.py) | Section 6 |
| 15 | Antigravity: Prompt B7 (attendance.py routes) | Section 6 |
| 15 | Antigravity: Prompt B6 (timetable.py routes) | Section 6 |
| 16 | Antigravity: Prompt F9 (attendance camera page), Prompt F13 (CameraFeed) | Section 8 |
| 16 | Test frame → API → face match → mark present | Browser |
| 17 | Tune confidence threshold (0.4–0.6), test multi-face | Lab |
| 18 | Antigravity: Prompt F8 (timetable page) | Section 8 |
| 18 | Antigravity: Prompt F15 (AttendanceTable), Prompt F16 (PieChart) | Section 8 |
| 19 | Antigravity: Prompt B8 (reports.py) | Section 6 |
| 19 | Antigravity: Prompt F11 (reports page) | Section 8 |
| 20 | Antigravity: Prompt F10 (attendance history) | Section 8 |
| 21 | Full end-to-end: login → timetable → take attendance → report | Browser |

### Week 4 — Polish & Submission (Days 22–28)
| Day | Task | Source |
|---|---|---|
| 22 | Fix all bugs from Week 3 | VS Code |
| 23 | Test photo upload enrollment + Excel export | Browser |
| 24 | UI polish, test 10+ faces simultaneously | Lab |
| 25 | Create demo faculty account + sample data | Postman/Supabase |
| 26 | Final full test | Browser |
| 27 | Zip project for submission | Terminal |
| 28 | Buffer — last-minute fixes | — |

---

## 12. Running the Project

**Terminal 1 — Backend:**
```powershell
cd $HOME\Documents\face-attendance-system\backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```powershell
cd $HOME\Documents\face-attendance-system\frontend
npm run dev
```

- App: http://localhost:3000
- API Docs: http://localhost:8000/docs

---

## 13. All Dependencies

### `backend/requirements.txt`
```
fastapi==0.111.0
uvicorn==0.29.0
insightface==0.7.3
onnxruntime==1.18.0
opencv-python==4.9.0.80
numpy==1.26.4
supabase==2.4.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
Pillow==10.3.0
openpyxl==3.1.2
python-dotenv==1.0.1
httpx==0.27.0
```

### Frontend npm
```
next@14.2.3 | react@^18 | typescript@^5 | tailwindcss@^3
axios@^1.7.2 | zustand@^4.5.2 | react-webcam@^7.2.0
recharts@^2.12.7 | face-api.js@^0.22.2
@supabase/supabase-js@^2.43.4 | lucide-react@^0.395.0
```

### face-api.js models — download to `frontend/public/models/`
From: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
```
tiny_face_detector_model-weights_manifest.json
tiny_face_detector_model-shard1
face_landmark_68_model-weights_manifest.json
face_landmark_68_model-shard1
face_recognition_model-weights_manifest.json
face_recognition_model-shard1
face_recognition_model-shard2
```

---

## File Coverage Summary

| File | Status | Section |
|---|---|---|
| backend/main.py | Prompt B1 | §6 |
| backend/app/config.py | Full code | §5 |
| backend/app/database.py | Full code | §5 |
| backend/app/models/user.py | Full code | §5 |
| backend/app/models/student.py | Full code | §5 |
| backend/app/models/course.py | Full code | §5 |
| backend/app/models/timetable.py | Full code | §5 |
| backend/app/models/attendance.py | Full code | §5 |
| backend/app/routes/auth.py | Prompt B2 | §6 |
| backend/app/routes/faculty.py | Prompt B3 | §6 |
| backend/app/routes/students.py | Prompt B4 | §6 |
| backend/app/routes/courses.py | Prompt B5 | §6 |
| backend/app/routes/timetable.py | Prompt B6 | §6 |
| backend/app/routes/attendance.py | Prompt B7 | §6 |
| backend/app/routes/reports.py | Prompt B8 | §6 |
| backend/app/services/auth_service.py | Full code | §5 |
| backend/app/services/face_service.py | Full code | §9 |
| backend/app/services/enrollment_service.py | Prompt B9 | §6 |
| backend/app/services/attendance_service.py | Prompt B10 | §6 |
| backend/app/utils/image_utils.py | Full code | §5 |
| backend/app/utils/export_utils.py | Full code | §5 |
| backend/scripts/bulk_import_students.py | Full code | §10 |
| supabase/schema.sql | Full code | §3 |
| frontend/app/layout.tsx | Full code | §7 |
| frontend/app/page.tsx | Full code | §7 |
| frontend/app/login/page.tsx | Prompt F1 | §8 |
| frontend/app/dashboard/layout.tsx | Prompt F2 | §8 |
| frontend/app/dashboard/page.tsx | Prompt F3 | §8 |
| frontend/app/dashboard/courses/page.tsx | Prompt F4 | §8 |
| frontend/app/dashboard/courses/[id]/page.tsx | Prompt F5 | §8 |
| frontend/app/dashboard/students/page.tsx | Prompt F6 | §8 |
| frontend/app/dashboard/students/enroll/page.tsx | Prompt F7 | §8 |
| frontend/app/dashboard/timetable/page.tsx | Prompt F8 | §8 |
| frontend/app/dashboard/attendance/page.tsx | Prompt F9 | §8 |
| frontend/app/dashboard/attendance/history/page.tsx | Prompt F10 | §8 |
| frontend/app/dashboard/reports/page.tsx | Prompt F11 | §8 |
| frontend/app/components/Navbar.tsx | Prompt F12 | §8 |
| frontend/app/components/CameraFeed.tsx | Prompt F13 | §8 |
| frontend/app/components/StudentCard.tsx | Prompt F14 | §8 |
| frontend/app/components/AttendanceTable.tsx | Prompt F15 | §8 |
| frontend/app/components/AttendancePieChart.tsx | Prompt F16 | §8 |
| frontend/app/components/EnrollmentForm.tsx | Prompt F17 | §8 |
| frontend/app/components/Sidebar.tsx | Prompt F2 | §8 |

**Total: 44 files | 17 full code | 27 Antigravity prompts | 0 missing**

---

*README v2 — Complete. All 44 files covered. Windows 10/11 | Supabase | No Docker | 4 weeks*
