import os
from pathlib import Path

ROOT_URLCONF = 'the_hive.urls'
# ... (diğer ayarlar) ...
BASE_DIR = Path(__file__).resolve().parent.parent

# SECRET_KEY'i .env'den al
SECRET_KEY = os.environ.get('SECRET_KEY')

# DEBUG ayarını .env'den al
DEBUG = os.environ.get('DEBUG', '0') == '1'

# Django'nun (Docker içinden) backend'e ve localhost'a erişimine izin ver
ALLOWED_HOSTS = ['backend', 'localhost', '127.0.0.1']

# ... (INSTALLED_APPS vb.) ...

# VERİTABANI Ayarları (.env'den okuyacak şekilde)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB'),
        'USER': os.environ.get('POSTGRES_USER'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD'),
        'HOST': 'db', # docker-compose'daki servis adı
        'PORT': 5432,
    }
}

# CORS ayarını da güncelleyelim (Sadece debug ise localhost'a izin ver)
if DEBUG:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
else:
    # Prodüksiyon için buraya Vercel/Sunucu adresinizi eklersiniz
    CORS_ALLOWED_ORIGINS = [
        "https://sizin-domaininiz.com",
    ]