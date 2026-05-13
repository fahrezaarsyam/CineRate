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
    initSettings();
}

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_FIELDS = {
    username: "last_username_change_at",
    email: "last_email_change_at",
    password: "last_password_change_at",
};

function getCooldownRemainingMs(field) {
    const auth = loadAuth();
    if (!auth) return 0;
    const stamp = auth[COOLDOWN_FIELDS[field]];
    if (!stamp) return 0;
    const last = new Date(stamp).getTime();
    if (isNaN(last)) return 0;
    const remaining = COOLDOWN_MS - (Date.now() - last);
    return remaining > 0 ? remaining : 0;
}

function formatCooldown(ms) {
    const totalMinutes = Math.ceil(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function settingsModalMarkup() {
    return `
    <div class="modal-backdrop" id="settings-modal" hidden>
        <div class="modal modal-settings" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
            <button type="button" class="modal-close" data-settings-close aria-label="Close">&times;</button>
            <div class="modal-tabs" id="settings-modal-title">
                <button type="button" class="modal-tab" data-settings-tab="username">Username</button>
                <button type="button" class="modal-tab" data-settings-tab="email">Email</button>
                <button type="button" class="modal-tab" data-settings-tab="password">Password</button>
            </div>

            <div class="settings-current">
                <span class="settings-current-label">Username</span>
                <span class="settings-current-value" data-settings-cur-username></span>
                <span class="settings-current-label">Email</span>
                <span class="settings-current-value" data-settings-cur-email></span>
            </div>

            <form id="settings-username-form" class="auth-form" data-settings-panel="username" novalidate>
                <div class="field">
                    <label for="settings-new-username">New username</label>
                    <input type="text" id="settings-new-username" name="new_username" minlength="3" maxlength="50" autocomplete="username" required>
                </div>
                <div class="field">
                    <label for="settings-username-password">Current password</label>
                    <input type="password" id="settings-username-password" name="password" autocomplete="current-password" required>
                </div>
                <button type="submit">Change username</button>
                <p class="settings-cooldown" data-cooldown="username"></p>
                <p class="form-status" data-status role="status" aria-live="polite"></p>
            </form>

            <form id="settings-email-form" class="auth-form" data-settings-panel="email" novalidate hidden>
                <div class="field">
                    <label for="settings-new-email">New email address</label>
                    <input type="email" id="settings-new-email" name="new_email" autocomplete="email" required>
                </div>
                <div class="field">
                    <label for="settings-email-password">Current password</label>
                    <input type="password" id="settings-email-password" name="password" autocomplete="current-password" required>
                </div>
                <button type="submit">Change email</button>
                <p class="settings-cooldown" data-cooldown="email"></p>
                <p class="form-status" data-status role="status" aria-live="polite"></p>
            </form>

            <form id="settings-password-form" class="auth-form" data-settings-panel="password" novalidate hidden>
                <div class="field">
                    <label for="settings-current-password">Current password</label>
                    <input type="password" id="settings-current-password" name="current_password" autocomplete="current-password" required>
                </div>
                <div class="field">
                    <label for="settings-new-password">New password</label>
                    <input type="password" id="settings-new-password" name="new_password" minlength="6" autocomplete="new-password" required>
                </div>
                <div class="field">
                    <label for="settings-confirm-password">Confirm new password</label>
                    <input type="password" id="settings-confirm-password" name="confirm_password" minlength="6" autocomplete="new-password" required>
                </div>
                <button type="submit">Change password</button>
                <p class="settings-cooldown" data-cooldown="password"></p>
                <p class="form-status" data-status role="status" aria-live="polite"></p>
            </form>
        </div>
    </div>`;
}

function ensureSettingsModal() {
    if (document.getElementById("settings-modal")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = settingsModalMarkup();
    document.body.appendChild(wrap.firstElementChild);
}

function populateSettingsCurrent() {
    const auth = loadAuth();
    if (!auth) return;
    const u = document.querySelector("[data-settings-cur-username]");
    const e = document.querySelector("[data-settings-cur-email]");
    if (u) u.textContent = `@${auth.username}`;
    if (e) e.textContent = auth.email || "(none)";
}

function selectSettingsTab(tab) {
    document.querySelectorAll("[data-settings-tab]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.settingsTab === tab);
    });
    document.querySelectorAll("[data-settings-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.settingsPanel !== tab;
    });
}

function refreshAllCooldowns() {
    for (const field of Object.keys(COOLDOWN_FIELDS)) {
        refreshCooldown(field);
    }
}

function refreshCooldown(field) {
    const form = document.querySelector(`[data-settings-panel="${field}"]`);
    if (!form) return;
    const label = form.querySelector(`[data-cooldown="${field}"]`);
    const submit = form.querySelector("button[type=submit]");
    const remaining = getCooldownRemainingMs(field);
    if (remaining > 0) {
        label.textContent = `Available in ${formatCooldown(remaining)}`;
        label.classList.add("cooldown-active");
        submit.disabled = true;
    } else {
        label.textContent = "";
        label.classList.remove("cooldown-active");
        submit.disabled = false;
    }
}

let _cooldownTimer = null;

function startCooldownTimer() {
    if (_cooldownTimer) return;
    _cooldownTimer = setInterval(refreshAllCooldowns, 30000);
}

function openSettingsModal(tab) {
    ensureSettingsModal();
    populateSettingsCurrent();
    refreshAllCooldowns();
    startCooldownTimer();
    const modal = document.getElementById("settings-modal");
    if (!modal) return;
    modal.hidden = false;
    selectSettingsTab(tab || "username");
}

function closeSettingsModal() {
    const modal = document.getElementById("settings-modal");
    if (!modal) return;
    modal.hidden = true;
    ["settings-username-form", "settings-email-form", "settings-password-form"].forEach((id) => {
        const form = document.getElementById(id);
        if (form) {
            form.reset();
            setSettingsStatus(form, "", null);
        }
    });
}

function setSettingsStatus(form, message, kind) {
    const status = form.querySelector("[data-status]");
    if (!status) return;
    status.textContent = message || "";
    status.className = "form-status" + (kind ? " " + kind : "");
}

async function submitSettingsChange(field, form, payload, endpoint) {
    const button = form.querySelector("button[type=submit]");
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = "Submitting…";
    setSettingsStatus(form, "", null);
    try {
        const res = await fetch(endpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            const detail = Array.isArray(err.detail)
                ? err.detail.map((d) => d.msg).join("; ")
                : err.detail;
            if (res.status === 429) {
                const retryAfter = Number(res.headers.get("Retry-After")) || 0;
                if (retryAfter > 0) {
                    const auth = loadAuth();
                    if (auth) {
                        const stamp = new Date(Date.now() - (COOLDOWN_MS - retryAfter * 1000)).toISOString();
                        auth[COOLDOWN_FIELDS[field]] = stamp;
                        saveAuth(auth);
                    }
                }
                refreshCooldown(field);
            }
            throw new Error(detail || `HTTP ${res.status}`);
        }
        const updated = await res.json();
        saveAuth(updated);
        applyAuthState(updated);
        populateSettingsCurrent();
        refreshCooldown(field);
        form.reset();
        setSettingsStatus(form, `${field[0].toUpperCase() + field.slice(1)} updated.`, "success");
    } catch (err) {
        setSettingsStatus(form, err.message, "error");
    } finally {
        button.textContent = originalLabel;
        // refreshCooldown handles disabled state; only re-enable here if no cooldown
        if (getCooldownRemainingMs(field) === 0) button.disabled = false;
    }
}

function bindSettingsForms() {
    const usernameForm = document.getElementById("settings-username-form");
    if (usernameForm) {
        usernameForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const auth = loadAuth();
            if (!auth) return;
            const fd = new FormData(usernameForm);
            const payload = {
                new_username: (fd.get("new_username") || "").trim(),
                password: fd.get("password") || "",
            };
            await submitSettingsChange("username", usernameForm, payload,
                `${API_BASE}/users/${encodeURIComponent(auth.user_id)}/username`);
        });
    }

    const emailForm = document.getElementById("settings-email-form");
    if (emailForm) {
        emailForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const auth = loadAuth();
            if (!auth) return;
            const fd = new FormData(emailForm);
            const payload = {
                new_email: (fd.get("new_email") || "").trim(),
                password: fd.get("password") || "",
            };
            await submitSettingsChange("email", emailForm, payload,
                `${API_BASE}/users/${encodeURIComponent(auth.user_id)}/email`);
        });
    }

    const passwordForm = document.getElementById("settings-password-form");
    if (passwordForm) {
        passwordForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const auth = loadAuth();
            if (!auth) return;
            const fd = new FormData(passwordForm);
            const newPw = fd.get("new_password") || "";
            const confirmPw = fd.get("confirm_password") || "";
            if (newPw !== confirmPw) {
                setSettingsStatus(passwordForm, "New passwords do not match.", "error");
                return;
            }
            const payload = {
                current_password: fd.get("current_password") || "",
                new_password: newPw,
            };
            await submitSettingsChange("password", passwordForm, payload,
                `${API_BASE}/users/${encodeURIComponent(auth.user_id)}/password`);
        });
    }
}

function bindSettingsUI() {
    ensureSettingsModal();

    document.addEventListener("click", (e) => {
        const trigger = e.target.closest("[data-open-settings], .auth-username-link");
        if (!trigger) return;
        e.preventDefault();
        if (!loadAuth()) return;
        openSettingsModal();
    });

    document.addEventListener("click", (e) => {
        if (e.target.closest("[data-settings-close]")) closeSettingsModal();
    });

    const backdrop = document.getElementById("settings-modal");
    if (backdrop) {
        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) closeSettingsModal();
        });
    }

    document.addEventListener("keydown", (e) => {
        const modal = document.getElementById("settings-modal");
        if (e.key === "Escape" && modal && !modal.hidden) closeSettingsModal();
    });

    document.querySelectorAll("[data-settings-tab]").forEach((btn) => {
        btn.addEventListener("click", () => selectSettingsTab(btn.dataset.settingsTab));
    });
}

function initSettings() {
    ensureSettingsModal();
    bindSettingsForms();
    bindSettingsUI();
}
