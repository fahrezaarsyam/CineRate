const API_BASE = "http://localhost:8000/api";

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
}

function showPlaceholder(list, message) {
    list.innerHTML = "";
    list.appendChild(el("li", "placeholder", message));
}

function buildStars(rating) {
    const wrap = el("span", "stars");
    wrap.style.setProperty("--rating", rating);
    wrap.appendChild(el("span", "stars-fill"));
    return wrap;
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

function buildTop10Item(movie) {
    const li = document.createElement("li");

    li.appendChild(buildPoster(movie, "poster-thumb"));

    const titleBlock = document.createElement("div");
    titleBlock.appendChild(el("span", "title", movie.title));
    titleBlock.appendChild(el("span", "meta", `${movie.director} · ${movie.release_year}`));

    const rating = Number(movie.avg_rating || 0);
    const count = Number(movie.review_count || 0);
    const ratingBlock = el("div", "rating-block");
    ratingBlock.appendChild(buildStars(rating));
    ratingBlock.appendChild(el(
        "span",
        "rating-caption",
        `${rating.toFixed(1)} · ${count} ${count === 1 ? "rating" : "ratings"}`,
    ));

    li.appendChild(titleBlock);
    li.appendChild(ratingBlock);
    return li;
}

function buildCatalogItem(movie) {
    const li = document.createElement("li");

    li.appendChild(buildPoster(movie, "poster"));

    const info = el("div", "info");
    info.appendChild(el("span", "title", movie.title));
    info.appendChild(el("span", "year", movie.release_year));
    li.appendChild(info);

    li.addEventListener("click", () => {
        const input = document.getElementById("review-movie-id");
        input.value = movie.movie_id;
        input.focus();
        document.getElementById("review-section").scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    });

    return li;
}

async function loadTop10() {
    const list = document.getElementById("top10-list");
    showPlaceholder(list, "Loading…");
    try {
        const res = await fetch(`${API_BASE}/movies/top10`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const movies = payload.data || [];

        if (!movies.length) {
            showPlaceholder(list, "No rated films yet.");
            return;
        }

        list.innerHTML = "";
        for (const movie of movies) list.appendChild(buildTop10Item(movie));
    } catch (err) {
        console.error("Top 10 load failed:", err);
        showPlaceholder(list, "Failed to load Top 10.");
    }
}

async function loadCatalog() {
    const list = document.getElementById("catalog-list");
    showPlaceholder(list, "Loading…");
    try {
        const res = await fetch(`${API_BASE}/movies`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const movies = await res.json();

        if (!movies.length) {
            showPlaceholder(list, "Catalog is empty.");
            return;
        }

        list.innerHTML = "";
        for (const movie of movies) list.appendChild(buildCatalogItem(movie));
    } catch (err) {
        console.error("Catalog load failed:", err);
        showPlaceholder(list, "Failed to load catalog.");
    }
}

function setupRatingInput() {
    const container = document.getElementById("rating-input");
    const stars = container.querySelectorAll("button[data-value]");
    const clear = container.querySelector(".rating-clear");
    const hidden = document.getElementById("review-rating");

    function paint(value) {
        stars.forEach((btn) => {
            const v = Number(btn.dataset.value);
            btn.classList.toggle("filled", v <= value);
        });
    }

    stars.forEach((btn) => {
        btn.addEventListener("click", () => {
            hidden.value = btn.dataset.value;
            paint(Number(hidden.value));
        });
        btn.addEventListener("mouseenter", () => {
            paint(Number(btn.dataset.value));
        });
    });

    container.addEventListener("mouseleave", () => {
        paint(Number(hidden.value || 0));
    });

    clear.addEventListener("click", () => {
        hidden.value = "";
        paint(0);
    });

    return { reset: () => { hidden.value = ""; paint(0); } };
}

function setStatus(message, kind) {
    const status = document.getElementById("form-status");
    status.textContent = message;
    status.className = "form-status" + (kind ? " " + kind : "");
}

function bindReviewForm(rating) {
    const form = document.getElementById("review-form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const ratingValue = Number(formData.get("rating"));
        if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
            setStatus("Pick a rating from 1 to 5.", "error");
            return;
        }

        const payload = {
            user_id: (formData.get("user_id") || "").trim(),
            movie_id: (formData.get("movie_id") || "").trim(),
            rating: ratingValue,
            review_text: (formData.get("review_text") || "").trim(),
        };

        const button = form.querySelector("button[type=submit]");
        const originalLabel = button.textContent;
        button.disabled = true;
        button.textContent = "Submitting…";
        setStatus("", null);

        try {
            const res = await fetch(`${API_BASE}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || `HTTP ${res.status}`);
            }
            setStatus("Review submitted.", "success");
            form.reset();
            rating.reset();
            loadTop10();
        } catch (err) {
            setStatus(`Could not submit: ${err.message}`, "error");
        } finally {
            button.disabled = false;
            button.textContent = originalLabel;
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadTop10();
    loadCatalog();
    const rating = setupRatingInput();
    bindReviewForm(rating);
});
