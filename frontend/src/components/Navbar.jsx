import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, User } from 'lucide-react';

function Navbar() {
    const { user, logout, openAuthModal, openSettingsModal } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <header>
            <div className="brand">
                <Link to="/" className="brand-link">
                    <h1>CineRate</h1>
                </Link>
                <span className="brand-dots" aria-hidden="true">
                    <span></span><span></span><span></span>
                </span>
                <p className="tagline">Movie ratings & reviews</p>
            </div>
            <nav className="primary-nav">
                <Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link>
                <Link to="/leaderboard.html" className={isActive('/leaderboard.html') ? 'active' : ''}>Top 10</Link>
                {user && (
                    <Link to="/mywatchlist.html" className={isActive('/mywatchlist.html') ? 'active' : ''}>Watchlist</Link>
                )}
                <Link to="/foryou.html" className={isActive('/foryou.html') ? 'active' : ''}>For You</Link>
            </nav>
            <div className="auth-widget">
                {!user ? (
                    <div className="auth-anon">
                        <button type="button" className="auth-link" onClick={() => openAuthModal('login')}>
                            Log in
                        </button>
                        <button type="button" className="auth-link auth-link-primary" onClick={() => openAuthModal('signup')}>
                            Sign up
                        </button>
                    </div>
                ) : (
                    <div className="auth-user">
                        <button type="button" className="auth-username-link" onClick={() => openSettingsModal()}>
                            <span className="auth-username">@{user.username}</span>
                        </button>
                        <button type="button" className="auth-link" onClick={logout}>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Navbar;
