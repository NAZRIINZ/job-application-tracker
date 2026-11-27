
// notificationService.js
// Fetch notifications directly from the backend

export async function fetchNotifications() {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No authentication token found. Please log in.');
        return [];
    }

    const baseUrl = import.meta.env.VITE_API_URL || '';

    try {
        const response = await fetch(
            `${baseUrl}/api/jobs/notifications`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (response.status === 401) {
            console.error('Authentication failed. Please log in again.');
            return [];
        }

        if (!response.ok) {
            throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();

        if (!data.success) {
            return [];
        }

        const timeAgo = (dateStr) => {
            const diff = Date.now() - new Date(dateStr).getTime();

            if (!Number.isFinite(diff)) return '';

            const mins = Math.max(0, Math.floor(diff / 60000));

            if (mins < 60) return `${mins}m ago`;

            const hrs = Math.floor(mins / 60);

            if (hrs < 24) return `${hrs}h ago`;

            const days = Math.floor(hrs / 24);

            return `${days}d ago`;
        };

        const iconMap = {
            application_added: 'Info',
            application_updated: 'Info',
            status_changed: 'RefreshCw'
        };

        return (data.notifications || []).map(notification => ({
            id: notification.id,
            icon: iconMap[notification.type] || 'Info',
            title: notification.title,
            detail: notification.detail || '',
            time: timeAgo(notification.created_at),
            read: Boolean(notification.is_read)
        }));

    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
    }
}

// Mark all notifications as read
export async function markAllNotificationsRead() {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No authentication token found. Please log in.');
        return false;
    }

    const baseUrl = import.meta.env.VITE_API_URL || '';

    try {
        const response = await fetch(
            `${baseUrl}/api/jobs/notifications/read-all`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to mark notifications as read');
        }

        const data = await response.json();
        return data.success === true;

    } catch (error) {
        console.error('Failed to mark notifications as read:', error);
        return false;
    }
}
