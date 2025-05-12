FROM python:3.11-slim

# Install NodeJS
RUN apt-get update && apt-get install -y nodejs npm

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 8000

# Jalankan pakai bentuk yang memanggil shell langsung
CMD ["sh", "-c", "cd backend && python app.py"]
