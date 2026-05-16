import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Plus, Check } from 'lucide-react';

function Stars({ rating }) {
    return (
        <span className="stars" style={{ '--rating': Number(rating) || 0 }}>
            <span className="stars-fill"></span>
        </span>
    );
}

function MovieDetail() {
    const [searchParams] = useSearchParams();
    const movieId = searchParams.get('id');
    const { user, openAuthModal } = useAuth();

    const [movie, setMovie] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [rateStatus, setRateStatus] = useState('');
    const [rateStatusType, setRateStatusType] = useState('');
    const [error, setError] = useState(null);

    const fetchReviews = async (id) => {
        const data = await api.get(`/movies/${id}/reviews`);
        setReviews(data);
    };

    useEffect(() => {
        if (!movieId) return;
        const fetchData = async () => {
            try {
                const [movieData, reviewsData] = await Promise.all([
                    api.get(`/movies/${movieId}`),
                    api.get(`/movies/${movieId}/reviews`)
                ]);
                setMovie(movieData);
                setReviews(reviewsData);

                if (user) {
                    try {
                        const wl = await api.get(`/users/${user.user_id}/watchlist/${movieId}`);
                        setInWatchlist(wl.in_watchlist);
                    } catch (_) {}
                }
            } catch (err) {
                console.error(err);
                setError('Movie not found.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [movieId, user]);

    const toggleWatchlist = async () => {
        if (!user) return openAuthModal('login');
        try {
            if (inWatchlist) {
                await api.delete(`/users/${user.user_id}/watchlist/${movieId}`);
                setInWatchlist(false);
            } else {
                await api.post(`/users/${user.user_id}/watchlist`, { movie_id: movieId });
                setInWatchlist(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) return openAuthModal('login');
        if (!rating) {
            setRateStatus('Pick a rating (0.5 – 5)');
            setRateStatusType('error');
            return;
        }
        setSubmitting(true);
        setRateStatus('');
        try {
            await api.post('/reviews', {
                user_id: user.user_id,
                movie_id: movieId,
                rating,
                review_text: reviewText.trim()
            });
            setRateStatus('Rating saved!');
            setRateStatusType('success');
            setRating(0);
            setHoverRating(0);
            setReviewText('');
            await fetchReviews(movieId);
        } catch (err) {
            setRateStatus(err.message);
            setRateStatusType('error');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) return <main><p id="movie-status" className="movie-status">Loading…</p></main>;
    if (error || !movie) return <main><p id="movie-status" className="movie-status">{error || 'Movie not found.'}</p></main>;

    const avg = Number(movie.avg_rating || 0);
    const count = Number(movie.review_count || 0);
    const displayRating = hoverRating || rating;

    return (
        <main>
        <article id="movie-detail" className="movie-detail">
            {/* Left: Poster */}
            <div className="movie-poster" id="movie-poster">
                {movie.poster_url
                    ? <img src={movie.poster_url} alt={movie.title} />
                    : <div className="poster-fallback">{movie.title}</div>
                }
            </div>

            {/* Right: Info */}
            <div className="movie-info">
                <h2 className="movie-title" id="movie-title">{movie.title}</h2>
                <p className="movie-meta" id="movie-meta">{movie.director} · {movie.release_year}</p>

                <div id="movie-genres" className="genre-list">
                    {movie.genres?.map(g => <span key={g} className="genre-pill">{g}</span>)}
                </div>

                <div className="movie-rating-summary">
                    <span id="movie-avg-stars" className="stars" style={{ '--rating': avg }}>
                        <span className="stars-fill"></span>
                    </span>
                    <span className="rating-caption" id="movie-avg-caption">
                        {count > 0 ? `${avg.toFixed(1)} · ${count} ${count === 1 ? 'rating' : 'ratings'}` : 'Not yet rated'}
                    </span>
                </div>

                <p className="movie-synopsis" id="movie-synopsis">{movie.synopsis}</p>

                <div className="movie-actions">
                    {user ? (
                        <button
                            type="button"
                            id="watchlist-btn"
                            className={`watchlist-btn${inWatchlist ? ' watchlist-btn-active' : ''}`}
                            onClick={toggleWatchlist}
                        >
                            {inWatchlist
                                ? <><Check size={13} style={{ marginRight: '0.4rem' }} /><span className="watchlist-label">In Watchlist · Remove</span></>
                                : <><Plus size={13} style={{ marginRight: '0.4rem' }} /><span className="watchlist-label">Add to Watchlist</span></>
                            }
                        </button>
                    ) : (
                        <p className="auth-gate">
                            <button type="button" className="auth-inline" onClick={() => openAuthModal('login')}>Log in</button>
                            {' '}to rate or save this movie.
                        </p>
                    )}
                </div>

                {/* Reviews list */}
                <section id="reviews-section" className="reviews-section">
                    <h3>Reviews</h3>
                    <ul id="reviews-list" className="reviews-list">
                        {reviews.length === 0 ? (
                            <li style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', padding: '0.5rem 0' }}>
                                No reviews yet — be the first.
                            </li>
                        ) : reviews.map(r => (
                            <li key={r.review_id} className={`review-item${user && String(r.user_id) === String(user.user_id) ? ' review-item-self' : ''}`}>
                                <div className="review-head">
                                    <span className="review-user">@{r.username}</span>
                                    <span className="stars review-stars" style={{ '--rating': r.rating }}>
                                        <span className="stars-fill"></span>
                                    </span>
                                    <span className="review-rating">{Number(r.rating).toFixed(1)}</span>
                                    <span className="review-date">
                                        {new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                {r.review_text && <p className="review-text">{r.review_text}</p>}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Rate section — only shown when logged in */}
                {user && (
                    <section id="rate-section" className="rate-section">
                        <h3>Your rating</h3>
                        <form id="rate-form" noValidate onSubmit={handleReviewSubmit}>
                            <div className="field rating-field">
                                <div className="rating-input-half" id="rating-input">
                                    <div className="rating-stars-bg" aria-hidden="true">
                                        <span className="stars rating-stars-display">
                                            <span className="stars-fill" id="rating-stars-fill" style={{ width: `${(displayRating / 5) * 100}%` }}></span>
                                        </span>
                                    </div>
                                    <div className="rating-hitzones" id="rating-hitzones">
                                        {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                aria-label={`${val} stars`}
                                                onMouseEnter={() => setHoverRating(val)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setRating(val)}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="rating-controls">
                                    <span className="rating-current" id="rating-current">
                                        {rating ? `${rating.toFixed(1)} stars` : 'No rating'}
                                    </span>
                                    <button
                                        type="button"
                                        className="rating-clear"
                                        id="rating-clear"
                                        onClick={() => { setRating(0); setHoverRating(0); }}
                                    >
                                        Clear
                                    </button>
                                </div>
                                <input type="hidden" id="review-rating" name="rating" value={rating} readOnly />
                            </div>

                            <div className="field">
                                <label htmlFor="review-text">Review (optional)</label>
                                <textarea
                                    id="review-text"
                                    name="review_text"
                                    rows={4}
                                    placeholder="Optional"
                                    value={reviewText}
                                    onChange={e => setReviewText(e.target.value)}
                                />
                            </div>

                            <button type="submit" disabled={submitting}>
                                {submitting ? 'Submitting…' : 'Submit rating'}
                            </button>
                            <p id="rate-status" className={`form-status ${rateStatusType}`} role="status" aria-live="polite">
                                {rateStatus}
                            </p>
                        </form>
                    </section>
                )}
            </div>
        </article>
        </main>
    );
}

export default MovieDetail;
