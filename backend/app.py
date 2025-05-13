from flask import Flask, json, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import sqlite3
import os
import bcrypt
from auth import init_db, register_user, login_user
from openai import OpenAI
from threading import Timer
import time
from flask import send_file
import re
import json
import base64
import fitz  # PyMuPDF
from docx import Document

conn = sqlite3.connect("webai.db")  # ganti sesuai nama DB kamu
cursor = conn.cursor()

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

conn.commit()
conn.close()

if not os.path.exists("static"):
    os.makedirs("static")
def delete_file_later(path, delay=30):
    def delete():
        try:
            if os.path.exists(path):
                os.remove(path)
                print(f"[Auto Delete] File {path} telah dihapus.")
        except Exception as e:
            print(f"[Auto Delete Error] {str(e)}")
    Timer(delay, delete).start()

# Load .env
load_dotenv()

# Init Flask & OpenAI Client
app = Flask(__name__)
CORS(app)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
DB_NAME = "webai.db"

# Init DB
init_db()

# Function for generating content
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
1. 3 Ikigai Spot yang paling cocok dan relevan (berikan sebagai daftar).
2. 3 Slice of Life Purpose yang paling sesuai dengan kombinasi karakter di atas (berikan sebagai daftar).

⚠️ *Catatan*: Jangan sertakan penjelasan panjang. Tampilkan hanya 2 daftar terpisah, masing-masing berisi 3 poin.

Format Output:
Ikigai Spot:
- ...
- ...
- ...

Slice of Life Purpose:
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
