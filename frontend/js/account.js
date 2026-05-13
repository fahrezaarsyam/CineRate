const API = "http://localhost:8000/api";

function setStatus(el, message, kind) {
    if (!el) return;
    el.textContent = message || "";
    el.className = "form-status" + (kind ? " " + kind : "");
}

function populateAccountInfo() {
    const auth = loadAuth();
    if (!auth) return;

    const usernameEl = document.getElementById("account-username");
    const emailEl = document.getElementById("account-email");

    if (usernameEl) usernameEl.textContent = auth.username;
    if (emailEl) emailEl.textContent = auth.email || "Not set";
}

function bindAccountForms() {
    // Update Email form
    const emailForm = document.getElementById("update-email-form");
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

            if (!payload.new_email) {
                setStatus(document.getElementById("email-status"), "Please enter a new email address.", "error");
                return;
            }

            const button = emailForm.querySelector("button[type=submit]");
            button.disabled = true;
            setStatus(document.getElementById("email-status"), "", null);

            try {
                const res = await fetch(`${API}/users/${auth.user_id}/email`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.detail || `HTTP ${res.status}`);
                }
                const updated = await res.json();
                // Update local auth storage
                auth.email = updated.email;
                saveAuth(auth);
                populateAccountInfo();
                emailForm.reset();
                setStatus(document.getElementById("email-status"), "Email updated successfully!", "success");
            } catch (err) {
                setStatus(document.getElementById("email-status"), err.message, "error");
            } finally {
                button.disabled = false;
            }
        });
    }

    // Change Password form
    const passwordForm = document.getElementById("change-password-form");
    if (passwordForm) {
        passwordForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const auth = loadAuth();
            if (!auth) return;

            const fd = new FormData(passwordForm);
            const payload = {
                current_password: fd.get("current_password") || "",
                new_password: fd.get("new_password") || "",
            };
            const confirmPassword = fd.get("confirm_password") || "";

            if (payload.new_password !== confirmPassword) {
                setStatus(document.getElementById("password-status"), "New passwords do not match.", "error");
                return;
            }

            if (payload.new_password.length < 6) {
                setStatus(document.getElementById("password-status"), "New password must be at least 6 characters.", "error");
                return;
            }

            const button = passwordForm.querySelector("button[type=submit]");
            button.disabled = true;
            setStatus(document.getElementById("password-status"), "", null);

            try {
                const res = await fetch(`${API}/users/${auth.user_id}/password`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.detail || `HTTP ${res.status}`);
                }
                passwordForm.reset();
                setStatus(document.getElementById("password-status"), "Password changed successfully!", "success");
            } catch (err) {
                setStatus(document.getElementById("password-status"), err.message, "error");
            } finally {
                button.disabled = false;
            }
        });
    }
}

function initAccount() {
    populateAccountInfo();
    bindAccountForms();

    // Re-populate when auth state changes (e.g. login/logout)
    window.addEventListener("cinerate:auth", () => {
        populateAccountInfo();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initAuth();
    initAccount();
});
