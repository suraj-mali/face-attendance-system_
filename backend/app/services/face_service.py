class FaceService:
    _app = None

    @classmethod
    def initialize(cls):
        if cls._app is not None:
            return
        import insightface
        app = insightface.app.FaceAnalysis(name='buffalo_l', root='./face_models')
        app.prepare(ctx_id=-1)
        cls._app = app
        print('InsightFace loaded OK')

    def __init__(self):
        if FaceService._app is None:
            FaceService.initialize()
        self.app = FaceService._app

    def extract_embedding(self, img):
        import numpy as np
        from app.utils.image_utils import resize_image
        if img is None: return None
        try:
            img = resize_image(img, 640)
            faces = self.app.get(img)
            if not faces: return None
            largest = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1]))
            return np.array(largest.embedding, dtype=np.float32)
        except Exception as e:
            print(f'extract_embedding error: {e}')
            return None

    def detect_all_faces(self, frame_base64: str) -> list:
        from app.utils.image_utils import base64_to_numpy, resize_image
        import numpy as np
        try:
            img = base64_to_numpy(frame_base64)
            if img is None:
                print('detect_all_faces: decoded image is None')
                return []
            img = resize_image(img, 320)
            faces = self.app.get(img)
            if not faces:
                print('detect_all_faces: no faces found in frame')
                return []
            result = []
            for face in faces:
                score = float(face.det_score)
                print(f'Face found: det_score={score:.3f}')
                if score < 0.20:
                    print(f'Skipping face: score {score:.3f} below 0.20')
                    continue
                result.append({
                    'embedding': np.array(face.embedding, dtype=np.float32),
                    'bbox': face.bbox.tolist(),
                    'det_score': score
                })
            print(f'detect_all_faces: returning {len(result)} faces')
            return result
        except Exception as e:
            import traceback
            traceback.print_exc()
            return []

    def match_embedding(
        self,
        query_embedding,
        stored_records: list,
        threshold: float = 0.30
    ) -> dict or None:
        import numpy as np

        if not stored_records:
            print('match_embedding: no stored records')
            return None

        if query_embedding is None:
            print('match_embedding: query is None')
            return None

        try:
            # Normalize query once
            query = np.array(query_embedding, dtype=np.float32).flatten()
            nq = np.linalg.norm(query)
            if nq < 1e-6: return None
            query = query / nq
            
            # Build matrix of all stored embeddings
            valid_records = []
            embeddings_list = []
            for record in stored_records:
                try:
                    emb = record.get('face_embedding')
                    if emb is None: continue
                    import json
                    if isinstance(emb, str):
                        emb = json.loads(emb)
                    arr = np.array([float(x) for x in emb], dtype=np.float32)
                    ns = np.linalg.norm(arr)
                    if ns < 1e-6: continue
                    embeddings_list.append(arr / ns)
                    valid_records.append(record)
                except:
                    continue
            
            if not embeddings_list:
                print('No valid embeddings to compare')
                return None
            
            # Single matrix multiply = all scores at once (very fast)
            matrix = np.stack(embeddings_list)
            scores = matrix.dot(query)
            best_idx = int(np.argmax(scores))
            best_score = float(scores[best_idx])
            
            print(f'Best: {valid_records[best_idx].get("name")} score={best_score:.4f}')
            
            if best_score >= threshold:
                best = valid_records[best_idx]
                return {
                    'student_id': best['id'],
                    'name': best['name'],
                    'roll_number': best['roll_number'],
                    'confidence': round(best_score, 4)
                }
            return None

        except Exception as e:
            import traceback
            traceback.print_exc()
            return None

    def detect_emotion(self, img) -> str:
        import threading
        emotion_result = ['neutral']
        
        def _run():
            try:
                if img is None: return
                import cv2
                small = cv2.resize(img, (96, 96))
                from deepface import DeepFace
                r = DeepFace.analyze(
                    small,
                    actions=['emotion'],
                    enforce_detection=False,
                    detector_backend='opencv',
                    silent=True
                )
                if isinstance(r, list) and r:
                    emotion_result[0] = str(
                        r[0].get('dominant_emotion', 'neutral')
                    ).lower()
                elif isinstance(r, dict):
                    emotion_result[0] = str(
                        r.get('dominant_emotion', 'neutral')
                    ).lower()
            except Exception as e:
                print(f'Emotion error: {e}')
        
        t = threading.Thread(target=_run, daemon=True)
        t.start()
        t.join(timeout=0.4)
        return emotion_result[0]