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

function movieHref(movie) {
    return `film.html?id=${encodeURIComponent(movie.movie_id)}`;
}

function buildCatalogItem(movie) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = movieHref(movie);
    link.className = "catalog-link";

    link.appendChild(buildPoster(movie, "poster"));

    const info = el("div", "info");
    info.appendChild(el("span", "title", movie.title));
    info.appendChild(el("span", "year", movie.release_year));
    
    if (movie.genres && movie.genres.length > 0) {
        const genresList = el("div", "genre-list");
        movie.genres.forEach(g => {
            genresList.appendChild(el("span", "genre-pill", g));
        });
        info.appendChild(genresList);
    }
    
    link.appendChild(info);

    li.appendChild(link);
    return li;
}

let _allMovies = [];

function renderCatalog(movies) {
    const list = document.getElementById("catalog-list");
    const count = document.getElementById("catalog-search-count");
    list.innerHTML = "";
    if (!movies.length) {
        showPlaceholder(list, "No films match your search.");
    } else {
        for (const movie of movies) list.appendChild(buildCatalogItem(movie));
    }
    if (count) {
        count.textContent = `${movies.length} of ${_allMovies.length}`;
    }
}

function filterMovies(query) {
    const q = query.trim().toLowerCase();
    if (!q) return _allMovies;
    return _allMovies.filter((m) => {
        const title = (m.title || "").toLowerCase();
        const director = (m.director || "").toLowerCase();
        return title.includes(q) || director.includes(q);
    });
}

function bindCatalogSearch() {
    const input = document.getElementById("catalog-search-input");
    if (!input) return;
    input.addEventListener("input", () => {
        renderCatalog(filterMovies(input.value));
    });
}

async function loadCatalog() {
    const list = document.getElementById("catalog-list");
    showPlaceholder(list, "Loading…");
    try {
        const res = await fetch(`${API_BASE}/movies`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        _allMovies = await res.json();

        if (!_allMovies.length) {
            showPlaceholder(list, "Catalog is empty.");
            return;
        }

        const input = document.getElementById("catalog-search-input");
        renderCatalog(filterMovies(input ? input.value : ""));
    } catch (err) {
        console.error("Catalog load failed:", err);
        showPlaceholder(list, "Failed to load catalog.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initAuth();
    bindCatalogSearch();
    loadCatalog();
});
