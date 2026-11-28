
import React, { useState, useEffect, useCallback } from 'react';
import { fetchNotifications, markAllNotificationsRead
} from './notificationService';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Notifications from './Notifications';
import {
    Bell, LayoutDashboard, Briefcase, CalendarDays, CalendarCheck,
    User, Trash2, X, LogOut, Menu, AlertTriangle, CheckCircle
} from 'lucide-react';

// Navigation items
const NAV_ITEMS = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs',      icon: Briefcase,       label: 'My Applications' },
    { to: '/interviews',icon: CalendarCheck,   label: 'Interviews' },
    { to: '/calendar',  icon: CalendarDays,    label: 'Calendar' },
];

const NAV_BOTTOM = [
    { to: '/profile', icon: User, label: 'Profile Settings' },
];

// Status Badge
// Status Badge
export function StatusBadge({ status }) {
    const map = {
        Wishlist: 'badge badge-wishlist',
        Applied: 'badge badge-applied',
        Interview: 'badge badge-interview',
        'Offer Received': 'badge badge-offer',
        Rejected: 'badge badge-rejected'
    };

    return (
        <span className={map[status] || 'badge badge-wishlist'}>
            {status === 'Wishlist' ? 'Saved Jobs' : status}
        </span>
    );
}

// Confirm Modal
export function ConfirmModal({
    isOpen,
    title,
    description,
    onConfirm,
    onCancel,
    loading
}) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-icon"><Trash2 size={28} color="#ef4444" /></div>

                <h3 className="modal-title">{title}</h3>
                <p className="modal-desc">{description}</p>

                <div className="modal-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        className="btn btn-danger"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Loading Spinner
export function LoadingSpinner({ text = 'Loading...' }) {
    return (
        <div className="loading-container">
            <div className="spinner" />
            <p className="loading-text">{text}</p>
        </div>
    );
}

// Sidebar
function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <>
            <div
                className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
                onClick={onClose}
            />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <NavLink to="/dashboard" className="sidebar-logo" onClick={onClose}>
                        <Briefcase size={22} color="#4f46e5" />
                        <span>JobTracker</span>
                    </NavLink>

                    <button className="sidebar-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <p className="nav-section-title">Menu</p>

                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon;
                        return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'active' : ''}`
                            }
                            onClick={onClose}
                        >
                            <span className="nav-icon"><Icon size={18} /></span>
                            <span>{item.label}</span>
                        </NavLink>
                        );
                    })}

                    <p className="nav-section-title">Account</p>

                    {NAV_BOTTOM.map(item => {
                        const Icon = item.icon;
                        return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'active' : ''}`
                            }
                            onClick={onClose}
                        >
                            <span className="nav-icon"><Icon size={18} /></span>
                            <span>{item.label}</span>
                        </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user-info">
                        <div
                            className="user-avatar"
                            style={{ background: '#4f46e5' }}
                        >
                            {initials}
                        </div>

                        <div>
                            <div className="sidebar-user-name">
                                {user?.name}
                            </div>

                            <div className="sidebar-user-email">
                                {user?.email}
                            </div>
                        </div>
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={16} style={{ marginRight: 6 }} /> Logout
                    </button>
                </div>
            </aside>
        </>
    );
}


// Top Navbar
function Navbar({ onMenuToggle }) {
    const { user } = useAuth();

    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch the actual unread notification count
    const loadUnreadCount = useCallback(async () => {
        const notifications = await fetchNotifications();

        const count = notifications.filter(
            notification => !notification.read
        ).length;

        setUnreadCount(count);
    }, []);

    // Load notifications when Navbar mounts.
    // Refresh every 30 seconds to check for new notifications.
    useEffect(() => {
        loadUnreadCount();

        const interval = setInterval(() => {
            loadUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, [loadUnreadCount]);

    // Open notification panel and mark notifications as read
    const handleNotificationClick = async () => {
        if (showNotifications) {
            setShowNotifications(false);
            return;
        }

        // Open the panel
        setShowNotifications(true);

        // Mark notifications as read in the database
        const success = await markAllNotificationsRead();

        if (success) {
            setUnreadCount(0);
        }
    };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    const greeting = (() => {
        const hour = new Date().getHours();

        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    })();

    return (
        <header className="navbar">
            <div className="navbar-left">
                <button
                    className="menu-toggle"
                    onClick={onMenuToggle}
                    aria-label="Toggle menu"
                >
                    <Menu size={22} />
                </button>

                <div className="greeting-block">
                    <span className="greeting-text">
                        {greeting},&nbsp;
                    </span>
                    <span className="greeting-name">
                        {user?.name?.split(' ')[0] || 'User'}!
                    </span>
                </div>
            </div>

            <div className="navbar-right">
                <div className="notification-wrapper">
                    <button
                        className="notification-btn"
                        onClick={handleNotificationClick}
                        aria-label="Notifications"
                    >
                        <Bell size={20} color="#0EA5E9" />

                        {unreadCount > 0 && (
                            <span className="notif-badge" aria-label="unread count">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="notification-dropdown">
                            <Notifications
                               
                            />
                        </div>
                    )}
                </div>

                <div className="navbar-user">
                    <div className="user-avatar">{initials}</div>
                    <span className="navbar-username">
                        {user?.name?.split(' ')[0] || user?.name}
                    </span>
                </div>
            </div>
        </header>
    );
}

// Main Layout
export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="app-layout">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="main-content">
                <Navbar
                    onMenuToggle={() =>
                        setSidebarOpen(prev => !prev)
                    }
                />

                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
