import { Link } from 'react-router-dom';

function MovieCard({ movie }) {
    return (
        <li>
            <Link to={`/film.html?id=${encodeURIComponent(movie.movie_id)}`} className="catalog-link">
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
        </li>
    );
}

export default MovieCard;
