import numpy as np
import logging
from datetime import datetime
from typing import List, Dict, Any

from app.utils.image_utils import base64_to_numpy, validate_image_quality
from app.database import get_db
from app.services.face_service import FaceService

face_service = FaceService()
logger = logging.getLogger(__name__)

class EnrollmentService:
    def _get_db_client(self):
        # Handle cases where get_db() might be a generator (common in FastAPI dependencies)
        db_instance = get_db()
        if hasattr(db_instance, "__next__"):
            return next(db_instance)
        return db_instance

    def enroll_student(self, student_id: str, photos: List[str]) -> Dict[str, Any]:
        embeddings = []
        
        for idx, b64_photo in enumerate(photos):
            try:
                # Convert base64 string to numpy image array
                img = base64_to_numpy(b64_photo)
                
                # Check image quality
                if not validate_image_quality(img):
                    logger.warning(f"Image {idx} failed quality validation for student {student_id}")
                    continue
                    
                # Extract face embedding
                embedding = face_service.extract_embedding(img)
                if embedding is not None:
                    embeddings.append(embedding)
                else:
                    logger.warning(f"No face detected in image {idx} for student {student_id}")

            except Exception as e:
                logger.error(f"Error processing image {idx} for student {student_id}: {str(e)}")
                continue
                
        if not embeddings:
            raise ValueError("No face detected in any photo or all photos failed validation.")
            
        try:
            # Average embeddings for better representation
            avg_embedding = np.mean(embeddings, axis=0)
            
            # Normalize embedding to magnitude 1
            norm = np.linalg.norm(avg_embedding)
            if norm > 0:
                normalized_embedding = avg_embedding / norm
            else:
                normalized_embedding = avg_embedding
                
            embedding_list = normalized_embedding.tolist()
            
            # Update Supabase database safely
            db = self._get_db_client()
            update_data = {
                "face_embedding": embedding_list,
                "is_enrolled": True,
                "enrolled_at": datetime.now().isoformat()
            }
            
            response = db.table("students").update(update_data).eq("id", student_id).execute()
            
            if not response.data:
                raise Exception("Failed to update student record in Supabase database.")
                
            return {
                "success": True,
                "embeddings_used": len(embeddings),
                "student_id": student_id
            }
            
        except Exception as e:
            logger.error(f"Failed to enroll student {student_id}: {str(e)}")
            raise e

    def get_all_embeddings(self) -> List[Dict[str, Any]]:
        try:
            db = self._get_db_client()
            
            # Fetch all enrolled student embeddings
            response = db.table("students")\
                .select("id, name, roll_number, face_embedding")\
                .eq("is_enrolled", True)\
                .execute()
                
            return response.data
            
        except Exception as e:
            logger.error(f"Failed to retrieve embeddings from database: {str(e)}")
            raise e
