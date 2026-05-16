import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { X } from 'lucide-react';

function AuthModal() {
    const { isAuthModalOpen, closeAuthModal, authModalTab, setAuthModalTab, login } = useAuth();
    const [formData, setFormData] = useState({ identifier: '', email: '', username: '', password: '' });
    const [status, setStatus] = useState({ message: '', type: null });
    const [isLoading, setIsLoading] = useState(false);

    if (!isAuthModalOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ message: '', type: null });

        try {
            const endpoint = authModalTab === 'login' ? '/auth/login' : '/auth/signup';
            const payload = authModalTab === 'login' 
                ? { identifier: formData.identifier, password: formData.password }
                : { username: formData.username, email: formData.email, password: formData.password };

            const userData = await api.post(endpoint, payload);
            login(userData);
            closeAuthModal();
        } catch (err) {
            setStatus({ message: err.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={(e) => e.target.className === 'modal-backdrop' && closeAuthModal()}>
            <div className="modal">
                <button type="button" className="modal-close" onClick={closeAuthModal}><X size={20} /></button>
                <div className="modal-tabs">
                    <button 
                        type="button" 
                        className={`modal-tab ${authModalTab === 'login' ? 'active' : ''}`}
                        onClick={() => setAuthModalTab('login')}
                    >
                        Log in
                    </button>
                    <button 
                        type="button" 
                        className={`modal-tab ${authModalTab === 'signup' ? 'active' : ''}`}
                        onClick={() => setAuthModalTab('signup')}
                    >
                        Sign up
                    </button>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {authModalTab === 'login' ? (
                        <>
                            <div className="field">
                                <label>Username or email</label>
                                <input 
                                    type="text" 
                                    name="identifier" 
                                    value={formData.identifier} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="field">
                                <label>Username</label>
                                <input 
                                    type="text" 
                                    name="username" 
                                    value={formData.username} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                            <div className="field">
                                <label>Email</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </>
                    )}
                    <div className="field">
                        <label>Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Processing...' : authModalTab === 'login' ? 'Log in' : 'Create account'}
                    </button>
                    {status.message && (
                        <p className={`form-status ${status.type}`}>{status.message}</p>
                    )}
                </form>
            </div>
        </div>
    );
}

export default AuthModal;
