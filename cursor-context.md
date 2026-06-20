# Project Context — Job Search Email Classifier

> Feed this file to Cursor as project context (e.g. save as `.cursorrules` in the
> repo root, or add it under `.cursor/rules/`). It is the source of truth for the
> stack and conventions. **Do not deviate from the decisions below without my
> explicit confirmation in chat.**

---

## 1. What we are building

A full stack web app that connects to a user's Gmail, pulls unread job-search
emails, classifies each one with the OpenAI API, stores everything in Postgres,
and shows the user's job-application funnel on a React dashboard.

Classification labels (exactly these six, no others):
- `auto_acknowledgement`
- `rejection`
- `interview_invite`
- `follow_up_required`
- `recruiter_outreach`
- `offer`

---

## 2. Locked tech stack — DO NOT substitute

| Layer            | Technology                                   |
|------------------|----------------------------------------------|
| Frontend         | React + TypeScript (Vite)                    |
| Backend          | Django + Django REST Framework (Python)      |
| Database         | PostgreSQL                                    |
| ORM              | Django ORM (NOT Prisma)                       |
| Email            | Gmail API via `google-api-python-client`     |
| AI               | OpenAI API via the official `openai` Python SDK |
| Auth             | Google OAuth2 (offline access) + JWT for app sessions |
| Frontend↔API auth| `djangorestframework-simplejwt`              |
| CORS             | `django-cors-headers`                        |
| Hosting          | Render or Railway with managed Postgres      |

> NOTE: An earlier draft of this project specified Node/Express + Prisma + TS
> backend. That is **superseded**. The backend is **Django/Python**. Ignore any
> Prisma or Express references.

Do not introduce additional frameworks, ORMs, state-management libraries, or
component kits without asking first. No SQLite in committed config — Postgres
everywhere, run locally via Docker.

---

## 3. Architecture / data flow

```
Gmail inbox
   -> Gmail API (Django service) — fetch unread emails
   -> OpenAI API (Django service) — classify subject + snippet -> label + confidence
   -> PostgreSQL (Django ORM) — store email + classification
   -> React dashboard — render application funnel
```

The user triggers a fresh pull + classification by clicking **"Sync Inbox"**,
which calls `POST /api/sync`.

---

## 4. Database schema (Django models)

Use Django's built-in auth. **Do not create a custom `users` table from scratch.**
Store Google tokens on a related profile (or custom user) model.

- **UserProfile** (extends/relates to Django `User`)
  - `google_access_token`, `google_refresh_token`, `token_expiry`, `created_at`
- **Email**
  - `user` (FK), `gmail_message_id` (unique per user), `sender`, `subject`,
    `body_snippet`, `received_at`, `created_at`
- **Classification**
  - `email` (FK), `label`, `confidence_score`, `raw_openai_response` (store the
    full raw response for debugging), `classified_at`
- **Company**
  - `user` (FK), `company_name`, `role_title`, `status`, `last_updated`

Dedupe ingested emails on `(user, gmail_message_id)`. Always migrate via Django
migrations — never hand-edit the DB or migration history.

---

## 5. API endpoints (DRF)

- `GET  /api/auth/google/login` — start OAuth flow
- `GET  /api/auth/google/callback` — handle callback, store tokens, issue JWT
- `POST /api/sync` — fetch unread -> classify -> store; returns summary
- `GET  /api/emails` — list classified emails (paginated)
- `GET  /api/dashboard/funnel` — aggregate counts per label for the funnel

Auth-protect everything except the OAuth start/callback. Return JSON only.

---

## 6. OpenAI classification rules

- Send subject + body snippet only (not full bodies) to control token cost.
- Request **structured JSON output** with a strict schema: `{ "label": <one of
  the six>, "confidence": <0..1> }`. Use the SDK's structured/JSON mode.
- Validate the label is one of the six allowed values before saving; if invalid,
  store the raw response and flag it rather than guessing.
- Persist the full raw response in `Classification.raw_openai_response`.
- Never hardcode the API key — read from environment variables.

---

## 7. Google OAuth rules

- Scopes: `https://www.googleapis.com/auth/gmail.readonly`, `openid`, `email`,
  `profile`.
- Request **offline access** + consent prompt so a refresh token is returned.
- Store access + refresh tokens on the user's profile; implement refresh when the
  access token expires.
- Keep separate redirect URIs for local and production; both must be registered
  in the Google Cloud console.

---

## 8. Conventions

- TypeScript on the frontend: `strict` mode on, no `any` unless justified inline.
- Python: type hints on function signatures; keep Gmail and OpenAI logic in
  dedicated service modules, not in views.
- Thin views, fat services: DRF views orchestrate; business logic lives in
  `services/`.
- All secrets via environment variables / `.env` (gitignored). Provide a
  `.env.example`. Never commit real keys or tokens.
- Small, reviewable changes. When a request is ambiguous, ask before generating
  large amounts of code.

---

## 9. Suggested folder structure

```
backend/
  config/                 # Django project settings, urls
  apps/
    accounts/             # auth, UserProfile, OAuth
    emails/               # Email, Classification models + ingestion
    companies/            # Company model
  services/
    gmail_service.py      # Gmail fetch + parse
    openai_service.py     # classification
  requirements.txt
frontend/
  src/
    api/                  # typed API client
    components/
    pages/
  package.json
docker-compose.yml        # Postgres (+ optionally backend)
.env.example
```

---

## 10. Build phases (current = update this line as you go)

> **CURRENT PHASE: 0 — scaffolding**

0. Scaffolding: Django + DRF + Postgres + React, one working end-to-end endpoint.
1. Models + migrations + Django admin.
2. Google OAuth (login + Gmail authorization + token storage + JWT).
3. OpenAI classifier service (standalone, test with sample emails).
4. Gmail ingestion service (fetch, parse, dedupe, refresh tokens).
5. Sync pipeline + read endpoints.
6. React dashboard (login, Sync button, funnel, email list).
7. Deploy to Render/Railway.

Stretch: Celery + Redis for background sync.

**When I ask for help, stay within the current phase unless I say otherwise.**
Do not jump ahead and scaffold future phases.
