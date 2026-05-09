import os
import logging
from contextlib import contextmanager
from psycopg2 import pool
from psycopg2.extras import RealDictCursor

logger = logging.getLogger("cinerate.models")

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "5435")
DB_NAME = os.getenv("DB_NAME", "cinerate_db")
DB_USER = os.getenv("DB_USER", "cinerate_user")
DB_PASS = os.getenv("DB_PASS", "cinerate_pass")

_db_pool = None

def init_db_pool(minconn=1, maxconn=10):
    global _db_pool
    _db_pool = pool.SimpleConnectionPool(
        minconn, maxconn,
        host=DB_HOST, port=DB_PORT,
        dbname=DB_NAME, user=DB_USER, password=DB_PASS,
    )

def close_db_pool():
    global _db_pool
    if _db_pool:
        _db_pool.closeall()
        _db_pool = None

@contextmanager
def get_db_cursor():
    conn = _db_pool.getconn()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        _db_pool.putconn(conn)

# User Queries
def get_all_users():
    with get_db_cursor() as cur:
        cur.execute("SELECT id AS user_id, username, email, created_at FROM users ORDER BY created_at")
        return cur.fetchall()

def get_user_by_id(user_id):
    with get_db_cursor() as cur:
        cur.execute("SELECT id AS user_id, username, email, created_at FROM users WHERE id = %s", (user_id,))
        return cur.fetchone()

def create_user(username, email, password):
    with get_db_cursor() as cur:
        # Note: In a real app we would hash the password.
        cur.execute(
            "INSERT INTO users (username, email) VALUES (%s, %s) RETURNING id AS user_id, username, email, created_at",
            (username, email),
        )
        return cur.fetchone()

# Movie Queries
def get_all_movies():
    with get_db_cursor() as cur:
        cur.execute("SELECT id AS movie_id, title, synopsis, director, release_year FROM movies ORDER BY title")
        return cur.fetchall()

def get_movie_by_id(movie_id):
    with get_db_cursor() as cur:
        cur.execute("""
            SELECT m.id AS movie_id, m.title, m.synopsis, m.director, m.release_year,
                   COALESCE(ROUND(AVG(r.rating),1),0) AS avg_rating, COUNT(r.id) AS review_count
            FROM movies m LEFT JOIN reviews r ON m.id = r.movie_id
            WHERE m.id = %s GROUP BY m.id
        """, (movie_id,))
        return cur.fetchone()

def get_top10_movies():
    with get_db_cursor() as cur:
        cur.execute("""
            SELECT m.id AS movie_id, m.title, m.synopsis, m.director, m.release_year,
                   COALESCE(ROUND(AVG(r.rating),1),0) AS avg_rating, COUNT(r.id) AS review_count
            FROM movies m LEFT JOIN reviews r ON m.id = r.movie_id
            GROUP BY m.id HAVING COUNT(r.id) > 0
            ORDER BY avg_rating DESC, review_count DESC LIMIT 10
        """)
        return cur.fetchall()

# Review Queries
def get_reviews_for_movie(movie_id):
    with get_db_cursor() as cur:
        cur.execute("""
            SELECT r.id AS review_id, r.rating, r.review_text, r.created_at, u.id AS user_id, u.username
            FROM reviews r JOIN users u ON r.user_id = u.id
            WHERE r.movie_id = %s ORDER BY r.created_at DESC
        """, (movie_id,))
        return cur.fetchall()

def create_review(user_id, movie_id, rating, review_text):
    with get_db_cursor() as cur:
        cur.execute(
            "INSERT INTO reviews (user_id, movie_id, rating, review_text) VALUES (%s, %s, %s, %s) RETURNING id AS review_id, user_id, movie_id, rating, review_text, created_at",
            (user_id, movie_id, rating, review_text),
        )
        return cur.fetchone()
