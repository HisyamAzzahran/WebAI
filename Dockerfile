FROM python:3.11-slim

# Install NodeJS
RUN apt-get update && apt-get install -y nodejs npm

# Tempat kerja utama tetap /app
WORKDIR /app

# Copy backend folder ke dalam image
COPY backend/ backend/

COPY requirements.txt .
RUN pip install -r requirements.txt

# (Opsional) Build frontend
# RUN npm run build

# Jalankan backend dari file app.py di folder backend
CMD ["python", "backend/app.py"]
