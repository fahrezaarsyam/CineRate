import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_FIELDS = {
    username: "last_username_change_at",
    email: "last_email_change_at",
    password: "last_password_change_at",
};

function SettingsModal() {
    const { 
        user, 
        login, 
        isSettingsModalOpen, 
        settingsModalTab, 
        closeSettingsModal, 
        setSettingsModalTab 
    } = useAuth();

    const [formData, setFormData] = useState({
        new_username: '',
        new_email: '',
        current_password: '',
        new_password: '',
        confirm_password: '',
        password: '' // used for both username and email change confirmation
    });

    const [status, setStatus] = useState({ message: '', kind: null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cooldowns, setCooldowns] = useState({ username: 0, email: 0, password: 0 });

    useEffect(() => {
        if (!isSettingsModalOpen) {
            setFormData({
                new_username: '',
                new_email: '',
                current_password: '',
                new_password: '',
                confirm_password: '',
                password: ''
            });
            setStatus({ message: '', kind: null });
        }
    }, [isSettingsModalOpen]);

    useEffect(() => {
        const updateCooldowns = () => {
            if (!user) return;
            const newCooldowns = {};
            Object.keys(COOLDOWN_FIELDS).forEach(field => {
                const stamp = user[COOLDOWN_FIELDS[field]];
                if (!stamp) {
                    newCooldowns[field] = 0;
                } else {
                    const last = new Date(stamp).getTime();
                    const remaining = COOLDOWN_MS - (Date.now() - last);
                    newCooldowns[field] = remaining > 0 ? remaining : 0;
                }
            });
            setCooldowns(newCooldowns);
        };

        updateCooldowns();
        const timer = setInterval(updateCooldowns, 30000);
        return () => clearInterval(timer);
    }, [user]);

    if (!isSettingsModalOpen) return null;

    const formatCooldown = (ms) => {
        const totalMinutes = Math.ceil(ms / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ message: '', kind: null });

        let endpoint = '';
        let payload = {};
        const field = settingsModalTab;

        if (field === 'username') {
            endpoint = `/users/${user.user_id}/username`;
            payload = { new_username: formData.new_username.trim(), password: formData.password };
        } else if (field === 'email') {
            endpoint = `/users/${user.user_id}/email`;
            payload = { new_email: formData.new_email.trim(), password: formData.password };
        } else if (field === 'password') {
            if (formData.new_password !== formData.confirm_password) {
                setStatus({ message: "New passwords do not match.", kind: "error" });
                setIsSubmitting(false);
                return;
            }
            endpoint = `/users/${user.user_id}/password`;
            payload = { current_password: formData.current_password, new_password: formData.new_password };
        }

        try {
            const updated = await api.put(endpoint, payload);
            login(updated); // update local storage and state
            setStatus({ message: `${field.charAt(0).toUpperCase() + field.slice(1)} updated.`, kind: "success" });
            setFormData({ ...formData, new_username: '', new_email: '', current_password: '', new_password: '', confirm_password: '', password: '' });
        } catch (err) {
            setStatus({ message: err.message, kind: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={(e) => e.target.className === 'modal-backdrop' && closeSettingsModal()}>
            <div className="modal modal-settings" role="dialog" aria-modal="true">
                <button type="button" className="modal-close" onClick={closeSettingsModal} aria-label="Close">&times;</button>
                
                <div className="modal-tabs">
                    <button 
                        type="button" 
                        className={`modal-tab ${settingsModalTab === 'username' ? 'active' : ''}`}
                        onClick={() => setSettingsModalTab('username')}
                    >
                        Username
                    </button>
                    <button 
                        type="button" 
                        className={`modal-tab ${settingsModalTab === 'email' ? 'active' : ''}`}
                        onClick={() => setSettingsModalTab('email')}
                    >
                        Email
                    </button>
                    <button 
                        type="button" 
                        className={`modal-tab ${settingsModalTab === 'password' ? 'active' : ''}`}
                        onClick={() => setSettingsModalTab('password')}
                    >
                        Password
                    </button>
                </div>

                <div className="settings-current">
                    <span className="settings-current-label">Username</span>
                    <span className="settings-current-value">@{user?.username}</span>
                    <span className="settings-current-label">Email</span>
                    <span className="settings-current-value">{user?.email || "(none)"}</span>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {settingsModalTab === 'username' && (
                        <>
                            <div className="field">
                                <label htmlFor="settings-new-username">New username</label>
                                <input 
                                    type="text" 
                                    id="settings-new-username" 
                                    name="new_username" 
                                    value={formData.new_username}
                                    onChange={handleChange}
                                    minLength="3" 
                                    maxLength="50" 
                                    required 
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="settings-username-password">Current password</label>
                                <input 
                                    type="password" 
                                    id="settings-username-password" 
                                    name="password" 
                                    value={formData.password}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </>
                    )}

                    {settingsModalTab === 'email' && (
                        <>
                            <div className="field">
                                <label htmlFor="settings-new-email">New email address</label>
                                <input 
                                    type="email" 
                                    id="settings-new-email" 
                                    name="new_email" 
                                    value={formData.new_email}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="settings-email-password">Current password</label>
                                <input 
                                    type="password" 
                                    id="settings-email-password" 
                                    name="password" 
                                    value={formData.password}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </>
                    )}

                    {settingsModalTab === 'password' && (
                        <>
                            <div className="field">
                                <label htmlFor="settings-current-password">Current password</label>
                                <input 
                                    type="password" 
                                    id="settings-current-password" 
                                    name="current_password" 
                                    value={formData.current_password}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="settings-new-password">New password</label>
                                <input 
                                    type="password" 
                                    id="settings-new-password" 
                                    name="new_password" 
                                    value={formData.new_password}
                                    onChange={handleChange}
                                    minLength="6" 
                                    required 
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="settings-confirm-password">Confirm new password</label>
                                <input 
                                    type="password" 
                                    id="settings-confirm-password" 
                                    name="confirm_password" 
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    minLength="6" 
                                    required 
                                />
                            </div>
                        </>
                    )}

                    <button type="submit" disabled={isSubmitting || cooldowns[settingsModalTab] > 0}>
                        {isSubmitting ? 'Submitting…' : `Change ${settingsModalTab}`}
                    </button>

                    {cooldowns[settingsModalTab] > 0 && (
                        <p className="settings-cooldown cooldown-active">
                            Available in {formatCooldown(cooldowns[settingsModalTab])}
                        </p>
                    )}

                    {status.message && (
                        <p className={`form-status ${status.kind === 'error' ? 'error' : 'success'}`}>
                            {status.message}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}

export default SettingsModal;
