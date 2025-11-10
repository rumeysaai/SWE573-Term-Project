# 🐳 Docker ile The Hive Projesini Çalıştırma

## Hızlı Başlangıç

### Development Ortamı

```bash
# 1. Environment dosyasını oluşturun
cp .env.example .env

# 2. .env dosyasını düzenleyin ve gerekli değerleri girin

# 3. Docker Compose ile başlatın
docker-compose up -d

# 4. Logları takip edin
docker-compose logs -f
```

Uygulama şu adreslerde çalışacak:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

### Production Ortamı

```bash
# 1. Production environment dosyasını oluşturun
cp .env.prod.example .env.prod

# 2. .env.prod dosyasını düzenleyin

# 3. Docker Hub'dan image'ları çekin veya kendi image'larınızı build edin
# (Detaylar için DOCKER_PUBLISH.md dosyasına bakın)

# 4. Production compose ile başlatın
docker-compose -f docker-compose.prod.yml up -d
```

## 📦 Docker Image'larını Publish Etme

Detaylı bilgi için [DOCKER_PUBLISH.md](./DOCKER_PUBLISH.md) dosyasına bakın.

### Hızlı Publish

**Linux/Mac:**
```bash
export DOCKER_USERNAME=your-username
./scripts/publish.sh 1.0.0
```

**Windows:**
```powershell
$env:DOCKER_USERNAME="your-username"
.\scripts\publish.ps1 -Version 1.0.0
```

## 🔧 Yaygın Komutlar

### Servisleri Durdurma
```bash
docker-compose down
```

### Servisleri Yeniden Başlatma
```bash
docker-compose restart
```

### Veritabanını Sıfırlama
```bash
docker-compose down -v  # Volume'ları da siler
docker-compose up -d
```

### Logları Görüntüleme
```bash
# Tüm servisler
docker-compose logs -f

# Sadece backend
docker-compose logs -f backend

# Sadece frontend
docker-compose logs -f frontend
```

### Container'a Giriş Yapma
```bash
# Backend container'ına
docker-compose exec backend bash

# Database container'ına
docker-compose exec db psql -U the_hive_user -d the_hive_db
```

### Django Komutlarını Çalıştırma
```bash
# Migration
docker-compose exec backend python manage.py migrate

# Superuser oluşturma
docker-compose exec backend python manage.py createsuperuser

# Shell
docker-compose exec backend python manage.py shell
```

## 🏗️ Build İşlemleri

### Manuel Build

```bash
# Backend
cd backend
docker build -t the-hive-backend .
cd ..

# Frontend
cd frontend
docker build -t the-hive-frontend .
cd ..
```

## 📊 Health Check

Servislerin durumunu kontrol etmek için:

```bash
docker-compose ps
```

## 🔍 Sorun Giderme

### Port Zaten Kullanılıyor
```bash
# Port'u kullanan process'i bulun
# Linux/Mac
lsof -i :3000
lsof -i :8000

# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :8000
```

### Container Başlamıyor
```bash
# Logları kontrol edin
docker-compose logs backend
docker-compose logs frontend

# Container'ı yeniden build edin
docker-compose build --no-cache
docker-compose up -d
```

### Database Bağlantı Hatası
```bash
# Database container'ının çalıştığını kontrol edin
docker-compose ps db

# Database loglarını kontrol edin
docker-compose logs db
```

## 📚 Daha Fazla Bilgi

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Publish Rehberi](./DOCKER_PUBLISH.md)

