
import React, { useState } from 'react';
import './Calendar.css';

function Calendar({ events = [], onDateClick }) {
    const today = new Date();

    const [currentMonth, setCurrentMonth] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1)
    );

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const monthName = currentMonth.toLocaleString('default', {
        month: 'long'
    });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayWeekday = new Date(year, month, 1).getDay();

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Format a date using local calendar values
    function getLocalISODate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // Handle SQL DATE strings and ISO timestamps
    function normalizeDate(value) {
        if (!value) return '';

        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return '';

        return getLocalISODate(date);
    }

    const todayISO = getLocalISODate(today);

    const getEventsForDate = (iso) =>
        events.filter(event => normalizeDate(event.date) === iso);

    const prevMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1));
    };

    return (
        <div className="calendar-container">

            {/* Calendar Header */}
            <div className="calendar-header">
                <button type="button" onClick={prevMonth}>
                    ←
                </button>

                <h3>{monthName} {year}</h3>

                <button type="button" onClick={nextMonth}>
                    →
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid">

                {weekdays.map(day => (
                    <div key={day} className="calendar-weekday">
                        {day}
                    </div>
                ))}

                {/* Empty spaces before first day */}
                {Array.from({ length: firstDayWeekday }).map((_, index) => (
                    <div
                        key={`empty-${index}`}
                        className="calendar-day empty"
                    />
                ))}

                {/* Month dates */}
                {Array.from({ length: daysInMonth }, (_, index) => {
                    const day = index + 1;

                    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                    const dayEvents = getEventsForDate(iso);
                    const isToday = iso === todayISO;

                    return (
                        <div
                            key={iso}
                            className={`calendar-day ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-event' : ''}`}
                            onClick={() => {
                                if (dayEvents.length > 0 && onDateClick) {
                                    onDateClick(dayEvents[0]);
                                }
                            }}
                            title={dayEvents.map(event => event.label).join(', ')}
                        >
                            <span>{day}</span>

                            {dayEvents.length > 0 && (
                                <span className="calendar-event-dot" />
                            )}
                        </div>
                    );
                })}

            </div>
        </div>
    );
}

export default Calendar;
