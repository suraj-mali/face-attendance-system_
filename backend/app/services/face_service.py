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
            img = resize_image(img, 480)
            faces = self.app.get(img)
            if not faces:
                print('detect_all_faces: no faces found in frame')
                return []
            result = []
            for face in faces:
                score = float(face.det_score)
                print(f'Face found: det_score={score:.3f}')
                if score < 0.30:
                    print(f'Skipping face: score {score:.3f} below 0.30')
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
        import json

        if not stored_records:
            print('match_embedding: no stored records')
            return None

        if query_embedding is None:
            print('match_embedding: query is None')
            return None

        try:
            # Normalize query embedding
            query = np.array(query_embedding, dtype=np.float32).flatten()
            nq = np.linalg.norm(query)
            if nq < 1e-6:
                print('match_embedding: query norm is zero')
                return None
            query = query / nq

            best_score = -1.0
            best_match = None

            for record in stored_records:
                try:
                    emb_data = record.get('face_embedding')
                    if emb_data is None:
                        continue

                    # Handle string format
                    if isinstance(emb_data, str):
                        emb_data = json.loads(emb_data)

                    # Convert to float32 numpy array
                    stored = np.array(
                        [float(x) for x in emb_data],
                        dtype=np.float32
                    ).flatten()

                    # Shapes must match
                    if stored.shape[0] != query.shape[0]:
                        print(f'Shape mismatch for {record.get("name")}: {query.shape} vs {stored.shape}')
                        continue

                    # Normalize stored
                    ns = np.linalg.norm(stored)
                    if ns < 1e-6:
                        continue
                    stored_norm = stored / ns

                    # Cosine similarity
                    score = float(np.dot(query, stored_norm))

                    if score > best_score:
                        best_score = score
                        best_match = record

                except Exception as e:
                    print(f'Error comparing {record.get("name")}: {e}')
                    continue

            name = best_match.get('name') if best_match else 'None'
            print(f'match_embedding: best={best_score:.4f} ({name}) threshold={threshold}')

            if best_score >= threshold and best_match:
                return {
                    'student_id': best_match['id'],
                    'name': best_match['name'],
                    'roll_number': best_match['roll_number'],
                    'confidence': round(best_score, 4)
                }

            return None

        except Exception as e:
            import traceback
            traceback.print_exc()
            return None

    def detect_emotion(self, img) -> str:
        """
        Detect the dominant emotion from a face image.
        Returns one of: happy, sad, angry, neutral, 
        surprised, fearful, disgusted
        Returns 'neutral' if detection fails for any reason.
        This method never raises an exception.
        """
        try:
            if img is None:
                return 'neutral'

            from deepface import DeepFace

            # Use enforce_detection=False so it does not crash
            # if face is partially visible
            analysis = DeepFace.analyze(
                img,
                actions=['emotion'],
                enforce_detection=False,
                silent=True
            )

            # DeepFace returns a list or dict depending on version
            if isinstance(analysis, list) and len(analysis) > 0:
                emotion = analysis[0].get('dominant_emotion', 'neutral')
            elif isinstance(analysis, dict):
                emotion = analysis.get('dominant_emotion', 'neutral')
            else:
                return 'neutral'

            result = str(emotion).lower().strip()
            print(f'Emotion detected: {result}')
            return result

        except Exception as e:
            # Emotion detection is optional — never block attendance
            print(f'Emotion detection skipped: {e}')
            return 'neutral'