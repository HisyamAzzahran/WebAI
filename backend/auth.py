# auth.py
import sqlite3
import bcrypt

DB_NAME = "webai.db" # Pastikan ini adalah nama database yang benar dan konsisten

def init_db():
    conn = None # Inisialisasi conn
    try:
        conn = sqlite3.connect(DB_NAME) # Menggunakan DB_NAME
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL, -- Akan menyimpan hash password sebagai string
                is_premium INTEGER DEFAULT 0,
                is_admin INTEGER DEFAULT 0,
                tokens INTEGER DEFAULT 0
            )
        ''')
        conn.commit()
    except sqlite3.Error as e:
        print(f"[DB Error in init_db] {str(e)}")
    finally:
        if conn:
            conn.close()

def register_user(username, email, password_input): # Mengganti nama parameter password
    try:
        # Menggunakan 'with' statement lebih aman untuk koneksi karena otomatis commit/rollback & close
        with sqlite3.connect(DB_NAME, check_same_thread=False) as conn:
            cursor = conn.cursor()
            # 1. Encode password input ke bytes, lalu hash
            hashed_bytes = bcrypt.hashpw(password_input.encode('utf-8'), bcrypt.gensalt())
            # 2. Decode hash bytes ke string untuk disimpan di kolom TEXT database
            hashed_string_for_db = hashed_bytes.decode('utf-8')
            
            print(f"📥 REGISTER ATTEMPT: {username}, {email}")
            cursor.execute("INSERT INTO users (username, email, password, tokens, is_premium, is_admin) VALUES (?, ?, ?, ?, ?, ?)",
                           (username, email, hashed_string_for_db, 10, 0, 0)) # Memberi nilai default untuk tokens, is_premium, is_admin
            # conn.commit() # Tidak perlu conn.commit() eksplisit jika menggunakan 'with' statement
            return True
    except sqlite3.IntegrityError: # Lebih spesifik untuk email duplikat
        print(f"⚠️ DUPLICATE EMAIL during registration: {email}")
        return False
    except Exception as e:
        print(f"🚨 REGISTRASI GAGAL: {str(e)}")
        return False

def login_user(email, password_input): # Mengganti nama parameter password
    conn = None # Inisialisasi conn
    try:
        conn = sqlite3.connect(DB_NAME) # Menggunakan DB_NAME
        cursor = conn.cursor()

        # Ambil semua kolom yang diperlukan, termasuk password hash
        cursor.execute("SELECT username, email, password, is_premium, is_admin, tokens FROM users WHERE email = ?", (email,))
        user_record = cursor.fetchone()

        if user_record:
            # user_record[2] adalah password hash (string) dari database
            hashed_password_from_db_str = user_record[2]

            # Bandingkan password input (plain text) dengan hash dari database
            # Keduanya harus di-encode ke bytes untuk bcrypt.checkpw
            if bcrypt.checkpw(password_input.encode('utf-8'), hashed_password_from_db_str.encode('utf-8')):
                # Password cocok
                return {
                    "username": user_record[0],
                    "email": user_record[1],
                    "is_premium": bool(user_record[3]), # Konversi 0/1 ke False/True
                    "is_admin": bool(user_record[4]),   # Konversi 0/1 ke False/True
                    "tokens": user_record[5]
                }
            else:
                # Password tidak cocok
                print(f"[Login Attempt] Password salah untuk email: {email}")
                return None
        else:
            # User dengan email tersebut tidak ditemukan
            print(f"[Login Attempt] User tidak ditemukan: {email}")
            return None

    except sqlite3.Error as e:
        print(f"[DB Error in login_user] {str(e)}")
        return None # Kembalikan None jika ada error database
    except Exception as e:
        print(f"[Unexpected Error in login_user] {str(e)}")
        return None # Kembalikan None untuk error lainnya
    finally:
        if conn:
            conn.close() # Pastikan koneksi selalu ditutup