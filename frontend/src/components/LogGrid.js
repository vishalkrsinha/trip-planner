import React, { useState } from 'react';
import FMCSALogGraphEnhanced from './FMCSALogGraphEnhanced';
import './LogGrid.css';

const formatTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const handlePointHover = (setTooltip) => (evt, data) => {
  if (evt && data) {
    setTooltip({
      x: evt.clientX,
      y: evt.clientY,
      content: `${data.status}\n${formatTime(data.startMins)} - ${formatTime(data.endMins)}\n${data.remarks || ''}`,
    });
  } else {
    setTooltip(null);
  }
};

const STATUS_LABELS = {
  "ON_DUTY": "On Duty (Not Driving)",
  "On Duty": "On Duty (Not Driving)",
  "On duty": "On Duty (Not Driving)",
  "On Duty (Not Driving)": "On Duty (Not Driving)",
  "DRIVING": "Driving",
  "Driving": "Driving",
  "OFF_DUTY": "Off Duty",
  "Off Duty": "Off Duty",
  "SLEEPER_BERTH": "Sleeper Berth",
  "Sleeper Berth": "Sleeper Berth",
};

const LogGrid = React.memo(({ segments = [], breaks = [], remarks = [], dayLabel = "Day 1" }) => {
  const [tooltip, setTooltip] = useState(null);

  const summary = segments.reduce((acc, seg) => {
    if (seg.status) {
      // acc[seg.status] = (acc[seg.status] || 0) + ((seg.endMins - seg.startMins) / 60);
      const normalizedStatus = STATUS_LABELS[seg.status] || seg.status;
      acc[normalizedStatus] = (acc[normalizedStatus] || 0) + ((seg.endMins - seg.startMins) / 60);
    }
    return acc;
  }, {});

  return (
    <div className="log-grid-container">
      <div className="log-grid-header">{dayLabel}</div>
      <FMCSALogGraphEnhanced
        segments={segments}
        breaks={breaks}
        remarks={remarks}
        onPointHover={handlePointHover(setTooltip)}
      />
      {tooltip && (
        <div
          className="log-grid-tooltip"
          style={{ top: tooltip.y + 10, left: tooltip.x + 10 }}
        >
          {tooltip.content}
        </div>
      )}

      <table className="summary-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Hours</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((seg, idx) => {
            const hours = ((seg.endMins - seg.startMins) / 60).toFixed(2);
            return (
              <tr key={`summary-${idx}`}>
                <td>{seg.status}</td>
                <td className="summary-table-hours">{hours}</td>
                <td>{seg.remarks || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="summary-totals">
        {Object.entries(summary).map(([status, hours]) => (
          <p key={status}>
            Total {status}: {hours.toFixed(2)} hours
          </p>
        ))}
      </div>
    </div>
  );
});

export default LogGrid;
