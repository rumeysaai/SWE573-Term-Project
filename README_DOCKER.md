# 🐳 Running The Hive Project with Docker

## Quick Start

### Development Environment

```bash
# 1. Create environment file
cp .env.example .env

# 2. Edit .env file and enter required values

# 3. Start with Docker Compose
docker-compose up -d

# 4. Follow logs
docker-compose logs -f
```

The application will run at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

### Production Environment

```bash
# 1. Create production environment file
cp .env.prod.example .env.prod

# 2. Edit .env.prod file

# 3. Pull images from Docker Hub or build your own images
# (See DOCKER_PUBLISH.md file for details)

# 4. Start with production compose
docker-compose -f docker-compose.prod.yml up -d
```

## 📦 Publishing Docker Images

For detailed information, see the [DOCKER_PUBLISH.md](./DOCKER_PUBLISH.md) file.

### Quick Publish

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

## 🔧 Common Commands

### Stopping Services
```bash
docker-compose down
```

### Restarting Services
```bash
docker-compose restart
```

### Resetting Database
```bash
docker-compose down -v  # Also deletes volumes
docker-compose up -d
```

### Viewing Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Accessing Container
```bash
# Backend container
docker-compose exec backend bash

# Database container
docker-compose exec db psql -U the_hive_user -d the_hive_db
```

### Running Django Commands
```bash
# Migration
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Shell
docker-compose exec backend python manage.py shell
```

## 🏗️ Build Operations

### Manual Build

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

To check the status of services:

```bash
docker-compose ps
```

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Find process using the port
# Linux/Mac
lsof -i :3000
lsof -i :8000

# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :8000
```

### Container Not Starting
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild container
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Error
```bash
docker-compose ps db
docker-compose logs db
```

## 📚 More Information

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Publish Guide](./DOCKER_PUBLISH.md)
