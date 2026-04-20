from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_KEY

def get_db() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)