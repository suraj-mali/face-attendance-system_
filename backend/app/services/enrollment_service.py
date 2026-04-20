class EnrollmentService:
    def enroll_student(self, student_id: str, photos: list) -> dict:
        from app.services.face_service import FaceService
        from app.utils.image_utils import base64_to_numpy, validate_image_quality
        from app.database import get_db
        import numpy as np
        from datetime import datetime
        
        fs = FaceService()
        valid_embeddings = []
        
        for photo in photos:
            img = base64_to_numpy(photo)
            if img is None: continue
            ok, msg = validate_image_quality(img)
            if not ok:
                print(f"Skipping photo: {msg}")
                continue
            emb = fs.extract_embedding(img)
            if emb is None:
                print("No face detected in photo")
                continue
            valid_embeddings.append(emb)
        
        if not valid_embeddings:
            raise ValueError("No face detected in any photo. Use good lighting and face the camera directly.")
        
        final_emb = np.mean(valid_embeddings, axis=0)
        final_emb = final_emb.astype(np.float32)
        norm = np.linalg.norm(final_emb)
        if norm > 0:
            final_emb = final_emb / norm

        # Convert to plain Python list of native float values
        # This is critical — do NOT use str() or json.dumps()
        # Supabase needs a real Python list, not a string
        embedding_list = [float(x) for x in final_emb.tolist()]

        # Verify it is a list of floats before saving
        assert isinstance(embedding_list, list), 'embedding must be a list'
        assert isinstance(embedding_list[0], float), 'values must be float'
        assert len(embedding_list) > 100, 'embedding too short'
        
        print(f'Saving embedding: length={len(embedding_list)} type={type(embedding_list)} first_val_type={type(embedding_list[0])}')
        
        db = get_db()
        update_res = db.table('students').update({
            'face_embedding': embedding_list,
            'is_enrolled': True,
            'enrolled_at': datetime.now().isoformat()
        }).eq('id', student_id).execute()

        print(f'Supabase update result: {update_res.data}')
        
        if not update_res.data:
            print('WARNING: Update returned no data - checking if student exists')
            check = db.table('students').select('id').eq('id', student_id).execute()
            if not check.data:
                raise ValueError(f'Student {student_id} not found in database')
        
        return {"success": True, "embeddings_used": len(valid_embeddings), "student_id": student_id}

    def get_all_embeddings(self) -> list:
        from app.database import get_db
        import numpy as np
        import json

        db = get_db()
        result = db.table('students').select(
            'id, name, roll_number, face_embedding'
        ).eq('is_enrolled', True).execute()

        valid = []
        for r in (result.data or []):
            name = r.get('name', 'Unknown')
            emb = r.get('face_embedding')

            if emb is None:
                print(f'SKIP {name}: embedding is None')
                continue

            # Handle string format (legacy bug)
            if isinstance(emb, str):
                try:
                    emb = json.loads(emb)
                    print(f'CONVERTED {name}: string embedding parsed to list')
                except Exception as e:
                    print(f'SKIP {name}: cannot parse string embedding: {e}')
                    continue

            # Handle any other non-list type
            if not isinstance(emb, list):
                try:
                    emb = list(emb)
                except Exception as e:
                    print(f'SKIP {name}: cannot convert {type(emb)} to list: {e}')
                    continue

            # Validate length
            if len(emb) < 128:
                print(f'SKIP {name}: embedding too short ({len(emb)})')
                continue

            # Convert all values to float
            try:
                emb = [float(x) for x in emb]
            except Exception as e:
                print(f'SKIP {name}: cannot convert values to float: {e}')
                continue

            r['face_embedding'] = emb
            valid.append(r)

        print(f'get_all_embeddings: {len(valid)} valid embeddings loaded')
        return valid
