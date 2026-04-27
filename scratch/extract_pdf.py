import PyPDF2

pdf_path = r"c:\Users\biswa\Desktop\Meal-Planning-using-GA\Internship_Report_draft (4) example.pdf"
output_path = r"c:\Users\biswa\Desktop\Meal-Planning-using-GA\scratch\pdf_content.md"

try:
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n\n---\n\n"
            
    import os
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Successfully extracted PDF to " + output_path)
except Exception as e:
    print(f"Error: {e}")
