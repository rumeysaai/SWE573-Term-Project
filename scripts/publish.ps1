# Docker Hub'a publish scripti (PowerShell)
# Kullanım: .\scripts\publish.ps1 [version]

param(
    [string]$Version = "latest",
    [string]$DockerUsername = $env:DOCKER_USERNAME
)

if (-not $DockerUsername) {
    Write-Host "❌ DOCKER_USERNAME environment variable ayarlanmamış!" -ForegroundColor Red
    Write-Host "Kullanım: `$env:DOCKER_USERNAME='your-username'; .\scripts\publish.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Publishing The Hive to Docker Hub..." -ForegroundColor Green
Write-Host "Version: $Version"
Write-Host "Docker Username: $DockerUsername"

# Docker Hub'a login kontrolü
try {
    docker info | Out-Null
} catch {
    Write-Host "⚠️  Docker Hub'a giriş yapmanız gerekiyor:" -ForegroundColor Yellow
    Write-Host "   docker login" -ForegroundColor Yellow
    exit 1
}

# Backend image'ını build et ve push et
Write-Host "`n📦 Building backend image..." -ForegroundColor Cyan
Set-Location backend
docker build -t "${DockerUsername}/the-hive-backend:${Version}" .
docker build -t "${DockerUsername}/the-hive-backend:latest" .
Write-Host "📤 Pushing backend image..." -ForegroundColor Cyan
docker push "${DockerUsername}/the-hive-backend:${Version}"
docker push "${DockerUsername}/the-hive-backend:latest"
Set-Location ..

# Frontend image'ını build et ve push et
Write-Host "`n📦 Building frontend image..." -ForegroundColor Cyan
Set-Location frontend
docker build -t "${DockerUsername}/the-hive-frontend:${Version}" .
docker build -t "${DockerUsername}/the-hive-frontend:latest" .
Write-Host "📤 Pushing frontend image..." -ForegroundColor Cyan
docker push "${DockerUsername}/the-hive-frontend:${Version}"
docker push "${DockerUsername}/the-hive-frontend:latest"
Set-Location ..

Write-Host "`n✅ Publish tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "Kullanım:" -ForegroundColor Yellow
Write-Host "  `$env:DOCKER_USERNAME='$DockerUsername'"
Write-Host "  `$env:VERSION='$Version'"
Write-Host "  docker-compose -f docker-compose.prod.yml up -d"

