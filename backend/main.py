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


import traceback
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes import auth, faculty, courses, timetable, students, attendance, reports
from app.services.face_service import FaceService

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up Face Attendance API...")
    FaceService.initialize()
    yield

app = FastAPI(
    title="Face Recognition Attendance System API",
    version="1.0.0",
    lifespan=lifespan
)

# THIS IS THE KEY PART — forces ALL errors to print in terminal
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()  # prints full traceback in uvicorn terminal
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__}
    )

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(faculty.router, prefix="/faculty", tags=["Faculty"])
app.include_router(students.router, prefix="/students", tags=["Students"])
app.include_router(courses.router, prefix="/courses", tags=["Courses"])
app.include_router(timetable.router, prefix="/timetable", tags=["Timetable"])
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])

@app.get("/")
async def root():
    return {"status": "ok", "service": "Face Attendance API", "version": "1.0.0"}