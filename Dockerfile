FROM python:3.11-slim

# Install NodeJS
RUN apt-get update && apt-get install -y nodejs npm

# Setup direktori kerja
WORKDIR /app

# Salin dan install dependency Python
COPY requirements.txt .
RUN pip install -r requirements.txt

# Salin dan install dependency NodeJS
COPY package.json package-lock.json ./
RUN npm install

# Salin semua file proyek
COPY . .

# Jalankan build (opsional, tergantung project kamu)
RUN npm run build

# Port yang digunakan (ganti jika perlu)
EXPOSE 8000

# Jalankan aplikasi kamu
CMD ["python", "backend/app.py"]
