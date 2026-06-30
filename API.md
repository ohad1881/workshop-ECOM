# API Reference

This document describes the HTTP API between the **frontend** (`frontend/src/api/*.js`) and the **Django backend** (`backend/`).

- **Base URL:** `http://localhost:8000/api` (configurable via `VITE_API_BASE_URL`)
- **Auth:** JWT Bearer tokens. The access token is sent as `Authorization: Bearer <access_token>` on every authenticated request. On a `401`, the client transparently refreshes via `/auth/token/refresh/`.
- **Content type:** `application/json`, except the chat endpoint (a Server-Sent Events stream).
- **IDs only.** All filtering, fetching, and cross-references use numeric **IDs**, never names or slugs — e.g. `category_id=1`, `tag_ids=1,2`, `mentioned_user_ids=[2]`.
- **No bulk fetch.** There is no "list everything" endpoint for users, tags, or categories. These are queried by type-ahead **search** (`?q=`), are paginated/capped, and the frontend selects results by ID.
- **Reading the `Request` column.** `**bold**` = required; everything else is optional (default in parentheses). `<id>` / `<user_id>` path segments are always required. `[ids]` denotes a comma-separated list of IDs.

> **Admin-only, not in this API:** creating, editing, and deleting products / categories / tags, and CSV import, are done through the **Django admin panel** + `python manage.py import_products`. They are intentionally **not** exposed to the frontend.

### Validation & errors

All validation lives in the **backend** (DRF serializers + permissions) — query params, path params, and request bodies. The frontend may do light form UX, but the backend is the single source of truth.

A custom DRF exception handler normalizes **every** error response to one shape, always with the **correct HTTP status code** (so logs, monitoring, and devtools stay honest):

```json
{ "message": "Human-readable summary.", "errors": { "field": ["..."], "non_field_errors": ["..."] } }
```

- **`message`** — always present; safe to show directly in a banner/toast.
- **`errors`** — per-field map of validation messages; present on `400`, omitted otherwise. Cross-field/form-level messages live under `non_field_errors`.

| Status | Meaning | Body |
|---|---|---|
| `400` | Validation failed | `message` + `errors` |
| `401` | Not authenticated (missing / invalid / expired token) | `message` |
| `403` | Authenticated but not allowed | `message` |
| `404` | Not found | `message` |
| `409` | Conflict (e.g. duplicate wishlist item) | `message` |
| `500` | Server error | `message` |

Examples:
```json
// 400
{ "message": "Enter a valid email address.", "errors": { "email": ["Enter a valid email address."] } }
// 401
{ "message": "Authentication credentials were not provided." }
```

- **Unrecognized keys** (a param or body field an endpoint doesn't use) are **silently ignored** (DRF default).
- **Backend implementation:** one custom `REST_FRAMEWORK["EXCEPTION_HANDLER"]` — wrap DRF's `exception_handler`, keep its `status_code`, reshape the body to `{ message, errors }`.

**Successful responses are unchanged:** normal `2xx` with the resource/data documented per endpoint (`200`/`201`, or `204` for deletes).

---

## Authentication & Account (`/api/auth/*`)

Two PATCH surfaces are split by concern: **settings** (identity/account) vs **preferences** (profile data). `GET /auth/me/` returns both (preferences nested).

| Endpoint | Method | Auth | Request | Returns (example) |
|---|---|---|---|---|
| `/auth/register/` | POST | No | body: **`email`**, **`username`**, **`password`**, **`password_confirm`** | `{ "user": { "id": 1, "email": "ada@example.com", "username": "ada", "gravatar_hash": "..." }, "access": "eyJ...", "refresh": "eyJ..." }` |
| `/auth/login/` | POST | No | body: **`email`**, **`password`** | `{ "access": "eyJ...", "refresh": "eyJ...", "user": { "id": 1, "username": "ada", "gravatar_hash": "..." } }` |
| `/auth/token/refresh/` | POST | No | body: **`refresh`** | `{ "access": "eyJ..." }` |
| `/auth/logout/` | POST | Yes | body: **`refresh`** | `204 No Content` |
| `/auth/me/` | GET | Yes | _(Bearer only)_ | `{ "id": 1, "email": "ada@example.com", "username": "ada", "gravatar_hash": "...", "date_joined": "2026-01-15T10:00:00Z", "preferences": { "bio": "", "interest_ids": [1, 2], "preferred_category_ids": [1], "excluded_category_ids": [] } }` |
| `/auth/me/` | PATCH | Yes | **settings** (partial): `username`, `email` | `{ "id": 1, "username": "ada2", "email": "ada@example.com", "gravatar_hash": "..." }` |
| `/auth/me/preferences/` | PATCH | Yes | **preferences** (partial): `bio`, `interest_ids` `[ids]` (Tag IDs from `/tags/`), `preferred_category_ids` `[ids]` (Category IDs from `/categories/`), `excluded_category_ids` `[ids]` (Category IDs) | `{ "bio": "Loves gadgets", "interest_ids": [1, 2, 3] }` |
| `/auth/change-password/` | POST | Yes | body: **`old_password`**, **`new_password`** | `{ "detail": "Password updated." }` |

## Users (`/api/users/*`)

No list-all endpoint. Discover users via search (used for the gift-builder recipient picker and chat `@mentions`); fetch a specific user by ID.

| Endpoint | Method | Auth | Request | Returns (example) |
|---|---|---|---|---|
| `/users/search/` | GET | Yes | query: **`q`**, `limit` (20) | `[ { "id": 2, "username": "grace", "gravatar_hash": "..." } ]` |
| `/users/<id>/` | GET | Yes | path **`id`** | `{ "id": 2, "username": "grace", "gravatar_hash": "...", "bio": "Hi", "date_joined": "2026-01-15T10:00:00Z", "interest_ids": [1, 2], "preferred_category_ids": [1], "excluded_category_ids": [] }` |
| `/users/<id>/wishlist/` | GET | Yes | path **`id`** | `[ { "id": 10, "product": { "id": 5, "name": "Headphones", "price": "199.00" } } ]` |

## Taxonomy & Metadata

Categories and tags are **searched**, not bulk-fetched — there can be hundreds of each. The frontend queries as the user types and selects by ID. `metadata` is a small fixed constant set (safe to cache fully).

| Endpoint | Method | Auth | Request | Returns (example) |
|---|---|---|---|---|
| `/categories/` | GET | Yes | query: `q`, `limit` (20), `page` _(paginated; no full dump)_ | `{ "count": 1, "results": [ { "id": 1, "name": "Electronics", "slug": "electronics", "icon": "💻" } ] }` |
| `/tags/` | GET | Yes | query: `q`, `limit` (20), `page` _(paginated; no full dump)_ | `{ "count": 1, "results": [ { "id": 1, "name": "eco-friendly", "slug": "eco-friendly" } ] }` |
| `/metadata/` | GET | Yes | _(none)_ | `{ "event_types": [ { "value": "birthday", "label": "Birthday", "description": "..." } ], "gift_strategies": [ { "value": "balanced", "label": "Balanced", "description": "..." } ] }` |

## Products (`/api/products/*`)

Read-only from the frontend (see the admin note at the top). Filtering is by **ID** only.

| Endpoint | Method | Auth | Request | Returns (example) |
|---|---|---|---|---|
| `/products/` | GET | Yes | query: `category_id`, `tag_ids` `[ids]`, `min_price`, `max_price`, `search`, `page`, `limit` (20) | `{ "count": 1, "results": [ { "id": 5, "name": "Headphones", "price": "199.00", "category_id": 1, "image_url": null, "is_active": true } ] }` |
| `/products/<id>/` | GET | Yes | path **`id`** | `{ "id": 5, "name": "Headphones", "description": "Wireless", "price": "199.00", "category_id": 1, "tag_ids": [1, 2], "image_url": null, "purchase_url": "https://...", "is_active": true }` |
| `/products/search/` | GET | Yes | query: **`q`**, `limit` (20) | `[ { "id": 5, "name": "Headphones", "price": "199.00" } ]` |

## Wishlists (`/api/wishlists/*`)

| Endpoint | Method | Auth | Request | Returns (example) |
|---|---|---|---|---|
| `/wishlists/` | GET | Yes | _(none)_ | `[ { "id": 10, "product": { "id": 5, "name": "Headphones", "price": "199.00" }, "note": "blue please", "privacy": "public", "priority": 3, "added_at": "2026-06-19T10:00:00Z" } ]` |
| `/wishlists/` | POST | Yes | body: **`product_id`**, `note`, `privacy` (`public`), `priority` (5) | `{ "id": 10, "product": { "id": 5, "name": "Headphones" }, "note": "blue please", "privacy": "public", "priority": 5, "added_at": "2026-06-19T10:00:00Z" }` |
| `/wishlists/<id>/` | PATCH | Yes | path **`id`**; body (partial): `note`, `privacy`, `priority` | `{ "id": 10, "note": "any color", "priority": 5 }` |
| `/wishlists/<id>/` | DELETE | Yes | path **`id`** | `204 No Content` |

## Recommendations (`/api/recommendations/*`)

`strategy` ∈ `max_score` \| `max_items` \| `balanced`. `event_type` is a metadata value (e.g. `birthday`), not an entity ID.

`gift-suggestions` returns the top-pick `recommendations` **and** all three `bundles` from a single scoring pass — the client renders every tab/strategy from one response (no per-strategy call). Excluded categories are filtered out server-side, so they are never scored or suggested. **Self-gift is auto-detected**: when `user_id` is the authenticated user, their private wishlist is also used. When the recipient has no public data, returns `{ "message": "…", "recommendations": [], "bundles": {} }`.

`for-me` scores the **entire catalog** against the authenticated user's own profile (self-gift scoring, so private wishlist data counts) and returns it sorted by match score — it powers the products page "Recommended" tab. There is no budget cap. When the user has no profile data yet, returns `{ "message": "…", "results": [] }`.

| Endpoint | Method | Auth | Request | Returns (example) |
|---|---|---|---|---|
| `/recommendations/gift-suggestions/<user_id>/` | GET | Yes | path **`user_id`**; query **`budget`**, `event_type`, `limit` (20) | `{ "recommendations": [ { "product": { "id": 5, "name": "Headphones", "price": "199.00" }, "score": 0.92, "explanation": "…" } ], "bundles": { "max_score": { "items": [ … ], "total_price": "461.45", "total_score": 4.1, "budget_utilization": "92.3%" }, "max_items": { … }, "balanced": { … } } }` |
| `/recommendations/for-me/` | GET | Yes | query: `limit` (200, max 500) | `{ "results": [ { "product": { "id": 5, "name": "Headphones", "price": "199.00", "category_id": 1, "image_url": null, "is_active": true }, "score": 0.78, "explanation": "…" } ] }` |

## Chat (`/api/chat/*`)

To tag users with `@`, the frontend autocompletes via `GET /users/search/` and sends the resolved **IDs** in `mentioned_user_ids` — the backend never parses `@name` from free text. Products are tagged with `#` the same way (autocomplete via `GET /products/search/`, resolved IDs sent in `mentioned_product_ids`).

| Endpoint | Method | Auth | Request | Returns (example) |
|---|---|---|---|---|
| `/chat/sessions/` | GET | Yes | _(none)_ | `[ { "id": 1, "title": "Gift ideas", "recipient_id": 2, "recipient_username": "alice", "budget": "100.00", "event_type": "birthday", "is_self_gift": false, "stranger_description": "", "created_at": "2026-06-19T10:00:00Z", "updated_at": "2026-06-19T10:00:00Z" } ]` (`recipient_username` is `null` when there is no recipient) |
| `/chat/sessions/` | POST | Yes | body (all optional): `title`, `recipient_id`, `budget`, `event_type`, `is_self_gift` (`false`), `stranger_description`, `bundle_product_ids` `[ids]`. A blank session is valid — the assistant infers the recipient from the free-text chat and asks for anything else (e.g. budget). When `bundle_product_ids` is given (gift-builder handoff), the session is seeded with a canned opening assistant message carrying the bundle card (no model call). | `{ "id": 1, "title": "", "recipient_id": null, "recipient_username": null, "budget": null, "event_type": "", "is_self_gift": false, "stranger_description": "", "messages": [], "created_at": "…", "updated_at": "…" }` |
| `/chat/sessions/<id>/` | GET | Yes | path **`id`** | `{ "id": 1, "title": "Gift ideas", "recipient_id": 2, "recipient_username": "alice", "budget": "100.00", "event_type": "birthday", "is_self_gift": false, "stranger_description": "", "messages": [ { "id": 1, "role": "user", "content": "Hi", "metadata": {}, "created_at": "…" }, { "id": 2, "role": "assistant", "content": "Hello!", "metadata": {}, "created_at": "…" } ], "created_at": "…", "updated_at": "…" }` |
| `/chat/sessions/<id>/` | DELETE | Yes | path **`id`** | `204 No Content`. `404` if not found, `403` if not the owner. |
| `/chat/sessions/<id>/messages/` | POST | Yes | path **`id`**; body: **`content`**, `mentioned_user_ids` `[ids]`, `mentioned_product_ids` `[ids]` | **SSE** stream of `data: {"text": "..."}` chunks, terminated by `data: [DONE]`. Returns `503` if the Gemini API key is not configured. |
