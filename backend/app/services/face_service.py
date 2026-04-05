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