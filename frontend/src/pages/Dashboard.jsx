import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from '../components/Layout'
import JobProgress from '../components/JobProgress'
import Notifications from '../components/Notifications'
import API_URL from '../api'
import './Dashboard.css' 
import {
    CalendarDays,
    BriefcaseBusiness,
    Users,
    Clock,
    Heart
} from 'lucide-react'

// ------------------------------------------------------------
// Date helpers
// ------------------------------------------------------------

function toDateKey(value) {
    if (!value) return ''

    // Preserve YYYY-MM-DD dates without timezone conversion.
    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function parseDate(key) {
    const [year, month, day] = key.split('-').map(Number)
    return new Date(year, month - 1, day)
}

function formatDate(key) {
    if (!key) return '—'

    return parseDate(key).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function formatMonth(date) {
    return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    })
}

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
}

function getList(response) {
    if (Array.isArray(response)) return response
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.data?.jobs)) return response.data.jobs
    if (Array.isArray(response?.data?.interviews)) return response.data.interviews
    if (Array.isArray(response?.jobs)) return response.jobs
    if (Array.isArray(response?.interviews)) return response.interviews
    return []
}

function getTime(value) {
    if (!value) return ''
    return String(value).slice(0, 5)
}

// ------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------

export default function Dashboard() {
    const { getAuthHeaders, user } = useAuth()

    const [stats, setStats] = useState(null)
    const [jobs, setJobs] = useState([])
    const [interviews, setInterviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [calendarLoading, setCalendarLoading] = useState(true)
    const [error, setError] = useState('')

    // ----- Period toggle and counts -----
  const [period, setPeriod] = useState('Day'); // Day | Week | Month
  const [periodStats, setPeriodStats] = useState({ total: 0, new: 0 });

  // Compute stats whenever jobs or period changes
  useEffect(() => {
    if (!jobs.length) {
      setPeriodStats({ total: 0, new: 0 });
      return;
    }
    const now = new Date();
    const sameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (period === 'Day') {
      const todayJobs = jobs.filter(j => sameDay(new Date(j.application_date || j.created_at), now));
      setPeriodStats({
        total: todayJobs.length,
        new: todayJobs.filter(j => !j.read).length,
      });
      return;
    }
    if (period === 'Week') {
      const start = new Date(now);
      const day = start.getDay(); // 0=Sun
      const diff = (day + 6) % 7; // days since Monday
      start.setDate(start.getDate() - diff);
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23,59,59,999);
      const weekJobs = jobs.filter(j => {
        const d = new Date(j.application_date || j.created_at);
        return d >= start && d <= end;
      });
      setPeriodStats({
        total: weekJobs.length,
        new: weekJobs.filter(j => !j.read).length,
      });
      return;
    }
    if (period === 'Month') {
      const month = now.getMonth();
      const year = now.getFullYear();
      const monthJobs = jobs.filter(j => {
        const d = new Date(j.application_date || j.created_at);
        return d.getMonth() === month && d.getFullYear() === year;
      });
      setPeriodStats({
        total: monthJobs.length,
        new: monthJobs.filter(j => !j.read).length,
      });
    }
  }, [jobs, period]);

    const applicationTargets = {
        daily: 3,
        weekly: 10,
        monthly: 20
    };


    // ----- Calculate Daily, Weekly and Monthly Applications -----

    const applicationCounts = useMemo(() => {

        const todayKey = toDateKey(new Date());
        const currentMonth = todayKey.slice(0, 7);

        // Get Monday of current week
        const weekStart = parseDate(todayKey);
        const day = weekStart.getDay();

        weekStart.setDate(
            weekStart.getDate() - ((day + 6) % 7)
        );

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekStartKey = toDateKey(weekStart);
        const weekEndKey = toDateKey(weekEnd);

        // Get actual application dates
        const applicationDates = jobs
            .filter(job =>
                String(job.status || '').toLowerCase() !== 'wishlist'
                && job.application_date
            )
            .map(job => toDateKey(job.application_date))
            .filter(Boolean);

        return {
            daily: applicationDates.filter(
                date => date === todayKey
            ).length,

            weekly: applicationDates.filter(
                date => date >= weekStartKey && date <= weekEndKey
            ).length,

            monthly: applicationDates.filter(
                date => date.startsWith(currentMonth)
            ).length
        };

    }, [jobs]);

    const [activeFilter, setActiveFilter] = useState('all')
    const [calendarView, setCalendarView] = useState('month')
    const [currentMonth, setCurrentMonth] = useState(() => {
        const today = new Date()
        return new Date(today.getFullYear(), today.getMonth(), 1)
    })
    const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()))
    const [selectedEvent, setSelectedEvent] = useState(null)

    // ----------------------------------------------------------
    // Fetch dashboard statistics, jobs and interviews
    // ----------------------------------------------------------

    useEffect(() => {
        let mounted = true

        async function fetchDashboardData() {
            setLoading(true)
            setCalendarLoading(true)

            const headers = getAuthHeaders()

            const requests = await Promise.allSettled([
                fetch(`${API_URL}/api/jobs/stats`, { headers }),
                fetch(`${API_URL}/api/jobs?limit=100`, { headers }),
                fetch(`${API_URL}/api/interviews`, { headers }),
            ])

            if (!mounted) return

            // Statistics
            if (requests[0].status === 'fulfilled') {
                try {
                    const response = requests[0].value
                    const data = await response.json()

                    if (response.ok && data.success) {
                        setStats(data.data)
                    } else {
                        setError(data.message || 'Unable to load dashboard statistics.')
                    }
                } catch {
                    setError('Unable to read dashboard statistics.')
                }
            } else {
                setError('Cannot connect to the dashboard API.')
            }

            // Jobs
            if (requests[1].status === 'fulfilled') {
                try {
                    const response = requests[1].value
                    const data = await response.json()

                    if (response.ok) {
                        setJobs(getList(data))
                    } else {
                        console.error('Jobs API error:', data.message)
                    }
                } catch (err) {
                    console.error('Unable to load jobs:', err)
                }
            }

            // Interviews
            if (requests[2].status === 'fulfilled') {
                try {
                    const response = requests[2].value
                    const data = await response.json()

                    if (response.ok) {
                        setInterviews(getList(data))
                    } else {
                        console.error('Interviews API error:', data.message)
                    }
                } catch (err) {
                    console.error('Unable to load interviews:', err)
                }
            }

            if (mounted) {
                setLoading(false)
                setCalendarLoading(false)
            }
        }

        fetchDashboardData()

        return () => {
            mounted = false
        }
    }, [])

    // ----------------------------------------------------------
    // Build all calendar events
    // ----------------------------------------------------------

    const events = useMemo(() => {
        const result = []

        jobs.forEach(job => {
            const status = String(job.status || '').toLowerCase()
            const company = job.company_name || 'Company'
            const title = job.job_title || 'Job application'

            // Wishlist event
            if (status === 'wishlist') {
                const date = toDateKey(job.created_at || job.application_date)

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
                    })
                }
            } else {
                // Application event
                const date = toDateKey(job.application_date)

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
                    })
                }
            }

            // Follow-up event
            const followUpDate = toDateKey(job.follow_up_date)

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
                })
            }
        })

        // Interview events
        interviews.forEach(interview => {
            const date = toDateKey(interview.interview_date)

            if (!date) return

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
            })
        })

        return result.sort((a, b) => {
            return a.date.localeCompare(b.date) ||
                (a.time || '').localeCompare(b.time || '')
        })
    }, [jobs, interviews])

    // ----------------------------------------------------------
    // Filter events
    // ----------------------------------------------------------

    const filteredEvents = useMemo(() => {
        if (activeFilter === 'all') return events

        return events.filter(event => event.type === activeFilter)
    }, [events, activeFilter])

    const selectedDateEvents = filteredEvents.filter(
        event => event.date === selectedDate
    )

    // ----------------------------------------------------------
    // Calendar navigation
    // ----------------------------------------------------------

    function changeMonth(direction) {
        setCurrentMonth(previous => {
            return new Date(
                previous.getFullYear(),
                previous.getMonth() + direction,
                1
            )
        })
    }

    function goToday() {
        const today = new Date()
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
        setSelectedDate(toDateKey(today))
        setSelectedEvent(null)
    }

    function selectDate(dateKey) {
        setSelectedDate(dateKey)
        setSelectedEvent(null)
    }

    function selectFilter(filter) {
        setActiveFilter(filter)
        setSelectedEvent(null)
    }

    // ----------------------------------------------------------
    // Generate calendar days
    // ----------------------------------------------------------

    const calendarDays = useMemo(() => {
        const firstDay = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            1
        )

        const start = new Date(firstDay)
        start.setDate(firstDay.getDate() - firstDay.getDay())

        const count = calendarView === 'month' ? 42 : 7

        if (calendarView === 'week') {
            const selected = parseDate(selectedDate)
            start.setDate(selected.getDate() - selected.getDay())
        }

        return Array.from({ length: count }, (_, index) => {
            const date = new Date(start)
            date.setDate(start.getDate() + index)

            const key = toDateKey(date)

            return {
                key,
                date,
                isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
                isToday: key === toDateKey(new Date()),
                events: filteredEvents.filter(event => event.date === key),
            }
        })
    }, [currentMonth, calendarView, selectedDate, filteredEvents])

    // ----------------------------------------------------------
    // Statistics
    // ----------------------------------------------------------

    const statCards = [
        {
            label: 'Total Applied',
            value: stats?.total || 0,
            color: 'purple'
        },
        {
            label: 'In Progress',
            value: stats?.applied || 0,
            color: 'blue'
        },
        {
            label: 'Interviews',
            value: stats?.interviews || 0,
            color: 'cyan'
        },
        {
            label: 'Offers Received',
            value: stats?.offers || 0,
            color: 'green'
        },
        {
            label: 'Rejected',
            value: stats?.rejected || 0,
            color: 'red'
        },
        {
            label: 'Follow-ups Due',
            value: stats?.upcoming_followups || 0,
            color: 'orange'
        },
    ]


    if (loading) {
        return <LoadingSpinner text="Loading dashboard..." />
    }

    const filters = [
        { id: 'all', label: 'All Events', icon: 'calendar-days' },
        { id: 'application', label: 'Job Applications', icon: 'briefcase-business' },
        { id: 'interview', label: 'Interviews', icon: 'users' },
        { id: 'followup', label: 'Follow-ups', icon: 'clock' },
        { id: 'wishlist', label: 'Wishlist', icon: 'heart' },
    ]

    return (
        <div className="jd-dashboard">

           
            {/* Header */}
            <div className="jd-page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Here's your job search overview</p>
                </div>

                {/*<Link to="/jobs/new" className="jd-add-job">*/}
                {/*    + Add Application*/}
                {/*</Link>*/}
            </div>

            {error && (
                <div className="jd-warning">
                    {error} Your calendar can still display available records.
                </div>
            )}

            {/* Statistics */}
            <div className="jd-stats-grid">
    {statCards.map(card => (
        <div
            className={`jd-stat-card ${card.color}`}
            key={card.label}
        >
            <div className="jd-stat-info">
                <p>{card.label}</p>
                <strong>{card.value}</strong>
            </div>
        </div>
    ))}
</div>
            {/* Job Search Progress + Notifications Row */}
            <div className="jd-dashboard-widgets-row">

                {/* Left: Job Search Progress */}
                <div className="jd-widget-progress">
                   
                    <JobProgress
                        counts={applicationCounts}
                        targets={applicationTargets}
                    />
                </div>

                {/* Right: Notifications */}
                <div className="jd-widget-notifications">
                    <Notifications
                        showAll={true}
                        maxItems={3}
                    />
                </div>

            </div>
{/* Main calendar layout */}
<div className="jd-main-grid">
    {/* Calendar moved to a separate page */}
    {/*<p>The calendar view has been moved to a separate page. Use the sidebar to access it.</p>*/}
</div>
        </div>
    );
}
// Calendar event details
// ------------------------------------------------------------

function EventDetails({ event }) {
    const typeLabel = {
        application: 'Applied',
        interview: 'Interview',
        followup: 'Follow-up',
        wishlist: 'Wishlist',
    }

    return (
        <div className={`jd-detail-item ${event.type}`}>


            <div className="jd-detail-content">
                <div className="jd-detail-title-row">
                    <strong>{event.title}</strong>
                    <span className={`jd-type-badge ${event.type}`}>
                        {typeLabel[event.type]}
                    </span>
                </div>

                <p>{event.subtitle}</p>

                {event.time && <p>Time: {event.time}</p>}
                {event.notes && <p>{event.notes}</p>}

                <Link to={event.url}>
                    View Details →
                </Link>
            </div>
        </div>
    )
}

/* =========================================================
   Professional Job Tracker Dashboard
   ========================================================= */
