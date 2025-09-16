/**
 * Generates an array of remarks for the log graph based on route stops and a trip start time.
 * Each remark corresponds to a stop, positioned on the graph's timeline.
 *
 * @param {Array<Object>} routeStops - An array of stop objects, each with a `timestamp`, `name`, and optional `details`.
 * @param {string|number} tripStartTime - The ISO string or millisecond timestamp representing the start of the trip.
 * @returns {Array<Object>} An array of remark objects formatted for the graph, each with `startMins`, `label`, and `details`.
 */
export function generateRemarks(routeStops, tripStartTime) {
  const tripStartMs = new Date(tripStartTime).getTime();
  // Validate inputs: ensure trip start time is valid and routeStops is an array.
  if (isNaN(tripStartMs) || !Array.isArray(routeStops)) {
    return [];
  }
  return routeStops.map(stop => {
    const stopTimeMs = new Date(stop.timestamp).getTime();
    const diffMins = Math.max(0, Math.round((stopTimeMs - tripStartMs) / 60000));
    return {
      startMins: diffMins,
      label: stop.name,
      details: stop.details || '',
    };
  }).filter(r => r.label); // Only include remarks that have a label.
}
