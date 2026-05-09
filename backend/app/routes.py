from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app import models, cache

class ReviewCreate(BaseModel):
    user_id: str
    movie_id: str
    rating: int = Field(..., ge=1, le=5)
    review_text: str = ""

class UserCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: str
    password: str = Field(..., min_length=6)

# Movies Router
movies_router = APIRouter(prefix="/api/movies", tags=["Movies"])

@movies_router.get("")
def list_movies():
    return models.get_all_movies()

@movies_router.get("/top10")
def top10_movies():
    cached = cache.get_top10_from_cache()
    if cached is not None:
        return {"source": "cache", "data": cached}

    data = models.get_top10_movies()
    result = [dict(row) for row in data]
    cache.set_top10_in_cache(result)
    return {"source": "database", "data": result}

@movies_router.get("/{movie_id}")
def get_movie(movie_id: str):
    movie = models.get_movie_by_id(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return dict(movie)

# Reviews Router
reviews_router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

@reviews_router.get("/movie/{movie_id}")
def list_reviews(movie_id: str):
    return models.get_reviews_for_movie(movie_id)

@reviews_router.post("", status_code=201)
def add_review(payload: ReviewCreate):
    try:
        review = models.create_review(
            payload.user_id, payload.movie_id,
            payload.rating, payload.review_text,
        )
        cache.invalidate_top10_cache()
        return dict(review)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

# Users Router
users_router = APIRouter(prefix="/api/users", tags=["Users"])

@users_router.get("")
def list_users():
    return models.get_all_users()

@users_router.get("/{user_id}")
def get_user(user_id: str):
    user = models.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(user)

@users_router.post("", status_code=201)
def register_user(payload: UserCreate):
    try:
        user = models.create_user(payload.username, payload.email, payload.password)
        return dict(user)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
