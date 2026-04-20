from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRY_HOURS
from app.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_faculty(email: str, plain_password: str):
    db = get_db()
    result = db.table("faculty").select("*").eq("email", email).execute()
    
    if not result.data:
        return None
        
    user = result.data[0]
    
    stored_hash = user.get("password_hash") or user.get("password")
    if not stored_hash:
        return None
        
    if not verify_password(plain_password, stored_hash):
        return None
        
    return user

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token",
                            headers={"WWW-Authenticate": "Bearer"})

def get_current_faculty(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    payload = decode_token(credentials.credentials)
    faculty_id = payload.get("sub")
    if not faculty_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return {"faculty_id": faculty_id, "email": payload.get("email"), "name": payload.get("name")}