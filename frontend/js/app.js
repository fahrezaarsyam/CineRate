const CineRate = (() => {
    const API_BASE = "http://localhost:8000/api";

    async function apiFetch(endpoint) {
        const res = await fetch(`${API_BASE}${endpoint}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }

    async function apiPost(endpoint, body) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `API error: ${res.status}`);
        }
        return res.json();
    }

    function createMovieCard(movie, rank = null) {
        const card = document.createElement("div");
        card.className = "movie-card";
        card.onclick = () => openMovieModal(movie.movie_id);

        const rankText = rank ? `<strong>#${rank}</strong><br>` : "";
        card.innerHTML = `
            ${rankText}
            <img src="${movie.poster_url || ''}" alt="${movie.title}" onerror="this.style.display='none'">
            <h3>${movie.title}</h3>
            <p>Rating: ${Number(movie.avg_rating || 0).toFixed(1)}/5</p>
            <p>${movie.release_year}</p>
        `;
        return card;
    }

    async function loadTop10() {
        const grid = document.getElementById("top10-grid");
        const badge = document.getElementById("cache-badge");
        grid.innerHTML = "<p>Loading...</p>";

        try {
            const result = await apiFetch("/movies/top10");
            const movies = result.data || result;
            badge.textContent = result.source || "database";

            grid.innerHTML = "";
            if (!movies.length) {
                grid.innerHTML = '<p>No rated movies yet.</p>';
                return;
            }
            movies.forEach((m, i) => grid.appendChild(createMovieCard(m, i + 1)));
        } catch (err) {
            console.error(err);
            grid.innerHTML = `<p>Error loading Top 10.</p>`;
        }
    }

    async function loadCatalog() {
        const grid = document.getElementById("catalog-grid");
        grid.innerHTML = "<p>Loading...</p>";

        try {
            const movies = await apiFetch("/movies");
            grid.innerHTML = "";
            if (!movies.length) {
                grid.innerHTML = '<p>No movies in catalog.</p>';
                return;
            }
            movies.forEach((m) => grid.appendChild(createMovieCard(m)));
        } catch (err) {
            console.error(err);
            grid.innerHTML = `<p>Error loading catalog.</p>`;
        }
    }

    async function openMovieModal(movieId) {
        const modal = document.getElementById("movie-modal");
        const body = document.getElementById("modal-body");
        
        body.innerHTML = "<p>Loading details...</p>";
        modal.classList.add("active");

        try {
            const [movie, reviews] = await Promise.all([
                apiFetch(`/movies/${movieId}`),
                apiFetch(`/reviews/movie/${movieId}`)
            ]);

            let reviewsHtml = reviews.length ? reviews.map(r => `
                <div class="review-item">
                    <strong>User @${r.username}</strong> - Rating: ${r.rating}/5
                    <p>${r.review_text || "No comment"}</p>
                    <small>${new Date(r.created_at).toLocaleDateString()}</small>
                </div>
            `).join("") : "<p>No reviews yet.</p>";

            body.innerHTML = `
                <h2>${movie.title}</h2>
                <p><strong>Rating:</strong> ${Number(movie.avg_rating || 0).toFixed(1)}/5 (${movie.review_count} reviews)</p>
                <p><strong>Director:</strong> ${movie.director}</p>
                <p><strong>Year:</strong> ${movie.release_year}</p>
                <p>${movie.synopsis}</p>
                
                <hr>
                <h3>Reviews</h3>
                <div id="review-list">${reviewsHtml}</div>

                <div class="review-form">
                    <h4>Add a Review</h4>
                    <label>User ID (UUID):</label>
                    <input type="text" id="review-user" value="11111111-1111-1111-1111-111111111111">
                    <label>Rating (1-5):</label>
                    <input type="number" id="review-rating" min="1" max="5" value="5">
                    <label>Review:</label>
                    <textarea id="review-text" rows="3"></textarea>
                    <button id="review-submit" data-movie="${movieId}">Submit</button>
                </div>
            `;

            document.getElementById("review-submit").addEventListener("click", handleReviewSubmit);
        } catch (err) {
            console.error(err);
            body.innerHTML = "<p>Error loading movie details.</p>";
        }
    }

    function closeModal() {
        document.getElementById("movie-modal").classList.remove("active");
    }

    async function handleReviewSubmit(e) {
        const btn = e.target;
        const movieId = btn.dataset.movie;
        const userId = document.getElementById("review-user").value.trim();
        const rating = Number(document.getElementById("review-rating").value);
        const reviewText = document.getElementById("review-text").value.trim();

        if (!userId || rating < 1 || rating > 5) {
            alert("Valid User ID and Rating (1-5) required.");
            return;
        }

        btn.disabled = true;
        btn.textContent = "Submitting...";

        try {
            await apiPost("/reviews", {
                user_id: userId,
                movie_id: movieId,
                rating: rating,
                review_text: reviewText
            });
            await openMovieModal(movieId);
            loadTop10();
        } catch (err) {
            alert("Error: " + err.message);
            btn.disabled = false;
            btn.textContent = "Submit";
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("modal-close").addEventListener("click", closeModal);
        loadTop10();
        loadCatalog();
    });

    return { loadTop10 };
})();
