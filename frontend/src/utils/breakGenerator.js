/**
 * Generates an array of break intervals from daily log data.
 *
 * @param {Array<Object>} dailyLogs - A flat array of log entries from the API.
 * @returns {Array<Object>} An array of break objects, each with `from`, `to`, `label`, and `row`.
 */
export function generateBreaks(dailyLogs) {
  const generatedBreaks = [];
  let currentMinute = 0;
  const breakPatterns = [
    { keyword: '10-hour', label: '10-Hour Off-Duty Break' },
    { keyword: 'lunch', label: 'Lunch' },
    { keyword: 'rest', label: 'Rest' },
    { keyword: 'yard', label: 'Yard Move' },
  ];

  dailyLogs.forEach(seg => {
    const durationMins = Math.round(Number(seg.hours || 0) * 60);
    if (seg.status === 'Off-Duty' && seg.notes) {
      const noteLower = seg.notes.toLowerCase();
      const pattern = breakPatterns.find(p => noteLower.includes(p.keyword));
      const breakLabel = pattern ? pattern.label : 'Break';
      generatedBreaks.push({ from: currentMinute, to: currentMinute + durationMins, label: breakLabel, row: 0 });
    }
    currentMinute += durationMins;
  });

  return generatedBreaks;
}