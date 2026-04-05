import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from io import BytesIO

def generate_attendance_excel(course_name, course_code, report_data, from_date, to_date) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Attendance Report"

    ws.merge_cells("A1:F1")
    ws["A1"] = f"Attendance Report — {course_name} ({course_code})"
    ws["A1"].font = Font(bold=True, size=14)
    ws["A1"].alignment = Alignment(horizontal="center")

    ws.merge_cells("A2:F2")
    ws["A2"] = f"Period: {from_date} to {to_date}"
    ws["A2"].alignment = Alignment(horizontal="center")

    headers = ["Roll No", "Student Name", "Total Classes", "Present", "Absent", "Attendance %"]
    hdr_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    hdr_font = Font(color="FFFFFF", bold=True)
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=4, column=col, value=h)
        cell.fill = hdr_fill
        cell.font = hdr_font
        cell.alignment = Alignment(horizontal="center")

    red_fill = PatternFill(start_color="FFE4E4", end_color="FFE4E4", fill_type="solid")
    green_fill = PatternFill(start_color="E4FFE4", end_color="E4FFE4", fill_type="solid")

    for i, s in enumerate(report_data, 5):
        absent = s["total_classes"] - s["present"]
        fill = red_fill if s["percentage"] < 75 else green_fill
        for col, val in enumerate([s["roll_number"], s["name"], s["total_classes"],
                                    s["present"], absent, f"{s['percentage']:.1f}%"], 1):
            cell = ws.cell(row=i, column=col, value=val)
            cell.fill = fill
            cell.alignment = Alignment(horizontal="center")

    for col, w in zip(["A","B","C","D","E","F"], [12,25,15,10,10,15]):
        ws.column_dimensions[col].width = w

    out = BytesIO()
    wb.save(out)
    out.seek(0)
    return out.read()