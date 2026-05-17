# CineRate

A full-stack movie rating and review platform. Built with React + Vite on the frontend and FastAPI on the backend, using PostgreSQL for persistent storage and Redis to cache the homepage's Top 10 list.

CineRate was developed as the final project for the Database Systems Practicum 2025/2026 at the Computer Engineering Study Program, Faculty of Engineering, Universitas Indonesia.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Manual Local Development](#manual-local-development)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Project Documentation](#project-documentation)
- [Team](#team)

---

## Features

- **Authentication.** Secure signup and login using bcrypt password hashing (cost factor 12). Login accepts either username or email. Each user can change their password, username, or email at most once every 24 hours.
- **Movie catalog.** Browse 40+ curated films with title, synopsis, director, release year, poster, and genre tags.
- **Search and filter.** Real-time title search and multi-genre filtering on the catalog page.
- **Star ratings and reviews.** Rate movies from 0.5 to 5.0 in half-star steps and submit an optional text review. Submitting again replaces your old rating (one review per user per movie).
- **Top 10 list.** The homepage shows the 10 highest-rated movies. The query is cached in Redis with a 300-second TTL and refreshed asynchronously (debounced by about 2 seconds) when a new review is submitted, so users never wait for a cache miss.
- **Personal watchlist.** Save films for later and toggle them from any movie detail page.
- **"For You" recommendations.** Personalized suggestions based on the user's review history and preferred genres.
- **Cloud-ready.** Single-command Docker setup for local development. In production, the frontend runs on Vercel while the FastAPI backend, PostgreSQL, and Redis all run on Railway.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Lucide Icons, vanilla CSS (glassmorphism) |
| Backend | FastAPI, Uvicorn, Pydantic, psycopg2, redis-py, bcrypt, python-dotenv |
| Database | PostgreSQL 16 with the `pgcrypto` extension (for UUID generation) |
| Cache | Redis 7 |
| Containerization | Docker, Docker Compose |
| Hosting | Vercel (frontend only) and Railway (FastAPI backend, Postgres, and Redis) |

---

## Architecture

CineRate is organized into three tiers.

1. **Client tier.** The React SPA runs in the user's browser, served as static assets from Vercel's CDN.
2. **Application tier.** The FastAPI backend runs as a long-running container on Railway. It exposes a REST API for the SPA to consume and coordinates between PostgreSQL and Redis.
3. **Data tier.** PostgreSQL stores all persistent data across four tables (`users`, `movies`, `reviews`, `watchlist`). Redis caches the Top 10 query result under the key `cinerate:top10:v2`. Both run as managed services on Railway alongside the backend.

For visuals, see [`docs/deployment_diagram.svg`](docs/deployment_diagram.svg) and [`docs/erd.svg`](docs/erd.svg).

---

## Repository Structure

```
CineRate/
├── backend/                      # FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI entry point, CORS, lifespan
│   │   ├── routes.py             # API routers (auth, users, movies, reviews, watchlist)
│   │   ├── models.py             # PostgreSQL connection pool and data access
│   │   └── cache.py              # Redis client and Top 10 cache helpers
│   ├── seed.py                   # Manual database seeding script
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile
├── frontend/                     # React + Vite SPA
│   ├── src/
│   │   ├── api/                  # API client (api/client.js)
│   │   ├── components/           # Navbar, AuthModal, MovieCard, SettingsModal, ...
│   │   ├── context/              # AuthContext for session state
│   │   ├── pages/                # Home, Top10, MovieDetail, ForYou, Watchlist, ...
│   │   └── main.jsx
│   ├── index.html
│   ├── nginx.conf                # Used by the Docker image
│   ├── vite.config.js
│   ├── vercel.json               # SPA rewrite rules
│   └── Dockerfile
├── database/
│   └── init.sql                  # Schema and seed data (idempotent)
├── docs/                         # Diagrams (ERD, flowchart, UML, deployment)
├── docker-compose.yml            # Local dev stack
├── package.json                  # Monorepo install/build helper for Vercel
└── README.md
```

---

## Prerequisites

You will need either:

- Docker and Docker Compose (the easier path), or
- Node.js 18+ and Python 3.11+ with local installations of PostgreSQL 16 and Redis 7 for manual development.

A GitHub account is also required if you want to fork and deploy your own instance.

---

## Quick Start (Docker)

The fastest way to run the full stack locally is with Docker Compose. The included `docker-compose.yml` expects an existing Postgres and Redis instance (either locally or on Railway). To stand up everything in one go, including the databases, create a `docker-compose.override.yml` file alongside it:

```yaml
# docker-compose.override.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: cinerate
      POSTGRES_USER: cinerate
      POSTGRES_PASSWORD: cinerate
    ports: ["5432:5432"]
    volumes:
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro

  redis:
    image: redis:7
    ports: ["6379:6379"]

  backend:
    depends_on: [postgres, redis]
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: cinerate
      DB_USER: cinerate
      DB_PASS: cinerate
      REDIS_URL: redis://redis:6379/0
      CACHE_TTL: 300
```

Then run:

```bash
docker-compose up --build
```

Once everything is up:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs (Swagger UI): http://localhost:8000/docs

To stop: `docker-compose down`. To wipe the database volume too: `docker-compose down -v`.

---

## Manual Local Development

If you prefer to run the services without Docker:

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create backend/.env (see "Environment Variables" below)
# Load the schema into your local Postgres:
psql -d cinerate -f ../database/init.sql

# Start the API
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs at http://localhost:5173 and proxies API calls to `http://localhost:8000`.

---

## Environment Variables

The backend is configured through environment variables loaded from `backend/.env` (or from the platform's project settings when deployed).

**Important: never commit `backend/.env` to the repository.** It is already listed in `.gitignore`. For new clones, copy the template below into a fresh `backend/.env` and fill in the real values. Production credentials should live only in the Railway and Vercel project settings.

```ini
# PostgreSQL connection (use Railway's public TCP proxy host/port for remote DBs)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cinerate
DB_USER=cinerate
DB_PASS=your_password_here

# Redis connection. REDIS_URL takes precedence if set.
REDIS_URL=redis://localhost:6379/0

# Alternatively, use split variables instead of REDIS_URL:
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_DB=0
# REDIS_PASSWORD=

# Cache TTL in seconds for the /movies/top10 endpoint
CACHE_TTL=300
```

The frontend reads one optional variable, `VITE_API_URL`, which overrides the auto-detected backend URL. It defaults to `http://localhost:8000` in development and the deployed Railway URL in production.

---

## Database Setup

The full schema and a seed dataset of 40+ curated movies live in `database/init.sql`. The script is idempotent: it drops the existing tables in dependency order before recreating them, so you can re-run it safely against either a fresh or an existing database.

Load the schema into a local Postgres:

```bash
psql -d cinerate -f database/init.sql
```

Or use the Docker image. The official Postgres image runs any file mounted at `/docker-entrypoint-initdb.d/` on first startup, which is what the `docker-compose.override.yml` snippet above does.

The seed file creates five test accounts, all with the password `password123` (bcrypt-hashed inside the script), for convenience during development.

---

## Deployment

### Backend and Databases (Railway)
1. Push the repository to GitHub.
2. In Railway, create a new project from the GitHub repo.
3. Set the *Root Directory* of the deployment to `/backend`.
4. Add two database services: *PostgreSQL* and *Redis* from Railway's plugin catalog.
5. Run `database/init.sql` against the new Postgres instance.
6. In the Backend service's *Variables* tab, add the contents of your `backend/.env` (linking to the Railway Postgres and Redis URLs).
7. Generate a public domain for the Backend service (e.g., `https://cinerate-production.up.railway.app`).

### Frontend (Vercel)
1. In Vercel, import the same GitHub repository.
2. Set the *Root Directory* to `frontend`.
3. Vercel will automatically detect Vite and configure the build settings.
4. Make sure your frontend API client points to the public Railway Backend URL.
5. Trigger a deployment. The frontend will be served from Vercel's CDN.

---

## API Reference

FastAPI auto-generates an interactive Swagger UI at `/docs` on any running backend instance (for example, http://localhost:8000/docs). The main endpoints are:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/signup` | Create a new account |
| `POST` | `/auth/login` | Log in with username or email |
| `GET` | `/users` | List all users |
| `PUT` | `/users/{user_id}/username` | Change username (24h cooldown) |
| `PUT` | `/users/{user_id}/email` | Change email (24h cooldown) |
| `PUT` | `/users/{user_id}/password` | Change password (24h cooldown) |
| `GET` | `/movies` | List all movies |
| `GET` | `/movies/top10` | Top 10 highest-rated (Redis-cached) |
| `GET` | `/movies/{movie_id}` | Single movie details |
| `GET` | `/movies/{movie_id}/reviews` | All reviews for a movie |
| `POST` | `/reviews` | Submit or update a review |
| `GET` | `/users/{user_id}/watchlist` | Get a user's watchlist |
| `POST` | `/users/{user_id}/watchlist` | Add a movie to the watchlist |
| `DELETE` | `/users/{user_id}/watchlist/{movie_id}` | Remove from watchlist |
| `GET` | `/users/{user_id}/watchlist/{movie_id}` | Check if a movie is in the watchlist |

---

## Project Documentation

The `docs/` directory contains the diagrams referenced in the final project report:

- `docs/erd.svg`: Entity-Relationship Diagram (4 tables, relationships, cardinality)
- `docs/flowchart.svg`: Application flowchart for the main user journey
- `docs/use_case_diagram.svg`: UML Use Case Diagram (Guest and Registered User actors)
- `docs/class_diagram.svg`: UML Class Diagram (entity, service, and infrastructure layers)
- `docs/deployment_diagram.svg`: UML Deployment Diagram (Vercel and Railway architecture)

Each diagram is also available as a `.mermaid` source file in the same directory for easy editing.

The full project report is at `docs/CineRate_Final_Project_Report.pdf`.

---

## Team

**Group 1, Database Systems Practicum 2025/2026**

| Role | Name | NPM |
|------|------|-----|
| Lead Developer | Fahreza Arsya Maulana | 2406450365 |
| Backend Developer | Paskah Rahmat Bisuk Abednego Samosir | 2406450453 |
| Database Administrator | Muhammad Agib Pratama | 2406450415 |
| Frontend Developer | Abidzar Rabbani Khatib Harahap | 2406369034 |

Final Project DBS, Teknik Komputer KKI, CineRate
