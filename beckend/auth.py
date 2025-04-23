import sqlite3
import bcrypt

DB_NAME = "database.db"

def init_db():
    with sqlite3.connect(DB_NAME, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                email TEXT UNIQUE,
                password TEXT,
                is_premium INTEGER DEFAULT 0
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
            cursor.execute("INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                           (username, email, hashed))
            conn.commit()
            return True
    except sqlite3.IntegrityError as e:
        print("⚠️ DUPLICATE EMAIL:", e)
        return False
    except Exception as e:
        print("🚨 REGISTRASI GAGAL:", e)
        return False


def login_user(email, password):
    try:
        with sqlite3.connect(DB_NAME, check_same_thread=False) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT password, is_premium FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()
            if user and bcrypt.checkpw(password.encode('utf-8'), user[0]):
                return {"is_premium": bool(user[1])}
    except Exception as e:
        print("🚨 LOGIN ERROR:", e)
    return None

