document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    const form = document.getElementById('foryou-form');
    const container = document.getElementById('recommendations-container');
    const listEl = document.getElementById('recommendation-list');
    const resetBtn = document.getElementById('reset-btn');
    const grid = document.getElementById('movie-picker-grid');
    const filterEl = document.getElementById('genre-filter');
    const counter = document.getElementById('picker-count');
    const submitBtn = document.getElementById('submit-btn');

    if (!form) return;

    const MAX_PICKS = 3;
    const NUM_RECOMMENDATIONS = 3;

    let allMovies = [];
    let allGenres = [];
    let activeGenre = null;
    const selectedIds = new Set();

    fetch('http://localhost:8000/api/movies')
        .then(r => {
            if (!r.ok) throw new Error('Network response was not ok');
            return r.json();
        })
        .then(movies => {
            allMovies = movies;
            const genreSet = new Set();
            allMovies.forEach(m => m.genres.forEach(g => genreSet.add(g)));
            allGenres = [...genreSet].sort();
            renderFilter();
            renderGrid();
        })
        .catch(err => {
            console.error('Failed to fetch movies', err);
            grid.innerHTML = '<p class="picker-empty">Could not load movies. Please make sure the backend is running.</p>';
        });

    function renderFilter() {
        const pills = [
            { value: '', label: 'All' },
            ...allGenres.map(g => ({ value: g, label: g })),
        ];
        filterEl.innerHTML = pills.map(p => `
            <button type="button" class="genre-pill${(activeGenre || '') === p.value ? ' active' : ''}" data-genre="${p.value}">${p.label}</button>
        `).join('');
        filterEl.querySelectorAll('.genre-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                activeGenre = btn.dataset.genre || null;
                renderFilter();
                renderGrid();
            });
        });
    }

    function renderGrid() {
        const visible = activeGenre
            ? allMovies.filter(m => m.genres.includes(activeGenre))
            : allMovies;

        if (visible.length === 0) {
            grid.innerHTML = '<p class="picker-empty">No movies match this genre.</p>';
            return;
        }

        grid.innerHTML = visible.map(m => `
            <button type="button" class="picker-card${selectedIds.has(m.movie_id) ? ' selected' : ''}" data-id="${m.movie_id}">
                <img src="${m.poster_url}" alt="${m.title}" loading="lazy">
                <div class="picker-card-title">${m.title} (${m.release_year})</div>
            </button>
        `).join('');

        grid.querySelectorAll('.picker-card').forEach(card => {
            card.addEventListener('click', () => toggleSelection(card));
        });
    }

    function toggleSelection(card) {
        const id = card.dataset.id;
        if (selectedIds.has(id)) {
            selectedIds.delete(id);
            card.classList.remove('selected');
        } else {
            if (selectedIds.size >= MAX_PICKS) return;
            selectedIds.add(id);
            card.classList.add('selected');
        }
        counter.textContent = selectedIds.size;
        submitBtn.disabled = selectedIds.size !== MAX_PICKS;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (selectedIds.size !== MAX_PICKS) return;

        const seeds = allMovies.filter(m => selectedIds.has(m.movie_id));
        const candidates = allMovies.filter(m => !selectedIds.has(m.movie_id));

        // IDF per genre: rare genres carry more signal than common ones.
        const N = allMovies.length;
        const df = {};
        allMovies.forEach(m => {
            new Set(m.genres).forEach(g => {
                df[g] = (df[g] || 0) + 1;
            });
        });
        const idf = {};
        Object.keys(df).forEach(g => {
            // +1 smoothing avoids idf=0 when a genre appears in every movie.
            idf[g] = Math.log((N + 1) / (df[g] + 1)) + 1;
        });

        // User profile: sum of idf weights across the 3 seed movies' genres.
        const profile = {};
        seeds.forEach(seed => {
            new Set(seed.genres).forEach(g => {
                profile[g] = (profile[g] || 0) + idf[g];
            });
        });

        // Candidate score: dot product of candidate genre vector with profile.
        const scored = candidates.map(m => {
            let score = 0;
            new Set(m.genres).forEach(g => {
                if (profile[g]) score += profile[g];
            });
            return { ...m, score };
        });

        scored.sort((a, b) => b.score - a.score);
        const top = scored.slice(0, NUM_RECOMMENDATIONS);

        listEl.innerHTML = top.map(movie => `
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
    });

    resetBtn.addEventListener('click', () => {
        selectedIds.clear();
        activeGenre = null;
        counter.textContent = '0';
        submitBtn.disabled = true;
        renderFilter();
        renderGrid();
        form.hidden = false;
        container.hidden = true;
    });
});
