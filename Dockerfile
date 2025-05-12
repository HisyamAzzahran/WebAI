FROM python:3.11-slim

RUN apt-get update && apt-get install -y nodejs npm

WORKDIR /app

# Salin semua isi backend
COPY backend/ backend/

WORKDIR /app/backend

# Install Python dependencies (file sudah ada di sini)
RUN pip install -r requirements.txt

EXPOSE 8080

CMD ["python", "app.py"]
