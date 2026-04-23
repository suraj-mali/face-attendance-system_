from datetime import datetime, date, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from app.services.auth_service import get_current_faculty
from app.database import get_db
from pydantic import BaseModel
from typing import Optional, List

_session_embedding_cache: dict = {}
_session_prepared_cache: dict = {}

from app.services.face_service import FaceService
_face_service = FaceService()

router = APIRouter()

class SessionStart(BaseModel):
    course_id: str

class FrameProcess(BaseModel):
    session_id: str
    frame: str

class SessionEnd(BaseModel):
    session_id: str

@router.post("/start")
def start_session(body: SessionStart, current_faculty=Depends(get_current_faculty)):
    faculty_id = current_faculty["faculty_id"]
    try:
        db = get_db()
        
        from datetime import date
        today = date.today().isoformat()

        # Check if a session already exists for this course today
        # that was started in the last 10 minutes (prevents duplicates)
        from datetime import datetime, timedelta
        ten_mins_ago = (datetime.now() - timedelta(minutes=10)).isoformat()

        existing_res = db.table('attendance_sessions').select(
            'id, started_at'
        ).eq('course_id', body.course_id).eq(
            'faculty_id', faculty_id
        ).eq('session_date', today).gte(
            'started_at', ten_mins_ago
        ).execute()

        if existing_res.data:
            # Return the existing session instead of creating a new one
            existing = existing_res.data[0]
            existing_id = existing['id']
            print(f'Duplicate session detected! Returning existing session {existing_id}')

            # Get course name
            course_res = db.table('courses').select(
                'name, code'
            ).eq('id', body.course_id).execute()
            course_name = course_res.data[0]['name'] if course_res.data else 'Unknown'

            # Get total enrolled students
            enrolled_res = db.table('students').select(
                'id', count='exact'
            ).eq('is_enrolled', True).execute()
            total = enrolled_res.count or 0

            return {
                'session_id': existing_id,
                'course_name': course_name,
                'total_students': total,
                'started_at': existing['started_at'],
                'is_existing': True
            }

        course_res = db.table("courses").select("id, name, code").eq("id", body.course_id).eq("faculty_id", faculty_id).execute()
        if not course_res.data:
            raise HTTPException(status_code=404, detail="Course not found or does not belong to you")
        course = course_res.data[0]
        course_name = course["name"]

        enrolled_res = db.table("students").select("id", count="exact").eq("is_enrolled", True).execute()
        total_students = enrolled_res.count if enrolled_res.count is not None else len(enrolled_res.data or [])

        session_data = {
            "course_id": body.course_id,
            "faculty_id": faculty_id,
            "session_date": date.today().isoformat(),
            "started_at": datetime.now().isoformat(),
            "total_students": total_students,
            "present_count": 0
        }
        
        session_res = db.table("attendance_sessions").insert(session_data).execute()
        if not session_res.data:
            raise HTTPException(status_code=500, detail="Failed to create session in database")
        session_id = session_res.data[0]["id"]
        
        # Clear any stale caches for this new session
        _session_embedding_cache.pop(session_id, None)
        _session_prepared_cache.pop(session_id, None)
        # Clear marked cache for this session
        cache_key = '_marked_' + session_id
        if cache_key in _session_prepared_cache:
            del _session_prepared_cache[cache_key]
        
        print(f'New session {session_id} started clean')

        return {
            "session_id": session_id,
            "course_name": course_name,
            "total_students": total_students,
            "started_at": datetime.now().isoformat()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")

@router.post("/process-frame")
def process_frame(body: FrameProcess, current_faculty=Depends(get_current_faculty)):
    faculty_id = current_faculty['faculty_id']
    
    try:
      db = get_db()
      
      # Validate session exists
      session_res = db.table('attendance_sessions').select('*').eq('id', body.session_id).execute()
      if not session_res.data:
        raise HTTPException(status_code=404, detail='Session not found')
      session = session_res.data[0]
      
      # Load and cache embeddings once per session
      if body.session_id not in _session_embedding_cache:
        from app.services.enrollment_service import EnrollmentService
        es = EnrollmentService()
        cached = es.get_all_embeddings()
        _session_embedding_cache[body.session_id] = cached
        print(f'Cached {len(cached)} embeddings for session {body.session_id}')
      
      stored = _session_embedding_cache[body.session_id]
      
      if not stored:
        print('WARNING: No enrolled students with embeddings!')
        return {'detected': [], 'total_present': 0,
                'warning': 'No enrolled students. Please enroll students first.'}
      
      # Detect faces
      detected_faces = _face_service.detect_all_faces(body.frame)
      print(f'process-frame: {len(detected_faces)} faces detected')
      
      if not detected_faces:
        return {'detected': [], 'total_present': 0}
      
      result_list = []
      from datetime import date
      from app.utils.image_utils import base64_to_numpy
      full_frame_img = base64_to_numpy(body.frame)
      
      for face in detected_faces:
        embedding = face.get('embedding')
        bbox = face.get('bbox', [0, 0, 100, 100])
        
        if embedding is None:
          result_list.append({'is_unknown': True, 'bbox': bbox,
                              'student_id': None, 'name': 'Unknown'})
          continue
        
        matched = _face_service.match_embedding(embedding, stored)
        
        if matched:
          # Always check database directly — do not rely on stale memory cache
          already_marked = False
          try:
              dup_res = db.table('attendance_records').select(
                  'id'
              ).eq('session_id', body.session_id).eq(
                  'student_id', matched['student_id']
              ).execute()
              already_marked = len(dup_res.data or []) > 0
          except Exception as dup_err:
              print(f'Duplicate check error: {dup_err}')
              already_marked = False

          print(f'{matched["name"]}: already_marked={already_marked}')
          
          if not already_marked:
            db.table('attendance_records').insert({
              'session_id': body.session_id,
              'student_id': matched['student_id'],
              'course_id': session['course_id'],
              'session_date': date.today().isoformat(),
              'is_present': True,
              'confidence_score': matched['confidence'],
              'marked_by': 'face_recognition'
            }).execute()
            print(f'MARKED PRESENT: {matched["name"]} confidence={matched["confidence"]}')
          
          # Detect emotion — runs only when student is matched
          # Does not affect attendance marking if it fails
          emotion = 'neutral'
          try:
              if full_frame_img is not None:
                  # Crop face using bbox
                  x1, y1, x2, y2 = [int(v) for v in bbox]
                  h, w = full_frame_img.shape[:2]
                  
                  # Add 20px padding for better emotion detection
                  px1 = max(0, x1 - 20)
                  py1 = max(0, y1 - 20)
                  px2 = min(w, x2 + 20)
                  py2 = min(h, y2 + 20)
                  
                  face_crop = full_frame_img[py1:py2, px1:px2]
                  
                  if face_crop.size > 0:
                      emotion = _face_service.detect_emotion(face_crop)
          except Exception as emotion_err:
              print(f'Emotion step skipped: {emotion_err}')
              emotion = 'neutral'

          # Save emotion to the attendance record
          if not already_marked:
              try:
                  db.table('attendance_records').update({
                      'emotion': emotion
                  }).eq('session_id', body.session_id).eq(
                      'student_id', matched['student_id']
                  ).execute()
              except Exception as save_err:
                  print(f'Could not save emotion: {save_err}')
          
          result_list.append({
            'student_id': matched['student_id'],
            'name': matched['name'],
            'roll_number': matched['roll_number'],
            'confidence': matched['confidence'],
            'emotion': emotion,
            'bbox': bbox,
            'already_marked': already_marked,
            'is_unknown': False
          })
        else:
          result_list.append({
            'is_unknown': True, 'bbox': bbox,
            'student_id': None, 'name': 'Unknown', 'confidence': 0,
            'emotion': 'unknown'
          })
      
      # Count total present
      present = db.table('attendance_records').select('id').eq(
        'session_id', body.session_id).eq('is_present', True).execute()
      
      return {'detected': result_list, 'total_present': len(present.data or [])}
    
    except HTTPException:
      raise
    except Exception as e:
      import traceback
      traceback.print_exc()
      return {'detected': [], 'total_present': 0, 'error': str(e)}

@router.post("/end")
def end_session(body: SessionEnd, current_faculty=Depends(get_current_faculty)):
    faculty_id = current_faculty['faculty_id']
    try:
      db = get_db()
      from datetime import datetime, date
      
      session_res = db.table('attendance_sessions').select('*').eq('id', body.session_id).execute()
      if not session_res.data:
        raise HTTPException(status_code=404, detail='Session not found')
      session = session_res.data[0]
      
      # Count present
      present_res = db.table('attendance_records').select('student_id').eq(
        'session_id', body.session_id).eq('is_present', True).execute()
      present_ids = set(r['student_id'] for r in (present_res.data or []))
      
      # Mark absents
      all_students = db.table('students').select('id').eq('is_enrolled', True).execute()
      all_ids = [r['id'] for r in (all_students.data or [])]
      
      for sid in all_ids:
        if sid not in present_ids:
          exists = db.table('attendance_records').select('id').eq(
            'session_id', body.session_id).eq('student_id', sid).execute()
          if not exists.data:
            try:
              db.table('attendance_records').insert({
                'session_id': body.session_id,
                'student_id': sid,
                'course_id': session['course_id'],
                'session_date': date.today().isoformat(),
                'is_present': False,
                'marked_by': 'auto_absent'
              }).execute()
            except:
              pass
      
      # Update session
      now = datetime.now()
      try:
        started = datetime.fromisoformat(str(session['started_at']).replace('Z','').split('.')[0])
        duration = round((now - started).total_seconds() / 60, 1)
      except:
        duration = 0
      
      db.table('attendance_sessions').update({
        'ended_at': now.isoformat(),
        'present_count': len(present_ids),
        'total_students': len(all_ids)
      }).eq('id', body.session_id).execute()
      
      _session_embedding_cache.pop(body.session_id, None)
      
      return {
        'session_id': body.session_id,
        'present_count': len(present_ids),
        'absent_count': len(all_ids) - len(present_ids),
        'total_students': len(all_ids),
        'duration_minutes': duration
      }
    
    except HTTPException:
      raise
    except Exception as e:
      import traceback
      traceback.print_exc()
      raise HTTPException(status_code=500, detail=f'End session error: {str(e)}')

@router.get("/history")
def get_attendance_history(
    request: Request,
    current_faculty: dict = Depends(get_current_faculty)
):
    faculty_id = current_faculty['faculty_id']

    try:
        db = get_db()

        # Build query
        query = db.table('attendance_sessions').select(
            'id, course_id, faculty_id, session_date, '
            'started_at, ended_at, total_students, present_count, '
            'courses(id, name, code)'
        ).eq('faculty_id', faculty_id)

        # Optional course filter
        course_id = request.query_params.get('course_id')
        if course_id and course_id.strip():
            query = query.eq('course_id', course_id.strip())

        result = query.order('started_at', desc=True).limit(50).execute()

        sessions = []
        for s in (result.data or []):
            course = s.get('courses') or {}
            total = s.get('total_students') or 0
            present = s.get('present_count') or 0
            pct = round(present / total * 100, 1) if total > 0 else 0.0

            sessions.append({
                'id': s['id'],
                'course_id': s.get('course_id'),
                'course_name': course.get('name', 'Unknown'),
                'course_code': course.get('code', ''),
                'session_date': s.get('session_date', ''),
                'started_at': s.get('started_at', ''),
                'ended_at': s.get('ended_at', ''),
                'total_students': total,
                'present_count': present,
                'absent_count': total - present,
                'attendance_percentage': pct
            })

        return {'sessions': sessions, 'total': len(sessions)}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f'History fetch error: {str(e)}'
        )

@router.get("/session/{session_id}/records")
def get_session_records(
    session_id: str,
    current_faculty: dict = Depends(get_current_faculty)
):
    faculty_id = current_faculty['faculty_id']

    try:
        db = get_db()

        records_res = db.table('attendance_records').select(
            'id, student_id, is_present, confidence_score, '
            'marked_at, marked_by, '
            'students(id, name, roll_number)'
        ).eq('session_id', session_id).execute()

        records = []
        for r in (records_res.data or []):
            student = r.get('students') or {}
            records.append({
                'id': r['id'],
                'student_id': r.get('student_id'),
                'name': student.get('name', 'Unknown'),
                'roll_number': student.get('roll_number', ''),
                'is_present': r.get('is_present', False),
                'confidence_score': r.get('confidence_score'),
                'marked_at': r.get('marked_at', ''),
                'marked_by': r.get('marked_by', '')
            })

        present = [r for r in records if r['is_present']]
        absent = [r for r in records if not r['is_present']]

        return {
            'session_id': session_id,
            'records': records,
            'present_count': len(present),
            'absent_count': len(absent),
            'total': len(records)
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f'Records fetch error: {str(e)}'
        )

@router.get("/debug/embeddings")
def debug_embeddings(current_faculty: dict = Depends(get_current_faculty)):
    db = get_db()
    result = db.table("students").select("id, name, roll_number, is_enrolled, face_embedding").execute()
    summary = []
    for r in (result.data or []):
        emb = r.get("face_embedding")
        summary.append({
            "name": r["name"],
            "roll_number": r["roll_number"],
            "is_enrolled": r["is_enrolled"],
            "has_embedding": emb is not None,
            "embedding_length": len(emb) if isinstance(emb, list) else 0
        })
    return {"students": summary, "total": len(summary)}
