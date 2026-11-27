
import React, { useState, useEffect } from 'react';
import './Notifications.css';
import { Bell } from 'lucide-react';
import { fetchNotifications } from './notificationService';

export default function Notifications({
    showAll = true,
    maxItems = null
}) {
    const [notifications, setNotifications] = useState([]);

    // Load notifications from backend
    useEffect(() => {
        let mounted = true;

        fetchNotifications()
            .then(data => {
                if (mounted) {
                    setNotifications(data);
                }
            })
            .catch(err => {
                console.error('Failed to load notifications:', err);
            });

        return () => {
            mounted = false;
        };
    }, []);

    // Notification icons
    const iconMap = {
        Calendar: (
            <svg width="22" height="22" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),

        RefreshCw: (
            <svg width="22" height="22" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
            </svg>
        ),

        Info: (
            <svg width="22" height="22" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
        )
    };

    // Filter notifications
    let filtered = showAll
        ? notifications
        : notifications.filter(n => !n.read);

    if (maxItems !== null) {
        filtered = filtered.slice(0, maxItems);
    }

    return (
        <section className="card notifications">

            {/* Header */}
            <div className="card-header">
                <div className="title-left">
                    <Bell size={21} />
                    <h3>Notifications</h3>
                </div>
            </div>

            {/* Notification list */}
            <ul className="list">
                {filtered.length > 0 ? (
                    filtered.map(n => (
                        <li
                            key={n.id}
                            className={`item ${!n.read ? 'unread' : ''}`}
                        >
                            <div className="icon">
                                {iconMap[n.icon] || iconMap.Info}
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
                    ))
                ) : (
                    <li className="empty-notifications">
                        <Bell size={25} />
                        <p>No notifications yet</p>
                    </li>
                )}
            </ul>

        </section>
    );
}
