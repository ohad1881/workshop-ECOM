# Backend — GiftGraph

Django 5.1 + Django REST Framework + PostgreSQL + JWT (simplejwt) + Celery/Redis + Anthropic SDK +
Google OR-Tools. Serves the React frontend described in `../frontend/CLAUDE.md`.
The authoritative build plan and API contract live in the root `README.md` (architecture = §3,
structure = §4, endpoints = Appendix B) and `../API.md`.

## Architecture: layer-first (transport → service → data)

The backend is organized **by layer, not by feature**. The three top-level folders **are** the
architectural layers; each domain (`users`, `products`, `wishlists`, `recommendations`, `chat`) is a
subfolder inside each layer it needs. Dependencies flow **one way only**:

```
api/  ──imports──▶  services/  ──imports──▶  data/
(transport/HTTP)    (business logic)         (models + ORM)
```

```
backend/
  api/<domain>/          TRANSPORT — DRF views (the "controllers"), serializers, urls, permissions
  services/<domain>/     SERVICE   — business logic; services.py (+ engine/optimizer/ai_service/tools/tasks)
  data/<domain>/         DATA      — each domain IS a Django app: models.py, repositories.py, migrations/, admin.py
  config/                Django core: settings.py, urls.py, wsgi.py, celery.py
  common/                shared helpers (pagination, app-wide constants) — revisit later
  tests/                 mirrors the layers — NOT IMPLEMENTED YET
```

### The layering rule (the one thing to get right)

- **`api/` imports from `services/` only** — never touches the ORM, models, or repositories.
- **`services/` imports from `data/` only** — never touches HTTP, `request`, or `Response`.
- **`data/` imports nothing from the layers above it.**

A request flows: **view** parses input (via a serializer) → calls a **service** function → service
applies business rules and calls one or more **repositories** → repository runs the ORM query. The
view then serializes the result. Thin pass-through services are fine for trivial CRUD — keep the
chain consistent so the seam is there when logic grows.

### Why `data/` holds the Django apps

Django requires models to live inside a **registered app** (migrations, `AUTH_USER_MODEL`, admin
autodiscovery all depend on it). So each `data/<domain>/` is a Django app:

- `apps.py` declares `name = 'data.<domain>'`; the **app label defaults to the last path component**
  (`data.users` → `users`), which is why `AUTH_USER_MODEL = 'users.User'` and migration app-labels
  stay clean (`users`, `products`, …, **not** `data_users`).
- Only the `data.*` packages appear in `INSTALLED_APPS`.
- `api/` and `services/` are **plain Python packages** — no `AppConfig`.

## Conventions — where new code goes

- **A new HTTP endpoint** → `api/<domain>/views.py` (a DRF `APIView`/`ViewSet`), its input/output
  schemas in `api/<domain>/serializers.py`, route in `api/<domain>/urls.py` (registered in
  `config/urls.py` under `/api/<domain>/`), and any access rules in `api/<domain>/permissions.py`.
  The view must call a service — never a repository or the ORM directly.
- **Business logic** → `services/<domain>/services.py`. Cross-domain orchestration lives here. For
  recommendations the scoring/optimization code is split out: `engine.py`, `optimizer.py`,
  `constants.py`. For chat the Claude integration is `ai_service.py` + `tools.py`.
- **A DB query** → a method on a repository class in `data/<domain>/repositories.py`. All ORM access
  (`filter`, `get`, `create`, …) is confined here. One repository per model (usually).
- **A model / schema change** → `data/<domain>/models.py`, then `makemigrations` (writes to
  `data/<domain>/migrations/`).
- **A Celery task** → `services/<domain>/tasks.py` (e.g. `services/chat/tasks.py`). Because the
  service layer is **not** a registered Django app, these packages are listed explicitly in
  `config/celery.py` via `autodiscover_tasks([...])` — add the package there when a new layer task
  module appears.
- **A management command** (e.g. `import_products`) → must live in a Django app, so it goes under
  `data/<domain>/management/commands/`. Keep the command thin: parse args → call a service.
- **App-wide constants / pagination** → `common/`.

## Build order (per feature: bottom-up)

1. **Repository** (`data/<domain>/repositories.py`) — ORM methods, tested against the real DB.
2. **Service** (`services/<domain>/services.py`) — logic calling repositories, tested with mocks.
3. **View** (`api/<domain>/views.py`) — thin HTTP wrapper, tested with DRF's `APIClient`.

Tests are **not implemented yet**; when added they go under `tests/` mirroring the three layers.

## Security / org constraints (always)

- Never hardcode secrets — load everything via `python-decouple` from env (`.env` is git-ignored).
- All ORM access goes through repositories; **no raw SQL string concatenation** — use the ORM /
  parameterized queries.
- New endpoints require authentication (DRF default is `IsAuthenticated`); only loosen it
  deliberately and explicitly per view.
- Never disable TLS verification on outbound HTTP clients.

## Commands

```
python -m venv .venv && source .venv/bin/activate   # first time (.venv is git-ignored)
pip install -r requirements.txt
# Postgres → hosted on Neon; Redis → hosted Upstash or a local install. Point .env at both.
python manage.py makemigrations
python manage.py migrate
python manage.py runserver           # http://localhost:8000  (admin at /admin/)
python manage.py check               # validates the app registry / config
```

Env: see `.env.example`. JWT auth routes are wired in `config/urls.py` (`/api/auth/token/...`).
