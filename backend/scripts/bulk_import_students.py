import csv, os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()
from app.database import get_db

def bulk_import(csv_path: str = "students_list.csv"):
    db = get_db()
    inserted = skipped = 0
    with open(csv_path, newline='', encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            if db.table('students').select('id').eq('roll_number', row['roll_number']).execute().data:
                print(f"SKIP — {row['roll_number']}"); skipped += 1; continue
            db.table('students').insert({
                "name": row['name'].strip(), "roll_number": row['roll_number'].strip(),
                "email": row.get('email', '').strip() or None,
                "division": row.get('division', 'B').strip(),
                "year": row.get('year', 'SY').strip(), "is_enrolled": False
            }).execute()
            print(f"INSERTED — {row['roll_number']} {row['name']}"); inserted += 1
    print(f"\nDone. Inserted: {inserted} | Skipped: {skipped}")

if __name__ == "__main__":
    bulk_import()