# Backend — GiftGraph

Django 5.1 + Django REST Framework + PostgreSQL + JWT (simplejwt) + Celery/Redis + google-genai
(Gemini) SDK + Google OR-Tools. Serves the React frontend described in `../frontend/CLAUDE.md`.
The authoritative build plan and API contract live in the root `README.md` (architecture = §3,
structure = §4, endpoints = Appendix B) and `../API.md`.

## Keep the root docs in sync (do this with every change)

The root `README.md` and `../API.md` are the shared source of truth — keep them current as part of
the same change, never as a follow-up. Before finishing any task, update them when you have:

- **Added / removed / renamed a file or directory**, changed an app's layout, or added a new domain
  → update the structure tree in **`README.md` §4** (and this file's structure map). Reflect what is
  *actually built* — don't leave planned-but-absent files (e.g. `tests/`, Celery `tasks.py`) implying
  they exist; annotate them as planned if you keep them.
- **Added / changed / removed an HTTP endpoint** (route, method, params, request/response shape, auth,
  status codes) → update **`../API.md`** and **`README.md` Appendix B**.
- **Changed the architecture, layering rules, or build order** → update **`README.md` §3** and the
  relevant section here.
- **Added a dependency, env var, model, constant, or command** → update `requirements.txt` notes /
  `.env.example` / **README.md** Appendices C & D as applicable.

If a code change and the docs disagree, the code is the truth — fix the docs to match in the same
commit. When a change spans both layers, also check `../frontend/CLAUDE.md` stays consistent.

## Architecture: feature-first apps, layered by file (controller → service → repository)

The backend is organized **by feature/domain**, not by layer. Each domain (`users`, `products`,
`wishlists`, `recommendations`, `chat`) is a single Django app under `apps/<domain>/` that holds
**all of its layers as sibling files**. The transport → service → data layering is preserved *inside*
each app by file naming, and dependencies still flow **one way only**:

```
controllers.py  ──imports──▶  services.py  ──imports──▶  repositories.py  ──▶  models.py (ORM)
(transport/HTTP)              (business logic)            (data access)
```

```
backend/
  apps/<domain>/         the Django app — everything for the domain lives here:
    controllers.py         TRANSPORT — DRF APIViews (classes named *Controller), call services only
    services.py            SERVICE   — business logic & cross-domain orchestration
    repositories.py        DATA      — all ORM access (filter/get/create/…) confined to repo classes
    serializers.py         DRF input/output schemas
    models.py              models for this domain
    urls.py                routes (mounted in config/urls.py under /api/<domain>/)
    admin.py               Django admin registration
    apps.py                AppConfig (name = 'apps.<domain>')
    migrations/            schema migrations
  config/                Django core: settings.py, urls.py, wsgi.py, celery.py
  common/                shared helpers: pagination.py, constants.py, exceptions.py
```

Domain-specific extras that exist today:
- `apps/users/` — `auth_urls.py` (JWT routes), `permissions.py`, `signals.py` (wired via `apps.py`'s
  `ready()`).
- `apps/products/` — `category_urls.py`, `tag_urls.py`, and `management/commands/import_products.py`
  + `management/commands/seed_dummy_data.py` (local-dev seeder reading the gitignored
  `seed_data/dummy_data.json`).
- `apps/recommendations/` — `engine.py`, `optimizer.py`, `constants.py` (scoring/OR-Tools split out).
  Note: no `migrations/` directory yet.
- `apps/chat/` — `tools.py` (Gemini function declarations) and `prompts.py` (system-prompt prose as
  `str.format` templates); the Gemini integration currently lives in `services.py` (there is no
  separate `ai_service.py`). `_build_system_prompt` does the mode selection + interpolation, pulling
  text from `prompts.py`.

### The layering rule (the one thing to get right)

- **`controllers.py` imports from `services.py` only** — never touches the ORM, models, or repositories.
- **`services.py` imports from `repositories.py` only** — never touches HTTP, `request`, or `Response`.
- **`repositories.py` is the only place ORM calls happen.**

A request flows: **controller** parses input (via a serializer) → calls a **service** function →
service applies business rules and calls one or more **repositories** → repository runs the ORM
query. The controller then serializes the result. Thin pass-through services are fine for trivial
CRUD — keep the chain consistent so the seam is there when logic grows.

### App registration

- Each `apps/<domain>/apps.py` declares `name = 'apps.<domain>'`; the **app label defaults to the
  last path component** (`apps.users` → `users`), which is why `AUTH_USER_MODEL = 'users.User'` and
  migration app-labels stay clean (`users`, `products`, …, **not** `apps_users`).
- `INSTALLED_APPS` lists `apps.users`, `apps.products`, `apps.wishlists`, `apps.recommendations`,
  `apps.chat`.

## Conventions — where new code goes

- **A new HTTP endpoint** → `apps/<domain>/controllers.py` (a DRF `APIView`/`ViewSet`, named
  `*Controller`), its input/output schemas in `apps/<domain>/serializers.py`, route in
  `apps/<domain>/urls.py` (mounted in `config/urls.py` under `/api/<domain>/`), and any access rules
  in `apps/<domain>/permissions.py`. The controller must call a service — never a repository or the
  ORM directly.
- **Business logic** → `apps/<domain>/services.py`. Cross-domain orchestration lives here. For
  recommendations the scoring/optimization code is split out: `engine.py`, `optimizer.py`,
  `constants.py`. For chat the Gemini function declarations are in `tools.py`.
- **A DB query** → a method on a repository class in `apps/<domain>/repositories.py`. All ORM access
  (`filter`, `get`, `create`, …) is confined here. One repository per model (usually).
- **A model / schema change** → `apps/<domain>/models.py`, then `makemigrations` (writes to
  `apps/<domain>/migrations/`).
- **A Celery task** → `apps/<domain>/tasks.py`. `config/celery.py` uses bare `autodiscover_tasks()`,
  so a `tasks.py` in any registered app is picked up automatically (no explicit registration). No
  task modules exist yet.
- **A management command** (e.g. `import_products`) → `apps/<domain>/management/commands/`. Keep the
  command thin: parse args → call a service.
- **App-wide constants / pagination / exceptions** → `common/`.

## Build order (per feature: bottom-up)

1. **Repository** (`apps/<domain>/repositories.py`) — ORM methods, tested against the real DB.
2. **Service** (`apps/<domain>/services.py`) — logic calling repositories, tested with mocks.
3. **Controller** (`apps/<domain>/controllers.py`) — thin HTTP wrapper, tested with DRF's `APIClient`.

Tests are **not implemented yet** — there is no `tests/` directory.

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

### Seeding local dummy data (products / categories / tags — no users)

`seed_dummy_data` populates the DB with dummy categories, tags, and products for local dev. It
reads a **gitignored** JSON data file (`seed_data/dummy_data.json`) — no seed data is committed.
The command is idempotent: categories matched by `slug`, tags by `slug`, products by `name`
(re-running updates existing products and re-sets their tags). It never creates users.

```
python manage.py seed_dummy_data            # seed from seed_data/dummy_data.json
python manage.py seed_dummy_data --clear    # wipe products/tags/categories first, then seed
python manage.py seed_dummy_data --file path/to/other.json   # use a different data file
```

The JSON shape is `{ "categories": [{name, slug, icon}], "tags": ["name", ...],
"products": [{name, description, price, category_slug, tags: [...], image_url, purchase_url,
is_active}] }`. If `seed_data/dummy_data.json` is missing (it's gitignored, so a fresh clone
won't have it), generate one matching that shape, or seed products instead via
`import_products` from a CSV.

Env: see `.env.example`. JWT auth routes are wired in `config/urls.py` (`/api/auth/token/...`).
