FROM python:3.11-slim

# Install NodeJS
RUN apt-get update && apt-get install -y nodejs npm

# LANGSUNG MASUK FOLDER BACKEND
WORKDIR /app/backend

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Install npm dependencies
COPY ../package.json ../package-lock.json ../
RUN npm install

# Copy semua isi folder backend
COPY . .

EXPOSE 8000

# Jalankan app.py langsung, tanpa cd lagi
CMD ["python", "app.py"]
