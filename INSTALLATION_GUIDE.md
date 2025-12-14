# Installation Guide

This guide will help you set up The Hive project from scratch. The project consists of a Django backend and a React frontend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
   - [Method 1: Docker (Recommended)](#method-1-docker-recommended)
   - [Method 2: Manual Installation](#method-2-manual-installation)
3. [Post-Installation Setup](#post-installation-setup)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have the following installed:

### For Docker Installation:
- **Docker** (version 20.10 or higher)
  - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (version 2.0 or higher)
  - Usually included with Docker Desktop
  - [Install Docker Compose](https://docs.docker.com/compose/install/)

### For Manual Installation:
- **Python** (version 3.10 or higher)
  - [Download Python](https://www.python.org/downloads/)
- **Node.js** (version 18 or higher) and **npm**
  - [Download Node.js](https://nodejs.org/)
- **PostgreSQL** (version 12 or higher)
  - [Download PostgreSQL](https://www.postgresql.org/download/)
- **Git**
  - [Download Git](https://git-scm.com/downloads)

---

## Installation Methods

### Method 1: Docker (Recommended)

This is the easiest and recommended way to set up the project. Docker handles all dependencies and configurations automatically.

#### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd SWE573_term_project
```

#### Step 2: Create Environment File

Create a `.env` file in the root directory:

```bash
# Copy example file if it exists, or create manually
touch .env
```

Edit the `.env` file with the following variables:

```env
# Database Configuration
POSTGRES_DB=the_hive_db
POSTGRES_USER=the_hive_user
POSTGRES_PASSWORD=your_secure_password_here
DB_HOST=db
DB_PORT=5432

# Django Configuration
SECRET_KEY=your-secret-key-here-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# CORS Configuration (for development)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Important:** Replace `your_secure_password_here` and `your-secret-key-here-change-this-in-production` with secure values.

#### Step 3: Create Docker Network (if needed)

The docker-compose.yml uses an external network. If it doesn't exist, create it:

```bash
docker network create dokploy-network
```

#### Step 4: Configure Nginx for Local Development

If you're running the project locally (not in production), you need to uncomment the proxy settings in the nginx configuration file:

1. Open `frontend/nginx.conf`
2. Uncomment the following sections (remove the `#` characters):
   - `location /api/` block (lines 12-21)
   - `location /admin/` block (lines 23-29)
   - `location /django-static/` block (lines 30-32)

The file should look like this after uncommenting:

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html; 
    }

    location /api/ {
        proxy_cookie_flags sessionid SameSite=Lax;
        proxy_cookie_flags csrftoken SameSite=Lax;
        proxy_pass http://backend:8000; 
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://backend:8000/admin/; 
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /django-static/ {
        proxy_pass http://backend:8000/django-static/; 
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

**Note:** This step is only necessary if you're using Docker with nginx. If you're running the frontend with `npm start` in development mode, you don't need to modify nginx.conf.

#### Step 5: Start the Services

```bash
# Build and start all services
docker-compose up -d

# View logs to ensure everything is starting correctly
docker-compose logs -f
```

The `-d` flag runs containers in detached mode (in the background).

#### Step 6: Run Database Migrations

```bash
# Run migrations
docker-compose exec backend python manage.py migrate
```

#### Step 7: Create Superuser (Optional)

Create an admin user to access the Django admin panel:

```bash
docker-compose exec backend python manage.py createsuperuser
```

Follow the prompts to create your admin account.

#### Step 8: Access the Application

Once all services are running, you can access:

- **Frontend:** http://localhost:3000 (if port mapping is configured)
- **Backend API:** http://localhost:8000
- **Admin Panel:** http://localhost:8000/admin

---

### Method 2: Manual Installation

If you prefer to run the project without Docker, follow these steps.

#### Backend Setup

##### Step 1: Navigate to Backend Directory

```bash
cd backend
```

##### Step 2: Create Virtual Environment

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

##### Step 3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

##### Step 4: Set Up Environment Variables

Create a `.env` file in the `backend` directory or set environment variables:

**Linux/Mac:**
```bash
export POSTGRES_DB=the_hive_db
export POSTGRES_USER=the_hive_user
export POSTGRES_PASSWORD=your_password
export DB_HOST=localhost
export DB_PORT=5432
export SECRET_KEY=your-secret-key-here
export DEBUG=True
export ALLOWED_HOSTS=localhost,127.0.0.1
```

**Windows (PowerShell):**
```powershell
$env:POSTGRES_DB="the_hive_db"
$env:POSTGRES_USER="the_hive_user"
$env:POSTGRES_PASSWORD="your_password"
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:SECRET_KEY="your-secret-key-here"
$env:DEBUG="True"
$env:ALLOWED_HOSTS="localhost,127.0.0.1"
```

##### Step 5: Set Up PostgreSQL Database

1. Start PostgreSQL service
2. Create database and user:

```bash
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL shell:
CREATE DATABASE the_hive_db;
CREATE USER the_hive_user WITH PASSWORD 'your_password';
ALTER ROLE the_hive_user SET client_encoding TO 'utf8';
ALTER ROLE the_hive_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE the_hive_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE the_hive_db TO the_hive_user;
\q
```

##### Step 6: Run Migrations

```bash
python manage.py migrate
```

##### Step 7: Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

##### Step 8: Start Backend Server

```bash
# Development server
python manage.py runserver

# Or with Gunicorn (production-like)
gunicorn the_hive.wsgi:application --bind 0.0.0.0:8000
```

Backend will be available at: http://localhost:8000

#### Frontend Setup

##### Step 1: Navigate to Frontend Directory

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

##### Step 2: Install Node Dependencies

```bash
npm install
```

##### Step 3: Configure API URL (if needed)

The frontend is configured to proxy API requests to `http://localhost:8000` by default (see `package.json`). If your backend runs on a different URL, update the proxy setting or create a `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

##### Step 4: Start Frontend Development Server

```bash
npm start
```

Frontend will be available at: http://localhost:3000

The browser should open automatically. If not, navigate to http://localhost:3000 manually.

---

## Post-Installation Setup

### 1. Verify Database Connection

Check that the backend can connect to the database:

```bash
# Docker
docker-compose exec backend python manage.py dbshell

# Manual
python manage.py dbshell
```

### 2. Load Initial Data (Optional)

If you have fixtures or seed data:

```bash
# Docker
docker-compose exec backend python manage.py loaddata <fixture_name>

# Manual
python manage.py loaddata <fixture_name>
```

### 3. Collect Static Files (Production)

For production deployments:

```bash
# Docker
docker-compose exec backend python manage.py collectstatic --noinput

# Manual
python manage.py collectstatic --noinput
```

---

## Verification

### Check Backend Health

```bash
# Test API endpoint
curl http://localhost:8000/api/

# Or visit in browser
# http://localhost:8000/api/
```

### Check Frontend

1. Open browser: http://localhost:3000
2. You should see the welcome page
3. Try navigating to different pages

### Check Admin Panel

1. Visit: http://localhost:8000/admin
2. Login with the superuser credentials you created
3. You should see the Django admin interface

### Run Tests

**Backend Tests:**
```bash
# Docker
docker-compose exec backend python manage.py test

# Manual
python manage.py test
```

**Frontend Tests:**
```bash
cd frontend

# Unit tests
npm test -- --watchAll=false

# E2E tests (requires backend and frontend running)
npm run test:e2e
```

---

## Troubleshooting

### Docker Issues

#### Port Already in Use

If you get an error that ports 3000 or 8000 are already in use:

**Linux/Mac:**
```bash
# Find process using port
lsof -i :3000
lsof -i :8000

# Kill process (replace PID with actual process ID)
kill -9 <PID>
```

**Windows:**
```powershell
# Find process using port
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

Or change ports in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use 3001 instead of 3000
  - "8001:8000"  # Use 8001 instead of 8000
```

#### Container Not Starting

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

#### Database Connection Error

```bash
# Check if database container is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Manual Installation Issues

#### Python Virtual Environment Issues

```bash
# If virtual environment activation fails
python3 -m venv --clear venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

#### PostgreSQL Connection Issues

1. Ensure PostgreSQL is running:
   ```bash
   # Linux
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   
   # Mac
   brew services start postgresql
   
   # Windows
   # Check Services panel
   ```

2. Verify database credentials in `.env` file
3. Check PostgreSQL is listening on correct port (default: 5432)

#### Node.js/npm Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### CORS Errors

If you see CORS errors in the browser console:

1. Check `CORS_ALLOWED_ORIGINS` in backend settings
2. Ensure frontend URL is included in allowed origins
3. For development, you can temporarily allow all origins (NOT for production):
   ```python
   CORS_ALLOW_ALL_ORIGINS = True  # Only for development!
   ```

### Common Errors

#### "Module not found" Errors

**Backend:**
```bash
# Ensure virtual environment is activated
# Reinstall dependencies
pip install -r requirements.txt
```

**Frontend:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

#### Migration Errors

```bash
# Reset migrations (WARNING: This will delete data)
# Docker
docker-compose exec backend python manage.py migrate --fake-initial

# Manual
python manage.py migrate --fake-initial
```

#### Static Files Not Loading

```bash
# Collect static files
python manage.py collectstatic

# Check STATIC_ROOT and STATIC_URL in settings.py
```

---

## Stopping the Application

### Docker

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v
```

### Manual

1. **Stop Backend:** Press `Ctrl+C` in the terminal running the backend
2. **Stop Frontend:** Press `Ctrl+C` in the terminal running the frontend
3. **Stop PostgreSQL:** Stop the PostgreSQL service

---

## Next Steps

After successful installation:

1. **Read the Documentation:**
   - [README_DOCKER.md](./README_DOCKER.md) - Docker-specific information
   - [TEST_RUN_GUIDE.md](./TEST_RUN_GUIDE.md) - How to run tests
   - [TEST_RESULTS.md](./TEST_RESULTS.md) - Test results and coverage

2. **Explore the Application:**
   - Create a user account
   - Explore different features
   - Check the admin panel

3. **Development:**
   - Set up your IDE/editor
   - Configure linting and formatting
   - Read the codebase documentation

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the logs:
   - Docker: `docker-compose logs -f`
   - Backend: Check terminal output
   - Frontend: Check browser console and terminal

2. Review error messages carefully

3. Check GitHub issues (if applicable)

4. Review Django and React documentation

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `the_hive_db` |
| `POSTGRES_USER` | Database user | `the_hive_user` |
| `POSTGRES_PASSWORD` | Database password | `secure_password_123` |
| `SECRET_KEY` | Django secret key | `django-insecure-...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Debug mode | `True` |
| `DB_HOST` | Database host | `db` (Docker) or `localhost` (Manual) |
| `DB_PORT` | Database port | `5432` |
| `ALLOWED_HOSTS` | Allowed hosts | `localhost,127.0.0.1,backend` |
| `CORS_ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |

---

**Last Updated:** 2024-12-19

