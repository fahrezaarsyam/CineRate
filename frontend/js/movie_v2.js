function getMovieId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

function setStatus(message) {
    const node = document.getElementById("movie-status");
    if (!node) return;
    node.textContent = message || "";
    node.hidden = !message;
}

function setRateStatus(message, kind) {
    const node = document.getElementById("rate-status");
    if (!node) return;
    node.textContent = message || "";
    node.className = "form-status" + (kind ? " " + kind : "");
}

function renderMovie(movie) {
    document.getElementById("movie-status").hidden = true;
    document.getElementById("movie-detail").hidden = false;

    document.getElementById("movie-title").textContent = movie.title;
    document.getElementById("movie-meta").textContent = `${movie.director} · ${movie.release_year}`;
    document.getElementById("movie-synopsis").textContent = movie.synopsis || "";

    const posterEl = document.getElementById("movie-poster");
    posterEl.innerHTML = "";
    if (movie.poster_url) {
        const img = document.createElement("img");
        img.src = movie.poster_url;
        img.alt = movie.title;
        img.addEventListener("error", () => {
            posterEl.innerHTML = "";
            const fb = document.createElement("div");
            fb.className = "poster-fallback";
            fb.textContent = movie.title;
            posterEl.appendChild(fb);
        });
        posterEl.appendChild(img);
    } else {
        const fb = document.createElement("div");
        fb.className = "poster-fallback";
        fb.textContent = movie.title;
        posterEl.appendChild(fb);
    }

    const avg = Number(movie.avg_rating || 0);
    const count = Number(movie.review_count || 0);
    const stars = document.getElementById("movie-avg-stars");
    stars.style.setProperty("--rating", avg);
    document.getElementById("movie-avg-caption").textContent =
        count > 0
            ? `${avg.toFixed(1)} · ${count} ${count === 1 ? "rating" : "ratings"}`
            : "Not yet rated";
}

function buildRatingWidget() {
    const zones = document.getElementById("rating-hitzones");
    const fill = document.getElementById("rating-stars-fill");
    const hidden = document.getElementById("review-rating");
    const currentLabel = document.getElementById("rating-current");
    const clear = document.getElementById("rating-clear");

    zones.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const value = i / 2;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.value = String(value);
        btn.setAttribute("aria-label", `${value} star${value === 1 ? "" : "s"}`);
        zones.appendChild(btn);
    }

    function paint(value) {
        const pct = (value / 5) * 100;
        fill.style.width = `${pct}%`;
    }

    function display(value) {
        currentLabel.textContent = value
            ? `${value.toFixed(1)} stars`
            : "No rating";
    }

    function commit(value) {
        hidden.value = String(value);
        paint(value);
        display(value);
    }

    zones.querySelectorAll("button").forEach((btn) => {
        const v = Number(btn.dataset.value);
        btn.addEventListener("mouseenter", () => paint(v));
        btn.addEventListener("focus", () => paint(v));
        btn.addEventListener("click", () => commit(v));
    });

    zones.addEventListener("mouseleave", () => {
        paint(Number(hidden.value || 0));
    });

    clear.addEventListener("click", () => commit(0));

    paint(0);
    display(0);

    return {
        reset: () => commit(0),
        set: (v) => commit(Number(v) || 0),
    };
}

async function loadWatchlistState(userId, movieId) {
    const btn = document.getElementById("watchlist-btn");
    btn.hidden = false;
    try {
        const res = await fetch(
            `${API_BASE}/users/${encodeURIComponent(userId)}/watchlist/${encodeURIComponent(movieId)}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        applyWatchlistState(data.in_watchlist);
    } catch (err) {
        console.error("Watchlist state load failed:", err);
    }
}

function applyWatchlistState(inWatchlist) {
    const btn = document.getElementById("watchlist-btn");
    btn.classList.toggle("watchlist-btn-active", inWatchlist);
    btn.querySelector(".watchlist-label").textContent = inWatchlist
        ? "In Watchlist · Remove"
        : "Add to Watchlist";
    btn.dataset.in = inWatchlist ? "1" : "0";
}

function bindWatchlistToggle(movieId) {
    const btn = document.getElementById("watchlist-btn");
    btn.addEventListener("click", async () => {
        const auth = loadAuth();
        if (!auth) {
            openAuthModal("login");
            return;
        }
        const inList = btn.dataset.in === "1";
        btn.disabled = true;
        try {
            if (inList) {
                const res = await fetch(
                    `${API_BASE}/users/${encodeURIComponent(auth.user_id)}/watchlist/${encodeURIComponent(movieId)}`,
                    { method: "DELETE" },
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                applyWatchlistState(false);
            } else {
                const res = await fetch(
                    `${API_BASE}/users/${encodeURIComponent(auth.user_id)}/watchlist`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ movie_id: movieId }),
                    },
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                applyWatchlistState(true);
            }
        } catch (err) {
            console.error("Watchlist toggle failed:", err);
        } finally {
            btn.disabled = false;
        }
    });
}

function bindRateForm(movieId, ratingWidget) {
    const form = document.getElementById("rate-form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const auth = loadAuth();
        if (!auth) {
            setRateStatus("Please log in to rate.", "error");
            return;
        }
        const ratingValue = Number(document.getElementById("review-rating").value);
        if (!ratingValue || ratingValue < 0.5 || ratingValue > 5) {
            setRateStatus("Pick a rating (0.5 to 5).", "error");
            return;
        }
        const payload = {
            user_id: auth.user_id,
            movie_id: movieId,
            rating: ratingValue,
            review_text: (document.getElementById("review-text").value || "").trim(),
        };
        const button = form.querySelector("button[type=submit]");
        const original = button.textContent;
        button.disabled = true;
        button.textContent = "Submitting…";
        setRateStatus("", null);
        try {
            const res = await fetch(`${API_BASE}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                const detail = Array.isArray(err.detail)
                    ? err.detail.map((d) => d.msg).join("; ")
                    : err.detail;
                throw new Error(detail || `HTTP ${res.status}`);
            }
            setRateStatus("Rating saved.", "success");
            await loadMovie(movieId, { keepRating: true });
            await loadReviews(movieId);
        } catch (err) {
            setRateStatus(`Could not submit: ${err.message}`, "error");
        } finally {
            button.disabled = false;
            button.textContent = original;
        }
    });
}

function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function buildReviewItem(review, currentUserId) {
    const li = document.createElement("li");
    li.className = "review-item";
    if (currentUserId && String(review.user_id) === String(currentUserId)) {
        li.classList.add("review-item-self");
    }

    const head = document.createElement("div");
    head.className = "review-head";

    const who = document.createElement("span");
    who.className = "review-user";
    who.textContent = `@${review.username}`;
    head.appendChild(who);

    const rating = Number(review.rating || 0);
    const stars = document.createElement("span");
    stars.className = "stars review-stars";
    stars.style.setProperty("--rating", rating);
    const fill = document.createElement("span");
    fill.className = "stars-fill";
    stars.appendChild(fill);
    head.appendChild(stars);

    const value = document.createElement("span");
    value.className = "review-rating";
    value.textContent = rating.toFixed(1);
    head.appendChild(value);

    const date = document.createElement("span");
    date.className = "review-date";
    date.textContent = formatDate(review.created_at);
    head.appendChild(date);

    li.appendChild(head);

    if (review.review_text) {
        const text = document.createElement("p");
        text.className = "review-text";
        text.textContent = review.review_text;
        li.appendChild(text);
    }
    return li;
}

async function loadReviews(movieId) {
    const list = document.getElementById("reviews-list");
    if (!list) return;
    list.innerHTML = "";
    const placeholder = document.createElement("li");
    placeholder.className = "placeholder";
    placeholder.textContent = "Loading reviews…";
    list.appendChild(placeholder);
    try {
        const res = await fetch(`${API_BASE}/movies/${encodeURIComponent(movieId)}/reviews`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reviews = await res.json();
        list.innerHTML = "";
        if (!reviews.length) {
            const empty = document.createElement("li");
            empty.className = "placeholder";
            empty.textContent = "No reviews yet — be the first.";
            list.appendChild(empty);
            return;
        }
        const auth = loadAuth();
        const currentUserId = auth ? auth.user_id : null;
        for (const r of reviews) list.appendChild(buildReviewItem(r, currentUserId));
    } catch (err) {
        console.error("Reviews load failed:", err);
        list.innerHTML = "";
        const failed = document.createElement("li");
        failed.className = "placeholder";
        failed.textContent = "Failed to load reviews.";
        list.appendChild(failed);
    }
}

async function loadMovie(movieId, opts = {}) {
    try {
        const res = await fetch(`${API_BASE}/movies/${encodeURIComponent(movieId)}`);
        if (!res.ok) {
            if (res.status === 404) {
                setStatus("Movie not found.");
                return null;
            }
            throw new Error(`HTTP ${res.status}`);
        }
        const movie = await res.json();
        renderMovie(movie);
        return movie;
    } catch (err) {
        console.error("Movie load failed:", err);
        setStatus("Failed to load movie.");
        return null;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    initAuth();
    const movieId = getMovieId();
    if (!movieId) {
        setStatus("No movie selected.");
        return;
    }
    const movie = await loadMovie(movieId);
    if (!movie) return;

    const ratingWidget = buildRatingWidget();
    bindRateForm(movieId, ratingWidget);
    bindWatchlistToggle(movieId);
    loadReviews(movieId);

    const auth = loadAuth();
    if (auth) loadWatchlistState(auth.user_id, movieId);

    window.addEventListener("cinerate:auth", (e) => {
        const user = e.detail;
        if (user) {
            loadWatchlistState(user.user_id, movieId);
        } else {
            applyWatchlistState(false);
            document.getElementById("watchlist-btn").hidden = true;
        }
    });
});
