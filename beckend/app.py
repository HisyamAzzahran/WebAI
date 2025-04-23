from flask import Flask, request, jsonify
from flask_cors import CORS
from auth import init_db, register_user, login_user
from dotenv import load_dotenv
import google.generativeai as genai
import sqlite3
import os

# Load .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# Inisialisasi database
init_db()

# Konfigurasi Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"message": "Data tidak lengkap"}), 400

    success = register_user(username, email, password)
    if success:
        return jsonify({"message": "Berhasil daftar!"}), 200
    else:
        return jsonify({"message": "Registrasi gagal: username atau email sudah terdaftar"}), 400

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    result = login_user(email, password)
    if result:
        is_admin = email == "hisyamjunior898@gmail.com"
        return jsonify({
            "message": "Login berhasil!",
            "is_premium": result["is_premium"],
            "is_admin": is_admin
        }), 200
    else:
        return jsonify({"message": "Login gagal!"}), 401

@app.route("/generate-title", methods=["POST"])
def generate_title():
    data = request.json
    tema = data.get("tema")
    sub_tema = data.get("sub_tema")

    prompt = (
        f"Buat hanya **satu** judul essay yang kompleks, inovatif, dan menarik "
        f"tentang {sub_tema} di bidang {tema}, "
        f"dengan format seperti: Judul Singkat: Pengembangan/Penerapan Teknologi Spesifik "
        f"untuk Solusi Isu Spesifik di Daerah Spesifik, disertai Metode Riset yang Relevan. "
        f"Tampilkan **hanya judulnya saja** tanpa penjelasan tambahan, tanpa nomor, dan tanpa tips."
    )
    try:
        model = genai.GenerativeModel("models/gemini-1.5-pro-latest")  # ✅ GANTI INI!
        response = model.generate_content(prompt)
        return jsonify({"title": response.text.strip()})
    except Exception as e:
        print("🚨 Gagal generate judul (Gemini):", e)
        return jsonify({"title": "[ERROR] Gagal generate judul dari Gemini API."}), 500

@app.route("/admin/users", methods=["GET"])
def get_all_users():
    try:
        with sqlite3.connect("database.db", check_same_thread=False) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, username, email, is_premium FROM users")
            users = cursor.fetchall()
            result = [
                {"id": u[0], "username": u[1], "email": u[2], "is_premium": bool(u[3])}
                for u in users
            ]
            return jsonify(result)
    except Exception as e:
        print("🚨 Gagal ambil data user:", e)
        return jsonify({"error": "Gagal ambil data user"}), 500

if __name__ == "__main__":
    app.run(debug=True)
