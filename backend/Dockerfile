# Python temel imajını al
FROM python:3.10-slim

# Çevre değişkenleri
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Çalışma dizini
WORKDIR /app

# Sistem bağımlılıklarını kur (PostgreSQL client için)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Python bağımlılıklarını kopyala ve kur
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Proje kodunu kopyala
COPY . .

# Static files dizini oluştur
RUN mkdir -p /app/staticfiles

# Non-root user oluştur (güvenlik için)
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Gunicorn ile uygulamayı çalıştır
# 0.0.0.0:8000 portundan dışarıyı dinle
EXPOSE 8000

# Production için gunicorn workers ile başlat
CMD ["gunicorn", "the_hive.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]