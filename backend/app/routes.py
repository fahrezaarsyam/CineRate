from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

from app import cache, models


class ReviewCreate(BaseModel):
    user_id: str
    movie_id: str
    rating: int = Field(..., ge=1, le=5)
    review_text: str = ""


movies_router = APIRouter(prefix="/api/movies", tags=["Movies"])
reviews_router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


@movies_router.get("")
def list_movies():
    return models.get_all_movies()


@movies_router.get("/top10")
def top10_movies():
    cached = cache.get_top10_from_cache()
    if cached is not None:
        return {"source": "cache", "data": cached}

    data = [dict(row) for row in models.get_top10_movies()]
    cache.set_top10_in_cache(data)
    return {"source": "database", "data": data}


def refresh_top10_cache() -> None:
    data = [dict(row) for row in models.get_top10_movies()]
    cache.set_top10_in_cache(data)


@reviews_router.post("", status_code=201)
def add_review(payload: ReviewCreate, background: BackgroundTasks):
    try:
        review = models.create_review(
            payload.user_id,
            payload.movie_id,
            payload.rating,
            payload.review_text,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    background.add_task(refresh_top10_cache)
    return dict(review)
