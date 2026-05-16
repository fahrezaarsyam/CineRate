import { useState, useEffect } from 'react';
import { api } from '../api/client';
import MovieCard from '../components/MovieCard';

function Home() {
    const [movies, setMovies] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const data = await api.get('/movies');
                setMovies(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMovies();
    }, []);

    const filteredMovies = movies.filter(m => {
        const q = searchQuery.toLowerCase();
        return m.title.toLowerCase().includes(q) || m.director.toLowerCase().includes(q);
    });

    return (
        <main>
            <section id="catalog-section">
                <h2>Catalog</h2>
                <p className="section-hint">Click a film to open its page.</p>
                <div className="catalog-search">
                    <input
                        type="search"
                        id="catalog-search-input"
                        placeholder="Search title or director…"
                        autoComplete="off"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="catalog-search-count" id="catalog-search-count">
                        {filteredMovies.length} of {movies.length}
                    </span>
                </div>

                <ul id="catalog-list">
                    {isLoading ? (
                        <li className="placeholder">Loading…</li>
                    ) : filteredMovies.length > 0 ? (
                        filteredMovies.map(movie => (
                            <MovieCard key={movie.movie_id} movie={movie} />
                        ))
                    ) : (
                        <li className="placeholder">No films match your search.</li>
                    )}
                </ul>
            </section>
        </main>
    );
}

export default Home;
