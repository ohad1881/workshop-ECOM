# GiftGraph — Full-Stack Implementation Plan

> **Purpose**: This document is a step-by-step build plan for an AI coding agent. Follow each phase sequentially. Each phase includes context, specifications, file paths, code architecture decisions, and acceptance criteria. Do not skip phases. This is a **university project** — there is no production/staging distinction; everything runs locally.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture: Controller → Service → Repository](#3-architecture-controller--service--repository)
4. [Project Structure](#4-project-structure)
5. [Phase 1 — Project Scaffolding & Environment](#phase-1--project-scaffolding--environment)
6. [Phase 2 — Database Models & Migrations](#phase-2--database-models--migrations)
7. [Phase 3 — Authentication System](#phase-3--authentication-system)
8. [Phase 4 — Core REST API (Users, Categories, Tags)](#phase-4--core-rest-api-users-categories-tags)
9. [Phase 5 — Product Catalog & CSV Import](#phase-5--product-catalog--csv-import)
10. [Phase 6 — Wishlist System](#phase-6--wishlist-system)
11. [Phase 7 — Recommendation Engine](#phase-7--recommendation-engine)
12. [Phase 8 — Knapsack Optimization Algorithm](#phase-8--knapsack-optimization-algorithm)
13. [Phase 9 — AI Chat Integration (Core Feature)](#phase-9--ai-chat-integration-core-feature)
14. [Phase 10 — Frontend: Core Layout & Auth](#phase-10--frontend-core-layout--auth)
15. [Phase 11 — Frontend: Profile Pages](#phase-11--frontend-profile-pages)
16. [Phase 12 — Frontend: Wishlist](#phase-12--frontend-wishlist)
17. [Phase 13 — Frontend: Gift Finder & Recommendations](#phase-13--frontend-gift-finder--recommendations)
18. [Phase 14 — Frontend: AI Chat Interface](#phase-14--frontend-ai-chat-interface)
19. [Phase 15 — Testing](#phase-15--testing)
20. [Appendix A — Full Database Schema](#appendix-a--full-database-schema)
21. [Appendix B — API Endpoint Reference](#appendix-b--api-endpoint-reference)
22. [Appendix C — Environment Variables](#appendix-c--environment-variables)
23. [Appendix D — Backend Constants](#appendix-d--backend-constants)

---

## 1. Project Overview

**GiftGraph** is a Social-Commerce platform that reimagines gift-finding by shifting from product-based search to person-based search. Users create profiles with interests, preferences, and wishlists. When a user wants to find a gift for someone else, the system uses publicly available profile data, a scoring engine, and a knapsack optimization algorithm to suggest optimal gifts or gift bundles within a budget. An AI chat interface powered by Claude lets users refine recommendations conversationally.

The AI is the **core feature** of this project. It doesn't just answer questions — it actively learns each user's gifting style over time, remembers what they liked and disliked, and uses that memory to improve future recommendations for everyone using the platform.

### Core User Flows

1. **Registration & Profile Setup** — User registers, sets interests/preferences, configures privacy.
2. **Wishlist Management** — User adds products to their wishlist, marks items public or private.
3. **Gift Search** — User searches for another user, sets a budget and optional event type, receives AI-optimized recommendations.
4. **AI Chat Refinement** — User converses with AI to adjust recommendations. AI learns from the conversation and updates its knowledge about the user's gifting style.
5. **Self-Gift Mode** — User optimizes product selection for themselves with quality vs. quantity controls.

---

## 2. Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.11+ | Core language |
| **Django** | 5.1+ | Web framework, ORM, admin panel |
| **Django REST Framework** | 3.15+ | REST API with serializers, viewsets, permissions |
| **PostgreSQL** | 15+ | Database (full-text search, JSONB) |
| **djangorestframework-simplejwt** | 5.3+ | JWT authentication (stateless, free) |
| **django-filter** | 24.0+ | Declarative API filtering |
| **django-cors-headers** | 4.3+ | CORS for React frontend |
| **anthropic** | 0.40+ | Official Claude API SDK |
| **google-or-tools** | 9.9+ | Free knapsack optimizer from Google |
| **Celery** | 5.4+ | Async task queue for background AI work |
| **Redis** | 7+ | Celery message broker |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2+ | UI framework |
| **Vite** | 5+ | Dev server and bundler |
| **React Router** | 6.20+ | Client-side routing |
| **TanStack Query** | 5+ | Server state management & caching |
| **MUI (Material UI)** | 5+ (free tier) | Component library (`@mui/material`, `@mui/icons-material`) |
| **Emotion** | 11+ | CSS-in-JS (required by MUI: `@emotion/react`, `@emotion/styled`) |
| **Axios** | 1.7+ | HTTP client with JWT interceptors |
| **React Hook Form** | 7.50+ | Form state management |
| **Zod** | 3.22+ | Schema-based form validation |

### Infrastructure (Local Only)

| Technology | Purpose |
|---|---|
| **Docker Compose** | Runs PostgreSQL + Redis containers locally (app itself runs on host) |

---

## 3. Architecture: Controller → Service → Repository

The backend follows the **Controller-Service-Repository (CSR)** pattern. This separates concerns into three layers, making each independently testable and reusable.

### Layer Definitions

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  CONTROLLER (controllers.py)                            │
│  - Receives HTTP request                                │
│  - Validates input using DRF serializers                │
│  - Calls the appropriate service method                 │
│  - Returns HTTP response with serialized data           │
│  - Knows about: HTTP, serializers, permissions          │
│  - Does NOT know about: ORM, database queries           │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  SERVICE (services.py)                                  │
│  - Contains all business logic                          │
│  - Orchestrates operations across multiple repositories │
│  - Enforces business rules (privacy, validation logic)  │
│  - Knows about: business rules, repositories            │
│  - Does NOT know about: HTTP, request/response          │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  REPOSITORY (repositories.py)                           │
│  - Data access layer — all ORM queries live here        │
│  - Simple CRUD + custom queries                         │
│  - One repository per model (usually)                   │
│  - Knows about: Django ORM, models, querysets           │
│  - Does NOT know about: business rules, HTTP            │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
                   [ Database ]
```

### Development Order (Per Feature)

When building any feature, **always develop bottom-up**:

1. **Repository first** — Write the data access methods. These are simple ORM calls (`get`, `filter`, `create`, `update`, `delete`). Test them against the real database to verify queries work.

2. **Service second** — Write the business logic that calls repository methods. A service can call multiple repositories. Test services by mocking the repositories (inject fakes or use `unittest.mock.patch`).

3. **Controller last** — Write the HTTP endpoint that calls the service. The controller is a thin wrapper: parse input → call service → serialize output. Test controllers using DRF's `APIClient`, mocking the service layer.

### Why This Matters

- **Testability**: Each layer is tested in isolation. Repository tests verify queries. Service tests verify logic without hitting the DB. Controller tests verify HTTP behavior without running business logic.
- **Reusability**: The AI chat tools call the **same service methods** as the REST API controllers. No code duplication — the service is the single source of truth for business logic.
- **Clarity**: When reading the code, you always know where to look. HTTP issues → controller. Logic bugs → service. Wrong data → repository.

### Concrete Example

```python
# repositories.py — Data access only
class ProductRepository:
    @staticmethod
    def get_by_id(product_id):
        return Product.objects.filter(id=product_id, is_active=True).first()

    @staticmethod
    def search(query, category=None, min_price=None, max_price=None, tag_ids=None):
        qs = Product.objects.filter(is_active=True)
        if query:
            qs = qs.annotate(
                rank=SearchRank(SearchVector('name', 'description'), SearchQuery(query))
            ).filter(rank__gt=0).order_by('-rank')
        if category:
            qs = qs.filter(category__slug=category)
        if min_price is not None:
            qs = qs.filter(price__gte=min_price)
        if max_price is not None:
            qs = qs.filter(price__lte=max_price)
        if tag_ids:
            qs = qs.filter(tags__id__in=tag_ids).distinct()
        return qs


# services.py — Business logic
class ProductService:
    @staticmethod
    def search_products(query=None, category=None, min_price=None, max_price=None, tag_ids=None):
        """Search products with business rules applied."""
        products = ProductRepository.search(query, category, min_price, max_price, tag_ids)
        return products  # Could add additional business logic here

    @staticmethod
    def get_product(product_id):
        product = ProductRepository.get_by_id(product_id)
        if not product:
            raise ValueError(f"Product {product_id} not found or inactive")
        return product


# controllers.py — HTTP layer only
class ProductSearchController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProductSearchParamsSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        products = ProductService.search_products(**serializer.validated_data)
        page = self.paginate_queryset(products)
        return self.get_paginated_response(
            ProductSerializer(page, many=True).data
        )
```

---

## 4. Project Structure

```
giftgraph/
├── docker-compose.yml          # PostgreSQL + Redis only
├── .gitignore
├── README.md
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── products_template.csv   # CSV import template with examples
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py         # Single settings file (no dev/prod split)
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── celery.py           # Celery app configuration
│   ├── apps/
│   │   ├── __init__.py
│   │   ├── users/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── repositories.py
│   │   │   ├── services.py
│   │   │   ├── controllers.py      # DRF views (the HTTP layer)
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   ├── permissions.py
│   │   │   ├── admin.py
│   │   │   ├── signals.py
│   │   │   └── tests/
│   │   │       ├── __init__.py
│   │   │       ├── test_repositories.py
│   │   │       ├── test_services.py
│   │   │       └── test_controllers.py
│   │   ├── products/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── repositories.py
│   │   │   ├── services.py
│   │   │   ├── controllers.py
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   ├── admin.py
│   │   │   ├── management/
│   │   │   │   └── commands/
│   │   │   │       └── import_products.py
│   │   │   └── tests/
│   │   │       ├── __init__.py
│   │   │       ├── test_repositories.py
│   │   │       ├── test_services.py
│   │   │       └── test_controllers.py
│   │   ├── wishlists/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── repositories.py
│   │   │   ├── services.py
│   │   │   ├── controllers.py
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   ├── admin.py
│   │   │   └── tests/
│   │   │       ├── __init__.py
│   │   │       ├── test_repositories.py
│   │   │       ├── test_services.py
│   │   │       └── test_controllers.py
│   │   ├── recommendations/
│   │   │   ├── __init__.py
│   │   │   ├── constants.py        # Scoring weights, event mappings, strategies
│   │   │   ├── engine.py           # Scoring engine
│   │   │   ├── optimizer.py        # Knapsack solver
│   │   │   ├── repositories.py
│   │   │   ├── services.py
│   │   │   ├── controllers.py
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   └── tests/
│   │   │       ├── __init__.py
│   │   │       ├── test_engine.py
│   │   │       ├── test_optimizer.py
│   │   │       └── test_services.py
│   │   └── chat/
│   │       ├── __init__.py
│   │       ├── models.py
│   │       ├── repositories.py
│   │       ├── services.py
│   │       ├── controllers.py
│   │       ├── serializers.py
│   │       ├── urls.py
│   │       ├── ai_service.py       # Claude API integration
│   │       ├── tools.py            # Tool definitions for Claude
│   │       ├── tasks.py            # Celery async tasks
│   │       ├── admin.py
│   │       └── tests/
│   │           ├── __init__.py
│   │           ├── test_ai_service.py
│   │           ├── test_services.py
│   │           └── test_controllers.py
│   └── common/
│       ├── __init__.py
│       ├── constants.py            # App-wide constants (event types, strategies)
│       └── pagination.py
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── theme.js                # MUI theme configuration
│       ├── api/
│       │   ├── client.js           # Axios instance with JWT interceptors
│       │   ├── auth.js
│       │   ├── users.js
│       │   ├── products.js
│       │   ├── wishlists.js
│       │   ├── recommendations.js
│       │   ├── chat.js
│       │   └── metadata.js         # Event types, strategies (cached)
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useMetadata.js      # Loads & caches app constants
│       │   └── useDebounce.js
│       ├── context/
│       │   └── AuthContext.jsx
│       │
│       │   # ── Page folders ──────────────────────────────
│       │   # Each page is a folder. Single-use components
│       │   # live INSIDE the page folder that uses them.
│       │   # Only truly shared/generic components go in
│       │   # the top-level components/ folder.
│       │
│       ├── home/
│       │   ├── HomePage.jsx
│       │   ├── HeroSection.jsx         # Only used on home page
│       │   └── FeaturedUsers.jsx        # Only used on home page
│       ├── login/
│       │   ├── LoginPage.jsx
│       │   └── LoginForm.jsx
│       ├── register/
│       │   ├── RegisterPage.jsx
│       │   └── RegisterForm.jsx
│       ├── profile/
│       │   ├── MyProfilePage.jsx        # Logged-in user viewing their own profile
│       │   ├── UserProfilePage.jsx      # Viewing someone else's profile
│       │   ├── ProfileCard.jsx
│       │   ├── InterestTags.jsx
│       │   ├── PrivacyToggle.jsx
│       │   └── StrangerPreviewBanner.jsx
│       ├── wishlist/
│       │   ├── WishlistPage.jsx
│       │   ├── WishlistGrid.jsx
│       │   ├── WishlistItem.jsx
│       │   ├── AddToWishlistModal.jsx
│       │   └── UndoSnackbar.jsx         # "Deleted. Undo?" hover snackbar
│       ├── gift-finder/
│       │   ├── GiftFinderPage.jsx
│       │   ├── UserSearchPanel.jsx
│       │   ├── GiftConfigPanel.jsx      # Budget, event type, strategy selector
│       │   ├── RecommendationCard.jsx
│       │   ├── BundleView.jsx
│       │   └── ScoreExplanation.jsx
│       ├── chat/
│       │   ├── ChatPage.jsx
│       │   ├── ChatWindow.jsx
│       │   ├── ChatMessage.jsx
│       │   ├── ChatInput.jsx
│       │   └── ChatSidebar.jsx
│       ├── not-found/
│       │   └── NotFoundPage.jsx
│       │
│       │   # ── Shared components ─────────────────────────
│       │   # Generic, reusable across 2+ pages.
│       │   # Pages may compose these into page-specific
│       │   # components stored inside their own folder.
│       │
│       ├── components/
│       │   ├── Layout.jsx               # Navbar + content + footer wrapper
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── ProductCard.jsx          # Used in wishlist, gift-finder, chat
│       │   ├── ProductGrid.jsx          # Used in wishlist, gift-finder
│       │   ├── UserCard.jsx             # Used in gift-finder, home
│       │   ├── Spinner.jsx
│       │   └── EmptyState.jsx
│       │
│       └── utils/
│           ├── constants.js
│           └── formatters.js
```

### Frontend Folder Convention — Rule

> If a component is used by **only one page**, it lives **inside that page's folder**.
> If a component is used by **two or more pages**, it lives in `components/`.
> When in doubt, start inside the page folder. Move to `components/` only when a second page needs it.

---

## Phase 1 — Project Scaffolding & Environment

### 1.1 Docker Compose (Database Services Only)

Create `docker-compose.yml` in the project root. This runs **only** PostgreSQL and Redis — the Django and React apps run directly on the host machine.

```yaml
version: "3.9"
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: giftgraph
      POSTGRES_USER: giftgraph_user
      POSTGRES_PASSWORD: giftgraph_pass
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

Start with: `docker-compose up -d`

### 1.2 Backend Setup

1. Create the `giftgraph/backend/` directory structure as shown in section 4.
2. Initialize a Django project named `config` inside `backend/`.
3. Create a **single** `config/settings.py` file (no dev/prod split).
4. Create `requirements.txt`:

```
Django>=5.1,<5.2
djangorestframework>=3.15,<4.0
djangorestframework-simplejwt>=5.3,<6.0
django-cors-headers>=4.3,<5.0
django-filter>=24.0,<25.0
psycopg[binary]>=3.1,<4.0
anthropic>=0.40,<1.0
ortools>=9.9
celery>=5.4,<6.0
redis>=5.0,<6.0
python-decouple>=3.8
Pillow>=10.0
```

5. Create `.env.example`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=giftgraph
DB_USER=giftgraph_user
DB_PASSWORD=giftgraph_pass
DB_HOST=localhost
DB_PORT=5432

ANTHROPIC_API_KEY=your-anthropic-api-key

REDIS_URL=redis://localhost:6379/0

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

6. Configure `settings.py`:
   - Load **all** secrets from environment variables using `python-decouple`. Never hardcode secrets.
   - `INSTALLED_APPS`: add `rest_framework`, `corsheaders`, `django_filters`, `rest_framework_simplejwt.token_blacklist`, and all five custom apps (`apps.users`, `apps.products`, `apps.wishlists`, `apps.recommendations`, `apps.chat`).
   - DRF defaults: pagination (page size 20), `DEFAULT_AUTHENTICATION_CLASSES` = JWT, `DEFAULT_PERMISSION_CLASSES` = `[IsAuthenticated]`.
   - Configure `simplejwt`: access token lifetime 15 minutes, refresh token lifetime 7 days, `ROTATE_REFRESH_TOKENS = True`, `BLACKLIST_AFTER_ROTATION = True`.
   - Configure PostgreSQL database using env vars.
   - Set `AUTH_USER_MODEL = 'users.User'`.
   - CORS: `CORS_ALLOWED_ORIGINS` from env.
   - `MEDIA_ROOT` and `MEDIA_URL` for avatar uploads.

7. Create all five Django apps under `apps/`.

8. Configure Celery in `config/celery.py`:

```python
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
app = Celery('giftgraph')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

In `config/__init__.py`:
```python
from .celery import app as celery_app
__all__ = ('celery_app',)
```

In `settings.py`:
```python
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379/0')
```

### 1.3 Frontend Setup

1. Initialize a Vite React project in `giftgraph/frontend/`:
   ```bash
   npm create vite@latest frontend -- --template react
   ```
2. Install dependencies:
   ```bash
   npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
   npm install react-router-dom @tanstack/react-query axios
   npm install react-hook-form @hookform/resolvers zod
   ```
3. Create `.env.example`:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
4. Create `src/theme.js` — MUI theme customization:
   ```javascript
   import { createTheme } from '@mui/material/styles';

   const theme = createTheme({
     palette: {
       primary: { main: '#E87461' },      // Warm coral
       secondary: { main: '#2A9D8F' },    // Teal
       warning: { main: '#E9C46A' },      // Gold accent
     },
     typography: {
       fontFamily: '"DM Sans", "Roboto", sans-serif',
     },
     shape: { borderRadius: 12 },
   });

   export default theme;
   ```
5. Wrap `App` in `ThemeProvider` and `CssBaseline` from MUI in `main.jsx`.
6. Create the full `src/` directory structure as specified in section 4.

### Acceptance Criteria — Phase 1

- [ ] `docker-compose up -d` starts PostgreSQL and Redis
- [ ] Django dev server starts at `http://localhost:8000/` (`python manage.py runserver`)
- [ ] React dev server starts at `http://localhost:5173/` (`npm run dev`)
- [ ] Django connects to PostgreSQL and runs `python manage.py migrate`
- [ ] Celery worker starts without errors (`celery -A config worker -l info`)
- [ ] No secrets are hardcoded anywhere — all from `.env`
- [ ] MUI theme is applied (custom colors visible on a test page)

---

## Phase 2 — Database Models & Migrations

### 2.1 Users App — `apps/users/models.py`

```python
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = EmailField(unique=True)
    bio = TextField(blank=True, max_length=500)
    avatar = ImageField(
        upload_to='avatars/',
        default='avatars/default_avatar.png'  # Every new user gets this
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
```

**IMPORTANT**: Place a `default_avatar.png` image file in `backend/media/avatars/default_avatar.png`. Every newly registered user will reference this file as their avatar until they upload a custom one.

```python
class Category(Model):
    name = CharField(max_length=100, unique=True)
    slug = SlugField(unique=True)
    icon = CharField(max_length=50, blank=True)  # Emoji or MUI icon name

    class Meta:
        verbose_name_plural = 'categories'


class UserProfile(Model):
    class PrivacyLevel(TextChoices):
        PUBLIC = 'public', 'Public'
        PRIVATE = 'private', 'Private'

    user = OneToOneField(User, on_delete=CASCADE, related_name='profile')

    # Interests & Preferences
    interests = ManyToManyField(Category, blank=True, related_name='interested_users')
    preferred_categories = ManyToManyField(Category, blank=True, related_name='preferred_by')
    excluded_categories = ManyToManyField(Category, blank=True, related_name='excluded_by')

    # Privacy controls (per section)
    interests_privacy = CharField(max_length=10, choices=PrivacyLevel.choices, default=PrivacyLevel.PUBLIC)
    preferences_privacy = CharField(max_length=10, choices=PrivacyLevel.choices, default=PrivacyLevel.PUBLIC)

    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

**Note**: No `budget_preference` field — budget is provided per gift-search session, not stored on the profile. No `wishlist_privacy` field — privacy is controlled per-item on `WishlistItem`.

Create a **signal** in `apps/users/signals.py` that auto-creates a `UserProfile` when a `User` is created.

### 2.2 Tag Model — `apps/products/models.py`

```python
class Tag(Model):
    name = CharField(max_length=50, unique=True)
    slug = SlugField(unique=True)

    def __str__(self):
        return self.name
```

Tags are a first-class entity with a many-to-many relationship to products. This allows:
- Creating and managing tags via admin
- Querying products by tag efficiently
- Using tags in the scoring engine based on wishlist item overlap

### 2.3 Product Model — `apps/products/models.py`

```python
class Product(Model):
    name = CharField(max_length=255)
    description = TextField(blank=True)
    price = DecimalField(max_digits=10, decimal_places=2)
    category = ForeignKey(Category, on_delete=SET_NULL, null=True, related_name='products')
    tags = ManyToManyField(Tag, blank=True, related_name='products')  # M2M, not ArrayField
    image_url = URLField(blank=True)
    purchase_url = URLField(blank=True)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            Index(fields=['price']),
            Index(fields=['category']),
        ]
```

### 2.4 Wishlist Model — `apps/wishlists/models.py`

```python
class WishlistItem(Model):
    class PrivacyLevel(TextChoices):
        PUBLIC = 'public', 'Public'
        PRIVATE = 'private', 'Private'

    user = ForeignKey(User, on_delete=CASCADE, related_name='wishlist_items')
    product = ForeignKey(Product, on_delete=CASCADE, related_name='wishlisted_by')
    privacy = CharField(max_length=10, choices=PrivacyLevel.choices, default=PrivacyLevel.PUBLIC)
    priority = IntegerField(default=0)  # 0 = no priority, 5 = most wanted
    note = TextField(blank=True, max_length=200)
    added_at = DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-priority', '-added_at']
```

### 2.5 Chat Models — `apps/chat/models.py`

```python
class ChatSession(Model):
    owner = ForeignKey(User, on_delete=CASCADE, related_name='chat_sessions')
    recipient = ForeignKey(User, on_delete=SET_NULL, null=True, blank=True, related_name='gift_sessions')
    budget = DecimalField(max_digits=10, decimal_places=2, null=True)
    event_type = CharField(max_length=50, blank=True)
    is_self_gift = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    MAX_MESSAGES_PER_SESSION = 50  # Safety cap


class ChatMessage(Model):
    class Role(TextChoices):
        USER = 'user', 'User'
        ASSISTANT = 'assistant', 'Assistant'
        SYSTEM = 'system', 'System'

    session = ForeignKey(ChatSession, on_delete=CASCADE, related_name='messages')
    role = CharField(max_length=10, choices=Role.choices)
    content = TextField()
    metadata = JSONField(default=dict, blank=True)  # Recommended product IDs, scores, etc.
    created_at = DateTimeField(auto_now_add=True)
```

**Why store every message**: Claude has no memory between API calls. The entire conversation history must be sent on every request for context. Without stored messages, the AI couldn't reference anything from earlier in the conversation. A cap of 50 messages per session prevents unbounded growth, and sessions can be soft-deleted over time.

### 2.6 AI Memory Model — `apps/chat/models.py`

This is the AI's persistent memory about each user's **gifting style**.

```python
class GiftGiverPreference(Model):
    """AI-learned preferences about how a user likes to give gifts.
    
    Example: If the AI suggests electronics and the user says 
    "I never gift tech stuff", the AI stores an AVOID_CATEGORY 
    preference. Next time, those products are deprioritized.
    """
    class PreferenceType(TextChoices):
        AVOID_CATEGORY = 'avoid_category', 'Avoid Category'
        AVOID_TAG = 'avoid_tag', 'Avoid Tag'
        PREFER_CATEGORY = 'prefer_category', 'Prefer Category'
        PREFER_TAG = 'prefer_tag', 'Prefer Tag'
        GENERAL_NOTE = 'general_note', 'General Note'

    user = ForeignKey(User, on_delete=CASCADE, related_name='giver_preferences')
    preference_type = CharField(max_length=20, choices=PreferenceType.choices)
    value = CharField(max_length=255)  # Category slug, tag name, or free text
    context = TextField(blank=True)    # Why the AI learned this (conversation excerpt)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'preference_type', 'value')
```

### 2.7 Admin Registration

Register all models in their respective `admin.py` with useful `list_display`, `list_filter`, and `search_fields`. The Django admin panel is the primary interface for managing categories, tags, and products.

### 2.8 Run Migrations

```bash
python manage.py makemigrations users products wishlists chat
python manage.py migrate
```

### Acceptance Criteria — Phase 2

- [ ] All migrations run cleanly on a fresh database
- [ ] `UserProfile` is auto-created when a `User` is created (test via shell)
- [ ] New users have `default_avatar.png` as their avatar
- [ ] Tag model supports M2M with Product
- [ ] All models visible in Django admin with useful columns
- [ ] `WishlistItem` enforces unique (user, product) constraint
- [ ] `GiftGiverPreference` enforces unique (user, preference_type, value)
- [ ] No raw SQL — all queries use ORM

---

## Phase 3 — Authentication System

Follow CSR pattern: build repository → service → controller.

### 3.1 Repository — `apps/users/repositories.py`

```python
class UserRepository:
    @staticmethod
    def get_by_id(user_id):
        return User.objects.select_related('profile').filter(id=user_id).first()

    @staticmethod
    def get_by_email(email):
        return User.objects.filter(email=email).first()

    @staticmethod
    def create_user(email, username, password):
        user = User.objects.create_user(
            email=email,
            username=username,
            password=password  # create_user() hashes the password automatically
        )
        return user

    @staticmethod
    def update_user(user, **kwargs):
        for key, value in kwargs.items():
            setattr(user, key, value)
        user.save(update_fields=list(kwargs.keys()))
        return user
```

### 3.2 Service — `apps/users/services.py`

```python
class AuthService:
    @staticmethod
    def register(email, username, password):
        if UserRepository.get_by_email(email):
            raise ValueError("Email already registered")
        user = UserRepository.create_user(email, username, password)
        # UserProfile is auto-created via signal
        return user

    @staticmethod
    def change_password(user, old_password, new_password):
        if not user.check_password(old_password):
            raise ValueError("Current password is incorrect")
        user.set_password(new_password)
        user.save()
```

### 3.3 Controller — `apps/users/controllers.py`

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/register/` | POST | No | Create account: email, username, password, password_confirm |
| `/api/auth/login/` | POST | No | Returns JWT access + refresh tokens (email-based login) |
| `/api/auth/token/refresh/` | POST | No | Refresh access token |
| `/api/auth/logout/` | POST | Yes | Blacklist the refresh token |
| `/api/auth/me/` | GET | Yes | Get current user + profile |
| `/api/auth/me/` | PATCH | Yes | Update profile fields |
| `/api/auth/change-password/` | POST | Yes | Change password |

### 3.4 Serializers — `apps/users/serializers.py`

**`RegisterSerializer`**:
- Fields: `email`, `username`, `password`, `password_confirm`
- Validation: email unique, username 3-30 chars (alphanumeric + underscores), password min 8 chars with at least one letter and one digit, `password_confirm` matches `password`.
- **`create()` method calls `AuthService.register()`**, which internally uses `User.objects.create_user()`. The `create_user()` method hashes the password via Django's `make_password()` before saving — passwords are never stored in plaintext.

**`CustomTokenObtainPairSerializer`**:
- Override `username_field` to use email.
- Add `user_id` and `username` to JWT claims.

**`UserSerializer`**: Read serializer with nested `ProfileSerializer`.

**`ProfileUpdateSerializer`**: Write serializer for profile fields + privacy settings.

### 3.5 Frontend Auth

**`src/api/client.js`** — Axios instance:
- Base URL from `VITE_API_BASE_URL`.
- Request interceptor: attach `Authorization: Bearer <access_token>`.
- Response interceptor: on 401, attempt silent refresh. If refresh fails, redirect to login.
- Store tokens in memory (React state via context). A page refresh requires re-login (acceptable for a university project).

**`src/context/AuthContext.jsx`**:
- Provides: `user`, `isAuthenticated`, `isLoading`, `login()`, `register()`, `logout()`.
- On login success: store tokens in memory, fetch user profile via `/api/auth/me/`.

**`src/components/ProtectedRoute.jsx`**:
- Wraps routes requiring auth.
- If not authenticated: redirect to `/login`.

### Acceptance Criteria — Phase 3

- [ ] Registration creates user + auto-created profile with default avatar
- [ ] `create_user()` hashes the password (verify via Django shell: `user.password` starts with `pbkdf2_`)
- [ ] Login with email + password returns JWT tokens
- [ ] Access token expires after 15 minutes
- [ ] Refresh token generates a new access token
- [ ] Logout blacklists the refresh token
- [ ] Protected endpoints return 401 without a valid token
- [ ] Frontend Axios interceptor handles token refresh silently
- [ ] All database queries use ORM (parameterized)

---

## Phase 4 — Core REST API (Users, Categories, Tags)

### 4.1 Users API

Build using CSR: UserRepository → UserService → UserController.

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/users/` | GET | Yes | List users (public info only: username, avatar, public interests) |
| `/api/users/<id>/` | GET | Yes | Get user's public profile (respects privacy settings) |
| `/api/users/search/?q=<query>` | GET | Yes | Search users by username. Uses `icontains` for partial matching. |

**Privacy logic** (in `UserService`):
- Create a method `get_public_profile(user_id)` that returns only fields where the privacy setting is `'public'`.
- Never expose email addresses of other users.
- This same service method is reused by AI tools (no duplication).

**Permissions** — `apps/users/permissions.py`:
```python
class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.user == request.user
```

### 4.2 Categories & Tags API

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/categories/` | GET | Yes | List all categories |
| `/api/tags/` | GET | Yes | List all tags |

Read-only endpoints. Categories and tags are managed via Django admin.

### 4.3 Metadata API

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/metadata/` | GET | Yes | Returns app constants: event types, gift strategies with descriptions |

This endpoint returns backend-defined constants so the frontend can render dropdowns and info panels without hardcoding values. The data comes from `common/constants.py` (see Appendix D).

The frontend calls this once on app load (or on entering the gift finder page) and caches it via TanStack Query with a long `staleTime`.

### Acceptance Criteria — Phase 4

- [ ] `GET /api/users/` returns only public profile information
- [ ] `GET /api/users/<id>/` respects per-field privacy settings
- [ ] User search works with partial username matching
- [ ] Emails are never exposed
- [ ] Metadata endpoint returns event types and strategies
- [ ] All endpoints require authentication
- [ ] CSR pattern: controllers call services, services call repositories

---

## Phase 5 — Product Catalog & CSV Import

### 5.1 Product API

Build using CSR: ProductRepository → ProductService → ProductController.

| Endpoint | Method | Auth | Permission | Description |
|---|---|---|---|---|
| `/api/products/` | GET | Yes | Any | List products, filterable |
| `/api/products/<id>/` | GET | Yes | Any | Product detail |
| `/api/products/` | POST | Yes | Admin | Create product |
| `/api/products/<id>/` | PUT/PATCH | Yes | Admin | Update product |
| `/api/products/<id>/` | DELETE | Yes | Admin | Soft delete (`is_active=False`) |
| `/api/products/search/?q=<query>` | GET | Yes | Any | Full-text search |
| `/api/products/import-csv/` | POST | Yes | Admin | Upload CSV, returns import report |

**Filtering** (via `django-filter` on GET `/api/products/`):
- `category` — exact match on category slug
- `min_price` / `max_price` — range filter
- `tags` — filter products that have any of the specified tag IDs
- `is_active` — defaults to `True`

**Full-text search** (in `ProductRepository`):
```python
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank

@staticmethod
def full_text_search(query):
    return Product.objects.filter(is_active=True).annotate(
        rank=SearchRank(SearchVector('name', 'description'), SearchQuery(query))
    ).filter(rank__gt=0).order_by('-rank')
```

### 5.2 CSV Import — Management Command

Create `apps/products/management/commands/import_products.py`.

**The CSV template** (`products_template.csv`) is included in the `backend/` directory. Its format:

```csv
name,description,price,category_slug,tags,image_url,purchase_url
"Wireless Headphones","Premium Bluetooth 5.0 headphones...",49.99,electronics,"audio,music,wireless",https://...,https://...
```

The `tags` column contains comma-separated tag names within the quoted field. The import command:
1. Reads each row, validates: name required, price must be positive, category_slug must match an existing Category.
2. For tags: splits the comma-separated string, creates `Tag` objects if they don't exist (using `get_or_create`), and links them via M2M.
3. Skips invalid rows and logs them with line numbers.
4. Uses `get_or_create` on product name for upsert behavior.
5. Wraps all operations in a transaction.
6. Prints summary: created, updated, skipped, errors.

**Usage**: `python manage.py import_products /path/to/products_template.csv`

Also exposed as an API endpoint (`/api/products/import-csv/`) for admin users.

**IMPORTANT**: Do NOT insert any hardcoded seed data into the database. The only way products enter the system is via the CSV import command or admin panel. The CSV template with 5 example products is provided for testing that the import pipeline works correctly.

### Acceptance Criteria — Phase 5

- [ ] Products filterable by category, price range, and tags
- [ ] Full-text search returns ranked results
- [ ] CSV import creates products and auto-creates tags
- [ ] CSV import logs invalid rows with line numbers
- [ ] CSV import works with the provided `products_template.csv`
- [ ] Only admin users can create/edit/delete products
- [ ] Soft delete sets `is_active=False`
- [ ] CSR layers are clean: controller → service → repository

---

## Phase 6 — Wishlist System

### 6.1 Wishlist API

Build using CSR: WishlistRepository → WishlistService → WishlistController.

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/wishlists/` | GET | Yes | Current user's full wishlist (all items, including private) |
| `/api/wishlists/` | POST | Yes | Add item. Body: `{ product_id, privacy, priority, note }` |
| `/api/wishlists/<id>/` | PATCH | Yes | Update privacy, priority, or note |
| `/api/wishlists/<id>/` | DELETE | Yes | Remove item (no confirmation needed) |
| `/api/users/<id>/wishlist/` | GET | Yes | Another user's PUBLIC wishlist items only |

**Business rules** (in `WishlistService`):
- Duplicate product returns 409 Conflict.
- Viewing another user's wishlist: filter items where `privacy='public'` only.
- Priority is 0-5 integer.
- Owner sees all their items including private.

### Acceptance Criteria — Phase 6

- [ ] User can add, update, remove wishlist items
- [ ] Duplicate product returns 409
- [ ] Viewing another user's wishlist shows only public items
- [ ] Priority ordering works
- [ ] Owner sees all items including private

---

## Phase 7 — Recommendation Engine

### 7.1 Constants — `apps/recommendations/constants.py`

```python
# Scoring weights
WISHLIST_WEIGHT = 0.35
CATEGORY_WEIGHT = 0.20
TAG_OVERLAP_WEIGHT = 0.20
COMMUNITY_WEIGHT = 0.10
EVENT_WEIGHT = 0.05
GIVER_PREFERENCE_WEIGHT = 0.10  # AI-learned giver preferences

MAX_PRIORITY = 5

# Event → category boost mapping
EVENT_CATEGORY_MAP = {
    'birthday': ['toys & games', 'fashion', 'electronics', 'beauty'],
    'wedding': ['home & kitchen', 'art & crafts', 'food & drink'],
    'graduation': ['books', 'electronics', 'travel'],
    'holiday': ['food & drink', 'fashion', 'home & kitchen'],
    'anniversary': ['fashion', 'beauty', 'travel', 'food & drink'],
}
```

### 7.2 Scoring Engine — `apps/recommendations/engine.py`

The engine computes a relevance score (0.0 to 1.0) for each product relative to a target recipient **and** the gift giver.

```python
from .constants import *

def compute_score(product, recipient_profile, event_type=None, giver_preferences=None):
    """
    Score a product for a recipient, optionally adjusting for the giver's learned preferences.
    
    Args:
        product: Product instance
        recipient_profile: UserProfile of the recipient
        event_type: Optional event string
        giver_preferences: Optional list of GiftGiverPreference objects for the gift giver
    
    Returns:
        (score: float, explanation: str)
    """
    score = 0.0
    max_possible = 0.0
    explanations = []

    # ── 1. Wishlist match (weight: WISHLIST_WEIGHT) ──
    max_possible += WISHLIST_WEIGHT
    wishlist_item = recipient_profile.user.wishlist_items.filter(
        product=product, privacy='public'
    ).first()
    if wishlist_item:
        priority_factor = max(wishlist_item.priority, 1) / MAX_PRIORITY
        score += WISHLIST_WEIGHT * priority_factor
        explanations.append(
            f"On {recipient_profile.user.username}'s wishlist "
            f"(priority {wishlist_item.priority}/{MAX_PRIORITY})"
        )

    # ── 2. Category preference match (weight: CATEGORY_WEIGHT) ──
    max_possible += CATEGORY_WEIGHT
    if product.category in recipient_profile.preferred_categories.all():
        score += CATEGORY_WEIGHT
        explanations.append(f"Matches interest in {product.category.name}")
    elif product.category in recipient_profile.excluded_categories.all():
        score -= 0.15
        explanations.append(f"In excluded category: {product.category.name}")

    # ── 3. Tag overlap with recipient's wishlist (weight: TAG_OVERLAP_WEIGHT) ──
    # Compare THIS product's tags against tags from ALL products on the
    # recipient's public wishlist. High overlap = similar to what they want.
    max_possible += TAG_OVERLAP_WEIGHT
    product_tag_ids = set(product.tags.values_list('id', flat=True))
    if product_tag_ids:
        wishlist_product_ids = recipient_profile.user.wishlist_items.filter(
            privacy='public'
        ).values_list('product_id', flat=True)
        wishlist_tag_ids = set(
            Tag.objects.filter(products__id__in=wishlist_product_ids)
            .values_list('id', flat=True)
        )
        if wishlist_tag_ids:
            overlap = len(product_tag_ids & wishlist_tag_ids)
            tag_score = overlap / len(product_tag_ids)
            score += TAG_OVERLAP_WEIGHT * min(tag_score, 1.0)
            if overlap > 0:
                matching_names = Tag.objects.filter(
                    id__in=(product_tag_ids & wishlist_tag_ids)
                ).values_list('name', flat=True)
                explanations.append(f"Tags match wishlist: {', '.join(matching_names)}")

    # ── 4. Community signal (weight: COMMUNITY_WEIGHT) ──
    max_possible += COMMUNITY_WEIGHT
    wishlist_count = product.wishlisted_by.filter(privacy='public').count()
    # Avoid N+1: cache max_wishlisted at a higher level in real usage
    max_wishlisted = WishlistItem.objects.filter(privacy='public').values('product').annotate(
        c=Count('id')
    ).order_by('-c').first()
    max_count = max_wishlisted['c'] if max_wishlisted else 1
    community_score = wishlist_count / max_count
    score += COMMUNITY_WEIGHT * community_score
    if wishlist_count > 1:
        explanations.append(f"Popular: wishlisted by {wishlist_count} users")

    # ── 5. Event relevance (weight: EVENT_WEIGHT) ──
    max_possible += EVENT_WEIGHT
    if event_type and product.category:
        relevant_cats = EVENT_CATEGORY_MAP.get(event_type.lower(), [])
        if product.category.name.lower() in relevant_cats:
            score += EVENT_WEIGHT
            explanations.append(f"Great for {event_type} events")

    # ── 6. Giver preference adjustment (weight: GIVER_PREFERENCE_WEIGHT) ──
    # This is the AI's "memory" about the gift giver's style.
    max_possible += GIVER_PREFERENCE_WEIGHT
    if giver_preferences:
        giver_boost = 0.0
        for pref in giver_preferences:
            if pref.preference_type == 'avoid_category' and product.category:
                if product.category.slug == pref.value:
                    giver_boost -= 1.0
                    explanations.append(f"You usually avoid gifting {product.category.name}")
            elif pref.preference_type == 'avoid_tag':
                if product.tags.filter(slug=pref.value).exists():
                    giver_boost -= 0.5
            elif pref.preference_type == 'prefer_category' and product.category:
                if product.category.slug == pref.value:
                    giver_boost += 1.0
                    explanations.append(f"Matches your preferred gifting style")
            elif pref.preference_type == 'prefer_tag':
                if product.tags.filter(slug=pref.value).exists():
                    giver_boost += 0.5
        score += GIVER_PREFERENCE_WEIGHT * max(-1.0, min(giver_boost, 1.0))

    # Normalize to 0.0 – 1.0
    normalized = max(0.0, min(score / max_possible, 1.0)) if max_possible > 0 else 0.0
    explanation = "; ".join(explanations) if explanations else "General recommendation"

    return normalized, explanation
```

### 7.3 Recommendation Service — `apps/recommendations/services.py`

```python
class RecommendationService:
    @staticmethod
    def get_recommendations(recipient_id, budget, event_type=None, giver_user=None, limit=20):
        """
        Get scored product recommendations for a recipient.
        Used by BOTH the REST API controller AND the AI chat tools.
        """
        recipient_profile = UserRepository.get_profile(recipient_id)
        if not recipient_profile:
            raise ValueError("Recipient not found")

        # Check if recipient has any public data
        has_public_data = (
            (recipient_profile.interests_privacy == 'public' and recipient_profile.interests.exists()) or
            (recipient_profile.preferences_privacy == 'public' and recipient_profile.preferred_categories.exists()) or
            recipient_profile.user.wishlist_items.filter(privacy='public').exists()
        )
        if not has_public_data:
            return {"message": "This user has no public profile data for recommendations", "items": []}

        # Fetch giver preferences (AI memory) if giver is known
        giver_preferences = []
        if giver_user:
            giver_preferences = list(
                GiftGiverPreference.objects.filter(user=giver_user)
            )

        # Fetch products within budget
        products = ProductRepository.get_active_within_budget(budget)

        # Score each product
        scored = []
        for product in products:
            score, explanation = compute_score(
                product, recipient_profile, event_type, giver_preferences
            )
            scored.append({
                'product': product,
                'score': score,
                'explanation': explanation
            })

        # Sort by score, return top N
        scored.sort(key=lambda x: x['score'], reverse=True)
        return scored[:limit]
```

### 7.4 Recommendation Controller — `apps/recommendations/controllers.py`

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/recommendations/for-user/<user_id>/` | GET | Yes | Get ranked recommendations. Params: `budget` (required), `event_type`, `limit`. |

The controller calls `RecommendationService.get_recommendations()`, passing the authenticated user as `giver_user` so AI-learned preferences are applied.

### Acceptance Criteria — Phase 7

- [ ] Scoring uses all 6 signals with defined constants
- [ ] Wishlist tag overlap is computed from recipient's wishlist product tags (not user interests)
- [ ] Constants are defined in `constants.py`, not magic numbers
- [ ] Giver preferences (AI memory) adjust scores
- [ ] Products outside budget are excluded
- [ ] Privacy is respected (only public data used)
- [ ] Explanations accurately describe each score component
- [ ] `RecommendationService` is reusable (called by both API and AI tools)

---

## Phase 8 — Knapsack Optimization Algorithm

### 8.1 Optimizer — `apps/recommendations/optimizer.py`

```python
from ortools.algorithms.python import knapsack_solver

def optimize_gift_bundle(scored_products, budget, strategy='balanced'):
    """
    0/1 Knapsack: select products maximizing total score within budget.

    Args:
        scored_products: list of [{ 'product': Product, 'score': float, 'explanation': str }]
        budget: Decimal
        strategy: 'max_score' | 'max_items' | 'balanced'

    Returns:
        list of selected product dicts
    """
    if not scored_products:
        return []

    budget_cents = int(budget * 100)

    # Adjust values based on strategy
    SCORE_SCALE = 1000
    ITEM_BONUS = 200

    if strategy == 'max_score':
        values = [int(p['score'] * SCORE_SCALE) for p in scored_products]
    elif strategy == 'max_items':
        values = [100 for _ in scored_products]
    elif strategy == 'balanced':
        values = [int(p['score'] * (SCORE_SCALE - ITEM_BONUS) + ITEM_BONUS) for p in scored_products]
    else:
        values = [int(p['score'] * SCORE_SCALE) for p in scored_products]

    weights = [int(p['product'].price * 100) for p in scored_products]

    solver = knapsack_solver.KnapsackSolver(
        knapsack_solver.SolverType.KNAPSACK_MULTIDIMENSION_BRANCH_AND_BOUND_SOLVER,
        'GiftOptimizer'
    )
    solver.init(values, [weights], [budget_cents])
    solver.solve()

    return [scored_products[i] for i in range(len(scored_products)) if solver.best_solution_contains(i)]
```

### 8.2 Bundle Service & Endpoint

Extend `RecommendationService`:

```python
@staticmethod
def get_bundles(recipient_id, budget, event_type=None, giver_user=None):
    """Returns optimized bundles for all three strategies."""
    scored = RecommendationService.get_recommendations(
        recipient_id, budget, event_type, giver_user, limit=100  # Score more products for bundling
    )
    if isinstance(scored, dict) and 'message' in scored:
        return scored  # No public data

    results = {}
    for strategy in ['max_score', 'max_items', 'balanced']:
        bundle = optimize_gift_bundle(scored, budget, strategy)
        total_price = sum(p['product'].price for p in bundle)
        total_score = sum(p['score'] for p in bundle)
        results[strategy] = {
            'items': bundle,
            'total_price': total_price,
            'total_score': round(total_score, 2),
            'budget_utilization': f"{(total_price / budget * 100):.1f}%" if budget > 0 else "0%"
        }
    return results
```

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/recommendations/bundle/<user_id>/` | GET | Yes | Optimized bundles. Params: `budget`, `event_type`, `strategy` |
| `/api/recommendations/self-gift/` | GET | Yes | Self-gift bundles (uses user's own full profile data including private) |

### Acceptance Criteria — Phase 8

- [ ] Bundle total price never exceeds budget
- [ ] All three strategies return different results when applicable
- [ ] Self-gift mode uses the user's full data (including private preferences)
- [ ] Empty product list returns empty bundle
- [ ] Zero budget returns empty bundle
- [ ] Bundle service reuses `RecommendationService` (no duplication)

---

## Phase 9 — AI Chat Integration (Core Feature)

This is the most important phase. The AI is not just a chatbot — it's an intelligent assistant that learns, remembers, and actively improves recommendations.

### 9.1 AI Tools — `apps/chat/tools.py`

Define tools that Claude can call. **Each tool calls the existing service layer** — no code duplication.

```python
TOOLS = [
    {
        "name": "search_products",
        "description": "Search the product catalog. Returns matching products with name, price, category, and tags.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Free-text search query"},
                "category": {"type": "string", "description": "Category slug"},
                "min_price": {"type": "number"},
                "max_price": {"type": "number"},
                "tag_slugs": {"type": "array", "items": {"type": "string"}}
            }
        }
    },
    {
        "name": "get_recipient_profile",
        "description": "Get a user's public interests, preferred categories, and public wishlist items.",
        "input_schema": {
            "type": "object",
            "properties": {
                "user_id": {"type": "integer"}
            },
            "required": ["user_id"]
        }
    },
    {
        "name": "get_recommendations",
        "description": "Get scored product recommendations for a recipient within a budget.",
        "input_schema": {
            "type": "object",
            "properties": {
                "recipient_id": {"type": "integer"},
                "budget": {"type": "number"},
                "event_type": {"type": "string"},
                "limit": {"type": "integer", "default": 10}
            },
            "required": ["recipient_id", "budget"]
        }
    },
    {
        "name": "optimize_gift_bundle",
        "description": "Run the knapsack optimizer to find the best combination of gifts within budget.",
        "input_schema": {
            "type": "object",
            "properties": {
                "recipient_id": {"type": "integer"},
                "budget": {"type": "number"},
                "event_type": {"type": "string"},
                "strategy": {
                    "type": "string",
                    "enum": ["max_score", "max_items", "balanced"]
                }
            },
            "required": ["recipient_id", "budget"]
        }
    },
    {
        "name": "get_giver_preferences",
        "description": "Retrieve the current user's learned gifting preferences (what they like/avoid gifting).",
        "input_schema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "update_giver_preference",
        "description": "Save or update a learned preference about the current user's gifting style. Call this when the user expresses a preference (e.g., 'I never gift tech stuff' → avoid_category: electronics).",
        "input_schema": {
            "type": "object",
            "properties": {
                "preference_type": {
                    "type": "string",
                    "enum": ["avoid_category", "avoid_tag", "prefer_category", "prefer_tag", "general_note"]
                },
                "value": {"type": "string", "description": "Category slug, tag slug, or free text"},
                "context": {"type": "string", "description": "Why this preference was learned"}
            },
            "required": ["preference_type", "value"]
        }
    }
]
```

### 9.2 Tool Execution — `apps/chat/tools.py`

```python
def execute_tool(tool_name, tool_input, giver_user, recipient_id=None):
    """Execute a tool call using existing service layer methods."""

    if tool_name == "search_products":
        products = ProductService.search_products(**tool_input)
        return ProductSerializer(products[:20], many=True).data

    elif tool_name == "get_recipient_profile":
        profile = UserService.get_public_profile(tool_input['user_id'])
        return profile  # Already privacy-filtered by the service

    elif tool_name == "get_recommendations":
        results = RecommendationService.get_recommendations(
            recipient_id=tool_input['recipient_id'],
            budget=Decimal(str(tool_input['budget'])),
            event_type=tool_input.get('event_type'),
            giver_user=giver_user
        )
        return serialize_recommendations(results)

    elif tool_name == "optimize_gift_bundle":
        results = RecommendationService.get_bundles(
            recipient_id=tool_input['recipient_id'],
            budget=Decimal(str(tool_input['budget'])),
            event_type=tool_input.get('event_type'),
            giver_user=giver_user
        )
        return serialize_bundles(results)

    elif tool_name == "get_giver_preferences":
        prefs = GiftGiverPreferenceRepository.get_for_user(giver_user.id)
        return GiftGiverPreferenceSerializer(prefs, many=True).data

    elif tool_name == "update_giver_preference":
        pref = ChatService.update_giver_preference(
            user=giver_user,
            preference_type=tool_input['preference_type'],
            value=tool_input['value'],
            context=tool_input.get('context', '')
        )
        return {"status": "saved", "preference": GiftGiverPreferenceSerializer(pref).data}
```

### 9.3 AI Service — `apps/chat/ai_service.py`

System prompt for Claude:

```python
SYSTEM_PROMPT = """You are GiftGraph's gift recommendation assistant. You help users find 
perfect gifts for others (or themselves).

CRITICAL RULES:
1. Before running heavy computations (get_recommendations, optimize_gift_bundle), ALWAYS 
   verify you have ALL required information:
   - Who is the gift for? (you need a valid recipient user ID)
   - What is the budget?
   - What is the occasion? (optional but helpful)
   Ask the user for any missing information BEFORE calling those tools.

2. You have MEMORY. Before making recommendations, call get_giver_preferences to check 
   what this user likes and dislikes about gifting. Use this to give better suggestions.

3. When the user expresses a preference about gifting (positive or negative), call 
   update_giver_preference to remember it. Examples:
   - "I don't like gifting tech" → update_giver_preference(avoid_category, electronics, "User said they don't like gifting tech")
   - "I prefer handmade things" → update_giver_preference(prefer_tag, handmade, "User prefers handmade gifts")

4. Explain WHY you recommend each item. Be conversational and concise.

5. If the user asks to adjust (different budget, style, more/fewer items), use the tools 
   again with updated parameters.

Session context:
- Recipient: {recipient_info}
- Budget: {budget}
- Event: {event_type}
"""
```

**Chat flow with token streaming**:

Use the SDK's `client.messages.stream()` helper so the user sees the AI's reply
appear **token by token**, not all at once. The helper exposes `text_stream`
(an iterator of incremental text deltas) and `get_final_message()` (the fully
assembled response, used to detect tool calls and continue the tool-use loop).
The model is `claude-sonnet-4-6` — the current Sonnet: cheap, capable, and
supports streaming + tool use. `messages.stream()` defaults to a 10-minute
timeout, which comfortably covers AI calls.

```python
import anthropic
import json

def stream_chat_response(session, user_message):
    """
    Process a user message using Claude's streaming API with a tool-use loop.
    Yields text deltas (tokens) for StreamingHttpResponse — the frontend sees
    the response render in real time.
    """
    client = anthropic.Anthropic()  # Reads ANTHROPIC_API_KEY from env

    # Build conversation history from stored messages
    history = ChatRepository.get_messages_for_api(session.id)
    history.append({"role": "user", "content": user_message})

    system_prompt = build_system_prompt(session)

    # Save user message
    ChatRepository.create_message(session.id, 'user', user_message)

    full_response = ""

    # Tool-use loop (may need multiple round trips). Each model turn is streamed
    # token-by-token; tool calls happen between streamed turns.
    while True:
        with client.messages.stream(
            model="claude-sonnet-4-6",   # current Sonnet — cheap, capable, supports streaming
            max_tokens=2048,
            system=system_prompt,
            messages=history,
            tools=TOOLS,
        ) as stream:
            # Yield text tokens as they arrive
            for text in stream.text_stream:
                full_response += text
                yield text

            response = stream.get_final_message()

        tool_use_blocks = [b for b in response.content if b.type == "tool_use"]

        if not tool_use_blocks:
            # No tools requested — the streamed text above was the final answer
            break

        # Execute tools, then loop to stream the model's next turn
        history.append({"role": "assistant", "content": response.content})
        tool_results = []
        for block in tool_use_blocks:
            result = execute_tool(
                block.name, block.input,
                giver_user=session.owner,
                recipient_id=session.recipient_id
            )
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": json.dumps(result, default=str)
            })
        history.append({"role": "user", "content": tool_results})

    # Save assistant response
    ChatRepository.create_message(
        session.id, 'assistant', full_response,
        metadata=extract_product_ids(full_response)
    )

    # Enforce message cap
    msg_count = ChatRepository.count_messages(session.id)
    if msg_count > ChatSession.MAX_MESSAGES_PER_SESSION:
        ChatRepository.trim_oldest_messages(session.id, keep=ChatSession.MAX_MESSAGES_PER_SESSION)
```

### 9.4 Chat Controller with StreamingHttpResponse — `apps/chat/controllers.py`

```python
from django.http import StreamingHttpResponse

class ChatMessageController(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        session = ChatService.get_session(session_id, request.user)
        content = request.data.get('content', '').strip()
        if not content:
            return Response({"error": "Message content required"}, status=400)

        def event_stream():
            for chunk in stream_chat_response(session, content):
                yield f"data: {json.dumps({'text': chunk})}\n\n"
            yield "data: [DONE]\n\n"

        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response
```

### 9.5 Celery Tasks — `apps/chat/tasks.py`

Celery handles background work that doesn't need streaming:

```python
@shared_task
def update_giver_preferences_async(user_id, preference_type, value, context):
    """Update giver preference in the background (called after AI identifies one)."""
    ChatService.update_giver_preference(
        user_id=user_id,
        preference_type=preference_type,
        value=value,
        context=context
    )
```

### 9.6 Chat API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/chat/sessions/` | GET | Yes | List user's chat sessions |
| `/api/chat/sessions/` | POST | Yes | Create session. Body: `{ recipient_id, budget, event_type, is_self_gift }` |
| `/api/chat/sessions/<id>/` | GET | Yes | Session with message history |
| `/api/chat/sessions/<id>/messages/` | POST | Yes | Send message. Returns SSE stream. |

### Acceptance Criteria — Phase 9

- [ ] Chat session creation works with recipient/budget/event
- [ ] Sending a message returns a token-streamed AI response via SSE (text renders incrementally, not all at once)
- [ ] Claude uses `search_products` tool (calls ProductService — no duplication)
- [ ] Claude uses `get_recommendations` tool (calls RecommendationService)
- [ ] Claude uses `optimize_gift_bundle` tool (calls RecommendationService)
- [ ] Claude calls `get_giver_preferences` before making recommendations
- [ ] When user says "I don't like gifting X", Claude calls `update_giver_preference`
- [ ] GiftGiverPreference records persist in DB and affect future sessions
- [ ] Claude verifies it has recipient + budget BEFORE running heavy tools
- [ ] Conversation history is preserved and sent to Claude on each message
- [ ] Message cap (50) is enforced per session
- [ ] API key from env, never hardcoded
- [ ] Uses `client.messages.stream()` with `text_stream` for token-level streaming (the SDK's 10-minute default timeout covers AI calls)

---

## Phase 10 — Frontend: Core Layout & Auth

### 10.1 MUI Theme

In `src/theme.js`, define a consistent MUI theme with:
- Custom primary (warm coral), secondary (teal), and accent (gold) colors
- Border radius of 12px
- Typography with a distinctive font (e.g., "DM Sans" from Google Fonts)

Wrap the app in `<ThemeProvider theme={theme}>` and `<CssBaseline />` in `main.jsx`.

### 10.2 Layout Components

**`components/Layout.jsx`**: Uses MUI `Box`, `AppBar`, and `Container`. Contains `Navbar` at top, main content area, and `Footer`.

**`components/Navbar.jsx`**: MUI `AppBar` with:
- Logo (left)
- Navigation: Home, Find a Gift, My Wishlist (MUI `Button` or `Tab` components)
- User menu (right): MUI `Avatar` + `Menu` dropdown with My Profile, Logout
- Unauthenticated: Login / Register buttons

### 10.3 Auth Pages

**`login/LoginPage.jsx`**: MUI `Card` containing `LoginForm.jsx`:
- MUI `TextField` for email + password
- Validated with react-hook-form + zod
- MUI `Alert` for error display
- MUI `Button` for submit
- Link to register

**`register/RegisterPage.jsx`**: MUI `Card` containing `RegisterForm.jsx`:
- Fields: email, username, password, confirm password
- Validation: email format, password match, min length, at least one letter + digit
- On success: auto-login, redirect to profile setup

### Acceptance Criteria — Phase 10

- [ ] MUI theme applied consistently (custom colors, border radius)
- [ ] Navbar renders with correct links for auth/unauth states
- [ ] Login form validates and displays API errors via MUI Alert
- [ ] Registration creates account, logs in, redirects
- [ ] Protected routes redirect unauthenticated users to login
- [ ] JWT tokens managed in memory via AuthContext

---

## Phase 11 — Frontend: Profile Pages

### 11.1 Two Profile Pages

**`profile/MyProfilePage.jsx`** — The logged-in user viewing their OWN profile:
- Shows all fields (avatar, bio, interests, preferences, wishlist preview)
- Each section has a small MUI `IconButton` (edit icon) that makes the field **inline-editable**. No separate edit page — fields toggle between display and edit mode in-place.
- Wishlist preview shows first 6 items with a "See all" link (navigates to `/wishlist`) and a small edit icon that also goes to `/wishlist`.
- **"Show profile as a Stranger" button** (MUI `Button` with `Visibility` icon): Toggles the page into a read-only view that shows exactly what another user would see (respecting the current privacy settings). A banner at the top says "You're viewing your profile as others see it" with a "Back to my profile" button.

**`profile/UserProfilePage.jsx`** — Viewing someone else's profile:
- Shows only PUBLIC fields based on privacy settings.
- Avatar, username, bio (always public).
- Interests shown only if `interests_privacy == 'public'`.
- Preferred categories shown only if `preferences_privacy == 'public'`.
- Public wishlist preview (first 6 public items).
- **"Find a gift for {name}" CTA button** → navigates to gift finder with user pre-selected.
- No edit controls.

### 11.2 Supporting Components

**`profile/ProfileCard.jsx`**: Renders avatar + username + bio. Uses MUI `Card`, `Avatar`, `Typography`.

**`profile/InterestTags.jsx`**: Renders interest categories as MUI `Chip` components. In edit mode, shows a multi-select with all available categories.

**`profile/PrivacyToggle.jsx`**: MUI `Switch` with label ("Public" / "Private") per section.

**`profile/StrangerPreviewBanner.jsx`**: MUI `Alert` with info variant, shown at top when viewing profile as a stranger.

### Acceptance Criteria — Phase 11

- [ ] Own profile shows all data with inline edit capabilities
- [ ] Other user's profile shows only public fields
- [ ] Privacy toggles persist and take effect immediately
- [ ] "Show as Stranger" mode correctly hides private fields
- [ ] Banner and back button work in stranger mode
- [ ] "Find a gift" CTA appears on other users' profiles
- [ ] Wishlist preview shows first 6 items with "See all" link

---

## Phase 12 — Frontend: Wishlist

### 12.1 Wishlist Page

**`wishlist/WishlistPage.jsx`**:
- MUI `Grid` of wishlist items (each a MUI `Card` with product image, name, price, privacy badge, priority stars).
- "Add from Catalog" button → opens `AddToWishlistModal`.
- Each item has:
  - Privacy toggle (MUI `Switch` — public/private)
  - Priority (MUI `Rating` component, 0-5 stars)
  - **Delete button**: MUI `IconButton` with delete icon. **No confirmation dialog.** On click, the item is immediately removed and an **undo snackbar** appears.

### 12.2 Undo Snackbar

**`wishlist/UndoSnackbar.jsx`**: Uses MUI `Snackbar` component:
- Appears at the bottom of the screen for 5 seconds after deletion.
- Message: "{Product name} removed"
- Action: "Undo" button.
- If the user clicks "Undo" within the window, the item is restored (re-POST to the API with the same data).
- If the snackbar times out, the deletion is final.
- Implementation: on delete click, call the DELETE API immediately but keep the item data in local state. If "Undo" is clicked, call POST to re-add. If snackbar closes without undo, discard the saved data.

### 12.3 AddToWishlistModal

**`wishlist/AddToWishlistModal.jsx`**: MUI `Dialog` with:
- Search input (MUI `TextField`) to search products.
- Product results as a list of `ProductCard` components.
- Click a product to add it (default: public, priority 0).
- Products already in wishlist show a "Already in wishlist" MUI `Chip`.

### Acceptance Criteria — Phase 12

- [ ] Wishlist displays with cards, privacy badges, priority stars
- [ ] Adding a product works via search modal
- [ ] Duplicate add shows "Already in wishlist" chip
- [ ] Deleting is instant with no confirmation dialog
- [ ] Undo snackbar appears for 5 seconds after deletion
- [ ] Clicking "Undo" restores the item
- [ ] Privacy toggle and priority changes persist

---

## Phase 13 — Frontend: Gift Finder & Recommendations

### 13.1 Metadata Loading

On entering the gift finder page (or on app load), fetch `/api/metadata/` using TanStack Query with a long `staleTime` (e.g., 30 minutes). This returns:
- `event_types`: list of `{ value, label, description }` for the event dropdown
- `gift_strategies`: list of `{ value, label, description }` for the strategy selector

Cache this in the React Query cache so the data is available instantly on subsequent visits.

### 13.2 Gift Finder Page

**`gift-finder/GiftFinderPage.jsx`**:

**Step 1 — Select recipient**: `UserSearchPanel` with a debounced (300ms) MUI `TextField` + autocomplete for searching users. Results display as `UserCard` components. Clicking a card selects the recipient.

**Step 2 — Configure gift parameters**: `GiftConfigPanel` with:
- Budget input (MUI `TextField` type number)
- Event type dropdown (MUI `Select`): populated from metadata. Each option can show a tooltip or helper text with its description.
- Strategy selector (MUI `ToggleButtonGroup`): populated from metadata. Each option shows its label and a brief description (e.g., "Best match — highest relevance score" / "More gifts — maximizes number of items" / "Balanced — mix of quality and quantity").

**Step 3 — Results**: Tabbed view (MUI `Tabs`):
- "Top Picks" — individual items sorted by score
- "Best Bundle" — knapsack-optimized set for selected strategy
- "All Strategies" — side-by-side comparison of all 3 strategies

**`gift-finder/RecommendationCard.jsx`**: MUI `Card` with product image, name, price, score (MUI `LinearProgress` bar), and explanation text.

**`gift-finder/BundleView.jsx`**: MUI `Card` showing selected bundle items, total price vs. budget (MUI `LinearProgress`), total score, budget utilization percentage.

**"Refine with AI" button**: Opens the chat panel / navigates to chat with the session pre-populated.

### Acceptance Criteria — Phase 13

- [ ] Metadata (event types, strategies) loads from backend and is cached
- [ ] User search works with debouncing
- [ ] Event type and strategy dropdowns are populated from metadata
- [ ] Recommendations load after selecting recipient + budget
- [ ] Bundle view shows optimized combinations
- [ ] All three strategies are accessible and described
- [ ] Score explanations display clearly
- [ ] "Refine with AI" opens chat with context

---

## Phase 14 — Frontend: AI Chat Interface

### 14.1 Chat Window

**`chat/ChatWindow.jsx`**:
- Full-height panel (or drawer alongside gift finder).
- Message list with auto-scroll to bottom.
- User messages right-aligned (MUI `Paper` with primary color).
- AI messages left-aligned (MUI `Paper` with grey/secondary).
- MUI `CircularProgress` shown while AI is responding.
- Product cards embedded inline when AI recommends products (parse `metadata` from message).

**`chat/ChatInput.jsx`**: MUI `TextField` (multiline) with send `IconButton`. Enter sends, Shift+Enter for newline. Disabled while AI is processing.

**`chat/ChatSidebar.jsx`**: MUI `List` of past sessions. Each shows recipient name, date, last message snippet. "New chat" button at top.

### 14.2 SSE Integration

The frontend connects to the streaming endpoint using EventSource or fetch with ReadableStream:

```javascript
const response = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ content: message }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  // Parse SSE data lines and append to message display
}
```

### 14.3 Smart Behavior

The AI's system prompt ensures it validates information before heavy calls. But the frontend can also help:
- **Suggested prompts** for new sessions (MUI `Chip` components):
  - "Find the best gift for {name} under $50"
  - "I want a few small gifts instead of one big one"
  - "Something related to their interests"
- If the session has no recipient set yet and the user sends a gift request, the AI will ask for clarification rather than erroring.

### Acceptance Criteria — Phase 14

- [ ] Chat sends messages and streams AI responses in real-time
- [ ] MUI CircularProgress shows while waiting
- [ ] Conversation history persists within a session
- [ ] Product cards render inline in AI messages
- [ ] Chat is contextually pre-populated from gift finder
- [ ] Past sessions listed and resumable
- [ ] Suggested prompts appear for new sessions
- [ ] Error states (timeout, API failure) show MUI Alert messages
- [ ] Auto-scroll on new messages

---

## Phase 15 — Testing

### 15.1 Backend Unit Tests

Run with: `python manage.py test`

The CSR architecture makes testing clean — each layer is tested independently:

**Repository tests** (`test_repositories.py`):
- Test against real database (Django's test framework provides a fresh DB per test).
- Verify CRUD operations, filters, edge cases.

```python
class ProductRepositoryTests(TestCase):
    def test_search_by_category(self):
        """Products filtered by category slug return correct results."""

    def test_get_active_within_budget(self):
        """Only active products within price range are returned."""

    def test_full_text_search_ranks_by_relevance(self):
        """Search results are ordered by relevance rank."""
```

**Service tests** (`test_services.py`):
- Mock repository methods using `unittest.mock.patch`.
- Test business logic, privacy filtering, validation.

```python
class RecommendationServiceTests(TestCase):
    @patch('apps.recommendations.services.ProductRepository')
    def test_recommendations_respect_privacy(self, mock_repo):
        """Only public profile data is used for recommendations."""

    def test_giver_preferences_affect_scores(self):
        """AI-learned preferences adjust recommendation scores."""

    def test_no_public_data_returns_message(self):
        """If recipient has all private data, return helpful message."""
```

**Controller tests** (`test_controllers.py`):
- Use DRF's `APIClient`.
- Test HTTP status codes, authentication, response format.

```python
class AuthControllerTests(APITestCase):
    def test_register_creates_user_with_hashed_password(self):
        """POST /api/auth/register/ creates user. Password starts with pbkdf2_."""

    def test_login_returns_tokens(self):
        """POST /api/auth/login/ returns access and refresh tokens."""

    def test_protected_endpoint_requires_auth(self):
        """GET /api/products/ without token returns 401."""
```

**Scoring engine tests** (`test_engine.py`):

```python
class ScoringEngineTests(TestCase):
    def test_wishlist_item_scores_highest(self):
        """Product on recipient's public wishlist gets the highest score component."""

    def test_excluded_category_penalizes_score(self):
        """Product in excluded category has reduced score."""

    def test_tag_overlap_from_wishlist_products(self):
        """Score uses tags from wishlist products, not user interest categories."""

    def test_giver_avoid_preference_reduces_score(self):
        """When giver has 'avoid_category' preference, matching products score lower."""

    def test_all_weights_sum_to_one(self):
        """All constant weights in constants.py sum to 1.0."""
```

**Optimizer tests** (`test_optimizer.py`):

```python
class OptimizerTests(TestCase):
    def test_budget_constraint_respected(self):
        """Total price of selected items never exceeds budget."""

    def test_zero_budget_returns_empty(self):
        """Zero budget returns empty bundle."""

    def test_max_items_selects_most_items(self):
        """max_items strategy selects more items than max_score."""
```

**AI service tests** (`test_ai_service.py`):
- Mock the Anthropic client.
- Verify tool dispatch logic, message history building, error handling.

```python
class AIServiceTests(TestCase):
    @patch('apps.chat.ai_service.anthropic.Anthropic')
    def test_tool_calls_use_existing_services(self, mock_client):
        """Tool execution calls ProductService, not direct ORM."""

    def test_message_cap_enforced(self):
        """Sessions with >50 messages get trimmed."""
```

### 15.2 Frontend Testing

Frontend end-to-end testing will be performed **manually** using the following scenarios:

1. **Auth flow**: Register → Login → Verify navbar shows user info → Logout.
2. **Profile flow**: Edit profile → Change privacy settings → View "as Stranger" → Verify fields hidden.
3. **Wishlist flow**: Add product → Verify appears → Delete → Verify undo snackbar → Undo → Verify restored.
4. **Gift finder flow**: Search user → Set budget + event → View recommendations → View bundles → Open chat.
5. **AI chat flow**: Send message → Verify streaming response → Express preference → Verify AI remembers in next message.
6. **Privacy flow**: Set interests to private → Login as different user → View profile → Verify interests hidden.

### Acceptance Criteria — Phase 15

- [ ] All backend unit tests pass
- [ ] Each CSR layer has its own test file
- [ ] Repository tests use real DB
- [ ] Service tests mock repositories
- [ ] Controller tests use DRF APIClient
- [ ] All 6 manual frontend scenarios pass

---

## Appendix A — Full Database Schema

```
┌──────────────────┐       ┌──────────────────┐
│      User        │       │    Category       │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ email (unique)   │       │ name (unique)    │
│ username (unique)│       │ slug (unique)    │
│ password (hash)  │       │ icon             │
│ bio              │       └──────┬───────────┘
│ avatar (default) │              │
└──────┬───────────┘              │
       │                          │
       │ 1:1                      │ M:M (interests,
       ▼                          │      preferred,
┌──────────────────┐              │      excluded)
│  UserProfile     │──────────────┘
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ interests (M2M)  │
│ preferred (M2M)  │
│ excluded (M2M)   │
│ interests_priv   │
│ prefs_privacy    │
│ created_at       │
│ updated_at       │
└──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│      Tag         │       │    Product       │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ name (unique)    │◄─M2M──│ name             │
│ slug (unique)    │       │ description      │
└──────────────────┘       │ price            │
                           │ category_id (FK) │
                           │ tags (M2M → Tag) │
                           │ image_url        │
                           │ purchase_url     │
                           │ is_active        │
                           │ created_at       │
                           │ updated_at       │
                           └────────┬─────────┘
                                    │
┌──────────────────┐                │
│  WishlistItem    │────────────────┘
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ product_id (FK)  │
│ privacy          │
│ priority (0-5)   │
│ note             │
│ added_at         │
└──────────────────┘
unique(user, product)

┌──────────────────┐       ┌──────────────────┐
│  ChatSession     │       │  ChatMessage     │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │◄──────│ id (PK)          │
│ owner_id (FK)    │       │ session_id (FK)  │
│ recipient_id(FK) │       │ role             │
│ budget           │       │ content          │
│ event_type       │       │ metadata (JSON)  │
│ is_self_gift     │       │ created_at       │
│ created_at       │       └──────────────────┘
│ updated_at       │
└──────────────────┘

┌────────────────────────┐
│  GiftGiverPreference   │   ← AI Memory
├────────────────────────┤
│ id (PK)                │
│ user_id (FK)           │
│ preference_type        │
│ value                  │
│ context                │
│ created_at             │
└────────────────────────┘
unique(user, pref_type, value)
```

---

## Appendix B — API Endpoint Reference

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| 1 | POST | `/api/auth/register/` | No | Register |
| 2 | POST | `/api/auth/login/` | No | Login (JWT) |
| 3 | POST | `/api/auth/token/refresh/` | No | Refresh token |
| 4 | POST | `/api/auth/logout/` | Yes | Blacklist refresh token |
| 5 | GET | `/api/auth/me/` | Yes | Current user + profile |
| 6 | PATCH | `/api/auth/me/` | Yes | Update profile |
| 7 | POST | `/api/auth/change-password/` | Yes | Change password |
| 8 | GET | `/api/users/` | Yes | List users (public info) |
| 9 | GET | `/api/users/<id>/` | Yes | Public profile |
| 10 | GET | `/api/users/search/?q=` | Yes | Search users |
| 11 | GET | `/api/users/<id>/wishlist/` | Yes | User's public wishlist |
| 12 | GET | `/api/categories/` | Yes | List categories |
| 13 | GET | `/api/tags/` | Yes | List tags |
| 14 | GET | `/api/metadata/` | Yes | App constants (events, strategies) |
| 15 | GET | `/api/products/` | Yes | List/filter products |
| 16 | GET | `/api/products/<id>/` | Yes | Product detail |
| 17 | POST | `/api/products/` | Admin | Create product |
| 18 | PATCH | `/api/products/<id>/` | Admin | Update product |
| 19 | DELETE | `/api/products/<id>/` | Admin | Soft-delete |
| 20 | GET | `/api/products/search/?q=` | Yes | Full-text search |
| 21 | POST | `/api/products/import-csv/` | Admin | Import from CSV |
| 22 | GET | `/api/wishlists/` | Yes | Own wishlist (all) |
| 23 | POST | `/api/wishlists/` | Yes | Add to wishlist |
| 24 | PATCH | `/api/wishlists/<id>/` | Yes | Update wishlist item |
| 25 | DELETE | `/api/wishlists/<id>/` | Yes | Remove from wishlist |
| 26 | GET | `/api/recommendations/for-user/<id>/` | Yes | Recommendations |
| 27 | GET | `/api/recommendations/bundle/<id>/` | Yes | Optimized bundles |
| 28 | GET | `/api/recommendations/self-gift/` | Yes | Self-gift mode |
| 29 | GET | `/api/chat/sessions/` | Yes | List chat sessions |
| 30 | POST | `/api/chat/sessions/` | Yes | Create session |
| 31 | GET | `/api/chat/sessions/<id>/` | Yes | Session + history |
| 32 | POST | `/api/chat/sessions/<id>/messages/` | Yes | Send message (SSE stream) |

---

## Appendix C — Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | Yes | Django secret key |
| `DEBUG` | No | Default `True` |
| `ALLOWED_HOSTS` | Yes | Comma-separated hostnames |
| `DB_NAME` | Yes | PostgreSQL database name |
| `DB_USER` | Yes | PostgreSQL user |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `DB_HOST` | No | Default `localhost` |
| `DB_PORT` | No | Default `5432` |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `REDIS_URL` | No | Default `redis://localhost:6379/0` |
| `CORS_ALLOWED_ORIGINS` | Yes | Allowed frontend origins |

---

## Appendix D — Backend Constants

**`common/constants.py`** — Served via the `/api/metadata/` endpoint.

```python
EVENT_TYPES = [
    {
        "value": "birthday",
        "label": "Birthday",
        "description": "Celebrate someone's special day with a personal touch"
    },
    {
        "value": "wedding",
        "label": "Wedding",
        "description": "Gifts for the happy couple — home, lifestyle, and experiences"
    },
    {
        "value": "graduation",
        "label": "Graduation",
        "description": "Mark an achievement with something meaningful"
    },
    {
        "value": "holiday",
        "label": "Holiday",
        "description": "Seasonal and festive gifts for any holiday"
    },
    {
        "value": "anniversary",
        "label": "Anniversary",
        "description": "Celebrate a milestone with something memorable"
    },
]

GIFT_STRATEGIES = [
    {
        "value": "max_score",
        "label": "Best match",
        "description": "Picks the single most relevant gift — quality over quantity"
    },
    {
        "value": "max_items",
        "label": "More gifts",
        "description": "Maximizes the number of items within your budget"
    },
    {
        "value": "balanced",
        "label": "Balanced",
        "description": "A mix of relevance and variety — the sweet spot"
    },
]
```
