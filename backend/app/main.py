import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models import init_db_pool, close_db_pool
from app.routes import movies_router, reviews_router, users_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger("cinerate")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up CineRate API...")
    init_db_pool()
    yield
    logger.info("Shutting down CineRate API...")
    close_db_pool()

app = FastAPI(
    title="CineRate API",
    description="Movie catalog, ratings and reviews",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(movies_router)
app.include_router(reviews_router)
app.include_router(users_router)

@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok"}
