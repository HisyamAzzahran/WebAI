import sqlite3
import bcrypt

# Konfigurasi akun admin
email = "hisyamjunior898@gmail.com"
username = "adminhisyam"
password = "Hisy@m123"
hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

# Connect dan insert ke DB
conn = sqlite3.connect("database.db")
cursor = conn.cursor()

try:
    cursor.execute("INSERT INTO users (username, email, password, is_premium) VALUES (?, ?, ?, ?)",
                   (username, email, hashed_pw, 1))  # is_premium = 1
    conn.commit()
    print("✅ Admin user berhasil dibuat!")
except sqlite3.IntegrityError as e:
    print("⚠️ Admin user sudah ada:", e)
finally:
    conn.close()
