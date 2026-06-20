# Job Search Email Classifier

Full-stack app for classifying job-search emails from Gmail with OpenAI.

## Phase 0 — Local setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker (for PostgreSQL)

### 1. Environment

```bash
cp .env.example .env
```

### 2. PostgreSQL

```bash
docker compose up -d
```

### 3. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Health endpoint: [http://localhost:8000/api/health/](http://localhost:8000/api/health/)

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the page calls `/api/health/` via the Vite dev proxy and shows API + database status.

## Project layout

```
backend/          Django + DRF
frontend/         React + TypeScript (Vite)
docker-compose.yml
.env.example
```

See `cursor-context.md` for the full stack spec and build phases.
