export function mergeAdjacentSegments(segments) {
  if (!segments.length) return [];

  const merged = [];
  let prev = segments[0];

  for (let i = 1; i < segments.length; i++) {
    const current = segments[i];
    if (
      current.status === prev.status &&
      current.remarks === prev.remarks
    ) {
      // Extend previous segment end time, adjusting endMins or hours accordingly
      prev.endMins = current.endMins || prev.endMins;
      prev.hours = (prev.hours || 0) + (current.hours || 0);
    } else {
      merged.push(prev);
      prev = current;
    }
  }
  merged.push(prev);
  return merged;
}
