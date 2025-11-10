import os
from pathlib import Path

ROOT_URLCONF = 'the_hive.urls'
# ... (diğer ayarlar) ...
BASE_DIR = Path(__file__).resolve().parent.parent

# Yardımcı fonksiyonlar
def get_env_list(name, default):
    value = os.environ.get(name)
    if value:
        return [item.strip() for item in value.split(',') if item.strip()]
    return default


def get_env_bool(name, default):
    value = os.environ.get(name)
    if value is None:
        return default
    return value.lower() in ('1', 'true', 'yes', 'on')


# SECRET_KEY'i .env'den al, yoksa geliştirme için varsayılan oluştur
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-me')

# DEBUG ayarını .env'den al (varsayılan True)
DEBUG = get_env_bool('DEBUG', True)

# Django'nun (Docker içinden) backend'e ve localhost'a erişimine izin ver
ALLOWED_HOSTS = get_env_list('ALLOWED_HOSTS', ['backend', 'localhost', '127.0.0.1'])

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
        'HOST': os.environ.get('DB_HOST', 'db'),  # docker-compose'daki servis adı varsayılan
        'PORT': int(os.environ.get('DB_PORT', 5432)),
    }
}

REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend'
    ]
}


# CORS ayarını env'den oku, yoksa varsayılan localhost değerlerini kullan
LOCAL_FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOWED_ORIGINS = get_env_list('CORS_ALLOWED_ORIGINS', LOCAL_FRONTEND_ORIGINS)
CSRF_TRUSTED_ORIGINS = get_env_list('CSRF_TRUSTED_ORIGINS', LOCAL_FRONTEND_ORIGINS)

# React'in cookie göndermesine izin ver
CORS_ALLOW_CREDENTIALS = True 

# Cookie ayarlarını env'den yönet (cross-site için None/Secure kullanabilirsiniz)
CSRF_COOKIE_SAMESITE = os.environ.get('CSRF_COOKIE_SAMESITE', 'Lax')
SESSION_COOKIE_SAMESITE = os.environ.get('SESSION_COOKIE_SAMESITE', 'Lax')

CSRF_COOKIE_SECURE = get_env_bool('CSRF_COOKIE_SECURE', False)
SESSION_COOKIE_SECURE = get_env_bool('SESSION_COOKIE_SECURE', False)

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

STATIC_URL = 'django-static/'