## Production Deployment Guide

This guide explains how to deploy **The Hive** so that anyone on the internet can use it.  
The reference architecture is:

- **Frontend:** React app hosted on Vercel (free tier)
- **Backend:** Django REST API hosted on Render (free tier web service)
- **Database:** PostgreSQL managed by Render (free tier database)

> You can adapt the steps to any other providers; just keep the environment variables consistent.

---

### 1. Prerequisites

- GitHub repository for the project (Render & Vercel integrate directly with GitHub)
- Accounts on:
  - [Render](https://render.com/)
  - [Vercel](https://vercel.com/)
- Docker installed locally (for testing/builds)
- Python 3.10+ and Node 18+ locally if you prefer to run without Docker

---

### 2. Environment Variables Overview

Create a copy of `.env.prod.example` and fill in the values (never commit the real file):

```
POSTGRES_DB=the_hive_db
POSTGRES_USER=the_hive_user
POSTGRES_PASSWORD=generate-strong-password

SECRET_KEY=long-django-secret-key
DEBUG=False
ALLOWED_HOSTS=your-backend-domain.onrender.com,your-custom-domain.com

CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://www.your-custom-domain.com
CSRF_TRUSTED_ORIGINS=https://your-frontend.vercel.app,https://www.your-custom-domain.com
CSRF_COOKIE_SECURE=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SAMESITE=None
SESSION_COOKIE_SAMESITE=None

DOCKER_USERNAME=optional-if-you-push-images
VERSION=1.0.0
```

**Important notes**
- `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` must be comma-separated lists with full domains (for CSRF include `https://`).
- `CSRF_*` values are required because the frontend and backend live on different domains; without `SameSite=None` cookies will be blocked.
- When deploying on Render, set these variables in the Render dashboard (Web Service → Environment).

---

### 3. Render PostgreSQL Database

1. Go to Render → **New** → **PostgreSQL**.
2. Choose the free tier, name it `the-hive-db`.
3. Once created, go to the database dashboard → **Connections**.
4. Copy the internal connection string, you will use these values for:
   - `POSTGRES_DB`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `DB_HOST`
   - `DB_PORT`
5. Keep the connection string handy; you’ll paste these into the backend env vars.

---

### 4. Render Backend (Django/Gunicorn)

1. Go to Render → **New** → **Web Service**.
2. Connect your GitHub repo and choose the backend folder as the root (or keep repo root if Dockerfile is configured per folder).
3. Use the following build/run settings:
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn the_hive.wsgi:application --bind 0.0.0.0:8000 --workers 4`
4. Add environment variables:
   - `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
   - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_HOST`, `DB_PORT`
   - `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`
   - `CSRF_COOKIE_SECURE=True`, `SESSION_COOKIE_SECURE=True`, `CSRF_COOKIE_SAMESITE=None`, `SESSION_COOKIE_SAMESITE=None`
5. Redeploy; Render will build and start the service.
6. Run initial migrations and create a superuser:
   ```bash
   # in Render shell or via "Manual Deploy -> Shell"
   python manage.py migrate
   python manage.py createsuperuser
   ```
7. Note the Render backend URL, e.g. `https://the-hive-backend.onrender.com`.

---

### 5. Vercel Frontend (React)

1. Go to Vercel → **New Project** → import the GitHub repo.
2. Set the project root to `frontend`.
3. Environment variables:
   - `REACT_APP_API_URL=https://the-hive-backend.onrender.com/api`
4. Vercel automatically runs `npm install` and `npm run build`.
5. Deploy; you’ll get a domain like `https://the-hive-frontend.vercel.app`.

**Custom domain (optional)**
- Add your custom domain in Vercel and point DNS records to Vercel’s nameservers.
- Add the same domain to Render (Backend → Settings → Custom Domains) and supply the CNAME/A records as instructed.
- Update environment variables (`ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`) with the new domain and redeploy both services.

---

### 6. Verifying the Deployment

1. Navigate to your Vercel URL → should redirect to login.
2. Sign up/login; you should remain authenticated thanks to cookies.
3. Inspect browser developer tools → Networking tab → confirm requests go to `https://the-hive-backend...`.
4. Visit `/admin/` on the backend to access Django admin.
5. (Optional) Use `docker-compose.prod.yml` locally to replicate the production stack before pushing changes.

---

### 7. Optional: Docker Image Publish

If you prefer to deploy using container images:
1. Set `DOCKER_USERNAME` and run `scripts/publish.sh` (Linux/Mac) or `scripts\publish.bat` (Windows).
2. Render web service can be configured as a **Private Service** that deploys from Docker Hub images instead of building from source.
3. Vercel can also deploy from Docker (Advanced → Build & Output Settings), but using framework auto-builds is simpler.

---

### 8. Maintenance Checklist

- Update both services whenever you push to main.
- Review logs regularly (`Render Dashboard → Logs`, `Vercel → Deployments`).
- Rotate `SECRET_KEY` and DB password if leaked.
- Use `python manage.py createsuperuser` to manage admin accounts.
- Consider turning on HTTPS-only redirects in Django (set `SECURE_SSL_REDIRECT=True`) once you confirm HTTPS is available end to end.

---

### 9. Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 / Redirect loop | Cookies blocked | Ensure `CSRF_COOKIE_SAMESITE=None` & `SESSION_COOKIE_SAMESITE=None`, and that your frontend uses HTTPS |
| 502 on Render | Gunicorn crashed | Check logs, ensure migrations are run, verify database credentials |
| CORS error | Origins mismatch | Double-check `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` include exact frontend URL (with scheme) |
| CSRF token missing | CSRF cookie not set | Ensure you hit `/csrf/` before login (App already does this), confirm frontend is sending credentials (`withCredentials: true`) |
| Static files 404 | collectstatic not run | Render start command already runs `collectstatic`; ensure env `DJANGO_SETTINGS_MODULE` is default |

---

Deployment is now complete: users can access the Vercel URL (or your custom domain) from any device and interact with the Django backend hosted on Render with a managed Postgres database.

