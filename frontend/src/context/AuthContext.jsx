import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const AUTH_STORAGE_KEY = "cinerate.auth";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalTab, setAuthModalTab] = useState('login');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [settingsModalTab, setSettingsModalTab] = useState('username');

    useEffect(() => {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
            try {
                setUser(JSON.parse(raw));
            } catch (e) {
                localStorage.removeItem(AUTH_STORAGE_KEY);
            }
        }
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
    };

    const openAuthModal = (tab = 'login') => {
        setAuthModalTab(tab);
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    const openSettingsModal = (tab = 'username') => {
        setSettingsModalTab(tab);
        setIsSettingsModalOpen(true);
    };

    const closeSettingsModal = () => {
        setIsSettingsModalOpen(false);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout, 
            isAuthModalOpen, 
            authModalTab, 
            openAuthModal, 
            closeAuthModal,
            setAuthModalTab,
            isSettingsModalOpen,
            settingsModalTab,
            openSettingsModal,
            closeSettingsModal,
            setSettingsModalTab
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
