# GiftGraph Backend - Phase 1 Setup Complete ✅

## What's Been Created

✅ **Complete Django Project Structure**
- `config/` — Main Django settings, URLs, and WSGI
- `apps/` — Five modular apps (users, products, wishlists, recommendations, chat)
- `common/` — Shared utilities
- Custom User model with privacy settings
- JWT authentication configured
- CORS enabled for React frontend

✅ **Configuration Files**
- `.env.example` — Environment template
- `.env` — Local development config
- `settings.py` — Centralized Django settings
- `requirements.txt` — All dependencies

✅ **Database & Services**
- `docker-compose.yml` — PostgreSQL 15 + Redis 7
- Custom User model (AUTH_USER_MODEL)
- Celery configured for async tasks

## Prerequisites

You need to install **Docker Desktop** for Mac:
→ https://www.docker.com/products/docker-desktop

## Getting Started

### 1. Start PostgreSQL & Redis

```bash
cd /Users/ohadshushan/Desktop/workshop
docker compose up -d
```

Wait for both services to be healthy:
```bash
docker compose ps
# Both should show "healthy" status
```

### 2. Create migrations and apply them

```bash
cd backend
source venv/bin/activate

# Generate migrations
python manage.py makemigrations

# Apply migrations to database
python manage.py migrate

# Create a superuser (optional)
python manage.py createsuperuser
```

### 3. Start the Django server

```bash
cd /Users/ohadshushan/Desktop/workshop/backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

The backend will be running at: **http://localhost:8000**

## API Endpoints (Phase 1)

✅ **Authentication**
- `POST /api/auth/token/` — Login (get JWT tokens)
- `POST /api/auth/token/refresh/` — Refresh expired token
- `POST /api/auth/token/blacklist/` — Logout

✅ **Admin**
- `GET /admin/` — Django admin panel
- Username: (created with createsuperuser)
- Password: (set with createsuperuser)

## Frontend Connection

The frontend (running on `http://localhost:5173`) expects:
```
VITE_API_URL=http://localhost:8000/api
```

This is already set in `frontend/.env`

## Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── .env                    # Local dev config
├── .env.example
├── venv/                   # Virtual environment
├── config/
│   ├── settings.py         # All Django config
│   ├── urls.py
│   ├── wsgi.py
│   ├── celery.py
│   └── __init__.py
├── apps/
│   ├── users/
│   │   ├── models.py       # Custom User model
│   │   ├── urls.py
│   │   ├── views.py        # (To be created)
│   │   └── ...
│   ├── products/
│   ├── wishlists/
│   ├── recommendations/
│   └── chat/
└── common/
    └── constants.py        # (To be created)
```

## Next Steps

### Immediate (To make it work):
1. ✅ Install Docker Desktop
2. ✅ Start PostgreSQL & Redis: `docker compose up -d`
3. ✅ Run migrations: `python manage.py migrate`
4. ✅ Start server: `python manage.py runserver`

### Phase 2 — User Authentication API
- Create User serializers and controllers
- Implement `/api/auth/register/` endpoint
- Create `/api/users/me/` endpoint
- Add JWT token refresh logic

### Phase 3+ — Build remaining endpoints
- Product catalog endpoints
- Wishlist management
- Recommendation engine
- Chat integration

## Database Connection

The backend automatically connects to:
- **Host**: localhost
- **Port**: 5432
- **Database**: giftgraph
- **User**: giftgraph_user
- **Password**: giftgraph_pass

(These are set in `docker-compose.yml` and `.env`)

## Troubleshooting

### "Connection refused" error
→ Make sure `docker compose up -d` completed and containers are running
```bash
docker compose ps
```

### "No module named 'app'" error
→ Activate the virtual environment:
```bash
source venv/bin/activate
```

### Port 8000 already in use
→ Run on a different port:
```bash
python manage.py runserver 0.0.0.0:8001
```

### Reset everything
```bash
docker compose down  # Stop and remove containers
docker compose up -d # Start fresh
python manage.py migrate # Fresh migrations
```

---

**Status**: Phase 1 Complete — Ready for Phase 2! 🚀
