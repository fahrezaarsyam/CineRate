import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function Watchlist() {
    const { user, openAuthModal } = useAuth();
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [removing, setRemoving] = useState(null);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        const fetchWatchlist = async () => {
            try {
                const data = await api.get(`/users/${user.user_id}/watchlist`);
                setMovies(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWatchlist();
    }, [user]);

    const handleRemove = async (movieId) => {
        setRemoving(movieId);
        try {
            await api.delete(`/users/${user.user_id}/watchlist/${movieId}`);
            setMovies(prev => prev.filter(m => m.movie_id !== movieId));
        } catch (err) {
            console.error(err);
        } finally {
            setRemoving(null);
        }
    };

    return (
        <main>
            <section id="watchlist-section">
                <h2>Your Watchlist</h2>

                {!user ? (
                    <p className="auth-gate watchlist-gate">
                        <button type="button" className="auth-inline" onClick={() => openAuthModal('login')}>Log in</button>
                        {' '}or{' '}
                        <button type="button" className="auth-inline" onClick={() => openAuthModal('signup')}>sign up</button>
                        {' '}to start a watchlist.
                    </p>
                ) : isLoading ? (
                    <p className="placeholder">Loading watchlist…</p>
                ) : movies.length === 0 ? (
                    <p className="placeholder">Your watchlist is empty. Browse the <Link to="/">catalog</Link> and add a movie.</p>
                ) : (
                    <ul id="watchlist-list">
                        {movies.map(movie => (
                            <li key={movie.movie_id}>
                                <Link to={`/film.html?id=${movie.movie_id}`} className="catalog-link">
                                    <div className="poster">
                                        {movie.poster_url
                                            ? <img src={movie.poster_url} alt={movie.title} loading="lazy" />
                                            : <div className="poster-fallback">{movie.title}</div>
                                        }
                                    </div>
                                    <div className="info">
                                        <span className="title">{movie.title}</span>
                                        <span className="year">{movie.release_year}</span>
                                        {movie.genres && movie.genres.length > 0 && (
                                            <div className="genre-list">
                                                {movie.genres.map(g => (
                                                    <span key={g} className="genre-pill">{g}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                <button
                                    type="button"
                                    className="watchlist-remove"
                                    disabled={removing === movie.movie_id}
                                    onClick={() => handleRemove(movie.movie_id)}
                                >
                                    {removing === movie.movie_id ? '…' : 'Remove'}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}

export default Watchlist;
