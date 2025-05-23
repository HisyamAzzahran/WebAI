from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import datetime
from threading import Timer
from openai import OpenAI
import sqlite3
import os
import bcrypt
import base64
import json
import time
import fitz  # PyMuPDF
from docx import Document
import re
import uuid
from werkzeug.utils import secure_filename
from datetime import timezone

from auth import init_db, register_user, login_user

# Load environment variables
load_dotenv()

# Init Flask
app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///webai.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
DB_NAME = "webai.db"

TOKEN_COST_STUDENT_GOALS = 3

UPLOADS_FOLDER_GOALS = os.path.join(app.root_path, 'uploads', 'student_goals_files')
if not os.path.exists(UPLOADS_FOLDER_GOALS):
    os.makedirs(UPLOADS_FOLDER_GOALS, exist_ok=True)
# Init SQLAlchemy
db = SQLAlchemy(app)

# Init OpenAI Client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(120), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    tokens = db.Column(db.Integer, default=10)
    is_premium = db.Column(db.Boolean, default=False)

# Feature Log Model
class FeatureLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    feature = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# Create all tables
with app.app_context():
    db.create_all()

# Manual table for Ikigai tracking (if not using SQLAlchemy for this one)
conn = sqlite3.connect(DB_NAME)
cursor = conn.cursor()

# Buat tabel track_ikigai jika belum ada
cursor.execute("""
CREATE TABLE IF NOT EXISTS track_ikigai (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    nama TEXT NOT NULL,
    mbti TEXT NOT NULL,
    via TEXT NOT NULL,
    career TEXT NOT NULL,
    ikigai_spot TEXT NOT NULL,
    slice_purpose TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")

# Buat tabel track_swot jika belum ada
cursor.execute("""
CREATE TABLE IF NOT EXISTS track_swot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  nama TEXT NOT NULL,
  mbti TEXT NOT NULL,
  via1 TEXT NOT NULL,
  via2 TEXT NOT NULL,
  via3 TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS student_goals_plans (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    nama_input TEXT NOT NULL,
    jurusan_input TEXT NOT NULL,
    semester_input_awal INTEGER NOT NULL,
    mode_action_input TEXT NOT NULL,
    swot_file_ref TEXT,
    ikigai_file_ref TEXT,
    target_semester_plan INTEGER NOT NULL,
    plan_content TEXT NOT NULL,
    is_initial_data_source BOOLEAN DEFAULT FALSE,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email)
)
""")

conn.commit()
conn.close()

# Create static folder if not exists
if not os.path.exists("static"):
    os.makedirs("static")

# Auto delete temp file
def delete_file_later(path, delay=30):
    def delete():
        try:
            if os.path.exists(path):
                os.remove(path)
                print(f"[Auto Delete] File {path} telah dihapus.")
        except Exception as e:
            print(f"[Auto Delete Error] {str(e)}")
    Timer(delay, delete).start()

# Init custom database logic
init_db()

# Function to generate OpenAI completion
def generate_openai_response(prompt):
    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    return response.choices[0].message.content.strip()

@app.route("/register", methods=["POST"])
def register():
    return jsonify({"message": "Fitur pendaftaran sedang dinonaktifkan. Silakan gunakan akun yang sudah ada."}), 403

@app.route("/student-goals/generate", methods=["POST"])
def student_goals_generate():
    conn = None  # <--- TAMBAHKAN INISIALISASI INI
    try:
        email = request.form.get("email")
        nama = request.form.get("nama")
        jurusan = request.form.get("jurusan")
        semester_input_awal_str = request.form.get("semester_input_awal")
        target_semester_str = request.form.get("target_semester")
        mode_action = request.form.get("mode_action")

        is_regeneration_str = request.form.get("is_regeneration", "false")
        is_adding_super_plan_str = request.form.get("is_adding_super_plan", "false")
        plan_id_to_regenerate = request.form.get("plan_id_to_regenerate")

        swot_file_ref_from_req = request.form.get("swot_file_ref")
        ikigai_file_ref_from_req = request.form.get("ikigai_file_ref")

        is_regeneration = is_regeneration_str.lower() == 'true'
        is_adding_super_plan = is_adding_super_plan_str.lower() == 'true'
        is_initial_generation = not is_regeneration and not is_adding_super_plan

        if not email:
            # Jika return di sini, 'conn' belum di-assign, tapi karena sudah None, 'finally' aman
            return jsonify({"error": "Email wajib diisi."}), 400
        if not target_semester_str or not target_semester_str.isdigit():
            return jsonify({"error": "Target semester tidak valid."}), 400
        target_semester = int(target_semester_str)

        if is_initial_generation:
            if not all([nama, jurusan, semester_input_awal_str, mode_action]):
                return jsonify({"error": "Data awal (nama, jurusan, semester input, mode action) tidak lengkap."}), 400
            if not semester_input_awal_str.isdigit() or not (1 <= int(semester_input_awal_str) <= 14):
                 return jsonify({"error": "Semester input awal tidak valid (1-14)."}), 400
            if 'swot_pdf' not in request.files or 'ikigai_pdf' not in request.files:
                return jsonify({"error": "File SWOT dan Ikigai PDF wajib diunggah untuk rencana awal."}), 400
        elif (is_adding_super_plan or is_regeneration) and not all([nama, jurusan, mode_action]):
             return jsonify({"error": "Konteks data awal (nama, jurusan, mode action) diperlukan untuk menambah/regenerasi."}), 400

        # 'conn' baru di-assign di sini
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT is_premium, tokens FROM users WHERE email = ?", (email,))
        user_data = cursor.fetchone()

        if not user_data:
            # conn.close() tidak perlu di sini karena akan ditangani 'finally'
            return jsonify({"error": "User tidak ditemukan."}), 404

        is_premium_user, current_tokens = user_data
        if not is_premium_user:
            # conn.close() tidak perlu di sini
            return jsonify({"error": "Fitur ini hanya untuk pengguna Premium."}), 403
        if current_tokens < TOKEN_COST_STUDENT_GOALS:
            # conn.close() tidak perlu di sini
            return jsonify({"error": f"Token tidak cukup. Anda memerlukan {TOKEN_COST_STUDENT_GOALS} token."}), 403

        final_swot_file_ref = swot_file_ref_from_req
        final_ikigai_file_ref = ikigai_file_ref_from_req
        initial_data_refs_for_response = {}

        if is_initial_generation:
            swot_pdf_file = request.files['swot_pdf']
            ikigai_pdf_file = request.files['ikigai_pdf']
            
            swot_filename = secure_filename(f"{uuid.uuid4().hex}_{swot_pdf_file.filename}")
            ikigai_filename = secure_filename(f"{uuid.uuid4().hex}_{ikigai_pdf_file.filename}")
            
            final_swot_file_ref = os.path.join(UPLOADS_FOLDER_GOALS, swot_filename)
            final_ikigai_file_ref = os.path.join(UPLOADS_FOLDER_GOALS, ikigai_filename)
            
            try:
                swot_pdf_file.save(final_swot_file_ref)
                ikigai_pdf_file.save(final_ikigai_file_ref)
                initial_data_refs_for_response = {
                    "swot_file_ref": final_swot_file_ref,
                    "ikigai_file_ref": final_ikigai_file_ref
                }
            except Exception as e:
                # conn.close() tidak perlu di sini
                print(f"[File Save Error] {str(e)}")
                return jsonify({"error": f"Gagal menyimpan file: {str(e)}"}), 500
        
        prompt = f"""
Data Pengguna:
- Nama: {nama}
- Jurusan: {jurusan}
- Semester yang Direncanakan: {target_semester}
- Mode Action: {'Fast track (Cepat & Intensif)' if mode_action == 'fast' else 'Slow track (Bertahap & Fleksibel)'}

Tugas Anda:
Buatlah "Student Goals Planning" yang komprehensif untuk semester yang disebutkan.
Pastikan output terstruktur dengan baik dan mudah dibaca.

Format output yang diinginkan adalah sebagai berikut (gunakan Markdown):

# 📚 Misi Kuliah Semester {target_semester} Ini
(Berikan deskripsi singkat, 1-2 kalimat, mengenai fokus utama atau tema besar untuk semester ini berdasarkan data pengguna. Kaitkan dengan mode action jika memungkinkan.)

## 🎯 Mission Pack
(Detailkan minimal 2 Main Mission dan untuk setiap Main Mission, berikan minimal 2 Side Mission. Buatlah se-actionable mungkin!)

### Main Mission 1: [Judul Main Mission 1 yang Menarik dan Relevan]
   - **Deskripsi Singkat:** (1 kalimat penjelasan Main Mission ini)
   - **Target Utama:** (Indikator keberhasilan yang jelas dan terukur untuk Main Mission ini)
   - **Side Mission 1.1:** [Deskripsi Side Mission yang mendukung Main Mission 1]
     - *Action Steps:* (minimal 2 langkah konkret, spesifik, dan terukur)
       1. Langkah A...
       2. Langkah B...
   - **Side Mission 1.2:** [Deskripsi Side Mission lain yang mendukung Main Mission 1]
     - *Action Steps:*
       1. Langkah C...
       2. Langkah D...

### Main Mission 2: [Judul Main Mission 2 yang Menarik dan Relevan]
   - **Deskripsi Singkat:** (1 kalimat penjelasan Main Mission ini)
   - **Target Utama:** (Indikator keberhasilan yang jelas dan terukur untuk Main Mission ini)
   - **Side Mission 2.1:** [Deskripsi Side Mission yang mendukung Main Mission 2]
     - *Action Steps:*
       1. Langkah E...
       2. Langkah F...
   - **Side Mission 2.2:** [Deskripsi Side Mission lain yang mendukung Main Mission 2]
     - *Action Steps:*
       1. Langkah G...
       2. Langkah H...

*(Jika relevan dan menambah nilai, Anda bisa menambahkan Main Mission ke-3)*

## 💬 Quotes Penutup
(Satu kutipan motivasi yang singkat, relevan dengan tema semester atau tantangan mahasiswa, dan membangkitkan semangat.)

---
**PENTING:** Gunakan tone bahasa yang santai, Gen Z-friendly, reflektif, namun tetap actionable. Hindari bahasa yang terlalu kaku atau formal. Buat perencanaan ini terasa personal, memotivasi, dan memberikan panduan yang jelas!
"""
        plan_content = generate_openai_response(prompt)

        current_timestamp_iso = datetime.now(timezone.utc).isoformat()
        plan_record_id = str(uuid.uuid4())

        if is_regeneration and plan_id_to_regenerate:
            cursor.execute("""
                UPDATE student_goals_plans 
                SET plan_content = ?, timestamp = ?
                WHERE id = ? AND user_email = ?
            """, (plan_content, current_timestamp_iso, plan_id_to_regenerate, email))
            plan_record_id = plan_id_to_regenerate
        else:
            db_nama_input = nama if is_initial_generation else (cursor.execute("SELECT nama_input FROM student_goals_plans WHERE user_email = ? AND is_initial_data_source = TRUE ORDER BY timestamp DESC LIMIT 1", (email,)).fetchone() or [nama])[0]
            db_jurusan_input = jurusan if is_initial_generation else (cursor.execute("SELECT jurusan_input FROM student_goals_plans WHERE user_email = ? AND is_initial_data_source = TRUE ORDER BY timestamp DESC LIMIT 1", (email,)).fetchone() or [jurusan])[0]
            db_semester_input_awal_val = int(semester_input_awal_str) if semester_input_awal_str else target_semester # Fallback jika semester_input_awal_str None
            db_semester_input_awal = int(semester_input_awal_str) if is_initial_generation else (cursor.execute("SELECT semester_input_awal FROM student_goals_plans WHERE user_email = ? AND is_initial_data_source = TRUE ORDER BY timestamp DESC LIMIT 1", (email,)).fetchone() or [db_semester_input_awal_val])[0]
            db_mode_action_input = mode_action if is_initial_generation else (cursor.execute("SELECT mode_action_input FROM student_goals_plans WHERE user_email = ? AND is_initial_data_source = TRUE ORDER BY timestamp DESC LIMIT 1", (email,)).fetchone() or [mode_action])[0]
            
            db_swot_file_ref = final_swot_file_ref if is_initial_generation else (cursor.execute("SELECT swot_file_ref FROM student_goals_plans WHERE user_email = ? AND is_initial_data_source = TRUE ORDER BY timestamp DESC LIMIT 1", (email,)).fetchone() or [final_swot_file_ref])[0]
            db_ikigai_file_ref = final_ikigai_file_ref if is_initial_generation else (cursor.execute("SELECT ikigai_file_ref FROM student_goals_plans WHERE user_email = ? AND is_initial_data_source = TRUE ORDER BY timestamp DESC LIMIT 1", (email,)).fetchone() or [final_ikigai_file_ref])[0]

            cursor.execute("""
                INSERT INTO student_goals_plans 
                (id, user_email, nama_input, jurusan_input, semester_input_awal, mode_action_input, 
                 swot_file_ref, ikigai_file_ref, target_semester_plan, plan_content, is_initial_data_source, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (plan_record_id, email, db_nama_input, db_jurusan_input, db_semester_input_awal, db_mode_action_input,
                  db_swot_file_ref, db_ikigai_file_ref, target_semester, plan_content, is_initial_generation, current_timestamp_iso))

        new_token_balance = current_tokens - TOKEN_COST_STUDENT_GOALS
        cursor.execute("UPDATE users SET tokens = ? WHERE email = ?", (new_token_balance, email))
        conn.commit()

        response_payload = {
            "message": "Rencana berhasil diproses!",
            "plan": {
                "id": plan_record_id,
                "semester": target_semester,
                "content": plan_content,
                "timestamp": current_timestamp_iso,
                "is_initial_data_source": is_initial_generation
            },
            "new_token_balance": new_token_balance
        }
        if is_initial_generation:
            response_payload["initial_data_refs"] = initial_data_refs_for_response
        
        return jsonify(response_payload), 200

    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        print(f"[DB Error - /student-goals/generate] {str(e)}")
        return jsonify({"error": f"Kesalahan database: {str(e)}"}), 500
    except Exception as e:
        print(f"[Server Error - /student-goals/generate] {str(e)}")
        # Jika conn belum diinisialisasi, pengecekan 'if conn:' di finally akan aman
        return jsonify({"error": f"Kesalahan server internal: {str(e)}"}), 500
    finally:
        if conn: # Sekarang 'conn' pasti sudah terdefinisi (meskipun bisa None)
            conn.close()

# Di app.py Anda

@app.route("/student-goals/history/all", methods=["DELETE"]) # Atau POST jika Anda tidak bisa/mau pakai DELETE
def delete_all_student_goals_history():
    email = request.args.get("email") # Jika dikirim sebagai query param dengan metode DELETE

    if not email:
        return jsonify({"error": "Parameter email wajib diisi."}), 400

    conn = None
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        # Validasi user jika perlu (misalnya, apakah user ini ada)
        cursor.execute("SELECT 1 FROM users WHERE email = ?", (email,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "User tidak ditemukan."}), 404

        # Hapus semua rencana untuk user_email tersebut
        cursor.execute("DELETE FROM student_goals_plans WHERE user_email = ?", (email,))
        deleted_rows = cursor.rowcount # Jumlah baris yang terhapus
        conn.commit()

        return jsonify({"message": f"Berhasil menghapus {deleted_rows} riwayat rencana untuk {email}."}), 200

    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        print(f"[DB Error - /student-goals/history/all] {str(e)}")
        return jsonify({"error": f"Kesalahan database: {str(e)}"}), 500
    except Exception as e:
        print(f"[Server Error - /student-goals/history/all] {str(e)}")
        return jsonify({"error": f"Kesalahan server internal: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

@app.route("/student-goals/history", methods=["GET"])
def student_goals_history():
    # global DB_NAME
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Parameter email wajib diisi."}), 400

    conn = None # Initialize conn to None
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        # Ambil semua kolom yang relevan, urutkan agar yang terbaru per semester muncul (jika ada duplikat semester)
        # atau frontend bisa mengelola versi jika diperlukan.
        # Untuk simple history, urutkan berdasarkan semester lalu timestamp
        cursor.execute("""
            SELECT id, user_email, nama_input, jurusan_input, semester_input_awal, 
                   mode_action_input, swot_file_ref, ikigai_file_ref, 
                   target_semester_plan, plan_content, is_initial_data_source, timestamp 
            FROM student_goals_plans 
            WHERE user_email = ? 
            ORDER BY target_semester_plan ASC, timestamp DESC
        """, (email,))
        
        plans_data = []
        # Menggunakan fetchall dan kemudian memprosesnya
        rows = cursor.fetchall()
        for row in rows:
            plans_data.append({
                "id": row[0],
                "user_email": row[1],
                "nama_input": row[2],
                "jurusan_input": row[3],
                "semester_input_awal": row[4],
                "mode_action_input": row[5],
                "swot_file_ref": row[6],
                "ikigai_file_ref": row[7],
                "semester": row[8], # Menggunakan 'semester' agar konsisten dengan frontend
                "content": row[9],
                "is_initial_data_source": bool(row[10]), # Konversi ke boolean
                "timestamp": row[11]
            })
        
        return jsonify({"plans": plans_data}), 200

    except sqlite3.Error as e:
        print(f"[DB Error - /student-goals/history] {str(e)}")
        return jsonify({"error": f"Kesalahan database: {str(e)}", "plans": []}), 500 # Kembalikan array kosong
    except Exception as e:
        print(f"[Server Error - /student-goals/history] {str(e)}")
        return jsonify({"error": f"Kesalahan server internal: {str(e)}", "plans": []}), 500
    finally:
        if conn:
            conn.close()

@app.route("/analyze-swot", methods=["POST"])
def analyze_swot():
    data = request.get_json()
    email = data.get("email")
    nama = data.get("nama")
    mbti = data.get("mbti")
    via1 = data.get("via1")
    via2 = data.get("via2")
    via3 = data.get("via3")

    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        # Ambil status premium dan token
        cursor.execute("SELECT is_premium, tokens FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User tidak ditemukan."}), 404

        is_premium, tokens = user
        if not is_premium or tokens < 1:
            return jsonify({"error": "Premium dan minimal 1 token diperlukan."}), 403

        # Prompt GPT
        prompt = f"""
Bertindaklah sebagai gabungan 5 peran expert berikut:
1. Psikolog perkembangan yang ngerti cara manusia kenal dirinya secara utuh.
2. Career coach senior yang biasa bantu mahasiswa nemuin arah hidup dan kontribusi nyata.
3. Life & growth strategist yang bisa bimbing dari refleksi ke aksi.
4. Mentor konten Gen Z yang bisa ngejelasin insight dengan gaya ringan, relevan, dan relatable.
5. Expert dalam tes kepribadian MBTI dan VIA Character Strength.

Gunakan keahlianmu buat menganalisis hasil kepribadian dari seseorang berdasarkan data berikut:
- Nama: {nama}
- MBTI: {mbti}
- VIA Character Strength: {via1}, {via2}, {via3}

Buat analisis SWOT diri dari hasil MBTI dan VIA tersebut, khusus untuk mahasiswa.
Format output HARUS sama persis dengan struktur di bawah ini:

1. Buka dengan narasi ringan tentang kombinasi kepribadian MBTI + VIA, bahas vibe-nya user secara umum.
2. Lanjutkan dengan kalimat transisi yang ngenalin SWOT sebagai tools refleksi.
3. Tampilkan 4 bagian SWOT berikut secara berurutan dan konsisten yang masing-masing minimal 3:
🟩 S – Strength (Kekuatan Alami)
🟨 W – Weakness (Hambatan Pribadi)
🟦 O – Opportunity (Peluang Potensial)
🟥 T – Threat (Tantangan yang Perlu Diwaspadai)

Untuk setiap point SWOT, wajib pakai format ini:
⭐/⚠️/🚀/🔥 [Judul Point]: Penjelasan singkat 1 baris.
**Contoh:** ...
**Strategi:** ...

✨ Gunakan emoji, heading, dan tone Gen Z yang ringan, santai, dan relatable.
✨ Sorot poin penting dengan format bold.
✨ Tutup dengan CTA ringan: "Relate nggak sama SWOT ini?..."
"""

        result = generate_openai_response(prompt)

        # Simpan ke tabel track_swot (pastikan tabel ini sudah ada)
        cursor.execute("""
            INSERT INTO track_swot (email, nama, mbti, via1, via2, via3)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (email, nama, mbti, via1, via2, via3))

        # Kurangi token
        cursor.execute("UPDATE users SET tokens = tokens - 1 WHERE email = ?", (email,))
        conn.commit()
        conn.close()

        return jsonify({"result": result}), 200

    except Exception as e:
        print("[ERROR - /analyze-swot]", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/log-feature", methods=["POST"])
def log_feature():
    data = request.json
    email = data.get("email")
    feature = data.get("feature")
    if not email or not feature:
        return jsonify({"error": "Email dan nama fitur wajib disertakan"}), 400
    new_log = FeatureLog(email=email, feature=feature)
    db.session.add(new_log)
    db.session.commit()
    return jsonify({"message": "Log ditambahkan"}), 200

@app.route("/admin/feature-usage", methods=["GET"])
def get_feature_usage():
    logs = db.session.query(
        FeatureLog.feature,
        db.func.count(FeatureLog.id)
    ).group_by(FeatureLog.feature).all()

    return jsonify([{"feature": f, "count": c} for f, c in logs])

@app.route('/upload_cv', methods=['POST'])
def upload_cv():
    try:
        file = request.files.get('cv')
        if not file:
            return jsonify({"error": "File CV tidak ditemukan."}), 400

        filename = file.filename.lower()
        if filename.endswith('.pdf'):
            text = extract_text_from_pdf(file)
        elif filename.endswith('.docx'):
            text = extract_text_from_docx(file)
        else:
            return jsonify({"error": "Format file tidak didukung. Hanya PDF atau DOCX."}), 400

        # Lakukan ringkasan jika perlu (sementara langsung return semua isi)
        summary = summarize_cv_text(text)
        return jsonify({"cv_summary": summary})

    except Exception as e:
        print("[ERROR - /upload_cv]", str(e))
        return jsonify({"error": str(e)}), 500


def extract_text_from_pdf(file):
    text = ""
    doc = fitz.open(stream=file.read(), filetype="pdf")
    for page in doc:
        text += page.get_text()
    return text

def extract_text_from_docx(file):
    doc = Document(file)
    return "\n".join([para.text for para in doc.paragraphs])


def summarize_cv_text(text):
    # Placeholder ringkasan: ambil max 1000 karakter
    cleaned = text.replace('\n', ' ').strip()
    return cleaned[:1000] + "..." if len(cleaned) > 1000 else cleaned

@app.route('/delete_cv', methods=['POST'])
def delete_cv():
    try:
        for filename in os.listdir("temp_cv"):
            os.remove(os.path.join("temp_cv", filename))
        return jsonify({"message": "Semua CV sementara dihapus."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route("/debug/user", methods=["GET"])
def debug_user():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT email, password FROM users")
        users = cursor.fetchall()
        conn.close()
        return jsonify([
            {"email": u[0], "password": u[1]} for u in users
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analyze-bio", methods=["POST"])
def analyze_bio():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]
    email = request.form.get("email")

    if not email:
        return jsonify({"error": "No email provided"}), 400

    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        # Pastikan kolom token dan is_premium ada
        cursor.execute("PRAGMA table_info(users);")
        columns = [row[1] for row in cursor.fetchall()]
        if "token" not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN token INTEGER DEFAULT 10;")
        if "is_premium" not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT 0;")
        conn.commit()

        # Ambil data user
        cursor.execute("SELECT is_premium, token FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404

        is_premium, token = user

        if not is_premium or token < 3:
            return jsonify({"error": "Not enough token or not premium"}), 403

        # Encode image ke base64 untuk Vision API
        img_bytes = image.read()
        base64_img = base64.b64encode(img_bytes).decode("utf-8")
        image_url = f"data:image/png;base64,{base64_img}"

        # Prompt kuat
        prompt = (
            "Lihatlah screenshot bio Instagram berikut ini. Evaluasi dan identifikasi elemen-elemen penting "
            "yang kurang atau belum optimal, seperti: penekanan identitas profesional, ajakan (CTA), personal branding, "
            "highlight skill, link penting, dan tone keseluruhan bio.\n\n"
            "Lalu, buatkan 3 versi bio yang ditulis ulang berdasarkan analisis tersebut. Setiap versi bio harus unik dan menyesuaikan gaya berikut:\n"
            "1. Profesional: Tampilkan posisi, institusi, keahlian inti, dan ajakan untuk koneksi profesional.\n"
            "2. Personal Branding: Fokus pada kepribadian, cerita, nilai-nilai personal, dan kesan inspiratif.\n"
            "3. Showcase Skill: Soroti skill utama seperti MC, Desainer, Penulis, dan pengalaman/karya relevan.\n\n"
            "Tampilkan hasil Anda dalam format JSON seperti ini:\n\n"
            "{\n"
            '  "review": "Penilaian dan hal yang kurang dari bio saat ini...",\n'
            '  "recommendations": [\n'
            '    { "style": "Profesional", "bio": "..." },\n'
            '    { "style": "Personal Branding", "bio": "..." },\n'
            '    { "style": "Showcase Skill", "bio": "..." }\n'
            "  ]\n"
            "}\n\n"
            "Pastikan bio tidak lebih dari 150 karakter, sesuai batas Instagram."
        )

        # Kirim ke GPT-4o Vision
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": image_url}},
                        {"type": "text", "text": prompt}
                    ]
                }
            ],
            temperature=0.8,
            max_tokens=1000
        )

        content = response.choices[0].message.content

        # 🔐 Parsing aman menggunakan regex
        try:
            json_block = re.search(r'{.*}', content, re.DOTALL)
            if not json_block:
                raise ValueError("Blok JSON tidak ditemukan dalam respons GPT.")
            result_json = json.loads(json_block.group())
            review = result_json.get("review", "")
            recommendations = result_json.get("recommendations", [])
        except Exception as e:
            print("[JSON PARSE ERROR]", e)
            review = "Format tidak valid, gagal parse JSON."
            recommendations = []

        # Kurangi token
        new_token = token - 3
        cursor.execute("UPDATE users SET token = ? WHERE email = ?", (new_token, email))
        conn.commit()
        conn.close()

        return jsonify({
            "review": review,
            "recommendations": recommendations
        })

    except Exception as e:
        print("❌ ERROR analyze-bio:", str(e))
        return jsonify({"error": "Internal error", "details": str(e)}), 500

@app.route("/generate-final-bio", methods=["POST"])
def generate_final_bio():
    data = request.get_json()
    email = data.get("email")
    prompt_text = data.get("prompt")
    
    if not email or not prompt_text:
        return jsonify({"error": "Email dan prompt harus disertakan."}), 400

    try:
        # Validasi user
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT is_premium FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User tidak ditemukan."}), 404
        is_premium = user[0]
        if not is_premium:
            return jsonify({"error": "Hanya user premium yang bisa akses fitur ini."}), 403

        # Prompt ke GPT
        full_prompt = (
            "Buat bio Instagram yang singkat, menarik, dan powerful, dengan batas maksimal 150 karakter.\n"
            "Gunakan informasi dari user berikut ini:\n\n"
            f"{prompt_text}\n\n"
            "Output hanya satu baris bio. Hindari penggunaan tanda kutip, dan jangan sertakan label atau heading apa pun."
        )

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": full_prompt}],
            temperature=0.7,
            max_tokens=300
        )

        bio = response.choices[0].message.content.strip()

        return jsonify({"bio": bio}), 200

    except Exception as e:
        print("❌ Final bio generation error:", e)
        return jsonify({"error": "Gagal membuat bio akhir.", "details": str(e)}), 500

    finally:
        conn.close()

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()

    user_answer = data.get('answer', '')
    username = data.get('username', 'pelamar')
    history = data.get('history', [])  # list of {q, a}
    interview_type = data.get('interviewType', 'beasiswa')
    language = data.get('language', 'id')
    scholarship_name = data.get('scholarshipName', '')
    internship_position = data.get('internshipPosition', '')
    cv_summary = data.get('cv_summary', '')

    history_block = "\n".join([
        f"Pertanyaan: {item['q']}\nJawaban: {item['a']}" for item in history
    ]) if history else "(Belum ada riwayat sebelumnya.)"

    # 📌 Prompt Generator
    if interview_type == 'magang':
        base_desc_id = f"""
Kamu adalah pewawancara profesional dari perusahaan yang sedang menyeleksi Saudara {username} untuk posisi magang sebagai "{internship_position}".
Jika CV tersedia, berikut ringkasannya:
{cv_summary if cv_summary else '(CV tidak tersedia)'}

Berikut riwayat wawancara:
{history_block}

Jawaban terbaru dari pelamar:
"{user_answer}"

Tugasmu: Ajukan SATU pertanyaan lanjutan yang relevan dengan posisi tersebut. Fokus pada motivasi kerja, kesiapan profesional, atau kecocokan skill teknis.
Hindari pertanyaan yang terlalu umum atau repetitif.
"""

        base_desc_en = f"""
You are a professional interviewer from a company assessing Mr./Ms. {username} for an internship position as "{internship_position}".
If available, here is a summary of the CV:
{cv_summary if cv_summary else '(No CV provided)'}

Interview history:
{history_block}

The latest answer from the candidate:
"{user_answer}"

Your task: Ask ONE follow-up question relevant to the internship, focusing on work motivation, technical preparedness, or professional attitude. Avoid repetitive or shallow questions.
"""

        prompt = base_desc_en if language == "en" else base_desc_id

    else:  # Default: beasiswa
        base_desc_id = f"""
Kamu adalah pewawancara profesional dalam seleksi beasiswa "{scholarship_name}".
Sedang mewawancarai Saudara {username}.
Jika CV tersedia, berikut ringkasannya:
{cv_summary if cv_summary else '(CV tidak tersedia)'}

Berikut riwayat wawancara:
{history_block}

Jawaban terbaru dari pelamar:
"{user_answer}"

Tugasmu: Ajukan SATU pertanyaan lanjutan yang profesional dan mendalam. Fokus pada konsistensi tujuan studi, kontribusi sosial, kekuatan personal, atau pengalaman yang relevan dengan beasiswa ini. Hindari pertanyaan klise dan repetitif.
"""

        base_desc_en = f"""
You are a professional interviewer in the selection process for the "{scholarship_name}" scholarship.
Interviewing Mr./Ms. {username}.
If a CV is available, here's the summary:
{cv_summary if cv_summary else '(No CV provided)'}

Interview history:
{history_block}

Latest answer from the applicant:
"{user_answer}"

Your task: Ask ONE insightful and professional follow-up question. Focus on study goals, social impact, personal strengths, or relevant experience. Avoid clichés and repeated questions.
"""

        prompt = base_desc_en if language == "en" else base_desc_id

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Anda adalah pewawancara cerdas, kritis, dan profesional. Tugas Anda adalah menggali kualitas pelamar secara mendalam."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.7
        )
        question = response.choices[0].message.content.strip()
        return jsonify({"question": question})
    except Exception as e:
        print("[ERROR - /ask]", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/speak', methods=['POST'])
def speak():
    data = request.get_json()
    text = data.get('text', '').strip()

    if not text:
        return jsonify({"error": "Teks kosong tidak dapat dibacakan."}), 400

    try:
        tts_response = client.audio.speech.create(
            model="tts-1",
            voice="nova",
            input=text
        )

        timestamp = str(int(time.time()))
        output_path = f"static/audio_{timestamp}.mp3"

        with open(output_path, "wb") as f:
            f.write(tts_response.content)
            
        delete_file_later(output_path, delay=30)

        return send_file(output_path, mimetype='audio/mpeg')
    except Exception as e:
        print("[ERROR - /speak]", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/evaluate', methods=['POST'])
def evaluate():
    import re, json

    data = request.get_json()
    answers = data.get('answers', [])
    username = data.get('username', 'pelamar')
    interview_type = data.get('interviewType', 'beasiswa')
    language = data.get('language', 'id')
    scholarship_name = data.get('scholarshipName', '')
    internship_position = data.get('internshipPosition', '')
    cv_summary = data.get('cv_summary', '')

    combined_answers = "\n".join([f"{i+1}. {ans}" for i, ans in enumerate(answers)])

    if interview_type == 'magang':
        prompt_id = f"""
Kamu adalah juri profesional dari perusahaan yang sedang mengevaluasi hasil wawancara pelamar magang bernama Saudara {username}, untuk posisi "{internship_position}".

Jika tersedia, berikut ringkasan CV pelamar:
{cv_summary if cv_summary else '(CV tidak tersedia)'}

Berikut jawaban dari sesi wawancaranya:
{combined_answers}

Beri skor untuk setiap jawaban dari 1–5 berdasarkan: relevansi terhadap posisi, kesiapan kerja, kejelasan komunikasi, dan kedalaman argumen.

Kemudian, hitung total skor dan berikan feedback singkat.

Format JSON:
{{
  "scores": [4, 4, 5, 3, 4],
  "total": 20,
  "feedback": "Pelamar cukup siap dan mampu menjelaskan motivasinya dengan baik. Disarankan untuk memperkuat contoh konkret terkait pengalaman kerja sebelumnya."
}}
"""

        prompt_en = f"""
You are a company recruiter evaluating the interview answers of an internship candidate named {username}, applying for the position of "{internship_position}".

CV Summary:
{cv_summary if cv_summary else '(No CV provided)'}

Interview Answers:
{combined_answers}

Evaluate each answer on a scale of 1–5 based on: relevance to the role, preparedness, clarity of communication, and depth of reasoning.

Then, calculate total score and give concise feedback.

JSON Format:
{{
  "scores": [4, 4, 5, 3, 4],
  "total": 20,
  "feedback": "The candidate is fairly prepared and articulated motivation clearly. Suggest adding concrete examples of prior work experience."
}}
"""

        prompt = prompt_en if language == 'en' else prompt_id

    else:  # default: beasiswa
        prompt_id = f"""
Kamu adalah juri profesional seleksi beasiswa "{scholarship_name}". Evaluasilah hasil wawancara pelamar bernama Saudara {username}.

Jika tersedia, berikut ringkasan CV pelamar:
{cv_summary if cv_summary else '(CV tidak tersedia)'}

Berikut jawaban wawancaranya:
{combined_answers}

Nilai setiap jawaban dengan skala 1–5 berdasarkan: kejelasan, kedalaman argumen, relevansi terhadap tujuan studi dan kontribusi sosial.

Lalu, berikan total skor dan satu paragraf feedback.

Format JSON:
{{
  "scores": [4, 4, 5, 4, 4],
  "total": 21,
  "feedback": "Pelamar menunjukkan motivasi kuat dan pemahaman mendalam terhadap visi beasiswa. Perlu memperkuat aspek rencana kontribusi pasca studi."
}}
"""

        prompt_en = f"""
You are a professional jury for the "{scholarship_name}" scholarship. Evaluate the interview responses of the candidate {username}.

CV Summary:
{cv_summary if cv_summary else '(No CV provided)'}

Interview Answers:
{combined_answers}

Score each answer (1–5) based on: clarity, depth of thought, relevance to study goals, and potential for social contribution.

Provide total score and concise feedback.

JSON Format:
{{
  "scores": [4, 4, 5, 4, 4],
  "total": 21,
  "feedback": "The candidate demonstrates strong motivation and good alignment with the scholarship’s vision. The post-study contribution plan could be stronger."
}}
"""

        prompt = prompt_en if language == 'en' else prompt_id

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Anda adalah juri evaluasi wawancara yang sangat teliti, kritis, dan profesional. Formatkan hasil secara rapi."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )
        content = response.choices[0].message.content.strip()
        json_block = re.search(r'{.*}', content, re.DOTALL)
        if not json_block:
            raise ValueError("Gagal menemukan JSON pada hasil evaluasi.")
        parsed = json.loads(json_block.group())
        return jsonify(parsed)
    except Exception as e:
        print("[ERROR - /evaluate]", str(e))
        return jsonify({"error": str(e)}), 500
    
@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        audio_file = request.files['audio']
        if not audio_file:
            return jsonify({"error": "File audio tidak ditemukan"}), 400

        with open("temp_audio.webm", "wb") as f:
            f.write(audio_file.read())

        with open("temp_audio.webm", "rb") as f:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text"
            )
        
        delete_file_later("temp_audio.webm", delay=30)

        return jsonify({"transcription": transcript})
    except Exception as e:
        print("[ERROR - /transcribe]", str(e))
        return jsonify({"error": str(e)}), 500
    
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    result = login_user(email, password)
    if result:
        return jsonify({
            "message": "Login berhasil!",
            "is_premium": result["is_premium"],
            "is_admin": result["is_admin"],
            "tokens": result["tokens"]
        }), 200
    return jsonify({"message": "Login gagal!"}), 401

@app.route("/generate-title", methods=["POST"])
def generate_title():
    data = request.json
    email = data.get("email")
    tema = data.get("tema")
    sub_tema = data.get("sub_tema")
    background_enabled = data.get("background_enabled", False)
    background_text = data.get("background_text", "").strip()
    advanced_enabled = data.get("advanced_enabled", False)
    include_explanation = data.get("include_explanation", False)
    include_method_or_tech = data.get("include_method_or_tech", False)

    if not email or not tema or not sub_tema:
        return jsonify({"title": "[ERROR] Data tidak lengkap"}), 400

    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        # Validasi user
        cursor.execute("SELECT is_premium, tokens FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"title": "[ERROR] User tidak ditemukan"}), 404

        is_premium, tokens = user
        if tokens <= 0:
            return jsonify({"title": "[TOKEN HABIS] Silakan upgrade akun kamu."}), 403

        # Prompt tetap seperti yang kamu tulis
        prompt = (
            f"Kamu adalah seorang peneliti profesional. Tugasmu adalah membuat **satu ide essay** yang kompleks, inovatif, dan kritis "
            f"dengan struktur (1. Judul Pendek/Singkatan Judul/PunchLine Judul 2. Ide/Gagasan Inti 3. Daerah/Lokasi Implementasi Ide 4. Metode Riset 5. Tujuan Riset) buatkan yang kompleks yahh dan ingat harus menarik dan masuk akal kemudian sebenernya garis besarnya ini saya tuhh inginnya essai ini berdasarkan nanti saya bakal buat solusi permasalahan terkait nan inovatif sesuai dengan tujuan dibentuknya essai tapi untuk sementara buatkan dulu saja yaa judulnya, ohh iyaa kalau bisa metode yang dipakai tuhh yang ada bahasa penelitiannya gitu lohh jangan template kayak kualitatif kuantitatif tapi buat lebih menarik kalau bisa dikaitkan dengan beberapa ilmu mata kuliah terkait yang berkaitan dengan gagasan idenya, judulnya panjang maksimal 20 kata, jangan singkat judulnya pastikan sesuai format diatas"
            f"mengenai topik '{sub_tema}' dalam bidang '{tema}'."
        )

        # Premium logic
        if is_premium:
            if background_enabled and background_text:
                prompt += (
                    f"\nPertimbangkan latar belakang berikut ini sebagai dasar utama penyusunan ide:\n"
                    f"\"{background_text}\"\n"
                    "Gunakan konteks tersebut untuk memilih pendekatan masalah, solusi, dan riset yang tepat.\n"
                )

            prompt += (
                "\nTulis hasil dalam format berikut (dengan setiap bagian diawali labelnya):\n"
                "Judul: , berikan hanya judulnya saja, tapi jika setelah ini saya memberikan perintah lagi lakukan saja (ini hanya jika saja yahh)\n"
            )

            if advanced_enabled:
                if include_explanation:
                    prompt += (
                        "Penjelasan: [Jelaskan secara singkat maksud dari judul tersebut, serta arah dan urgensinya serta jelaskan apasih outputnya dari essai ini.]\n"
                    )
                if include_method_or_tech:
                    if tema == "saintek":
                        prompt += "Teknologi: [Sebutkan teknologi utama atau pendekatan saintifik yang digunakan.]\n"
                    elif tema in ["soshum", "hukum"]:
                        prompt += "Metode: [Sebutkan metode penelitian yang sesuai untuk topik tersebut.]\n"
        else:
            # User non-premium
            prompt += (
                "\nOutput hanya boleh berupa satu kalimat judul essay akademik. "
                "Jangan sertakan penjelasan tambahan, metode, atau teknologi apapun."
            )

        # Call to LLM
        output = generate_openai_response(prompt)

        # Kurangi token user
        cursor.execute("UPDATE users SET tokens = tokens - 1 WHERE email = ?", (email,))
        conn.commit()

        return jsonify({"title": output}), 200

    except Exception as e:
        print("🚨 ERROR generate judul:", e)
        return jsonify({"title": "[ERROR] Gagal generate judul dari server"}), 500

    finally:
        conn.close()

@app.route("/generate-kti", methods=["POST"])
def generate_kti():
    data = request.json
    email = data.get("email")
    tema = data.get("tema")
    sub_tema = data.get("sub_tema")
    features = data.get("features", {})
    background_urgensi = features.get("backgroundUrgensi", False)
    keterbaruan = features.get("keterbaruan", False)
    step_konkrit = features.get("stepKonkrit", False)
    efisiensi = features.get("efisiensi", False)
    penelitian_terdahulu = features.get("penelitianTerdahulu", False)
    success_rate = features.get("successRate", False)

    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT is_premium, tokens FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"title": "[ERROR] User tidak ditemukan"}), 404

        is_premium, tokens = user
        if tokens <= 0:
            return jsonify({"title": "[TOKEN HABIS] Silakan upgrade akun kamu."}), 403

        prompt = (
            f"Kamu adalah seorang peneliti profesional. Buat satu ide Karya Tulis Ilmiah (KTI) "
            f"yang kompleks, inovatif, relevan, dan kritis mengenai topik '{sub_tema}' dalam bidang '{tema}'. "
        )

        if is_premium:
            if background_urgensi:
                prompt += "\n- Jelaskan latar belakang permasalahan dan urgensi topik tersebut secara akademik dan faktual."
            if keterbaruan:
                prompt += "\n- Tunjukkan keterbaruan ide dibandingkan penelitian sebelumnya."
            if step_konkrit:
                prompt += "\n- Jabarkan langkah-langkah konkret (step-by-step) dalam implementasi ide KTI."
            if efisiensi:
                prompt += "\n- Sertakan bagaimana ide tersebut dapat dieksekusi secara efisien dan hemat sumber daya."
            if penelitian_terdahulu:
                prompt += "\n- Berikan contoh minimal satu penelitian terdahulu kredibel yang relevan sebagai basis ide."
            if success_rate:
                prompt += "\n- Estimasikan success rate ide tersebut dan berikan contoh input-output sederhana terkait ide."

        prompt += (
            "\n\nTulis hasil dalam format berikut dengan terstruktur (jangan gunakan simbol aneh):\n"
            "Judul: [Satu kalimat singkat untuk judul KTI yang menarik]\n"
        )

        if is_premium:
            prompt += (
                "Deskripsi: [Ringkasan ide utama KTI, termasuk urgensi, solusi, dan novelty]\n"
                "Target Luaran: [Produk akhir riset, seperti modul, prototipe, rekomendasi kebijakan, dll] Pastikan untuk deskripsi dan target luaran jangan terlalu panjang jika di promt ini akan ada Latar Belakang\n"
            )

        output = generate_openai_response(prompt)
        cursor.execute("UPDATE users SET tokens = tokens - 1 WHERE email = ?", (email,))
        conn.commit()
        return jsonify({"title": output}), 200

    except Exception as e:
        print("🚨 ERROR generate KTI:", e)
        return jsonify({"title": "[ERROR] Gagal generate KTI dari server"}), 500
    finally:
        conn.close()

@app.route("/generate-bp", methods=["POST"])
def generate_bp():
    data = request.json
    email = data.get("email")
    deskripsi_ide = data.get("deskripsi_ide", "").strip()
    features = data.get("features", {})

    executive_summary_enabled = features.get("ringkasanEksekutif", False)
    market_analysis_enabled = features.get("analisisPasar", False)
    marketing_strategy_enabled = features.get("strategiPemasaran", False)
    finance_enabled = features.get("keuangan", False)
    swot_enabled = features.get("analisisSWOT", False)

    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT is_premium, tokens FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"title": "[ERROR] User tidak ditemukan"}), 404

        is_premium, tokens = user
        if tokens <= 0:
            return jsonify({"title": "[TOKEN HABIS] Silakan upgrade akun kamu."}), 403

        prompt = (
            f"Kamu adalah AI bisnis profesional. Gunakan deskripsi berikut sebagai konteks ide bisnis:\n"
            f"\"{deskripsi_ide}\"\n\n"
            f"Buat 1 ide bisnis unik dengan:\n"
            f"- Nama brand\n"
            f"- Tagline\n"
            f"- Deskripsi singkat (pastikan jelas dan dapat dimengerti).\n"
        )

        if is_premium:
            if executive_summary_enabled:
                prompt += "\n\nTambahkan Ringkasan Eksekutif mencakup target pasar, visi, dan sumber daya awal."
            if market_analysis_enabled:
                prompt += "\n\nTambahkan Analisis Pasar berisi ukuran pasar, tren industri, dan perilaku konsumen."
            if marketing_strategy_enabled:
                prompt += "\n\nTambahkan Strategi Pemasaran termasuk channel, metode promosi, dan alasan strategis."
            if finance_enabled:
                prompt += "\n\nTambahkan Analisis Keuangan berupa proyeksi pendapatan, biaya operasional, laba/rugi, dan break even point."
            if swot_enabled:
                prompt += "\n\nTambahkan Analisis SWOT mencakup Strength, Weakness, Opportunity, dan Threats minimal 2 poin masing-masing."

        prompt += "\n\nTulis hasilnya dengan bahasa profesional, komunikatif, padat, dan rapi (jangan gunakan simbol aneh seperti * atau tagar)."

        output = generate_openai_response(prompt)
        cursor.execute("UPDATE users SET tokens = tokens - 1 WHERE email = ?", (email,))
        conn.commit()
        return jsonify({"title": output}), 200

    except Exception as e:
        print("🚨 ERROR generate Business Plan:", e)
        return jsonify({"title": "[ERROR] Gagal generate Business Plan dari server"}), 500
    finally:
        conn.close()

@app.route("/generate-essay-exchange", methods=["POST"])
def generate_essay_exchange():
    data = request.json
    email = data.get("email")
    motivasi_input = data.get("motivasi_input", "").strip()

    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT is_premium, tokens FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"title": "[ERROR] User tidak ditemukan"}), 404

        is_premium, tokens = user
        if not is_premium:
            return jsonify({"title": "[ERROR] Fitur ini hanya untuk Premium User."}), 403

        if tokens <= 0:
            return jsonify({"title": "[TOKEN HABIS] Silakan upgrade akun kamu."}), 403

        prompt = f"""
Kamu adalah mentor beasiswa luar negeri berpengalaman 10 tahun. Berdasarkan info program berikut:

1. Temasek Foundation – NUS LEaRN: https://nus.edu.sg/gro/docs/default-source/prog/sgp/tf-nuslearn/sgp_tf-nus-learn-2025-(info-sheet-for-sea).pdf
2. SDG Global Summer School Zhejiang University: https://sdg-gss.zju.edu.cn/65957/main.psp
3. VIPP Global Summer School - Michigan State University: https://vipp.isp.msu.edu/student-programs/vippsummer/
4. Global Undergraduate Exchange Program: https://www.aminef.or.id/grants-for-indonesians/fulbright-programs/fellowships/global-undergraduate-exchange-program/

Buat guideline lengkap untuk motivation letter dan setelah itu buat template motivation letter berdasarkan motivasi berikut: "{motivasi_input}"

Gunakan format:
- Struktur Ideal (6 bagian)
- Tahapan Rinci
- Poin Kritis
- Template surat
Jawaban maksimal 1 halaman, terstruktur, bahasa profesional dan komunikatif (jangan gunakan simbol aneh seperti * Bintang atau tagar).
"""

        output = generate_openai_response(prompt)
        cursor.execute("UPDATE users SET tokens = tokens - 1 WHERE email = ?", (email,))
        conn.commit()
        return jsonify({"title": output}), 200

    except Exception as e:
        print("🚨 ERROR generate Essay Exchange:", e)
        return jsonify({"title": "[ERROR] Gagal generate Essay Exchange dari server"}), 500
    finally:
        conn.close()

@app.route("/admin/update-user", methods=["POST"])
def update_user():
    try:
        data = request.get_json()
        email = data.get("email")
        tokens = data.get("tokens")
        is_premium = data.get("is_premium")

        conn = sqlite3.connect(DB_NAME, timeout=10)
        conn.execute('PRAGMA journal_mode=WAL;')
        cursor = conn.cursor()

        cursor.execute("UPDATE users SET tokens = ?, is_premium = ? WHERE email = ?", (tokens, is_premium, email))
        conn.commit()
        return jsonify({"message": "User updated"}), 200

    except Exception as e:
        print("🚨 UPDATE USER ERROR:", str(e))
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

@app.route("/admin/delete-user", methods=["POST"])
def delete_user():
    data = request.json
    email = data.get("email")

    if not email:
        return jsonify({"message": "Email harus disertakan!"}), 400

    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"message": "User tidak ditemukan."}), 404

        cursor.execute("DELETE FROM users WHERE email = ?", (email,))
        conn.commit()
        return jsonify({"message": f"User dengan email {email} berhasil dihapus."}), 200

    except Exception as e:
        print("❌ ERROR delete user:", e)
        return jsonify({"message": "Terjadi kesalahan saat menghapus user."}), 500
    finally:
        conn.close()

@app.route("/admin/users", methods=["GET"])
def get_all_users():
    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, username, email, is_premium, tokens FROM users")
            users = cursor.fetchall()
            return jsonify([
                {"id": row[0], "username": row[1], "email": row[2], "is_premium": row[3], "tokens": row[4]}
                for row in users
            ])
    except Exception as e:
        print("🚨 ADMIN USER FETCH ERROR:", e)
        return jsonify([])
    
# Tambahkan ini ke bawah semua route yang sudah ada di app.py

@app.route("/reduce-token", methods=["POST"])
def reduce_token():
    try:
        data = request.get_json()
        email = data.get("email")

        if not email:
            return jsonify({"error": "Email tidak ditemukan."}), 400

        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT tokens FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()

        if not row:
            return jsonify({"error": "User tidak ditemukan."}), 404

        current_token = row[0]
        if current_token <= 0:
            return jsonify({"error": "Token habis. Silakan isi ulang token kamu."}), 403

        new_token = current_token - 1
        cursor.execute("UPDATE users SET tokens = ? WHERE email = ?", (new_token, email))
        conn.commit()

        return jsonify({"success": True, "new_token": new_token}), 200

    except Exception as e:
        print("🚨 ERROR reduce-token:", e)
        return jsonify({"error": f"Gagal mengurangi token: {str(e)}"}), 500

    finally:
        conn.close()

@app.route("/analyze-ikigai-basic", methods=["POST"])
def analyze_ikigai_basic():
    import re
    data = request.get_json()
    email = data.get("email")
    nama = data.get("nama")
    jurusan = data.get("jurusan")
    semester = data.get("semester")
    universitas = data.get("universitas")
    sesuai_jurusan = data.get("sesuaiJurusan")
    mbti = data.get("mbti")
    via = data.get("via", [])
    career = data.get("career", [])

    if not all([email, nama, jurusan, semester, universitas, sesuai_jurusan, mbti]) or len(via) < 3 or len(career) < 3:
        return jsonify({"error": "Data tidak lengkap."}), 400

    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT is_premium, tokens FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User tidak ditemukan."}), 404

        is_premium, tokens = user
        if not is_premium or tokens < 5:
            return jsonify({"error": "Premium dan minimal 5 token diperlukan."}), 403

        # Prompt GPT
        prompt = f"""
Bertindaklah sebagai career coach & psikolog perkembangan.

Berikut data hasil tes seseorang:
- Nama: {nama}
- Jurusan: {jurusan}
- MBTI: {mbti}
- VIA Character Strength: {', '.join(via)}
- Career Explorer Role: {', '.join(career)}

Berdasarkan data di atas, tampilkan:
1. 3 Ikigai Spot yang paling cocok dan relevan pastikan Setiap peran harus memuat 1 kalimat 'Peran utama kamu adalah…' dan 1 contoh konkret yang relate dengan kehidupan mahasiswa(berikan sebagai daftar).
2. 3 Slice of Life Purpose yang paling sesuai dengan kombinasi karakter di atas Gunakan format ringan seperti: 'Gue pengen bantu orang yang…'(berikan sebagai daftar).

⚠️ *Catatan*: Jangan sertakan penjelasan panjang. Tampilkan hanya 2 daftar terpisah, masing-masing berisi 3 poin dan Gunakan gaya bahasa yang ringan, hangat, dan membumi untuk mahasiswa awam yang sedang mencari arah hidup. Tone-nya tetap relatable dan gak terlalu formal.

Format Output:
Ikigai Spot:
- ...
- ...
- ...

slice of life:
- ...
- ...
- ...
"""

        result = generate_openai_response(prompt)

        # Parsing 3 Ikigai Spot dan 3 Slice of Life dari hasil GPT
        def extract_list_from_text(keyword, text, max_items=3):
            pattern = rf"{keyword}.*?:?(.*?)(?=\n\n|$)"  # Tangkap setelah keyword
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if not match:
                return []
    
            block = match.group(1).strip()
            lines = [line.strip("-•*1234567890. ").strip() for line in block.split("\n") if line.strip()]
            return lines[:max_items]

        spot_list = extract_list_from_text("ikigai spot", result)
        slice_list = extract_list_from_text("slice of life", result)

        # Fallback manual jika regex gagal
        if not spot_list:
            spot_list = ["The Visionary", "The Problem Solver", "The Nurturer"]
        if not slice_list:
            slice_list = [
                "Gue pengen bantu orang nemuin passion-nya.",
                "Gue pengen bikin solusi simpel untuk masalah ribet.",
                "Gue pengen bangun sesuatu yang berdampak jangka panjang."
            ]

        return jsonify({
            "hasilPrompt": result,
            "spotList": spot_list,
            "sliceList": slice_list
        }), 200

    except Exception as e:
        print("[ERROR - /analyze-ikigai-basic]", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/analyze-ikigai-final", methods=["POST"])
def analyze_ikigai_final():
    data = request.get_json()
    email = data.get("email")
    ikigai_spot = data.get("ikigaiSpot")
    slice_purpose = data.get("slicePurpose")
    nama = data.get("nama")
    jurusan = data.get("jurusan")
    mbti = data.get("mbti")
    via = data.get("via", [])
    career = data.get("career", [])
    sesuai_jurusan = data.get("sesuaiJurusan", "YA")

    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT is_premium, tokens FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User tidak ditemukan."}), 404

        is_premium, tokens = user
        if not is_premium or tokens < 5:
            return jsonify({"error": "Premium dan minimal 5 token diperlukan."}), 403

        prompt = f"""
Bertindaklah sebagai gabungan 5 peran ahli berikut:
1. Psikolog perkembangan
2. Career coach senior
3. Life & growth strategist
4. Mentor konten Gen Z
5. Expert MBTI, VIA, Career Explorer

Tugas kamu adalah membuat output final SWEET SPOT CAREER & BUSINESS berdasarkan data berikut:
- Nama Kamu: {nama}
- Jurusan Kamu: {jurusan}
- MBTI: {mbti}
- VIA Character Strength: {', '.join(via)}
- Career Explorer Role: {', '.join(career)}
- Ikigai Spot: {ikigai_spot}
- Slice of Life Purpose: {slice_purpose}
- Include pertimbangan jurusan? {sesuai_jurusan}
Catatan untuk hasil Hindari istilah teknis berlebihan, gunakan bahasa membumi dan aplikatif, gaya bahasa ringan ala Gen Z.
Struktur output:
1. Tabel Strategi Realistis Awal per Track
2. Penjabaran Per Track (Employee, Self-Employed, Business Owner)
3. CTA Penutup (ajak pilih 1 fokus)
"""
        if sesuai_jurusan.upper() == "YA":
            prompt += "\nTambahkan Jurusan-Based Track berdasarkan jurusan pengguna."

        result = generate_openai_response(prompt)

        # Simpan ke track_ikigai
        cursor.execute("""
            INSERT INTO track_ikigai (email, nama, mbti, via, career, ikigai_spot, slice_purpose)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            email,
            nama,
            mbti,
            json.dumps(via),
            json.dumps(career),
            ikigai_spot,
            slice_purpose
        ))

        cursor.execute("UPDATE users SET tokens = tokens - 5 WHERE email = ?", (email,))
        conn.commit()
        conn.close()

        return jsonify({"result": result}), 200

    except Exception as e:
        print("[ERROR - /analyze-ikigai-final]", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/admin/track-ikigai", methods=["GET"])
def track_ikigai():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT email, nama, mbti, via, career, ikigai_spot, slice_purpose, timestamp FROM track_ikigai ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        conn.close()

        result = []
        for row in rows:
            result.append({
                "email": row[0],
                "nama": row[1],
                "mbti": row[2],
                "via": json.loads(row[3]),
                "career": json.loads(row[4]),
                "ikigai_spot": row[5],
                "slice_purpose": row[6],
                "timestamp": row[7]
            })

        return jsonify(result), 200
    except Exception as e:
        print("[ERROR - track_ikigai]", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/admin/add-user", methods=["POST"])
def add_user():
    data = request.json
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")  # Harus disimpan
    tokens = data.get("tokens", 0)
    is_premium = data.get("is_premium", 0)

    if not email or not username or not password:
        return jsonify({"error": "Data tidak lengkap"}), 400

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    existing = cursor.fetchone()

    if existing:
        return jsonify({"error": "Email sudah terdaftar"}), 400

    cursor.execute("""
        INSERT INTO users (email, username, password, tokens, is_premium)
        VALUES (?, ?, ?, ?, ?)
    """, (email, username, hashed_pw, tokens, is_premium))
    conn.commit()
    conn.close()

    return jsonify({"message": "User berhasil ditambahkan."}), 200

@app.route('/admin/download-db', methods=['GET'])
def download_db():
    try:
        db_path = "webai.db"
        if os.path.exists(db_path):
            return send_file(db_path, as_attachment=True)
        else:
            return jsonify({"error": "File database tidak ditemukan."}), 404
    except Exception as e:
        print("❌ ERROR download DB:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
