import React from 'react';
import './DailyLogHeader.css';

const DailyLogHeader = React.memo(({ info, miles, date }) => {
  let dateStr;
  try {
    // Add a time zone to prevent off-by-one day errors depending on local time.
    const parsedDate = date ? new Date(`${date}-T00:00:00`) : new Date();
    dateStr = parsedDate.toLocaleDateString('en-CA', { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch (error) {
    // Fallback for invalid date strings
    dateStr = new Date().toLocaleDateString('en-CA', { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  return (
    <div className="daily-log-header">
      <div className="header-row-1">
        <span>Date: {dateStr}</span>
        <span>Miles Today: {miles || "—"}</span>
        <span>Vehicle No: {info.vehicle || "—"}</span>
        <span>Pro/Shipping No: {info.shippingNo || "—"}</span>
      </div>
      <div className="header-row-2">
        <span>Carrier: <b>{info.carrier}</b></span>
        <span>Driver: <b>{info.driver}</b></span>
        <span>Office: <b>{info.address}</b></span>
      </div>
    </div>
  );
});

export default DailyLogHeader;
