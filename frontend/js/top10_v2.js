function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
}

function movieHref(movie) {
    return `film.html?id=${encodeURIComponent(movie.movie_id)}`;
}

function buildPoster(movie, className) {
    const wrap = el("div", className);
    if (movie.poster_url) {
        const img = document.createElement("img");
        img.src = movie.poster_url;
        img.alt = movie.title;
        img.loading = "lazy";
        img.addEventListener("error", () => {
            wrap.removeChild(img);
            wrap.appendChild(el("div", "poster-fallback", movie.title));
        });
        wrap.appendChild(img);
    } else {
        wrap.appendChild(el("div", "poster-fallback", movie.title));
    }
    return wrap;
}

function buildStars(rating) {
    const wrap = el("span", "stars");
    wrap.style.setProperty("--rating", rating);
    wrap.appendChild(el("span", "stars-fill"));
    return wrap;
}

function pickFeaturedReview(reviews) {
    if (!reviews || !reviews.length) return null;
    const withText = reviews.filter((r) => r.review_text && r.review_text.trim().length);
    if (!withText.length) return null;
    // pick highest rating, break ties by recency (example comment)
    withText.sort((a, b) => {
        const diff = Number(b.rating) - Number(a.rating);
        if (diff !== 0) return diff;
        return new Date(b.created_at) - new Date(a.created_at);
    });
    return withText[0];
}

async function fetchReviews(movieId) {
    try {
        const res = await fetch(`${API_BASE}/movies/${encodeURIComponent(movieId)}/reviews`);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

function buildQuote(review) {
    if (!review) return null;
    const fig = document.createElement("figure");
    fig.className = "top10-quote";

    const q = document.createElement("blockquote");
    q.className = "top10-quote-text";
    q.textContent = `“${review.review_text}”`;
    fig.appendChild(q);

    const cap = document.createElement("figcaption");
    cap.className = "top10-quote-attr";
    cap.textContent = `— @${review.username}`;
    fig.appendChild(cap);

    return fig;
}

function buildHero(movie, featuredReview) {
    const hero = document.getElementById("top10-hero");
    hero.innerHTML = "";
    hero.hidden = false;

    const link = document.createElement("a");
    link.href = movieHref(movie);
    link.className = "top10-hero-inner";

    const rankCol = el("div", "top10-hero-rank");
    rankCol.appendChild(el("span", "top10-rank-eyebrow", "Number"));
    rankCol.appendChild(el("span", "top10-rank-numeral", "1"));
    rankCol.appendChild(el("span", "top10-rank-suffix", "of CineRate"));
    link.appendChild(rankCol);

    link.appendChild(buildPoster(movie, "top10-hero-poster"));

    const info = el("div", "top10-hero-info");
    info.appendChild(el("p", "top10-hero-eyebrow", "Currently #1"));
    info.appendChild(el("h3", "top10-hero-title", movie.title));
    info.appendChild(el("p", "top10-hero-meta", `${movie.director} · ${movie.release_year}`));

    const rating = Number(movie.avg_rating || 0);
    const count = Number(movie.review_count || 0);
    const ratingRow = el("div", "top10-hero-rating");
    ratingRow.appendChild(buildStars(rating));
    ratingRow.appendChild(el("span", "top10-hero-rating-value", rating.toFixed(1)));
    ratingRow.appendChild(el("span", "top10-hero-rating-count", `· ${count} ${count === 1 ? "rating" : "ratings"}`));
    info.appendChild(ratingRow);

    const quote = buildQuote(featuredReview);
    if (quote) info.appendChild(quote);

    link.appendChild(info);
    hero.appendChild(link);
}

function buildRow(movie, rank, featuredReview) {
    const li = document.createElement("li");
    li.className = "top10-row";
    if (rank <= 3) li.classList.add(`top10-row-medal-${rank}`);

    const link = document.createElement("a");
    link.href = movieHref(movie);
    link.className = "top10-row-inner";

    link.appendChild(el("span", "top10-row-rank", String(rank)));
    link.appendChild(buildPoster(movie, "top10-row-poster"));

    const info = el("div", "top10-row-info");
    info.appendChild(el("h3", "top10-row-title", movie.title));
    info.appendChild(el("p", "top10-row-meta", `${movie.director} · ${movie.release_year}`));
    const quote = buildQuote(featuredReview);
    if (quote) info.appendChild(quote);
    link.appendChild(info);

    const rating = Number(movie.avg_rating || 0);
    const count = Number(movie.review_count || 0);
    const ratingCol = el("div", "top10-row-rating");
    ratingCol.appendChild(buildStars(rating));
    ratingCol.appendChild(el("span", "top10-row-rating-value", rating.toFixed(1)));
    ratingCol.appendChild(el("span", "top10-row-rating-count", `${count} ${count === 1 ? "rating" : "ratings"}`));
    link.appendChild(ratingCol);

    li.appendChild(link);
    return li;
}

async function loadTop10() {
    const status = document.getElementById("top10-status");
    const hero = document.getElementById("top10-hero");
    const rest = document.getElementById("top10-rest");

    try {
        const res = await fetch(`${API_BASE}/movies/top10`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const movies = payload.data || [];

        if (!movies.length) {
            status.textContent = "No rated films yet. Be the first.";
            return;
        }

        const reviewBatches = await Promise.all(
            movies.map((m) => fetchReviews(m.movie_id)),
        );
        const featured = reviewBatches.map(pickFeaturedReview);

        status.hidden = true;

        buildHero(movies[0], featured[0]);

        rest.innerHTML = "";
        rest.hidden = false;
        for (let i = 1; i < movies.length; i++) {
            rest.appendChild(buildRow(movies[i], i + 1, featured[i]));
        }
    } catch (err) {
        console.error("Top 10 load failed:", err);
        status.textContent = "Failed to load Top 10.";
        hero.hidden = true;
        rest.hidden = true;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initAuth();
    loadTop10();
});
