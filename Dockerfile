FROM python:3.11-slim

# Install NodeJS
RUN apt-get update && apt-get install -y nodejs npm

# Tempat kerja utama tetap /app
WORKDIR /app

# Copy semua file ke /app
COPY . .

# Install dependencies
RUN pip install -r requirements.txt
RUN npm install

# Build opsional
# RUN npm run build

# Jalankan langsung app.py dari folder backend
CMD ["python", "backend/app.py"]
