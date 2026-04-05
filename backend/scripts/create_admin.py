"""
Quick script to create a default faculty/admin account.
Usage:
  python scripts/create_admin.py           # Create admin (skip if exists)
  python scripts/create_admin.py --reset   # Reset password hash for existing admin
"""
import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()

import bcrypt
from app.database import get_db

# Edit these as needed
NAME       = "Admin Faculty"
EMAIL      = "admin@college.edu"
PASSWORD   = "admin@123"
DEPARTMENT = "Computer Engineering"

def create_admin(reset=False):
    db = get_db()
    hashed = bcrypt.hashpw(PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    existing = db.table("faculty").select("id").eq("email", EMAIL).execute()

    if existing.data:
        if reset:
            db.table("faculty").update({"password_hash": hashed}).eq("email", EMAIL).execute()
            print(f"Password reset for '{EMAIL}'")
            print(f"   Password: {PASSWORD}")
        else:
            print(f"Faculty '{EMAIL}' already exists. Use --reset to update password hash.")
        return

    result = db.table("faculty").insert({
        "name": NAME,
        "email": EMAIL,
        "password_hash": hashed,
        "department": DEPARTMENT,
    }).execute()

    if result.data:
        print(f"Admin created successfully!")
        print(f"   Email   : {EMAIL}")
        print(f"   Password: {PASSWORD}")
    else:
        print("Failed to create admin. Check your Supabase config.")

if __name__ == "__main__":
    reset = "--reset" in sys.argv
    create_admin(reset=reset)
