import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

function Stars({ rating }) {
    return (
        <span className="stars" style={{ '--rating': Number(rating) || 0 }}>
            <span className="stars-fill"></span>
        </span>
    );
}

function Top10() {
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTop10 = async () => {
            try {
                const res = await api.get('/movies/top10');
                setMovies(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error(err);
                setError('Failed to load Top 10.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTop10();
    }, []);

    const statusMsg = isLoading
        ? 'Loading the leaderboard…'
        : error
            ? error
            : movies.length === 0
                ? 'No rated films yet. Be the first.'
                : null;

    return (
        <main className="top10-main">
            <section className="top10-intro">
                <p className="top10-eyebrow">Highest rated · Most reviewed</p>
                <h2 className="top10-title">The Top 10</h2>
                <p className="top10-sub">The ten films CineRate users can't stop talking about.</p>
            </section>

            {statusMsg && (
                <div id="top10-status" className="movie-status">{statusMsg}</div>
            )}

            {!statusMsg && movies.length > 0 && (
                <>
                    {/* #1 film */}
                    <article id="top10-hero" className="top10-hero">
                        <Link to={`/film.html?id=${movies[0].movie_id}`} className="top10-hero-inner">
                            {/* Rank column */}
                            <div className="top10-hero-rank">
                                <span className="top10-rank-eyebrow">Number</span>
                                <span className="top10-rank-numeral">1</span>
                                <span className="top10-rank-suffix">of CineRate</span>
                            </div>

                            {/* Poster */}
                            <div className="top10-hero-poster">
                                {movies[0].poster_url
                                    ? <img src={movies[0].poster_url} alt={movies[0].title} loading="lazy" onError={e => { e.target.replaceWith(Object.assign(document.createElement('div'), { className: 'poster-fallback', textContent: movies[0].title })); }} />
                                    : <div className="poster-fallback">{movies[0].title}</div>
                                }
                            </div>

                            {/* Info */}
                            <div className="top10-hero-info">
                                <p className="top10-hero-eyebrow">Currently #1</p>
                                <h3 className="top10-hero-title">{movies[0].title}</h3>
                                <p className="top10-hero-meta">{movies[0].director} · {movies[0].release_year}</p>

                                {movies[0].genres?.length > 0 && (
                                    <div className="genre-list">
                                        {movies[0].genres.map(g => <span key={g} className="genre-pill">{g}</span>)}
                                    </div>
                                )}

                                <div className="top10-hero-rating">
                                    <Stars rating={movies[0].avg_rating} />
                                    <span className="top10-hero-rating-value">
                                        {Number(movies[0].avg_rating || 0).toFixed(1)}
                                    </span>
                                    <span className="top10-hero-rating-count">
                                        · {movies[0].review_count} {movies[0].review_count === 1 ? 'rating' : 'ratings'}
                                    </span>
                                </div>

                                {movies[0].featured_review?.review_text && (
                                    <figure className="top10-quote">
                                        <blockquote className="top10-quote-text">
                                            "{movies[0].featured_review.review_text}"
                                        </blockquote>
                                        <figcaption className="top10-quote-attr">
                                            — @{movies[0].featured_review.username}
                                        </figcaption>
                                    </figure>
                                )}
                            </div>
                        </Link>
                    </article>

                    {/* Rows 2–10 */}
                    <ol id="top10-rest" className="top10-rest">
                        {movies.slice(1).map((m, idx) => {
                            const rank = idx + 2;
                            return (
                                <li key={m.movie_id} className={`top10-row${rank <= 3 ? ` top10-row-medal-${rank}` : ''}`}>
                                    <Link to={`/film.html?id=${m.movie_id}`} className="top10-row-inner">
                                        <span className="top10-row-rank">{rank}</span>

                                        <div className="top10-row-poster">
                                            {m.poster_url
                                                ? <img src={m.poster_url} alt={m.title} loading="lazy" />
                                                : <div className="poster-fallback">{m.title}</div>
                                            }
                                        </div>

                                        <div className="top10-row-info">
                                            <h3 className="top10-row-title">{m.title}</h3>
                                            <p className="top10-row-meta">{m.director} · {m.release_year}</p>
                                            {m.genres?.length > 0 && (
                                                <div className="genre-list">
                                                    {m.genres.map(g => <span key={g} className="genre-pill">{g}</span>)}
                                                </div>
                                            )}
                                            {m.featured_review?.review_text && (
                                                <figure className="top10-quote">
                                                    <blockquote className="top10-quote-text">
                                                        "{m.featured_review.review_text}"
                                                    </blockquote>
                                                    <figcaption className="top10-quote-attr">
                                                        — @{m.featured_review.username}
                                                    </figcaption>
                                                </figure>
                                            )}
                                        </div>

                                        <div className="top10-row-rating">
                                            <Stars rating={m.avg_rating} />
                                            <span className="top10-row-rating-value">
                                                {Number(m.avg_rating || 0).toFixed(1)}
                                            </span>
                                            <span className="top10-row-rating-count">
                                                {m.review_count} {m.review_count === 1 ? 'rating' : 'ratings'}
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ol>
                </>
            )}
        </main>
    );
}

export default Top10;
