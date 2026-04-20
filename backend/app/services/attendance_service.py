import numpy as np
from app.database import get_db
from app.services.enrollment_service import EnrollmentService

enrollment_service = EnrollmentService()

class AttendanceService:
    def match_face(self, query_embedding: np.ndarray, threshold: float = 0.55):
        stored_records = enrollment_service.get_all_embeddings()
        if not stored_records:
            return None
            
        best_score = -1.0
        best_match = None
        
        for record in stored_records:
            stored = np.array(record["face_embedding"])
            nq = np.linalg.norm(query_embedding)
            ns = np.linalg.norm(stored)
            
            if nq == 0 or ns == 0:
                continue
                
            score = float(np.dot(query_embedding, stored) / (nq * ns))
            if score > best_score:
                best_score = score
                best_match = record
                
        if best_match and best_score >= threshold:
            return {
                "student_id": best_match["id"],
                "name": best_match["name"],
                "roll_number": best_match["roll_number"],
                "confidence": round(best_score, 4)
            }
            
        return None

    def is_already_marked(self, session_id: str, student_id: str) -> bool:
        db = get_db()
        result = db.table("attendance_records").select("id").eq("session_id", session_id).eq("student_id", student_id).execute()
        return len(result.data or []) > 0

    def get_session_present_count(self, session_id: str) -> int:
        db = get_db()
        result = db.table("attendance_records").select("id").eq("session_id", session_id).eq("is_present", True).execute()
        return len(result.data or [])
