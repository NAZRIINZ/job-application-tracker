
import React, { useState } from 'react';
import './Notifications.css';
import { Bell, Check } from 'lucide-react';
import { notifications as initialNotifications } from './notificationsData';

export default function Notifications({
    unreadCount,
    onMarkAll,
    showAll = true
}) {
    const [notifications, setNotifications] = useState(initialNotifications);

    const handleMarkAll = () => {
        const updated = notifications.map(n => ({
            ...n,
            read: true
        }));

        setNotifications(updated);

        if (onMarkAll) {
            onMarkAll();
        }
    };

    const filtered = showAll
        ? notifications
        : notifications.filter(n => !n.read);

    const iconMap = {
        Calendar: (
            <svg width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="#0284C7" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),

        RefreshCw: (
            <svg width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="#0284C7" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
            </svg>
        ),

        Info: (
            <svg width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="#0284C7" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
        )
    };

    return (
        <section className="card notifications">

            <div className="card-header">
                <div className="title-left">
                    <Bell size={20} color="#0EA5E9" />

                    <h3>Notifications</h3>

                    {unreadCount > 0 && (
                        <span className="badge" aria-label="unread count">
                            {unreadCount}
                        </span>
                    )}
                </div>

                <a
                    href="#"
                    className="view-all"
                    onClick={(e) => e.preventDefault()}
                >
                    View All →
                </a>
            </div>

            <ul className="list">
                {filtered.map(n => (
                    <li key={n.id} className="item">

                        <div className="icon">
                            {iconMap[n.icon]}
                        </div>

                        <div className="content">
                            <span className="title">
                                {n.title}
                            </span>

                            {n.detail && (
                                <span className="detail">
                                    {n.detail}
                                </span>
                            )}
                        </div>

                        <span className="time">
                            {n.time}
                        </span>

                    </li>
                ))}
            </ul>

            <button
                className="mark-all"
                onClick={handleMarkAll}
            >
                <Check size={16} color="#0284C7" />
                Mark all as read
            </button>

        </section>
    );
}
