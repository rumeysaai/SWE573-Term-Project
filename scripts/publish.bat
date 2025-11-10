@echo off
REM Docker Hub'a publish scripti (Windows Batch)
REM Kullanım: publish.bat [version]

setlocal enabledelayedexpansion

set VERSION=%1
if "%VERSION%"=="" set VERSION=latest

if "%DOCKER_USERNAME%"=="" (
    echo ❌ DOCKER_USERNAME environment variable ayarlanmamış!
    echo Kullanım: set DOCKER_USERNAME=your-username ^&^& publish.bat [version]
    exit /b 1
)

echo 🚀 Publishing The Hive to Docker Hub...
echo Version: %VERSION%
echo Docker Username: %DOCKER_USERNAME%

REM Docker kontrolü
docker info >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker çalışmıyor veya Docker Hub'a giriş yapmanız gerekiyor:
    echo    docker login
    exit /b 1
)

REM Backend image'ını build et ve push et
echo.
echo 📦 Building backend image...
cd backend
docker build -t %DOCKER_USERNAME%/the-hive-backend:%VERSION% .
if errorlevel 1 (
    echo ❌ Backend build hatası!
    cd ..
    exit /b 1
)
docker build -t %DOCKER_USERNAME%/the-hive-backend:latest .
if errorlevel 1 (
    echo ❌ Backend latest tag hatası!
    cd ..
    exit /b 1
)
echo 📤 Pushing backend image...
docker push %DOCKER_USERNAME%/the-hive-backend:%VERSION%
if errorlevel 1 (
    echo ❌ Backend push hatası!
    cd ..
    exit /b 1
)
docker push %DOCKER_USERNAME%/the-hive-backend:latest
if errorlevel 1 (
    echo ❌ Backend latest push hatası!
    cd ..
    exit /b 1
)
cd ..

REM Frontend image'ını build et ve push et
echo.
echo 📦 Building frontend image...
cd frontend
docker build -t %DOCKER_USERNAME%/the-hive-frontend:%VERSION% .
if errorlevel 1 (
    echo ❌ Frontend build hatası!
    cd ..
    exit /b 1
)
docker build -t %DOCKER_USERNAME%/the-hive-frontend:latest .
if errorlevel 1 (
    echo ❌ Frontend latest tag hatası!
    cd ..
    exit /b 1
)
echo 📤 Pushing frontend image...
docker push %DOCKER_USERNAME%/the-hive-frontend:%VERSION%
if errorlevel 1 (
    echo ❌ Frontend push hatası!
    cd ..
    exit /b 1
)
docker push %DOCKER_USERNAME%/the-hive-frontend:latest
if errorlevel 1 (
    echo ❌ Frontend latest push hatası!
    cd ..
    exit /b 1
)
cd ..

echo.
echo ✅ Publish tamamlandı!
echo.
echo Kullanım:
echo   set DOCKER_USERNAME=%DOCKER_USERNAME%
echo   set VERSION=%VERSION%
echo   docker-compose -f docker-compose.prod.yml up -d

endlocal

