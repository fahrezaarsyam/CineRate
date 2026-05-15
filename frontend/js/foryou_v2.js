document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    const form = document.getElementById('foryou-form');
    const container = document.getElementById('recommendations-container');
    const listEl = document.getElementById('recommendation-list');
    const resetBtn = document.getElementById('reset-btn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const q1 = document.querySelector('input[name="q1"]:checked')?.value;
        const q2 = document.querySelector('input[name="q2"]:checked')?.value;
        const q3 = document.querySelector('input[name="q3"]:checked')?.value;
        
        if (!q1 || !q2 || !q3) {
            alert('Please select an option for all 3 questions!');
            return;
        }
        
        const targetGenres = [q1, q2, q3];

        try {
            // Fetch all movies from backend
            const response = await fetch('http://localhost:8000/api/movies');
            if (!response.ok) throw new Error('Network response was not ok');
            const movies = await response.json();

            // Score movies based on genre matches
            const scoredMovies = movies.map(movie => {
                let score = 0;
                movie.genres.forEach(g => {
                    if (targetGenres.includes(g)) score++;
                });
                return { ...movie, score };
            });

            // Sort by score (descending) and shuffle randomly for ties
            scoredMovies.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return 0.5 - Math.random();
            });

            // Take top 3
            const top3 = scoredMovies.slice(0, 3);
            
            // Render recommendations
            listEl.innerHTML = top3.map(movie => `
                <a href="film.html?id=${movie.movie_id}" class="recommendation-card">
                    <img src="${movie.poster_url}" alt="${movie.title}" class="recommendation-poster" loading="lazy">
                    <div class="recommendation-info">
                        <h4 class="recommendation-title">${movie.title} (${movie.release_year})</h4>
                        <p class="recommendation-genres">${movie.genres.join(', ')}</p>
                        <p class="recommendation-synopsis">${movie.synopsis}</p>
                    </div>
                </a>
            `).join('');

            form.hidden = true;
            container.hidden = false;
            
        } catch (err) {
            console.error('Failed to fetch movies for recommendations', err);
            alert('Could not load recommendations. Please make sure the backend is running and try again.');
        }
    });

    resetBtn.addEventListener('click', () => {
        form.reset();
        form.hidden = false;
        container.hidden = true;
    });
});
