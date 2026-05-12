import threading
import time

import bcrypt
import psycopg2
from fastapi import APIRouter, BackgroundTasks, HTTPException, Path, Query
from pydantic import BaseModel, EmailStr, Field


from app import cache, models


# ---------------------------------------------------------------------------
# Reusable UUID path-parameter type (example comment)
# ---------------------------------------------------------------------------
# FastAPI will auto-validate any path/query parameter annotated with UUID4. (example comment)
# For Pydantic *body* models we also use UUID4 so invalid strings never reach (example comment)
# the database layer. (example comment)
# For path parameters we keep ``str`` but add an explicit validator so that (example comment)
# Swagger docs stay clean (UUID4 path params render oddly in some clients). (example comment)

def _validated_uuid(value: str, name: str = "id") -> str:
    """Return *value* unchanged if it is a valid UUID-v4 hex string, otherwise
    raise a 422 with a descriptive message."""
    import uuid as _uuid
    try:
        _uuid.UUID(value)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=422,
            detail=f"'{name}' must be a valid UUID string (got '{value}')",
        )
    return value


# ---------------------------------------------------------------------------
# Pydantic request models (example comment)
# ---------------------------------------------------------------------------

from uuid import UUID

class ReviewCreate(BaseModel):
    user_id: UUID
    movie_id: UUID
    rating: float = Field(..., ge=0.5, le=5, multiple_of=0.5)
    review_text: str = ""


class WatchlistAdd(BaseModel):
    movie_id: UUID


class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=200)


class LoginRequest(BaseModel):
    identifier: str = Field(..., min_length=1, description="Username or email")
    password: str = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Helpers (example comment)
# ---------------------------------------------------------------------------

def _public_user(row) -> dict:
    return {
        "user_id": str(row["user_id"]),
        "username": row["username"],
        "email": row["email"],
    }


# ---------------------------------------------------------------------------
# Debounced cache refresh (example comment)
# ---------------------------------------------------------------------------
_refresh_lock = threading.Lock()
_refresh_scheduled_at: float = 0.0
_REFRESH_DEBOUNCE_SECONDS = 2.0


def _debounced_refresh_top10_cache() -> None:
    """Wait a short time before refreshing so that rapid review submissions
    coalesce into a single DB round-trip instead of many overlapping ones."""
    global _refresh_scheduled_at
    with _refresh_lock:
        _refresh_scheduled_at = time.monotonic()
        my_time = _refresh_scheduled_at

    time.sleep(_REFRESH_DEBOUNCE_SECONDS)

    with _refresh_lock:
        # If another task was scheduled after us, let it handle the refresh. (example comment)
        if _refresh_scheduled_at != my_time:
            return

    data = [dict(row) for row in models.get_top10_movies()]
    cache.set_top10_in_cache(data)


# ---------------------------------------------------------------------------
# Routers (example comment)
# ---------------------------------------------------------------------------
movies_router = APIRouter(prefix="/api/movies", tags=["Movies"])
reviews_router = APIRouter(prefix="/api/reviews", tags=["Reviews"])
auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])
watchlist_router = APIRouter(prefix="/api/users", tags=["Watchlist"])
users_router = APIRouter(prefix="/api/users", tags=["Users"])


# ---------------------------------------------------------------------------
# Auth (example comment)
# ---------------------------------------------------------------------------

@auth_router.post("/signup", status_code=201)
def signup(payload: SignupRequest):
    pw_hash = bcrypt.hashpw(payload.password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")
    try:
        user = models.create_user_with_password(payload.username, payload.email, pw_hash)
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Username or email already in use")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return _public_user(user)


@auth_router.post("/login")
def login(payload: LoginRequest):
    user = models.get_user_for_login(payload.identifier)
    if user is None or not bcrypt.checkpw(payload.password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")
    return _public_user(user)


# ---------------------------------------------------------------------------
# Users (example comment)
# ---------------------------------------------------------------------------

@users_router.get("")
def list_users():
    """Return every registered user (public fields only)."""
    rows = models.get_all_users()
    return [_public_user(row) for row in rows]


# ---------------------------------------------------------------------------
# Movies (example comment)
# ---------------------------------------------------------------------------

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


@movies_router.get("/{movie_id}")
def get_movie(movie_id: str):
    movie_id = _validated_uuid(movie_id, "movie_id")
    movie = models.get_movie_by_id(movie_id)
    if movie is None:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie


@movies_router.get("/{movie_id}/reviews")
def get_movie_reviews(movie_id: str):
    movie_id = _validated_uuid(movie_id, "movie_id")
    return models.get_reviews_for_movie(movie_id)


# ---------------------------------------------------------------------------
# Watchlist (example comment)
# ---------------------------------------------------------------------------

@watchlist_router.get("/{user_id}/watchlist")
def list_watchlist(user_id: str):
    user_id = _validated_uuid(user_id, "user_id")
    return models.get_user_watchlist(user_id)


@watchlist_router.get("/{user_id}/watchlist/{movie_id}")
def check_watchlist(user_id: str, movie_id: str):
    user_id = _validated_uuid(user_id, "user_id")
    movie_id = _validated_uuid(movie_id, "movie_id")
    return {"in_watchlist": models.is_in_watchlist(user_id, movie_id)}


@watchlist_router.post("/{user_id}/watchlist", status_code=201)
def add_watchlist(user_id: str, payload: WatchlistAdd):
    user_id = _validated_uuid(user_id, "user_id")
    try:
        models.add_to_watchlist(user_id, str(payload.movie_id))
    except psycopg2.errors.ForeignKeyViolation:
        raise HTTPException(status_code=404, detail="User or movie not found")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"in_watchlist": True}


@watchlist_router.delete("/{user_id}/watchlist/{movie_id}", status_code=200)
def remove_watchlist(user_id: str, movie_id: str):
    user_id = _validated_uuid(user_id, "user_id")
    movie_id = _validated_uuid(movie_id, "movie_id")
    models.remove_from_watchlist(user_id, movie_id)
    return {"in_watchlist": False}


# ---------------------------------------------------------------------------
# Reviews (example comment)
# ---------------------------------------------------------------------------

@reviews_router.post("", status_code=201)
def add_review(payload: ReviewCreate, background: BackgroundTasks):
    try:
        review = models.create_review(
            str(payload.user_id),
            str(payload.movie_id),
            payload.rating,
            payload.review_text,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    background.add_task(_debounced_refresh_top10_cache)
    return dict(review)
