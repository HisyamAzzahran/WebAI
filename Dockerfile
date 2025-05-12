FROM python:3.11-slim

# Install NodeJS
RUN apt-get update && apt-get install -y nodejs npm

# Set working directory
WORKDIR /app

# Salin seluruh folder backend ke image
COPY backend/ backend/

# Masuk ke dalam backend
WORKDIR /app/backend

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

# Expose port
EXPOSE 8080

# Jalankan backend
CMD ["python", "app.py"]
