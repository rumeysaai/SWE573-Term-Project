# Python temel imajını al
FROM python:3.10-slim

# Çevre değişkenleri
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Çalışma dizini
WORKDIR /app

# Bağımlılıkları kopyala ve kur
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Proje kodunu kopyala
COPY . .

# Gunicorn ile uygulamayı çalıştır
# 0.0.0.0:8000 portundan dışarıyı dinle
EXPOSE 8000
CMD ["gunicorn", "the_hive.wsgi:application", "--bind", "0.0.0.0:8000"]