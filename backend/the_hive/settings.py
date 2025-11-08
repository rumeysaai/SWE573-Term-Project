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
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
    'django_filters',
]
# MIDDLEWARE
# Gelen isteklere ve giden yanıtlara müdahale eden katmanlar.
# Admin paneli (ve CORS) için zorunludur.
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    
    # HINT'in belirttiği gibi 'AuthenticationMiddleware'den önce olmalı
    'django.contrib.sessions.middleware.SessionMiddleware', 
    
    # CORS (React'ten gelen istekler için)
    'corsheaders.middleware.CorsMiddleware', 
    
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    
    # Admin paneli için zorunlu
    'django.contrib.auth.middleware.AuthenticationMiddleware', 
    
    # Admin paneli için zorunlu
    'django.contrib.messages.middleware.MessageMiddleware', 
    
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# TEMPLATES
# Admin panelinin (admin.E403 hatası) çalışması için zorunlu.
# 'APP_DIRS': True ayarı, Django'ya admin panelinin kendi HTML
# dosyalarını bulmasını söyler.
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


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

REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend'
    ]
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