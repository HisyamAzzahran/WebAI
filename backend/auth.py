import sqlite3
import bcrypt

DB_NAME = "database.db"

def init_db():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_premium INTEGER DEFAULT 0,
            is_admin INTEGER DEFAULT 0,
            tokens INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

def register_user(username, email, password):
    try:
        with sqlite3.connect(DB_NAME, check_same_thread=False) as conn:
            cursor = conn.cursor()
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            print(f"📥 REGISTER ATTEMPT: {username}, {email}")
            cursor.execute("INSERT INTO users (username, email, password, tokens) VALUES (?, ?, ?, ?)",
                   (username, email, hashed, 5))
            conn.commit()
            return True
    except sqlite3.IntegrityError as e:
        print("⚠️ DUPLICATE EMAIL:", e)
        return False
    except Exception as e:
        print("🚨 REGISTRASI GAGAL:", e)
        return False


def login_user(email, password):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("SELECT username, email, password, is_premium, is_admin, tokens FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    if user and bcrypt.checkpw(password.encode(), user[2].encode()):
        return {
            "username": user[0],
            "email": user[1],
            "is_premium": user[3],
            "is_admin": user[4],
            "tokens": user[5]
        }
    else:
        return None





