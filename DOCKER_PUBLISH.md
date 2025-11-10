# Docker ile Publish Etme Rehberi

Bu rehber, The Hive projesini Docker Hub'a veya başka bir container registry'ye publish etmek için gerekli adımları içerir.

## 📋 Ön Gereksinimler

1. Docker ve Docker Compose yüklü olmalı
2. Docker Hub hesabı (veya başka bir registry)
3. `.env.prod` dosyası oluşturulmalı (production ortamı için)

## 🚀 Hızlı Başlangıç

### 1. Docker Hub'a Giriş Yapın

```bash
docker login
```

### 2. Environment Variables Ayarlayın

```bash
# Linux/Mac
export DOCKER_USERNAME=your-dockerhub-username
export VERSION=1.0.0  # İsteğe bağlı, varsayılan: latest

# Windows PowerShell
$env:DOCKER_USERNAME="your-dockerhub-username"
$env:VERSION="1.0.0"
```

### 3. Publish Scriptini Çalıştırın

**Linux/Mac:**
```bash
chmod +x scripts/publish.sh
./scripts/publish.sh 1.0.0
```

**Windows (Batch - Önerilen):**
```cmd
set DOCKER_USERNAME=your-username
scripts\publish.bat 1.0.0
```

**Windows (PowerShell - Execution Policy Gerekli):**
```powershell
# Önce execution policy'yi ayarlayın (yönetici olarak):
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Sonra scripti çalıştırın:
.\scripts\publish.ps1 -Version 1.0.0
```

**Windows (PowerShell - Bypass ile - Geçici):**
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish.ps1 -Version 1.0.0
```

## 📝 Manuel Publish Adımları

Eğer script kullanmak istemiyorsanız, aşağıdaki adımları manuel olarak takip edebilirsiniz:

### Backend Image'ını Build ve Push Etme

```bash
cd backend
docker build -t your-username/the-hive-backend:1.0.0 .
docker build -t your-username/the-hive-backend:latest .
docker push your-username/the-hive-backend:1.0.0
docker push your-username/the-hive-backend:latest
cd ..
```

### Frontend Image'ını Build ve Push Etme

```bash
cd frontend
docker build -t your-username/the-hive-frontend:1.0.0 .
docker build -t your-username/the-hive-frontend:latest .
docker push your-username/the-hive-frontend:1.0.0
docker push your-username/the-hive-frontend:latest
cd ..
```

## 🏭 Production Ortamında Çalıştırma

### 1. Production Environment Dosyası Oluşturun

`.env.prod` dosyası oluşturun:

```env
# Database
POSTGRES_DB=the_hive_db
POSTGRES_USER=the_hive_user
POSTGRES_PASSWORD=your_secure_password

# Django
SECRET_KEY=your_production_secret_key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Docker
DOCKER_USERNAME=your-dockerhub-username
VERSION=1.0.0
```

### 2. Production Compose ile Başlatın

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Logları Kontrol Edin

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 Farklı Registry Kullanma

Eğer Docker Hub yerine başka bir registry kullanmak istiyorsanız:

### GitHub Container Registry (ghcr.io)

```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag ve push
docker tag your-username/the-hive-backend:latest ghcr.io/username/the-hive-backend:latest
docker push ghcr.io/username/the-hive-backend:latest
```

### AWS ECR

```bash
# Login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag ve push
docker tag your-username/the-hive-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/the-hive-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/the-hive-backend:latest
```

### Google Container Registry (GCR)

```bash
# Login
gcloud auth configure-docker

# Tag ve push
docker tag your-username/the-hive-backend:latest gcr.io/YOUR_PROJECT_ID/the-hive-backend:latest
docker push gcr.io/YOUR_PROJECT_ID/the-hive-backend:latest
```

## 📦 Image Boyutlarını Optimize Etme

### Multi-stage Build (Zaten kullanılıyor)

Frontend Dockerfile'ı zaten multi-stage build kullanıyor, bu sayede production image'ı sadece Nginx ve build edilmiş dosyaları içeriyor.

### Backend için Optimizasyon

Backend Dockerfile'ı zaten optimize edilmiş durumda. İsterseniz daha da küçültmek için:

```dockerfile
# Alpine Linux kullanarak image boyutunu küçültebilirsiniz
FROM python:3.10-alpine
```

## 🔒 Güvenlik İpuçları

1. **Secret Management**: Production'da secret'ları environment variables veya secret management servisleri ile yönetin
2. **Image Scanning**: `docker scan` komutu ile image'larınızı tarayın
3. **Non-root User**: Mümkünse container'ları non-root user ile çalıştırın
4. **Minimal Base Images**: Alpine veya distroless image'lar kullanın

## 📊 CI/CD Entegrasyonu

### GitHub Actions Örneği

`.github/workflows/docker-publish.yml` dosyası oluşturun:

```yaml
name: Docker Publish

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/the-hive-backend:latest
      
      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/the-hive-frontend:latest
```

## 🐛 Sorun Giderme

### Image bulunamadı hatası

```bash
# Image'ların push edildiğini kontrol edin
docker images | grep the-hive

# Docker Hub'da image'ları kontrol edin
# https://hub.docker.com/r/your-username/the-hive-backend
```

### Pull hatası

```bash
# Login durumunu kontrol edin
docker info

# Tekrar login olun
docker login
```

## 📚 Ek Kaynaklar

- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

