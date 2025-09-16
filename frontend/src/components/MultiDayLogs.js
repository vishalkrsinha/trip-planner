import React, { useState, useEffect, useRef } from 'react';
import LogGrid from './LogGrid';
import './MultiDayLogs.css';
import { mergeAdjacentSegments } from '../utils/logMerge';


const MultiDayLogs = ({ dailyLogs, remarks = [], breaks = [] }) => {
  const [selectedDay, setSelectedDay] = useState(dailyLogs.length > 0 ? dailyLogs[0].day : null);
  const panelRef = useRef(null);

  useEffect(() => {
    // Focus the panel when the selected day changes for better accessibility
    if (panelRef.current) {
      panelRef.current.focus();
    }
  }, [selectedDay]);

  useEffect(() => {
    // When the logs change (e.g., a new trip is generated),
    // reset the selected day to the first day of the new logs.
    if (dailyLogs.length > 0) {
      setSelectedDay(dailyLogs[0].day);
    }
  }, [dailyLogs]);

  if (!dailyLogs || dailyLogs.length === 0) {
    return <p>No logs available.</p>;
  }

  const selectedLogRaw = dailyLogs.find(log => log.day === selectedDay);
  const selectedLog = selectedLogRaw ? { ...selectedLogRaw, segments: mergeAdjacentSegments(selectedLogRaw.segments) } : null;
  return (
    <div>
      <div
        className="tabs-container"
        role="tablist"
        aria-label="ELD Daily Logs Tabs"
      >
        {dailyLogs.map(log => (
          <button
            className={`tab-button ${selectedDay === log.day ? 'active' : ''}`}
            key={log.day}
            role="tab"
            aria-selected={selectedDay === log.day}
            aria-controls={`day-panel-${log.day}`}
            id={`day-tab-${log.day}`}
            tabIndex={selectedDay === log.day ? 0 : -1}
            onClick={() => setSelectedDay(log.day)}
          >
            Day {log.day}
          </button>
        ))}
      </div>

      {selectedLog && (
        <div
          key={selectedDay}
          ref={panelRef}
          role="tabpanel"
          id={`day-panel-${selectedDay}`}
          aria-labelledby={`day-tab-${selectedDay}`}
          tabIndex={0}
        >
          <LogGrid
            dayLabel={`Day ${selectedLog.day}`}
            segments={selectedLog.segments}
            remarks={remarks}
            breaks={breaks}
          />
        </div>
      )}
    </div>
  );
};

export default MultiDayLogs;
