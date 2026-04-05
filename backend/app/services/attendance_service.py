import numpy as np
import logging
from typing import Optional, Dict, Any

from app.database import get_db
from app.services.enrollment_service import EnrollmentService

enrollment_service = EnrollmentService()
logger = logging.getLogger(__name__)

class AttendanceService:
    def _get_db_client(self):
        # Safely resolve Supabase client from get_db dependency
        db_instance = get_db()
        if hasattr(db_instance, "__next__"):
            return next(db_instance)
        return db_instance

    def match_face(self, query_embedding: np.ndarray, threshold: float = 0.5) -> Optional[Dict[str, Any]]:
        try:
            students = enrollment_service.get_all_embeddings()
            if not students:
                return None
                
            best_match = None
            highest_score = -1.0
            
            query_norm = np.linalg.norm(query_embedding)
            if query_norm == 0:
                return None
                
            for student in students:
                face_embedding = student.get("face_embedding")
                if not face_embedding:
                    continue
                    
                student_emb = np.array(face_embedding)
                student_norm = np.linalg.norm(student_emb)
                
                if student_norm == 0:
                    continue
                    
                # Cosine similarity
                sim = np.dot(query_embedding, student_emb) / (query_norm * student_norm)
                
                if sim > highest_score:
                    highest_score = sim
                    best_match = student
                    
            if highest_score >= threshold:
                return best_match
                
            return None
            
        except Exception as e:
            logger.error(f"Error matching face: {str(e)}")
            return None

    def is_already_marked(self, session_id: str, student_id: str) -> bool:
        try:
            db = self._get_db_client()
            response = db.table("attendance_records")\
                .select("id")\
                .eq("session_id", session_id)\
                .eq("student_id", student_id)\
                .execute()
                
            return len(response.data) > 0
        except Exception as e:
            logger.error(f"Error checking if already marked: {str(e)}")
            return False

    def get_session_present_count(self, session_id: str) -> int:
        try:
            db = self._get_db_client()
            response = db.table("attendance_records")\
                .select("id", count="exact")\
                .eq("session_id", session_id)\
                .eq("is_present", True)\
                .execute()
                
            return response.count if hasattr(response, "count") and response.count is not None else len(response.data)
        except Exception as e:
            logger.error(f"Error getting session present count: {str(e)}")
            return 0
