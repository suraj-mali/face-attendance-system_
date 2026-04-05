# Face Recognition Attendance System
### SY B.CSE — ~80 Students | Faculty Portal | Multi-Face Detection
> Built with Python FastAPI + Next.js + InsightFace + Supabase | Windows 10/11

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Final Tech Stack](#2-final-tech-stack)
3. [Complete Folder Structure](#3-complete-folder-structure)
4. [Prerequisites & Installation](#4-prerequisites--installation)
5. [Supabase Setup (No Docker)](#5-supabase-setup-no-docker)
6. [Environment Variables](#6-environment-variables)
7. [Face Recognition — No Training Required](#7-face-recognition--no-training-required)
8. [Student Enrollment (80 Students)](#8-student-enrollment-80-students)
9. [Antigravity Prompts — Frontend](#9-antigravity-prompts--frontend)
10. [Antigravity Prompts — Backend Logic](#10-antigravity-prompts--backend-logic)
11. [4-Week Execution Plan](#11-4-week-execution-plan)
12. [Running the Project](#12-running-the-project)
13. [All Dependencies Reference](#13-all-dependencies-reference)

---

## 1. Project Overview

A web-based attendance system that uses **real-time multi-face recognition** to automatically mark attendance for all students visible in a camera frame simultaneously. Faculty can manage courses, set timetables, and take attendance. Approximately 80 students of SY B.CSE are enrolled with face data stored as vector embeddings in Supabase.

**Key capabilities:**
- Detects and marks ALL faces in frame at once (not one at a time)
- Faculty login → select course → open camera → attendance auto-marked
- Student enrollment via live webcam capture OR photo upload
- Pretrained InsightFace model — no GPU, no custom training needed
- Reports, analytics, CSV export, low-attendance alerts
- Supabase as cloud database — no local DB install, no Docker

---

## 2. Final Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14 (React) | UI, pages, webcam |
| Styling | TailwindCSS | All UI styling |
| State | Zustand | Frontend state management |
| Camera | react-webcam | Browser webcam access |
| Face (browser) | face-api.js | Preview bounding boxes on screen |
| Backend | Python FastAPI | All API endpoints |
| Face (server) | InsightFace + ONNX | Multi-face detection & matching |
| Camera (server) | OpenCV | Frame processing |
| Database | Supabase (PostgreSQL) | All data + pgvector for embeddings |
| ORM | Supabase Python Client | DB queries from FastAPI |
| Auth | JWT (python-jose) | Faculty authentication |
| Password | Passlib (bcrypt) | Password hashing |
| HTTP Client | Axios | Frontend API calls |
| Charts | Recharts | Attendance analytics |
| Export | openpyxl | CSV/Excel export |
| AI Assistant | Google Antigravity | Generating frontend pages & components |

---

## 3. Complete Folder Structure

```
face-attendance-system/
│
├── README.md                          ← this file
├── .gitignore
│
├── backend/                           ← ALL Python FastAPI code
│   ├── main.py                        ← FastAPI app entry point
│   ├── requirements.txt               ← all Python dependencies
│   ├── .env                           ← Supabase URL, JWT secret (never commit)
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                  ← loads .env variables
│   │   ├── database.py                ← Supabase client setup
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                ← Faculty user model
│   │   │   ├── student.py             ← Student model
│   │   │   ├── course.py              ← Course model
│   │   │   ├── timetable.py           ← Timetable model
│   │   │   └── attendance.py          ← Attendance record model
│   │   │
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                ← POST /login, POST /register
│   │   │   ├── faculty.py             ← Faculty profile routes
│   │   │   ├── students.py            ← Student CRUD, enrollment
│   │   │   ├── courses.py             ← Course CRUD
│   │   │   ├── timetable.py           ← Timetable management
│   │   │   ├── attendance.py          ← Take attendance, history
│   │   │   └── reports.py             ← Analytics, export
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py        ← JWT create/verify logic
│   │   │   ├── face_service.py        ← InsightFace detection & matching
│   │   │   ├── enrollment_service.py  ← Generate & store face embeddings
│   │   │   └── attendance_service.py  ← Batch mark attendance logic
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── image_utils.py         ← base64 decode, frame prep
│   │       └── export_utils.py        ← CSV/Excel generation
│   │
│   ├── face_models/                   ← InsightFace downloads models here (auto)
│   │   └── .gitkeep
│   │
│   └── venv/                          ← Python virtual environment (never commit)
│
├── frontend/                          ← ALL Next.js code
│   ├── package.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   ├── .env.local                     ← NEXT_PUBLIC_API_URL (never commit)
│   │
│   ├── public/
│   │   ├── models/                    ← face-api.js model files (download separately)
│   │   │   ├── tiny_face_detector_model-weights_manifest.json
│   │   │   └── ... (other face-api.js weights)
│   │   └── logo.png
│   │
│   └── app/                           ← Next.js App Router
│       ├── layout.tsx                 ← Root layout
│       ├── page.tsx                   ← Redirect to /login
│       │
│       ├── login/
│       │   └── page.tsx               ← Faculty login page
│       │
│       ├── dashboard/
│       │   ├── layout.tsx             ← Sidebar + nav wrapper
│       │   ├── page.tsx               ← Dashboard overview
│       │   │
│       │   ├── courses/
│       │   │   ├── page.tsx           ← List all courses
│       │   │   └── [id]/
│       │   │       └── page.tsx       ← Single course detail
│       │   │
│       │   ├── students/
│       │   │   ├── page.tsx           ← List all students
│       │   │   └── enroll/
│       │   │       └── page.tsx       ← Enroll new student (webcam + upload)
│       │   │
│       │   ├── timetable/
│       │   │   └── page.tsx           ← Timetable builder
│       │   │
│       │   ├── attendance/
│       │   │   ├── page.tsx           ← Start attendance session
│       │   │   └── history/
│       │   │       └── page.tsx       ← Past attendance records
│       │   │
│       │   └── reports/
│       │       └── page.tsx           ← Analytics + export
│       │
│       └── components/
│           ├── Sidebar.tsx
│           ├── Navbar.tsx
│           ├── CameraFeed.tsx         ← Webcam + bounding box overlay
│           ├── StudentCard.tsx
│           ├── AttendanceTable.tsx
│           ├── AttendancePieChart.tsx
│           └── EnrollmentForm.tsx
│
└── supabase/
    └── schema.sql                     ← Full DB schema to run in Supabase SQL editor
```

---

## 4. Prerequisites & Installation

### Step 1 — Install required software (Windows 10/11)

Open **PowerShell as Administrator** and run each command:

```powershell
# Install Node.js v20 LTS
winget install OpenJS.NodeJS.LTS

# Install Python 3.11
winget install Python.Python.3.11

# Install Git
winget install Git.Git

# Install VS Code
winget install Microsoft.VisualStudioCode
```

Close and reopen PowerShell after installing. Verify:

```powershell
node --version        # should show v20.x.x
python --version      # should show 3.11.x
git --version         # should show git version 2.x
```

---

### Step 2 — Create project folder

Open **PowerShell** (regular, not Admin) and run:

```powershell
# Navigate to Documents
cd $HOME\Documents

# Create main project folder
mkdir face-attendance-system
cd face-attendance-system

# Create sub-folders
mkdir backend
mkdir frontend
mkdir supabase
```

---

### Step 3 — Set up Python backend

```powershell
# Go into backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate it (you must do this every time you open a new terminal)
venv\Scripts\activate

# You should now see (venv) at the start of your terminal prompt
```

Install all Python dependencies:

```powershell
pip install fastapi==0.111.0
pip install uvicorn==0.29.0
pip install insightface==0.7.3
pip install onnxruntime==1.18.0
pip install opencv-python==4.9.0.80
pip install numpy==1.26.4
pip install supabase==2.4.0
pip install python-jose[cryptography]==3.3.0
pip install passlib[bcrypt]==1.7.4
pip install python-multipart==0.0.9
pip install Pillow==10.3.0
pip install openpyxl==3.1.2
pip install python-dotenv==1.0.1
pip install httpx==0.27.0
```

Save all installed packages:
```powershell
pip freeze > requirements.txt
```

---

### Step 4 — Set up Next.js frontend

Open a **new PowerShell window** (keep backend one open):

```powershell
cd $HOME\Documents\face-attendance-system

# Create Next.js app inside frontend folder
cd frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"

# Install additional packages
npm install axios zustand react-webcam recharts face-api.js
npm install @supabase/supabase-js
npm install lucide-react
```

---

### Step 5 — Download face-api.js model files

These go inside `frontend/public/models/`. Download from:
```
https://github.com/justadudewhohacks/face-api.js/tree/master/weights
```

Files needed:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`

Place all files in: `frontend/public/models/`

---

## 5. Supabase Setup (No Docker)

### Step 1 — Create free Supabase project
1. Go to **https://supabase.com** and sign up (free)
2. Click **New Project**
3. Name: `face-attendance-db`
4. Set a strong database password (save it)
5. Region: Select closest to India (e.g. Singapore)
6. Wait ~2 minutes for project to initialize

### Step 2 — Enable pgvector extension
In Supabase dashboard → **SQL Editor** → run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 3 — Run the full schema
In Supabase → **SQL Editor** → paste and run the contents of `supabase/schema.sql`:

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Faculty users table
CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100) DEFAULT 'CSE',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Courses table
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

-- Students table (SY B CSE ~80 students)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    division VARCHAR(10) DEFAULT 'B',
    year VARCHAR(10) DEFAULT 'SY',
    face_embedding vector(512),          -- InsightFace 512-dim embedding
    enrollment_photo_url TEXT,           -- Supabase Storage URL
    is_enrolled BOOLEAN DEFAULT FALSE,
    enrolled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Timetable table
CREATE TABLE timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL,    -- Monday, Tuesday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance sessions table
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

-- Attendance records table
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id),
    course_id UUID REFERENCES courses(id),
    session_date DATE NOT NULL,
    is_present BOOLEAN DEFAULT TRUE,
    confidence_score FLOAT,
    marked_at TIMESTAMP DEFAULT NOW(),
    marked_by VARCHAR(20) DEFAULT 'face_recognition',  -- or 'manual'
    UNIQUE(session_id, student_id)      -- prevent duplicate marking
);

-- Index on face_embedding for fast vector search
CREATE INDEX ON students USING ivfflat (face_embedding vector_cosine_ops)
    WITH (lists = 10);

-- Index for fast attendance queries
CREATE INDEX idx_attendance_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_date ON attendance_records(session_date);
```

### Step 4 — Get your Supabase credentials
In Supabase dashboard → **Settings → API**:
- Copy **Project URL** (looks like `https://abcxyz.supabase.co`)
- Copy **anon/public key**
- Copy **service_role key** (for backend only — keep secret)

---

## 6. Environment Variables

### Backend — `backend/.env`
```env
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key-here

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24

# App
APP_NAME=Face Attendance System
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend — `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### `.gitignore` (root level)
```
# Python
backend/venv/
backend/__pycache__/
backend/**/__pycache__/
backend/.env
backend/face_models/

# Node
frontend/node_modules/
frontend/.env.local
frontend/.next/

# General
.DS_Store
*.pyc
```

---

## 7. Face Recognition — No Training Required

### How InsightFace works (pretrained)

InsightFace ships with a pretrained model called **buffalo_l** (or **buffalo_s** for lighter CPUs). This model was trained on millions of faces and can recognize any person — you do NOT retrain it.

**What you do instead — Enrollment:**
1. Student sits in front of webcam (or you upload their photo)
2. InsightFace detects their face and extracts a **512-dimensional embedding vector** (a unique numerical fingerprint of their face)
3. That vector is saved in Supabase with their student record
4. At attendance time: new face detected → embedding extracted → compared against all 80 stored embeddings → closest match above threshold = student identified

**Why no training is needed:**
- The pretrained model already understands faces universally
- Adding a new student = just saving their embedding, not retraining
- For 80 students it will work accurately without any custom training
- Accuracy: ~99.4% on standard benchmarks with good lighting

### InsightFace model download (happens automatically)

When `face_service.py` runs for the first time, InsightFace automatically downloads `buffalo_l` (~300MB) to `backend/face_models/`. Requires internet on first run only.

You can also pre-download manually:
```powershell
# Inside activated venv
python -c "import insightface; app = insightface.app.FaceAnalysis(name='buffalo_l', root='./face_models'); app.prepare(ctx_id=-1)"
```

### Face matching logic (in `backend/app/services/face_service.py`)

```python
import insightface
import numpy as np
import cv2
import base64

class FaceService:
    def __init__(self):
        self.app = insightface.app.FaceAnalysis(
            name='buffalo_l',
            root='./face_models'
        )
        self.app.prepare(ctx_id=-1)  # -1 = CPU mode, no GPU needed
        self.THRESHOLD = 0.5         # cosine similarity threshold

    def extract_embedding(self, image_bytes: bytes) -> np.ndarray | None:
        """Extract 512-dim embedding from a single face image."""
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        faces = self.app.get(img)
        if not faces:
            return None
        return faces[0].embedding  # largest/first face

    def detect_all_faces(self, frame_base64: str) -> list[dict]:
        """Detect ALL faces in a camera frame. Returns list of embeddings + bboxes."""
        img_bytes = base64.b64decode(frame_base64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        faces = self.app.get(img)
        return [
            {
                "embedding": face.embedding,
                "bbox": face.bbox.tolist(),
                "det_score": float(face.det_score)
            }
            for face in faces
        ]

    def match_embedding(self, query_embedding: np.ndarray, stored_embeddings: list[dict]) -> dict | None:
        """Find best matching student for a detected face embedding."""
        best_score = -1
        best_student = None
        for record in stored_embeddings:
            stored = np.array(record['face_embedding'])
            score = float(np.dot(query_embedding, stored) /
                         (np.linalg.norm(query_embedding) * np.linalg.norm(stored)))
            if score > best_score:
                best_score = score
                best_student = record
        if best_score >= self.THRESHOLD:
            return {"student": best_student, "confidence": round(best_score, 4)}
        return None  # Unknown face
```

---

## 8. Student Enrollment (80 Students)

### Option A — Bulk import student list first

Before capturing faces, add all 80 students to the database via a CSV import. Create `backend/scripts/bulk_import_students.py`:

```python
import csv
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Create a file: students_list.csv with columns: name, roll_number, email
with open('students_list.csv', newline='') as f:
    reader = csv.DictReader(f)
    for row in reader:
        supabase.table('students').insert({
            "name": row['name'],
            "roll_number": row['roll_number'],
            "email": row['email'],
            "division": "B",
            "year": "SY",
            "is_enrolled": False
        }).execute()

print("All students imported successfully.")
```

**CSV format (`students_list.csv`):**
```
name,roll_number,email
Rahul Sharma,23CSB001,rahul@college.edu
Priya Mehta,23CSB002,priya@college.edu
...
```

Run it:
```powershell
# inside backend/ with venv activated
python scripts/bulk_import_students.py
```

### Option B — Webcam enrollment (via dashboard UI)

Faculty opens `Dashboard → Students → Enroll`. Selects a student from the dropdown (already in DB from CSV import), clicks **Start Capture**. Webcam opens, system captures 5 photos automatically, generates an averaged embedding, saves to Supabase.

### Option C — Photo upload enrollment

Faculty uploads a clear face photo from college ID cards or admission records. System extracts the embedding from the uploaded file.

### Enrollment quality tips for 80 students:
- Capture in good lighting (near a window or under classroom lights)
- 5 photos per student at slight angle variations gives better accuracy
- Minimum image resolution: 640×480
- Glasses, masks will reduce accuracy — enroll with glasses if student usually wears them
- Takes approximately 2–3 minutes per student — plan a 3–4 hour enrollment session for 80 students

---

## 9. Antigravity Prompts — Frontend

> Use these prompts in **Google Antigravity** to generate each frontend page/component. Paste the prompt, review the output, then save the file at the path shown.

---

### PROMPT 1 — Faculty Login Page
**File:** `frontend/app/login/page.tsx`

```
You are an expert Next.js 14 and TailwindCSS developer.

Create a complete faculty login page for a Face Recognition Attendance System.

Requirements:
- File: Next.js 14 App Router page component (TypeScript)
- Styling: TailwindCSS only, no external UI libraries
- Fields: Email input, Password input, Login button
- On submit: POST to http://localhost:8000/auth/login with { email, password }
- Store JWT token received in response to localStorage as "faculty_token"
- On success: redirect to /dashboard using Next.js useRouter
- On error: show red error message below the form
- Show loading spinner on button while request is in progress
- Design: Clean, professional, centered card layout, white background, subtle border
- Include: College logo placeholder at top (just a gray square 80x80 with text "LOGO")
- No external icon libraries

Return only the complete TypeScript component code, no explanation.
```

---

### PROMPT 2 — Dashboard Sidebar + Layout
**File:** `frontend/app/dashboard/layout.tsx` and `frontend/app/components/Sidebar.tsx`

```
You are an expert Next.js 14 and TailwindCSS developer.

Create a dashboard layout with a sidebar for a Face Recognition Attendance System.

Sidebar navigation items:
1. Dashboard (icon: simple house SVG)
2. Courses (icon: simple book SVG)
3. Students (icon: simple person SVG)
4. Timetable (icon: simple calendar SVG)
5. Take Attendance (icon: simple camera SVG)
6. Reports (icon: simple chart SVG)
7. Logout (bottom of sidebar)

Requirements:
- Layout: Fixed left sidebar (240px wide), main content area takes remaining width
- Sidebar background: dark slate (#1e293b), white text for nav items
- Active nav item: highlighted with a teal/green accent color
- On logout: clear localStorage and redirect to /login
- Each nav item links to its route: /dashboard, /dashboard/courses, /dashboard/students, /dashboard/timetable, /dashboard/attendance, /dashboard/reports
- Include faculty name fetched from localStorage (store it at login as "faculty_name")
- Fully responsive is NOT required — desktop only is fine
- TypeScript, TailwindCSS only

Return the complete layout.tsx and Sidebar.tsx code separately, clearly labeled.
```

---

### PROMPT 3 — Dashboard Overview Page
**File:** `frontend/app/dashboard/page.tsx`

```
You are an expert Next.js 14 and TailwindCSS developer.

Create a dashboard overview page for a Face Recognition Attendance System.

Requirements:
- Show 4 stat cards at top: Total Students, Total Courses, Today's Sessions, Avg Attendance %
- Fetch stats from GET http://localhost:8000/reports/summary (returns { total_students, total_courses, todays_sessions, avg_attendance })
- Show a list of "Today's Timetable" below the cards — fetch from GET http://localhost:8000/timetable/today
- Each timetable item shows: Course Name, Time, Room, and a "Take Attendance" button
- "Take Attendance" button navigates to /dashboard/attendance?course_id=xxx&session_id=xxx
- Include a loading skeleton state while fetching
- Read JWT from localStorage "faculty_token" and send as Bearer token in all requests
- Clean card-based layout using TailwindCSS
- TypeScript only

Return only the complete component code.
```

---

### PROMPT 4 — Student List & Enrollment Page
**File:** `frontend/app/dashboard/students/page.tsx`

```
You are an expert Next.js 14 and TailwindCSS developer.

Create a Students management page for a Face Recognition Attendance System.

Requirements:
- Show a searchable table of all students (columns: Roll No, Name, Division, Enrolled?, Action)
- Fetch students from GET http://localhost:8000/students (paginated, 20 per page)
- Search bar filters by name or roll number (client-side filter)
- "Enrolled" column shows green badge if is_enrolled=true, else red "Not Enrolled" badge
- "Enroll Face" button in Action column — navigates to /dashboard/students/enroll?id=student_id
- "Add Student" button at top right opens a modal form (name, roll_number, email fields)
- Modal submits POST to http://localhost:8000/students
- Pagination controls at bottom
- JWT Bearer auth on all requests
- TypeScript, TailwindCSS only, no external component libraries

Return only the complete code.
```

---

### PROMPT 5 — Face Enrollment Page (Webcam + Upload)
**File:** `frontend/app/dashboard/students/enroll/page.tsx`

```
You are an expert Next.js 14 and TailwindCSS developer. You know how to use the react-webcam library.

Create a face enrollment page for a student in a Face Recognition Attendance System.

Requirements:
- Page receives student id from URL query param: useSearchParams to get "id"
- Fetch student details from GET http://localhost:8000/students/:id
- Show two tabs: "Webcam Capture" and "Upload Photo"

WEBCAM TAB:
- Use react-webcam to show live camera feed
- "Capture" button takes a photo (getScreenshot() from react-webcam)
- Capture 5 photos automatically with 1 second gap after clicking "Start Capture"
- Show thumbnail previews of captured photos
- "Enroll" button sends all 5 photos as base64 to POST http://localhost:8000/students/:id/enroll
- Request body: { photos: [base64string, ...] }

UPLOAD TAB:
- File input accepting image files (jpg, png)
- Preview selected image
- "Enroll" button sends the image as base64 to POST http://localhost:8000/students/:id/enroll
- Request body: { photos: [base64string] }

After successful enrollment:
- Show green success message "Student enrolled successfully"
- Update the student card to show "Enrolled" badge

JWT Bearer auth on all requests. TypeScript, TailwindCSS only.

Return the complete page code.
```

---

### PROMPT 6 — Live Attendance Camera Page
**File:** `frontend/app/dashboard/attendance/page.tsx`

```
You are an expert Next.js 14 and TailwindCSS developer. You know react-webcam and canvas drawing.

Create a live attendance-taking page for a Face Recognition Attendance System.

Requirements:
- Get course_id from URL query params using useSearchParams
- On load: POST to http://localhost:8000/attendance/start with { course_id } to create a session
  Response: { session_id, course_name, total_students }
- Show the webcam feed using react-webcam (full width, 640x480)
- Overlay a canvas on top of the webcam to draw face bounding boxes
- Every 2 seconds, capture a frame (getScreenshot()) and send to:
  POST http://localhost:8000/attendance/process-frame
  Body: { session_id, frame: base64string }
  Response: { detected: [{ student_id, name, roll_number, confidence, bbox: [x,y,w,h] }] }
- For each detected face, draw a green rectangle on the canvas at the bbox coordinates
- Show the student name below the bounding box in green text
- On the right side, show a live list of students marked present so far
  (name, roll number, time marked, confidence score as percentage)
- "End Session" button: POST http://localhost:8000/attendance/end with { session_id }
  Then redirect to /dashboard/attendance/history
- Show a counter: "X / total_students present"
- JWT Bearer auth on all requests. TypeScript, TailwindCSS only.

Return only the complete page code.
```

---

### PROMPT 7 — Timetable Builder Page
**File:** `frontend/app/dashboard/timetable/page.tsx`

```
You are an expert Next.js 14 and TailwindCSS developer.

Create a timetable management page for a Face Recognition Attendance System.

Requirements:
- Show a weekly grid: rows = time slots (8am–6pm in 1-hour slots), columns = days (Mon–Sat)
- Fetch existing timetable from GET http://localhost:8000/timetable (JWT auth)
- Each timetable entry renders as a colored card inside the grid cell showing: Course Name, Room
- "Add Slot" button at top opens a modal with:
  - Dropdown: select course (fetch from GET http://localhost:8000/courses)
  - Dropdown: day of week (Mon-Sat)
  - Time pickers: start_time and end_time
  - Text input: room number
  - Submit: POST http://localhost:8000/timetable
- Clicking an existing slot shows a popup with option to delete it
  DELETE http://localhost:8000/timetable/:id
- Different courses get different background colors (cycle through a set of 6 soft colors)
- TypeScript, TailwindCSS only, no external calendar libraries

Return the complete code.
```

---

### PROMPT 8 — Reports & Analytics Page
**File:** `frontend/app/dashboard/reports/page.tsx`

```
You are an expert Next.js 14 and TailwindCSS developer. You know how to use the recharts library.

Create a reports and analytics page for a Face Recognition Attendance System.

Requirements:
- Top filter bar: select Course (dropdown), select Date Range (from/to date inputs)
- Fetch report data from GET http://localhost:8000/reports/attendance?course_id=x&from=date&to=date
  Response: { students: [{ name, roll_number, total_classes, present, percentage }], course_name }

Display:
1. Summary cards: Total Classes Held, Class Average Attendance %, Students Below 75%
2. Bar chart (recharts BarChart) — X axis: student names, Y axis: attendance percentage
   Color bars red if below 75%, green if above
3. Table below chart: Roll No | Name | Present | Total | Percentage | Status badge
   Status: green "Regular" if >=75%, red "Shortage" if <75%
4. "Export Excel" button — calls GET http://localhost:8000/reports/export?course_id=x
   This returns a file download (Excel)
5. "Send Alerts" button — POST http://localhost:8000/reports/send-alerts?course_id=x
   Sends email to all students below 75%

JWT Bearer auth. TypeScript, TailwindCSS, recharts only.

Return the complete code.
```

---

## 10. Antigravity Prompts — Backend Logic

> Use these prompts to generate the FastAPI route and service files.

---

### PROMPT 9 — Main FastAPI App Entry
**File:** `backend/main.py`

```
You are a senior Python FastAPI developer with 15+ years experience.

Create the main.py entry point for a Face Recognition Attendance System backend.

Requirements:
- FastAPI app with CORS middleware (allow origins from .env ALLOWED_ORIGINS)
- Include routers from: auth, students, courses, timetable, attendance, reports, faculty
- Each router has prefix: /auth, /students, /courses, /timetable, /attendance, /reports, /faculty
- Add a GET / health check endpoint returning { status: "ok", service: "Face Attendance API" }
- Load environment variables from .env using python-dotenv
- Use lifespan context manager to initialize InsightFace model on startup (import from face_service)
- Print startup message with all registered routes

Python 3.11, FastAPI 0.111, no SQLAlchemy (use Supabase Python client directly).
Return only the complete main.py code.
```

---

### PROMPT 10 — Auth Routes
**File:** `backend/app/routes/auth.py`

```
You are a senior Python FastAPI developer.

Create the auth router for a Face Recognition Attendance System.

Requirements:
- POST /auth/login — accepts { email: str, password: str }
  1. Query Supabase "faculty" table for email
  2. Verify password with passlib bcrypt
  3. Return JWT token { access_token, token_type: "bearer", faculty_name, faculty_id }
  4. On failure: raise HTTPException 401

- POST /auth/register — accepts { name, email, password, department }
  1. Hash password with passlib bcrypt
  2. Insert into Supabase "faculty" table
  3. Return { message: "Faculty registered", faculty_id }

- GET /auth/me — protected route (Bearer JWT)
  Returns logged-in faculty details from Supabase

Create a get_current_faculty dependency that extracts and validates JWT from Authorization header.
Use python-jose for JWT. Load SUPABASE_URL, SUPABASE_KEY, JWT_SECRET from .env.

Return complete auth.py code with all imports.
```

---

### PROMPT 11 — Attendance Routes (Most Critical)
**File:** `backend/app/routes/attendance.py`

```
You are a senior Python FastAPI developer with expertise in computer vision integration.

Create the attendance router for a Face Recognition Attendance System.

Endpoints needed:

POST /attendance/start
- Body: { course_id: str }
- Auth: JWT required
- Creates a new attendance_session in Supabase
- Returns: { session_id, course_name, total_students, started_at }

POST /attendance/process-frame
- Body: { session_id: str, frame: str }  (frame is base64 JPEG)
- Auth: JWT required
- Calls FaceService.detect_all_faces(frame) to get list of face embeddings + bboxes
- For each detected face:
  1. Fetch all enrolled students' face_embedding from Supabase
  2. Call FaceService.match_embedding() to find best match
  3. If match found AND not already marked in this session:
     - Insert into attendance_records table
  4. Return all detected faces with student info or "Unknown"
- Returns: { detected: [{ student_id, name, roll_number, confidence, bbox, already_marked }] }
- Deduplication: check attendance_records for (session_id, student_id) before inserting

POST /attendance/end
- Body: { session_id: str }
- Updates attendance_session: ended_at = now(), present_count = count of records
- Marks absent all students NOT in attendance_records for this session
- Returns: { session_id, present_count, absent_count, duration_minutes }

GET /attendance/history
- Auth: JWT required
- Returns list of past sessions for this faculty
- Query param: course_id (optional filter)

Use Supabase Python client (not SQLAlchemy). Import FaceService from services/face_service.py.
Return complete attendance.py code.
```

---

## 11. 4-Week Execution Plan

> Total time: 4 weeks | Solo developer | Submission deadline

### Week 1 — Foundation (Days 1–7)
**Goal: Project running locally with auth working**

| Day | Task | Tool |
|---|---|---|
| 1 | Install Node, Python, Git, VS Code on Windows | Terminal |
| 1 | Create folder structure, initialize Git | Terminal |
| 2 | Create Supabase project, run schema.sql | Supabase dashboard |
| 2 | Set up backend venv, install all pip packages | Terminal |
| 2 | Set up frontend with Next.js, install npm packages | Terminal |
| 3 | Generate `main.py` with Prompt 9 (Antigravity) | Antigravity |
| 3 | Generate `auth.py` with Prompt 10 (Antigravity) | Antigravity |
| 3 | Test login API with Postman | Postman |
| 4 | Generate Login Page with Prompt 1 (Antigravity) | Antigravity |
| 4 | Generate Sidebar/Layout with Prompt 2 (Antigravity) | Antigravity |
| 5 | Connect login page to backend — test full login flow | Browser |
| 6 | Generate Dashboard page with Prompt 3 (Antigravity) | Antigravity |
| 6 | Write courses.py route (CRUD — use Antigravity) | Antigravity |
| 7 | Test all Week 1 work end-to-end, fix bugs | VS Code |

---

### Week 2 — Student Enrollment & Face System (Days 8–14)
**Goal: All 80 students enrolled with face embeddings**

| Day | Task | Tool |
|---|---|---|
| 8 | Write `face_service.py` (copy from Section 7 of this README) | VS Code |
| 8 | Test InsightFace — run first-time model download | Terminal |
| 9 | Write `enrollment_service.py` route — Prompt 11 (Antigravity) | Antigravity |
| 9 | Generate Student List page with Prompt 4 (Antigravity) | Antigravity |
| 10 | Generate Enrollment page with Prompt 5 (Antigravity) | Antigravity |
| 10 | Create `students_list.csv` with all 80 SY B CSE student details | Excel |
| 11 | Run `bulk_import_students.py` to add all 80 students to DB | Terminal |
| 11 | Test webcam enrollment for 5 students — verify embedding stored in Supabase | Browser |
| 12 | Enrollment session for 80 students (2–3 hours, use college lab) | Lab |
| 12–13 | Verify all 80 students show is_enrolled=true in Supabase | Supabase |
| 14 | Fix any enrollment issues, re-enroll students with poor results | Lab |

---

### Week 3 — Live Attendance + Timetable (Days 15–21)
**Goal: Full attendance flow working end-to-end**

| Day | Task | Tool |
|---|---|---|
| 15 | Generate `attendance.py` routes with Prompt 11 (Antigravity) | Antigravity |
| 15 | Write `attendance_service.py` batch marking logic | VS Code |
| 16 | Generate Attendance Camera Page with Prompt 6 (Antigravity) | Antigravity |
| 16 | Test frame capture → backend → face matching → mark present | Browser |
| 17 | Debug and tune confidence threshold (adjust 0.5 up/down) | VS Code |
| 17 | Test with multiple faces in frame simultaneously (3–5 people) | Lab |
| 18 | Write `timetable.py` route (CRUD) using Antigravity | Antigravity |
| 18 | Generate Timetable Builder page with Prompt 7 (Antigravity) | Antigravity |
| 19 | Generate Reports page with Prompt 8 (Antigravity) | Antigravity |
| 19 | Write `reports.py` route — attendance summary + Excel export | Antigravity |
| 20 | Connect timetable to attendance start (auto-fill course/time) | VS Code |
| 21 | Full end-to-end test: login → timetable → take attendance → report | Browser |

---

### Week 4 — Polish, Testing & Submission (Days 22–28)
**Goal: Stable, demo-ready application**

| Day | Task | Tool |
|---|---|---|
| 22 | Fix all bugs found in Week 3 testing | VS Code |
| 22 | Add manual attendance override (faculty marks absent/present) | Antigravity |
| 23 | Test enrollment photo upload flow (not just webcam) | Browser |
| 23 | Add low attendance alert logic (below 75% flag in reports) | VS Code |
| 24 | UI polish — fix any layout/spacing issues from Antigravity output | VS Code |
| 24 | Test full attendance session with 10+ students in frame | Lab |
| 25 | Write project documentation (how to run, how to use) | VS Code |
| 25 | Create demo faculty account + pre-load demo attendance data | Supabase |
| 26 | Final round of testing all features | Browser |
| 27 | Prepare submission — zip folder, final README check | Terminal |
| 28 | Buffer day — fix last-minute issues | — |

---

## 12. Running the Project

### Every time you start working — open 2 terminals:

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

Then open browser:
- Frontend: **http://localhost:3000**
- Backend API docs: **http://localhost:8000/docs**

### First run checklist:
- [ ] Supabase schema.sql has been run
- [ ] `.env` files are created with correct Supabase credentials
- [ ] `venv\Scripts\activate` is run before any `pip` or `uvicorn` command
- [ ] InsightFace model downloaded (happens auto on first request, needs internet)
- [ ] `face-api.js` model files are in `frontend/public/models/`

---

## 13. All Dependencies Reference

### Python (`backend/requirements.txt`)
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

### Node.js (`frontend/package.json` dependencies)
```json
{
  "dependencies": {
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3",
    "axios": "^1.7.2",
    "zustand": "^4.5.2",
    "react-webcam": "^7.2.0",
    "recharts": "^2.12.7",
    "face-api.js": "^0.22.2",
    "@supabase/supabase-js": "^2.43.4",
    "lucide-react": "^0.395.0"
  }
}
```

### Tools & Accounts needed
| Tool | Purpose | Cost |
|---|---|---|
| Supabase | Cloud PostgreSQL + pgvector | Free tier |
| Google Antigravity | AI code generation | As per your plan |
| VS Code | Code editor | Free |
| Postman | API testing | Free |
| Git + GitHub | Version control | Free |
| Node.js v20 | Run frontend | Free |
| Python 3.11 | Run backend | Free |

---

## Quick Reference — Key API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /auth/login | Faculty login |
| POST | /auth/register | Register faculty |
| GET | /students | List all students |
| POST | /students | Add student |
| POST | /students/:id/enroll | Enroll student face |
| GET | /courses | List courses |
| POST | /courses | Create course |
| GET | /timetable | Get weekly timetable |
| POST | /timetable | Add timetable slot |
| POST | /attendance/start | Start attendance session |
| POST | /attendance/process-frame | Process camera frame |
| POST | /attendance/end | End session |
| GET | /attendance/history | Past sessions |
| GET | /reports/summary | Dashboard stats |
| GET | /reports/attendance | Attendance report |
| GET | /reports/export | Download Excel |

---

*README last updated: Week 0 — Project initialized*
*Stack: FastAPI + Next.js + InsightFace + Supabase | Windows 10/11 | No Docker*
