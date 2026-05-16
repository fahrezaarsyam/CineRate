const API_BASE = import.meta.env.VITE_API_URL || (
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:8000/api"
        : "https://cinerate-production-20a4.up.railway.app/api"
);

async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        throw new Error(error.detail || `HTTP ${res.status}`);
    }
    return res.json();
}

export const api = {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
    delete: (path) => request(path, { method: "DELETE" }),
    put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
};
