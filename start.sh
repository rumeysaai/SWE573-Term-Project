#!/bin/bash

# Docker'ın hazır olup olmadığını kontrol et
echo "Docker kontrol ediliyor..."
until docker ps > /dev/null 2>&1; do
    echo "Docker Desktop başlatılıyor, lütfen bekleyin..."
    sleep 3
done

echo "✅ Docker hazır!"

# dokploy-network'i oluştur (yoksa)
echo "Ağ kontrol ediliyor..."
docker network create dokploy-network 2>/dev/null || echo "Ağ zaten mevcut veya oluşturuldu"

# Uygulamayı başlat
echo "Uygulama başlatılıyor..."
cd "$(dirname "$0")"
docker compose up -d

# Durumu göster
echo ""
echo "📊 Servis durumu:"
docker compose ps

echo ""
echo "✅ Uygulama başlatıldı!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "👤 Admin Panel: http://localhost:8000/admin"
echo ""
echo "Logları görmek için: docker compose logs -f"

