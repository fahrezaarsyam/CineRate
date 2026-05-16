# CineRate

A modern movie rating and review application built with **React (Vite)** and **FastAPI**.

##  Features
- **Modern UI**: Fully migrated from legacy HTML to a fast React Single Page Application.
- **Authentication**: Secure Login/Signup system with profile management.
- **Movie Catalog**: Real-time search, filters, and "Top 10" highest-rated movies.
- **Ratings & Reviews**: Interactive star rating system (0.5 to 5.0) and user reviews.
- **Watchlist**: Personal movie saving functionality.
- **Cloud Ready**: Configured for deployment on **Vercel** and **Railway**.

##  Tech Stack
- **Frontend**: React 18, Vite, Lucide Icons, Vanilla CSS.
- **Backend**: FastAPI (Python), PostgreSQL (Database), Redis (Caching).
- **Deployment**: Vercel (Frontend), Railway (Backend & Database).

## Project Structure
- `/frontend`: Vite project with React components and modern CSS.
- `/backend`: FastAPI application containing the API logic and database models.
- `/database`: Initial SQL scripts for database setup.

## Deployment
### Backend (Railway)
1. Push this repository to GitHub.
2. Link the repository to **Railway**.
3. Railway will automatically detect the `backend` directory and deploy the FastAPI server.
4. The API will be available at: `https://cinerate-production-20a4.up.railway.app`

### Frontend (Vercel)
1. Import the project into **Vercel**.
2. Set the **Root Directory** to `frontend`.
3. Vercel will automatically build the Vite app.
4. Ensure the `VITE_API_URL` environment variable is set to the Railway URL if you want to override the default.

##  Local Development (Docker)
Run the entire stack locally with one command:
```bash
docker-compose up --build
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

## Seeding the Database
To populate the database with initial movie data:
```bash
cd backend
python seed.py
```