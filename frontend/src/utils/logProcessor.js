/** 
 * Patch for groupAndConvertLogs or equivalent,
 * ensures On-Duty (Not Driving) only covers its precise block, and all remaining
 * time is Off-Duty, unless otherwise indicated.
 */
export function groupAndConvertLogs(flatLogs) {
  const grouped = flatLogs.reduce((acc, log) => {
    if (!acc[log.day]) acc[log.day] = [];
    acc[log.day].push(log);
    return acc;
  }, {});

  return Object.entries(grouped).map(([day, logs]) => {
    let currentMinute = 0;
    const segments = logs.map(log => {
      const hrs = Number(log.hours);
      const durationMins = Number.isFinite(hrs) && hrs > 0 ? Math.round(hrs * 60) : 0;
      const seg = {
        startMins: currentMinute,
        endMins: currentMinute + durationMins,
        status: log.status || 'Unknown',
        remarks: log.notes || '',
      };
      currentMinute += durationMins;
      return seg;
    }).filter(seg => Number.isFinite(seg.startMins) && Number.isFinite(seg.endMins));

    // Patch here: Fill possible gaps in timeline only with Off-Duty,
    // not On Duty (Not Driving)
    const filled = [];
    let prevEnd = 0;
    for (const seg of segments) {
      if (seg.startMins > prevEnd) {
        filled.push({
          startMins: prevEnd,
          endMins: seg.startMins,
          status: 'Off Duty', // Use "Off Duty" for all gaps
          remarks: 'Filler',
        });
      }
      filled.push(seg);
      prevEnd = seg.endMins;
    }
    // Ensure a final Off Duty filler for rest of day
    if (prevEnd < 24 * 60) {
      filled.push({
        startMins: prevEnd,
        endMins: 24 * 60,
        status: 'Off Duty',
        remarks: 'Filler',
      });
    }
    return { day: Number(day), segments: filled };
  });
}
