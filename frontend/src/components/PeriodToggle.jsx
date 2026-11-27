
import React from 'react';
import './PeriodToggle.css';

export default function PeriodToggle({ selected, onChange }) {
    return (
        <div className="period-toggle">
            {['Day', 'Week', 'Month'].map(label => (
                <button
                    key={label}
                    type="button"
                    className={selected === label ? 'active' : ''}
                    onClick={() => onChange(label)}
                    aria-pressed={selected === label}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
