# 1. Adım: Temel İmaj
# Python 3.10'un hafif (slim) bir sürümünü kullanıyoruz.
FROM python:3.10-slim

# 2. Adım: Çalışma Dizinini Ayarlama
# Konteyner içindeki varsayılan çalışma dizinini /app olarak belirliyoruz.
WORKDIR /app

# 3. Adım: Bağımlılıkları Kopyalama ve Kurma
# Önce sadece requirements.txt'yi kopyalıyoruz.
# Docker katman önbelleklemesi (layer caching) sayesinde, kod değişse bile
# bağımlılıklar değişmezse bu adımı tekrar çalıştırmaz, build hızlanır.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Adım: Proje Kodunu Kopyalama
# Geri kalan tüm proje dosyalarını (/app dizinine) kopyalıyoruz.
COPY . .

# 5. Adım: Konteyner Çalıştığında Çalıştırılacak Komut
# API'yi 0.0.0.0 adresi üzerinden 80 portunda yayınlıyoruz.
# 0.0.0.0: Konteynerin içindeki IP'ye değil, dışarıdan gelen tüm isteklere
# açık olmasını sağlar (Docker için kritik).
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]