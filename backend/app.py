from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import sqlite3
import os
import bcrypt
from auth import init_db, register_user, login_user
from openai import OpenAI

# Load .env
load_dotenv()

# Init Flask & OpenAI Client
app = Flask(__name__)
CORS(app)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
DB_NAME = "database.db"

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
            f"Kamu adalah seorang peneliti profesional. Tugasmu adalah membuat **satu ide essay** yang kompleks, inovatif, dan kritis "
            f"dengan struktur (1. Judul Pendek/Singkatan Judul/PunchLine Judul 2. Ide/Gagasan Inti 3. Daerah/Lokasi Implementasi Ide 4. Metode Riset 5. Tujuan Riset) buatkan yang kompleks yahh dan ingat harus menarik dan masuk akal kemudian sebenernya garis besarnya ini saya tuhh inginnya essai ini berdasarkan nanti saya bakal buat solusi permasalahan terkait nan inovatif sesuai dengan tujuan dibentuknya essai tapi untuk sementara buatkan dulu saja yaa judulnya, ohh iyaa kalau bisa metode yang dipakai tuhh yang ada bahasa penelitiannya gitu lohh jangan template kayak kualitatif kuantitatif tapi buat lebih menarik kalau bisa dikaitkan dengan beberapa ilmu mata kuliah terkait yang berkaitan dengan gagasan idenya, judulnya panjang maksimal 20 kata, jangan singkat judulnya pastikan sesuai format diatas"
            f"mengenai topik '{sub_tema}' dalam bidang '{tema}'."
        )

        if is_premium:
            if background_enabled and background_text:
                prompt += (
                    f"\nPertimbangkan latar belakang berikut ini sebagai dasar utama penyusunan ide:\n"
                    f"\"{background_text}\"\n"
                    "Gunakan konteks tersebut untuk memilih pendekatan masalah, solusi, dan riset yang tepat.\n"
                )

            prompt += (
                "\nTulis hasil dalam format berikut (dengan setiap bagian diawali labelnya):\n"
                "**Judul:** , berikan hanya judulnya saja, tapi jika setelah ini saya memberikan perintah lagi lakukan saja (ini hanya jika saja yahh)\n"
            )

            if advanced_enabled:
                if include_explanation:
                    prompt += (
                        "**Penjelasan:** [Jelaskan secara singkat maksud dari judul tersebut, serta arah dan urgensinya serta jelaskan apasih outputnya dari essai ini.]\n"
                    )
                if include_method_or_tech:
                    if tema == "saintek":
                        prompt += "**Teknologi:** [Sebutkan teknologi utama atau pendekatan saintifik yang digunakan.]\n"
                    elif tema in ["soshum", "hukum"]:
                        prompt += "**Metode:** [Sebutkan metode penelitian yang sesuai untuk topik tersebut.]\n"
        else:
            prompt += (
                "\nOutput hanya boleh berupa satu kalimat judul essay akademik. "
                "Jangan sertakan penjelasan tambahan, metode, atau teknologi apapun."
            )

        output = generate_openai_response(prompt)
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
            "\n\nTulis hasil dalam format berikut dengan terstruktur:\n"
            "**Judul:** [Satu kalimat singkat untuk judul KTI yang menarik]\n"
        )

        if is_premium:
            prompt += (
                "**Deskripsi:** [Ringkasan ide utama KTI, termasuk urgensi, solusi, dan novelty]\n"
                "**Target Luaran:** [Produk akhir riset, seperti modul, prototipe, rekomendasi kebijakan, dll] Pastikan untuk deskripsi dan target luaran jangan terlalu panjang jika di promt ini akan ada Latar Belakang\n"
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
            f"Buat 3-5 ide bisnis unik dengan:\n"
            f"- Nama brand\n"
            f"- Tagline\n"
            f"- Deskripsi singkat (maksimal 2 kalimat per ide).\n"
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

        prompt += "\n\nTulis hasilnya dengan bahasa profesional, komunikatif, padat, dan rapi."

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
Jawaban maksimal 1 halaman, terstruktur, bahasa profesional dan komunikatif.
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
def admin_update_user():
    data = request.json

    email = data.get("email")
    tokens = data.get("tokens")
    is_premium = data.get("is_premium")

    # Validasi input
    if email is None or tokens is None or is_premium is None:
        return jsonify({"message": "Data tidak lengkap!"}), 400

    try:
        tokens = int(tokens)
        is_premium = int(is_premium)

        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET tokens = ?, is_premium = ? WHERE email = ?",
                (tokens, is_premium, email)
            )
            conn.commit()
        return jsonify({"message": "Berhasil update user!"}), 200

    except Exception as e:
        print("🚨 UPDATE USER ERROR:", e)
        return jsonify({"message": "Gagal update user"}), 500


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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
