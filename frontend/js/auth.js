const API_BASE = "http://localhost:8000/api";
const AUTH_STORAGE_KEY = "cinerate.auth";

function loadAuth() {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveAuth(user) {
    if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent("cinerate:auth", { detail: user }));
}

function applyAuthState(user) {
    document.querySelectorAll("[data-auth-anon]").forEach((node) => {
        node.hidden = !!user;
    });
    document.querySelectorAll("[data-auth-user]").forEach((node) => {
        node.hidden = !user;
    });
    document.querySelectorAll("[data-auth-username]").forEach((node) => {
        node.textContent = user ? user.username : "";
    });
}

function setAuthModalStatus(form, message, kind) {
    const status = form.querySelector("[data-status]");
    if (!status) return;
    status.textContent = message || "";
    status.className = "form-status" + (kind ? " " + kind : "");
}

function openAuthModal(tab) {
    const modal = document.getElementById("auth-modal");
    if (!modal) return;
    modal.hidden = false;
    selectAuthTab(tab || "login");
}

function closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (!modal) return;
    modal.hidden = true;
    ["login-form", "signup-form"].forEach((id) => {
        const form = document.getElementById(id);
        if (form) {
            form.reset();
            setAuthModalStatus(form, "", null);
        }
    });
}

function selectAuthTab(tab) {
    document.querySelectorAll(".modal-tab").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === tab);
    });
    document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.tabPanel !== tab;
    });
}

function bindAuthUI() {
    document.querySelectorAll("[data-auth-open]").forEach((btn) => {
        btn.addEventListener("click", () => openAuthModal(btn.dataset.authOpen));
    });
    document.querySelectorAll("[data-auth-close]").forEach((btn) => {
        btn.addEventListener("click", closeAuthModal);
    });
    document.querySelectorAll(".modal-tab").forEach((btn) => {
        btn.addEventListener("click", () => selectAuthTab(btn.dataset.tab));
    });
    const backdrop = document.getElementById("auth-modal");
    if (backdrop) {
        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) closeAuthModal();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !backdrop.hidden) closeAuthModal();
        });
    }

    document.querySelectorAll("[data-auth-logout]").forEach((btn) => {
        btn.addEventListener("click", () => {
            saveAuth(null);
            applyAuthState(null);
        });
    });

    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const fd = new FormData(loginForm);
            const payload = {
                identifier: (fd.get("identifier") || "").trim(),
                password: fd.get("password") || "",
            };
            const button = loginForm.querySelector("button[type=submit]");
            button.disabled = true;
            setAuthModalStatus(loginForm, "", null);
            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.detail || `HTTP ${res.status}`);
                }
                const user = await res.json();
                saveAuth(user);
                applyAuthState(user);
                closeAuthModal();
            } catch (err) {
                setAuthModalStatus(loginForm, err.message, "error");
            } finally {
                button.disabled = false;
            }
        });
    }

    const signupForm = document.getElementById("signup-form");
    if (signupForm) {
        signupForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const fd = new FormData(signupForm);
            const payload = {
                username: (fd.get("username") || "").trim(),
                email: (fd.get("email") || "").trim(),
                password: fd.get("password") || "",
            };
            const button = signupForm.querySelector("button[type=submit]");
            button.disabled = true;
            setAuthModalStatus(signupForm, "", null);
            try {
                const res = await fetch(`${API_BASE}/auth/signup`, {
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
                const user = await res.json();
                saveAuth(user);
                applyAuthState(user);
                closeAuthModal();
            } catch (err) {
                setAuthModalStatus(signupForm, err.message, "error");
            } finally {
                button.disabled = false;
            }
        });
    }
}

function initAuth() {
    applyAuthState(loadAuth());
    bindAuthUI();
}

function authModalMarkup() {
    return `
    <div class="modal-backdrop" id="auth-modal" hidden>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <button type="button" class="modal-close" data-auth-close aria-label="Close">&times;</button>
            <div class="modal-tabs" id="auth-modal-title">
                <button type="button" class="modal-tab" data-tab="login">Log in</button>
                <button type="button" class="modal-tab" data-tab="signup">Sign up</button>
            </div>
            <form id="login-form" class="auth-form" data-tab-panel="login" novalidate>
                <div class="field">
                    <label for="login-identifier">Username or email</label>
                    <input type="text" id="login-identifier" name="identifier" autocomplete="username" required>
                </div>
                <div class="field">
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" name="password" autocomplete="current-password" required>
                </div>
                <button type="submit">Log in</button>
                <p class="form-status" data-status role="status" aria-live="polite"></p>
            </form>
            <form id="signup-form" class="auth-form" data-tab-panel="signup" novalidate hidden>
                <div class="field">
                    <label for="signup-username">Username</label>
                    <input type="text" id="signup-username" name="username" minlength="3" maxlength="50" autocomplete="username" required>
                </div>
                <div class="field">
                    <label for="signup-email">Email</label>
                    <input type="email" id="signup-email" name="email" autocomplete="email" required>
                </div>
                <div class="field">
                    <label for="signup-password">Password</label>
                    <input type="password" id="signup-password" name="password" minlength="6" autocomplete="new-password" required>
                </div>
                <button type="submit">Create account</button>
                <p class="form-status" data-status role="status" aria-live="polite"></p>
            </form>
        </div>
    </div>`;
}

function headerAuthWidgetMarkup() {
    return `
    <div class="auth-widget" id="auth-widget">
        <div class="auth-anon" data-auth-anon>
            <button type="button" class="auth-link" data-auth-open="login">Log in</button>
            <button type="button" class="auth-link auth-link-primary" data-auth-open="signup">Sign up</button>
        </div>
        <div class="auth-user" data-auth-user hidden>
            <a href="account.html" class="auth-username-link"><span class="auth-username">@<span data-auth-username></span></span></a>
            <button type="button" class="auth-link" data-auth-logout>Logout</button>
        </div>
    </div>`;
}
