# CineRate

A movie catalog, rating, and review platform built with FastAPI and vanilla JavaScript.

## Overview

CineRate allows users to browse a curated movie catalog, submit ratings and written reviews, and manage a personal watchlist. The application uses a RESTful API backend with PostgreSQL for persistent storage and Redis for caching.

## Tech Stack

- **Backend:** Python 3, FastAPI, Uvicorn
- **Database:** PostgreSQL (hosted on Railway)
- **Cache:** Redis (hosted on Railway)
- **Frontend:** HTML, CSS, vanilla JavaScript
- **Auth:** bcrypt password hashing

## Project Structure

```
CineRate/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application entry point
│   │   ├── routes.py         # API route handlers
│   │   ├── models.py         # Database queries and connection pool
│   │   └── cache.py          # Redis caching layer
│   ├── requirements.txt
│   └── .env                  # Environment variables (not committed)
├── database/
│   └── init.sql              # Schema definition and seed data
├── frontend/
│   ├── index.html            # Home / catalog page
│   ├── film.html             # Movie detail page
│   ├── leaderboard.html      # Top 10 movies page
│   ├── mywatchlist.html      # User watchlist page
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── auth.js           # Authentication logic
│       └── app_v2.js         # Catalog rendering
└── README.md
```

## Database Schema

The PostgreSQL database consists of four tables:

| Table       | Description                                      |
|-------------|--------------------------------------------------|
| `users`     | Registered accounts with bcrypt-hashed passwords |
| `movies`    | Movie catalog (title, synopsis, director, year, poster) |
| `reviews`   | User ratings and review text (one per user per movie) |
| `watchlist` | Per-user saved movies for later viewing          |

Redis is used to cache the Top 10 leaderboard query with a configurable TTL (default 300s).

## API Endpoints

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| POST   | `/api/auth/signup`                | Register a new user      |
| POST   | `/api/auth/login`                 | Log in with credentials  |
| GET    | `/api/movies`                     | List all movies          |
| GET    | `/api/movies/top10`               | Top 10 rated movies      |
| GET    | `/api/movies/{movie_id}`          | Movie detail             |
| GET    | `/api/movies/{movie_id}/reviews`  | Reviews for a movie      |
| POST   | `/api/reviews`                    | Submit or update a review|
| GET    | `/api/users/{user_id}/watchlist`  | Get user watchlist       |
| POST   | `/api/users/{user_id}/watchlist`  | Add to watchlist         |
| DELETE  | `/api/users/{user_id}/watchlist/{movie_id}` | Remove from watchlist |

## Setup

### Prerequisites

- Python 3.10+
- PostgreSQL database
- Redis instance

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/CineRate.git
   cd CineRate
   ```

2. Create and activate a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate   # Windows
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

5. Initialize the database by running `database/init.sql` against your PostgreSQL instance.

### Running

Start the backend server:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Serve the frontend (any static file server works):
```bash
python -m http.server 5500 --directory frontend
```

Open `http://localhost:5500` in your browser.
