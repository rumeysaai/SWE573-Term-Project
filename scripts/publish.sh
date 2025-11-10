#!/bin/bash

# Docker Hub'a publish scripti
# Kullanım: ./scripts/publish.sh [version]

set -e

VERSION=${1:-latest}
DOCKER_USERNAME=${DOCKER_USERNAME:-"your-dockerhub-username"}

echo "🚀 Publishing The Hive to Docker Hub..."
echo "Version: $VERSION"
echo "Docker Username: $DOCKER_USERNAME"

# Docker Hub'a login kontrolü
if ! docker info | grep -q "Username"; then
    echo "⚠️  Docker Hub'a giriş yapmanız gerekiyor:"
    echo "   docker login"
    exit 1
fi

# Backend image'ını build et ve push et
echo "📦 Building backend image..."
cd backend
docker build -t ${DOCKER_USERNAME}/the-hive-backend:${VERSION} .
docker build -t ${DOCKER_USERNAME}/the-hive-backend:latest .
echo "📤 Pushing backend image..."
docker push ${DOCKER_USERNAME}/the-hive-backend:${VERSION}
docker push ${DOCKER_USERNAME}/the-hive-backend:latest
cd ..

# Frontend image'ını build et ve push et
echo "📦 Building frontend image..."
cd frontend
docker build -t ${DOCKER_USERNAME}/the-hive-frontend:${VERSION} .
docker build -t ${DOCKER_USERNAME}/the-hive-frontend:latest .
echo "📤 Pushing frontend image..."
docker push ${DOCKER_USERNAME}/the-hive-frontend:${VERSION}
docker push ${DOCKER_USERNAME}/the-hive-frontend:latest
cd ..

echo "✅ Publish tamamlandı!"
echo ""
echo "Kullanım:"
echo "  export DOCKER_USERNAME=${DOCKER_USERNAME}"
echo "  export VERSION=${VERSION}"
echo "  docker-compose -f docker-compose.prod.yml up -d"

