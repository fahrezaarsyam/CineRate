import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

function ForYou() {
    const [allMovies, setAllMovies] = useState([]);
    const [allGenres, setAllGenres] = useState([]);
    const [activeGenre, setActiveGenre] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const MAX_PICKS = 3;
    const NUM_RECOMMENDATIONS = 3;

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const movies = await api.get('/movies');
                setAllMovies(movies);
                const genreSet = new Set();
                movies.forEach(m => (m.genres || []).forEach(g => genreSet.add(g)));
                setAllGenres([...genreSet].sort());
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMovies();
    }, []);

    const toggleSelection = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            if (next.size >= MAX_PICKS) return;
            next.add(id);
        }
        setSelectedIds(next);
    };

    const handleFindMovies = (e) => {
        e.preventDefault();
        if (selectedIds.size !== MAX_PICKS) return;

        const seeds = allMovies.filter(m => selectedIds.has(m.movie_id));
        const candidates = allMovies.filter(m => !selectedIds.has(m.movie_id));

        const N = allMovies.length;
        const df = {};
        allMovies.forEach(m => new Set(m.genres || []).forEach(g => { df[g] = (df[g] || 0) + 1; }));
        const idf = {};
        Object.keys(df).forEach(g => { idf[g] = Math.log((N + 1) / (df[g] + 1)) + 1; });

        const profile = {};
        seeds.forEach(seed => new Set(seed.genres || []).forEach(g => { profile[g] = (profile[g] || 0) + idf[g]; }));

        const scored = candidates.map(m => {
            let score = 0;
            new Set(m.genres || []).forEach(g => { if (profile[g]) score += profile[g]; });
            return { ...m, score };
        });

        scored.sort((a, b) => b.score - a.score);
        setRecommendations(scored.slice(0, NUM_RECOMMENDATIONS));
    };

    const visibleMovies = activeGenre
        ? allMovies.filter(m => (m.genres || []).includes(activeGenre))
        : allMovies;

    const selectedCount = selectedIds.size;

    return (
        <main>
            <div className="foryou-container">

                {/* Recommendations view */}
                {recommendations.length > 0 ? (
                    <div id="recommendations-container">
                        <h3>Your Magic Matches</h3>
                        <div className="recommendation-list" id="recommendation-list">
                            {recommendations.map(movie => (
                                <Link
                                    key={movie.movie_id}
                                    to={`/film.html?id=${movie.movie_id}`}
                                    className="recommendation-card"
                                >
                                    {movie.poster_url && (
                                        <img
                                            src={movie.poster_url}
                                            alt={movie.title}
                                            className="recommendation-poster"
                                        />
                                    )}
                                    <div className="recommendation-info">
                                        <h4 className="recommendation-title">
                                            {movie.title} ({movie.release_year})
                                        </h4>
                                        <p className="recommendation-genres">
                                            {(movie.genres || []).join(', ')}
                                        </p>
                                        <p className="recommendation-synopsis">{movie.synopsis}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="glow-btn reset-btn"
                            id="reset-btn"
                            onClick={() => { setRecommendations([]); setSelectedIds(new Set()); }}
                        >
                            Start Over
                        </button>
                    </div>

                ) : (
                    /* Picker view */
                    <>
                        <div className="foryou-header">
                            <h2>Find Your Next Obsession</h2>
                            <p>Answer 3 quick questions to get personalized movie matches curated just for you.</p>
                        </div>

                        <form id="foryou-form" onSubmit={handleFindMovies}>
                            <div className="picker-header">
                                <h3 className="picker-title">Pick 3 movies you love</h3>
                                <p className="picker-counter">
                                    <span id="picker-count">{selectedCount}</span> of 3 selected
                                </p>
                            </div>

                            <div className="genre-filter" id="genre-filter">
                                <button
                                    type="button"
                                    className={`genre-pill${activeGenre === '' ? ' active' : ''}`}
                                    onClick={() => setActiveGenre('')}
                                >
                                    All
                                </button>
                                {allGenres.map(g => (
                                    <button
                                        key={g}
                                        type="button"
                                        className={`genre-pill${activeGenre === g ? ' active' : ''}`}
                                        onClick={() => setActiveGenre(g)}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>

                            <div className="movie-picker-grid" id="movie-picker-grid">
                                {isLoading ? (
                                    <p className="picker-empty">Loading movies…</p>
                                ) : visibleMovies.length === 0 ? (
                                    <p className="picker-empty">No movies in this genre.</p>
                                ) : visibleMovies.map(m => (
                                    <button
                                        key={m.movie_id}
                                        type="button"
                                        className={`picker-card${selectedIds.has(m.movie_id) ? ' selected' : ''}`}
                                        onClick={() => toggleSelection(m.movie_id)}
                                    >
                                        <img src={m.poster_url} alt={m.title} loading="lazy" />
                                        <div className="picker-card-title">
                                            {m.title} ({m.release_year})
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                type="submit"
                                className="glow-btn"
                                id="submit-btn"
                                disabled={selectedCount !== MAX_PICKS}
                            >
                                Find My Movies
                            </button>
                        </form>
                    </>
                )}

            </div>
        </main>
    );
}

export default ForYou;
