# import os
# import bcrypt
# from datetime import datetime, timedelta, timezone
# from typing import Optional

# from dotenv import load_dotenv
# from fastapi import APIRouter, Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordBearer
# from jose import JWTError, jwt
# from pydantic import BaseModel, EmailStr
# from supabase import create_client, Client


# # Load environment variables
# load_dotenv()

# # Initialize Supabase client
# SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# if not SUPABASE_URL or not SUPABASE_KEY:
#     raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")

# supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# # JWT settings
# JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key")
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# # Password hashing — using bcrypt directly (avoids passlib compatibility issues)
# # (no CryptContext needed — using bcrypt directly)

# # FastAPI router and security definitions
# router = APIRouter()
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# # --- Models ---
# class LoginRequest(BaseModel):
#     email: EmailStr
#     password: str

# class RegisterRequest(BaseModel):
#     name: str
#     email: EmailStr
#     password: str
#     department: str


# # --- Helper Methods ---
# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# def get_password_hash(password: str) -> str:
#     return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
#     to_encode = data.copy()
#     if expires_delta:
#         expire = datetime.now(timezone.utc) + expires_delta
#     else:
#         expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
#     return encoded_jwt

# async def get_current_faculty(token: str = Depends(oauth2_scheme)) -> dict:
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Could not validate credentials",
#         headers={"WWW-Authenticate": "Bearer"},
#     )
    
#     # Extract JWT payload
#     try:
#         payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
#         faculty_id: str = payload.get("sub")
#         if faculty_id is None:
#             raise credentials_exception
#     except JWTError:
#         raise credentials_exception
        
#     # Query Supabase by ID
#     try:
#         res = supabase.table("faculty").select("*").eq("id", faculty_id).execute()
#         if not res.data:
#             raise credentials_exception
#         return res.data[0]
#     except Exception as e:
#         # Prevent leaking database exceptions directly
#         print(f"Supabase error looking up faculty: {e}")
#         raise credentials_exception


# # --- Routes ---
# @router.post("/register", status_code=status.HTTP_201_CREATED)
# async def register_faculty(req: RegisterRequest):
#     # 1. Check if email already exists
#     existing = supabase.table("faculty").select("id").eq("email", req.email).execute()
#     if existing.data:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Email already registered."
#         )
        
#     # 2. Hash password with bcrypt
#     hashed_password = get_password_hash(req.password)
    
#     # 3. Insert into Supabase table
#     faculty_data = {
#         "name": req.name,
#         "email": req.email,
#         "password_hash": hashed_password,
#         "department": req.department,
#     }
    
#     try:
#         response = supabase.table("faculty").insert(faculty_data).execute()
#         if not response.data:
#             raise Exception("No data returned on insert.")
            
#         inserted_id = response.data[0]["id"]
        
#         return {
#             "message": "Faculty registered", 
#             "faculty_id": inserted_id
#         }
#     except Exception as e:
#         print(f"Registration Error: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to register faculty: {str(e)}"
#         )


# @router.post("/login")
# async def login_faculty(req: LoginRequest):
#     # 1. Query Supabase "faculty" table
#     response = supabase.table("faculty").select("*").eq("email", req.email).execute()
    
#     if not response.data:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Incorrect email or password",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
        
#     faculty = response.data[0]
    
#     # 2. Verify password with passlib
#     try:
#         password_ok = verify_password(req.password, faculty["password_hash"])
#     except Exception as e:
#         print(f"Password verify error: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Auth backend error: {str(e)}"
#         )
#     if not password_ok:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Incorrect email or password",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
        
#     # 3. Create JSON Web Token
#     access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     token_data = {
#         "sub": str(faculty["id"]),
#         "email": faculty["email"]
#     }
#     access_token = create_access_token(data=token_data, expires_delta=access_token_expires)
    
#     # Include 'token' key alongside access_token for frontend interoperability depending on your client expectations
#     return {
#         "access_token": access_token,
#         "token": access_token,
#         "token_type": "bearer",
#         "faculty_name": faculty["name"],
#         "faculty_id": faculty["id"]
#     }


# @router.get("/me")
# async def get_my_profile(current_faculty: dict = Depends(get_current_faculty)):
#     # Clean up sensitive data before returning
#     safe_faculty = current_faculty.copy()
#     safe_faculty.pop("password_hash", None)
    
#     return safe_faculty


import os
import bcrypt
import traceback
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr

# Standardized import from your database.py
from app.database import supabase

load_dotenv()

# JWT Settings
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    department: str

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

# @router.post("/login")
# async def login_faculty(req: LoginRequest):
#     try:
#         # Step 1: Query Supabase
#         response = supabase.table("faculty").select("*").eq("email", req.email).execute()
        
#         if not response.data:
#             raise HTTPException(status_code=401, detail="Invalid email or password")
            
#         faculty = response.data[0]
        
#         # Step 2: Check Password
#         if not verify_password(req.password, faculty["password_hash"]):
#             raise HTTPException(status_code=401, detail="Invalid email or password")
            
#         # Step 3: Token Generation
#         token_data = {"sub": str(faculty["id"]), "email": faculty["email"]}
#         token = create_access_token(data=token_data, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        
#         return {
#             "access_token": token,
#             "token_type": "bearer",
#             "faculty_name": faculty["name"],
#             "faculty_id": faculty["id"]
#         }
#     except HTTPException as he:
#         raise he
#     except Exception as e:
#         print("--- DATABASE OR SERVER ERROR ---")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login_faculty(req: dict): # Changed from LoginRequest to dict to bypass Pydantic
    print("\n" + "="*30)
    print("DEBUG: LOGIN PROCESS STARTED")
    
    try:
        # Manually extract from dict since we bypassed Pydantic
        email = req.get("email")
        password = req.get("password")
        print(f"DEBUG: Attempting login for: {email}")

        if not email or not password:
            print("DEBUG: Missing email or password in request body")
            return {"error": "Missing credentials"}

        # 1. Test Supabase Connection
        print("DEBUG: Connecting to Supabase...")
        response = supabase.table("faculty").select("*").eq("email", email).execute()
        print(f"DEBUG: Supabase response received. Rows found: {len(response.data)}")
        
        if not response.data:
            print("DEBUG: No user found with that email")
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        faculty = response.data[0]
        
        # 2. Test Password Hash
        print("DEBUG: Verifying password...")
        stored_hash = faculty.get("password_hash")
        if not stored_hash:
            print("DEBUG: CRITICAL - password_hash column is empty in DB!")
            raise Exception("DB Schema Error: password_hash is missing")
            
        is_ok = verify_password(password, stored_hash)
        print(f"DEBUG: Password match: {is_ok}")
        
        if not is_ok:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # 3. Test Token Generation
        print("DEBUG: Generating JWT token...")
        token_data = {"sub": str(faculty["id"]), "email": faculty["email"]}
        access_token = create_access_token(data=token_data)
        print("DEBUG: JWT Created successfully")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "faculty_name": faculty.get("name")
        }

    except Exception as e:
        print("!!! LOGIC CRASHED !!!")
        print(f"ERROR TYPE: {type(e).__name__}")
        print(f"ERROR MESSAGE: {str(e)}")
        traceback.print_exc()
        return {"debug_error": str(e), "trace": "Check terminal"}

@router.post("/register")
async def register_faculty(req: RegisterRequest):
    # (Keeping this brief to ensure no syntax errors)
    hashed = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    data = {"name": req.name, "email": req.email, "password_hash": hashed, "department": req.department}
    res = supabase.table("faculty").insert(data).execute()
    return {"status": "success", "id": res.data[0]["id"]}