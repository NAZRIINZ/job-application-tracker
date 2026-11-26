// ============================================================
// Calendar.jsx - Dedicated calendar page
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/Layout';
import API_URL from '../api';
import './Dashboard.css'; // reuse styles
import { CalendarDays, BriefcaseBusiness, Users, Clock, Heart } from 'lucide-react';

export default function CalendarPage() {
  const { getAuthHeaders, user } = useAuth();

  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeFilter, setActiveFilter] = useState('all');
  const [calendarView, setCalendarView] = useState('month');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Helper date functions (same as Dashboard)
  function toDateKey(value) {
    if (!value) return '';
    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  function parseDate(key) {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  function formatDate(key) {
    if (!key) return '—';
    return parseDate(key).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  function formatMonth(date) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }
  function getList(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.jobs)) return response.data.jobs;
    if (Array.isArray(response?.data?.interviews)) return response.data.interviews;
    if (Array.isArray(response?.jobs)) return response.jobs;
    if (Array.isArray(response?.interviews)) return response.interviews;
    return [];
  }
  function getTime(value) {
    if (!value) return '';
    return String(value).slice(0, 5);
  }

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      setCalendarLoading(true);
      const headers = getAuthHeaders();
      const requests = await Promise.allSettled([
        fetch(`${API_URL}/api/jobs/stats`, { headers }),
        fetch(`${API_URL}/api/jobs?limit=100`, { headers }),
        fetch(`${API_URL}/api/interviews`, { headers }),
      ]);
      if (!mounted) return;
      if (requests[0].status === 'fulfilled') {
        try {
          const resp = requests[0].value;
          const data = await resp.json();
          if (resp.ok && data.success) setStats(data.data);
          else setError(data.message || 'Unable to load dashboard statistics.');
        } catch { setError('Unable to read dashboard statistics.'); }
      }
      if (requests[1].status === 'fulfilled') {
        try {
          const resp = requests[1].value;
          const data = await resp.json();
          if (resp.ok) setJobs(getList(data));
        } catch {}
      }
      if (requests[2].status === 'fulfilled') {
        try {
          const resp = requests[2].value;
          const data = await resp.json();
          if (resp.ok) setInterviews(getList(data));
        } catch {}
      }
      if (mounted) {
        setLoading(false);
        setCalendarLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, []);

  // Build events (same logic as Dashboard)
  const events = useMemo(() => {
    const result = [];
    jobs.forEach(job => {
      const status = String(job.status || '').toLowerCase();
      const company = job.company_name || 'Company';
      const title = job.job_title || 'Job application';
      if (status === 'wishlist') {
        const date = toDateKey(job.created_at || job.application_date);
        if (date) {
          result.push({
            id: `wishlist-${job.id}`,
            jobId: job.id,
            date,
            type: 'wishlist',
            title: company,
            subtitle: title,
            label: `${company} (Wishlist)`,
            url: `/jobs/${job.id}/edit`,
          });
        }
      } else {
        const date = toDateKey(job.application_date);
        if (date) {
          result.push({
            id: `job-${job.id}`,
            jobId: job.id,
            date,
            type: 'application',
            title: company,
            subtitle: title,
            label: `${company} (Applied)`,
            status: job.status,
            url: `/jobs/${job.id}/edit`,
          });
        }
      }
      const followUpDate = toDateKey(job.follow_up_date);
      if (followUpDate) {
        result.push({
          id: `followup-${job.id}`,
          jobId: job.id,
          date: followUpDate,
          type: 'followup',
          title: company,
          subtitle: `Follow-up for ${title}`,
          label: `${company} (Follow-up)`,
          url: `/jobs/${job.id}/edit`,
        });
      }
    });
    interviews.forEach(interview => {
      const date = toDateKey(interview.interview_date);
      if (!date) return;
      result.push({
        id: `interview-${interview.id}`,
        interviewId: interview.id,
        jobId: interview.job_id,
        date,
        type: 'interview',
        title: interview.company_name || 'Interview',
        subtitle: interview.job_title || interview.interview_type || 'Interview',
        time: getTime(interview.interview_time),
        notes: interview.notes || '',
        label: `${interview.company_name || 'Interview'} (Interview)`,
        url: '/interviews',
      });
    });
    return result.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  }, [jobs, interviews]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return events;
    return events.filter(ev => ev.type === activeFilter);
  }, [events, activeFilter]);

  const selectedDateEvents = filteredEvents.filter(ev => ev.date === selectedDate);

  function changeMonth(direction) {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  }
  function goToday() {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(toDateKey(today));
    setSelectedEvent(null);
  }
  function selectDate(dateKey) { setSelectedDate(dateKey); setSelectedEvent(null); }
  function selectFilter(filter) { setActiveFilter(filter); setSelectedEvent(null); }

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());
    const count = calendarView === 'month' ? 42 : 7;
    if (calendarView === 'week') {
      const selected = parseDate(selectedDate);
      start.setDate(selected.getDate() - selected.getDay());
    }
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = toDateKey(date);
      return {
        key,
        date,
        isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
        isToday: key === toDateKey(new Date()),
        events: filteredEvents.filter(ev => ev.date === key),
      };
    });
  }, [currentMonth, calendarView, selectedDate, filteredEvents]);

  const filters = [
    { id: 'all', label: 'All Events', icon: 'calendar-days' },
    { id: 'application', label: 'Job Applications', icon: 'briefcase-business' },
    { id: 'interview', label: 'Interviews', icon: 'users' },
    { id: 'followup', label: 'Follow-ups', icon: 'clock' },
    { id: 'wishlist', label: 'Wishlist', icon: 'heart' },
  ];

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="jd-dashboard">
      <div className="jd-page-header">
        <div>
          <h1>Calendar</h1>
          <p>All your job‑search events in one place</p>
        </div>
      </div>

      {error && <div className="jd-warning">{error} Your calendar can still display available records.</div>}

      <div className="jd-main-grid">
        {/* Calendar */}
        <section className="jd-calendar-card">
          <div className="jd-calendar-toolbar">
            <div className="jd-filter-tabs">
              {filters.map(filter => (
                <button
                  key={filter.id}
                  className={`jd-filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                  onClick={() => selectFilter(filter.id)}
                >
                  {filter.id === 'all' && <CalendarDays />}
                  {filter.id === 'application' && <BriefcaseBusiness />}
                  {filter.id === 'interview' && <Users />}
                  {filter.id === 'followup' && <Clock />}
                  {filter.id === 'wishlist' && <Heart />}
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="jd-view-tabs">
              {['month', 'week', 'list'].map(view => (
                <button
                  key={view}
                  className={calendarView === view ? 'active' : ''}
                  onClick={() => setCalendarView(view)}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="jd-calendar-navigation">
            <div className="jd-month-controls">
              <button onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
              <button onClick={() => changeMonth(1)} aria-label="Next month">›</button>
              <h2>{formatMonth(currentMonth)}</h2>
            </div>
            <button className="jd-today-btn" onClick={goToday}>Today</button>
          </div>

          {calendarLoading ? (
            <div className="jd-calendar-empty">Loading calendar events...</div>
          ) : calendarView === 'list' ? (
            <div className="jd-list-view">
              {filteredEvents.length === 0 ? (
                <div className="jd-calendar-empty">No events available.</div>
              ) : (
                filteredEvents.map(event => (
                  <button
                    key={event.id}
                    className={`jd-list-event ${event.type}`}
                    onClick={() => selectDate(event.date)}
                  >
                    <strong>{formatDate(event.date)}</strong>
                    <span>{event.title}</span>
                    <small>{event.subtitle}</small>
                    <span className="jd-event-type">
                      {event.type === 'application' ? 'Job Application' :
                        event.type === 'followup' ? 'Follow-up' :
                        event.type === 'interview' ? 'Interview' : 'Wishlist'}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="jd-calendar-grid">
              <div className="jd-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="jd-calendar-days">
                {calendarDays.map(day => (
                  <button
                    key={day.key}
                    className={[
                      'jd-day-cell',
                      !day.isCurrentMonth ? 'outside' : '',
                      day.isToday ? 'today' : '',
                      selectedDate === day.key ? 'selected' : '',
                    ].join(' ')}
                    onClick={() => selectDate(day.key)}
                  >
                    <span className="jd-day-number">{day.date.getDate()}</span>
                    <div className="jd-day-events">
                      {day.events.slice(0, 3).map(event => (
                        <span
                          key={event.id}
                          className={`jd-calendar-event ${event.type}`}
                          title={`${event.title} - ${event.subtitle}`}
                          onClick={e => { e.stopPropagation(); setSelectedDate(event.date); setSelectedEvent(event); }}
                        >
                          {event.title}
                        </span>
                      ))}
                      {day.events.length > 3 && (
                        <small>+{day.events.length - 3} more</small>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="jd-calendar-legend">
            <span><i className="application" /> Job Application</span>
            <span><i className="interview" /> Interview</span>
            <span><i className="followup" /> Follow-up</span>
            <span><i className="wishlist" /> Wishlist</span>
          </div>
        </section>

        {/* Selected date details */}
        <aside className="jd-details-card">
          <div className="jd-details-heading"><h2>Selected Date Details</h2></div>
          <h3>{formatDate(selectedDate)}</h3>
          <div className="jd-details-list">
            {selectedEvent ? (
              <EventDetails event={selectedEvent} />
            ) : selectedDateEvents.length > 0 ? (
              selectedDateEvents.map(ev => <EventDetails key={ev.id} event={ev} />)
            ) : (
              <div className="jd-no-events">
                <strong>No events for this date</strong>
                <p>Select another date or add a new activity.</p>
              </div>
            )}
          </div>
          <Link to="/jobs/new" className="jd-add-event">+ Add Event</Link>
          <Link to="/interviews" className="jd-manage-interviews">Manage Interviews →</Link>
          <div className="jd-pro-tip"><strong>💡 Pro Tip</strong><p>Use the calendar filters to view applications, interviews, follow‑ups and wishlist activities separately.</p></div>
        </aside>
      </div>
    </div>
  );
}

function EventDetails({ event }) {
  const typeLabel = {
    application: 'Applied',
    interview: 'Interview',
    followup: 'Follow-up',
    wishlist: 'Wishlist',
  };
  return (
    <div className={`jd-detail-item ${event.type}`}>
      <div className="jd-detail-content">
        <div className="jd-detail-title-row">
          <strong>{event.title}</strong>
          <span className={`jd-type-badge ${event.type}`}>{typeLabel[event.type]}</span>
        </div>
        <p>{event.subtitle}</p>
        {event.time && <p>Time: {event.time}</p>}
        {event.notes && <p>{event.notes}</p>}
        <Link to={event.url}>View Details →</Link>
      </div>
    </div>
  );
}

/* =========================================================
   Professional Job Tracker Calendar Page
   ========================================================= */
