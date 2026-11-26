
import React, { useState } from 'react';
import './JobProgress.css';

export default function JobProgress({ counts, targets }) {
    const [period, setPeriod] = useState('monthly');

    const periodLabels = {
        daily: 'Today',
        weekly: 'This Week',
        monthly: 'This Month'
    };

    const current = counts?.[period] ?? 0;
    const target = targets?.[period] ?? 0;

    const percent = target > 0
        ? Math.min(100, Math.round((current / target) * 100))
        : 0;

    const remaining = Math.max(0, target - current);

    const radius = 52;
    const stroke = 10;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset =
        circumference - (percent / 100) * circumference;

    const gradientId = 'progress-gradient';

    return (
        <section className="card job-progress">

            {/* Header */}
            <div className="card-header">

                <div className="title-left">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#0EA5E9"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M3 12h18" />
                        <path d="M8 8V4" />
                        <path d="M16 8V4" />
                        <path d="M12 8V4" />
                        <path d="M3 12v6a2 2 0 0 0 2 2h4" />
                        <path d="M21 12v6a2 2 0 0 1-2 2h-4" />
                    </svg>

                    <h3>Job Search Progress</h3>
                </div>

                <div className="title-right">
                    <select
                        className="time-selector"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                    >
                        <option value="daily">Today</option>
                        <option value="weekly">This Week</option>
                        <option value="monthly">This Month</option>
                    </select>
                </div>

            </div>

            {/* Progress Content */}
            <div className="progress-content">

                {/* Donut Chart */}
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    className="donut-svg"
                >
                    <defs>
                        <linearGradient
                            id={gradientId}
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%"
                        >
                            <stop offset="0%" stopColor="#2DD4BF" />
                            <stop offset="100%" stopColor="#0284C7" />
                        </linearGradient>
                    </defs>

                    <circle
                        stroke="#E2E8F0"
                        fill="transparent"
                        strokeWidth={stroke}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />

                    <circle
                        stroke={`url(#${gradientId})`}
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        style={{
                            transition: 'stroke-dashoffset 0.35s'
                        }}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        transform={`rotate(-90 ${radius} ${radius})`}
                    />

                    <text
                        x="50%"
                        y="50%"
                        dy="0.3em"
                        textAnchor="middle"
                        fill="#1E2952"
                        fontSize="22"
                        fontWeight="bold"
                    >
                        {percent}%
                    </text>
                </svg>

                {/* Linear Progress */}
                <div className="linear-section">

                    <div className="headline">
                        <strong>{current} of {target}</strong>
                        {' '}Applications
                    </div>

                    <div className="linear-bar-bg">
                        <div
                            className="linear-bar-fg"
                            style={{ width: `${percent}%` }}
                        />
                    </div>

                    <div className="subcaption">
                        <span className="dot" />

                        <span className="text">
                            {remaining > 0
                                ? `${remaining} applications remaining ${periodLabels[period].toLowerCase()}`
                                : 'Goal achieved! Great work!'
                            }
                        </span>
                    </div>

                </div>

            </div>

        </section>
    );
}
