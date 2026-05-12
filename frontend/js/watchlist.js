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

function buildWatchlistItem(movie, onRemove) {
    const li = document.createElement("li");

    const link = document.createElement("a");
    link.href = `movie.html?id=${encodeURIComponent(movie.movie_id)}`;
    link.className = "catalog-link";
    link.appendChild(buildPoster(movie, "poster"));

    const info = el("div", "info");
    info.appendChild(el("span", "title", movie.title));
    info.appendChild(el("span", "year", movie.release_year));
    link.appendChild(info);

    li.appendChild(link);

    const removeBtn = el("button", "watchlist-remove", "Remove");
    removeBtn.type = "button";
    removeBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeBtn.disabled = true;
        try {
            await onRemove(movie.movie_id);
            li.remove();
            if (!document.querySelectorAll("#watchlist-list li:not(.placeholder)").length) {
                const list = document.getElementById("watchlist-list");
                showPlaceholder(list, "Your watchlist is empty. Browse the catalog and add a movie.");
            }
        } catch {
            removeBtn.disabled = false;
        }
    });
    li.appendChild(removeBtn);

    return li;
}

async function loadWatchlist() {
    const auth = loadAuth();
    const list = document.getElementById("watchlist-list");
    if (!auth || !list) return;
    showPlaceholder(list, "Loading…");
    try {
        const res = await fetch(`${API_BASE}/users/${encodeURIComponent(auth.user_id)}/watchlist`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const movies = await res.json();
        if (!movies.length) {
            showPlaceholder(list, "Your watchlist is empty. Browse the catalog and add a movie.");
            return;
        }
        list.innerHTML = "";
        for (const movie of movies) {
            list.appendChild(buildWatchlistItem(movie, async (movieId) => {
                const r = await fetch(
                    `${API_BASE}/users/${encodeURIComponent(auth.user_id)}/watchlist/${encodeURIComponent(movieId)}`,
                    { method: "DELETE" },
                );
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
            }));
        }
    } catch (err) {
        console.error("Watchlist load failed:", err);
        showPlaceholder(list, "Failed to load watchlist.");
    }
}

window.addEventListener("cinerate:auth", () => {
    loadWatchlist();
});

document.addEventListener("DOMContentLoaded", () => {
    initAuth();
    loadWatchlist();
});
