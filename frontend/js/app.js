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
    return `movie.html?id=${encodeURIComponent(movie.movie_id)}`;
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
    link.appendChild(info);

    li.appendChild(link);
    return li;
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

document.addEventListener("DOMContentLoaded", () => {
    initAuth();
    loadCatalog();
});
