// ============================================================
// Home.jsx - Public landing page
// ============================================================
import React from 'react'
import { Link } from 'react-router-dom'
import {
    ClipboardList, CalendarCheck, Search, BarChart2,
    Bell, ShieldCheck, Briefcase, Rocket
} from 'lucide-react'

export default function Home() {
  const features = [
    { icon: ClipboardList, title: 'Track Applications',  desc: 'Keep all your job applications organized in one place with status updates.' },
    { icon: CalendarCheck, title: 'Manage Interviews',   desc: 'Schedule and track interviews with dates, types, and preparation notes.' },
    { icon: Search,        title: 'Search & Filter',     desc: 'Quickly find applications by company, status, or location.' },
    { icon: BarChart2,     title: 'Dashboard Overview',  desc: 'See your job search progress at a glance with summary statistics.' },
    { icon: Bell,          title: 'Follow-up Reminders', desc: 'Set follow-up dates so you never miss an important deadline.' },
    { icon: ShieldCheck,   title: 'Secure & Private',    desc: 'Your data is protected with JWT authentication and hashed passwords.' },
  ]

  return (
    <div className="home-page">
      {/* Top navigation bar */}
      <nav className="home-nav">
        <a href="/" className="home-nav-brand">
          <span>💼</span>
          <span>JobTracker</span>
        </a>
        <div className="home-nav-links">
          <Link to="/login"    className="btn btn-ghost">Login</Link>
          <Link to="/register" className="btn btn-white">Get Started</Link>
        </div>
      </nav>

      {/* Hero section */}
      <section className="hero">
        <h1>Track Your Job Search<br />Like a Pro</h1>
        <p>
          Stop losing track of applications in spreadsheets.
          JobTracker keeps everything organized — applications, interviews,
          follow-ups, and more.
        </p>
        <div className="hero-buttons">
          <Link to="/register" className="btn btn-white btn-lg">
            Start Tracking Free
          </Link>
          <Link to="/login" className="btn btn-ghost btn-lg">
            Sign In →
          </Link>
        </div>
      </section>

      {/* Features section */}
      <section className="features-section">
        <h2 className="section-title">Everything you need</h2>
        <p className="section-subtitle">
          A complete toolkit for your job search journey
        </p>

              <div className="features-grid">
                  {features.map((f, i) => {
                      const Icon = f.icon

                      return (
                          <div key={i} className="feature-card">
                              <div className="feature-icon">
                                  <Icon size={28} />
                              </div>

                              <h3 className="feature-title">{f.title}</h3>
                              <p className="feature-desc">{f.desc}</p>
                          </div>
                      )
                  })}
              </div>
        <div className="text-center mt-24">
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account
          </Link>
          <p className="text-muted text-sm mt-8">
            No credit card required. Start in seconds.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#111827',
        color: '#9ca3af',
        textAlign: 'center',
        padding: '24px',
        fontSize: '0.875rem'
      }}>
              <p>Powered by React, Node.js, Express & MySQL</p>
              <p style={{ marginTop: '4px' }}>
                  Simplifying your job search, one application at a time.
              </p>
      </footer>
    </div>
  )
}
