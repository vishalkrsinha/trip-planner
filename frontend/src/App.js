import React, { useState, useReducer } from 'react';
import './App.css';
import RouteMap from './RouteMap';
import MultiDayLogs from './components/MultiDayLogs';
import DailyLogHeader from './components/DailyLogHeader';
import { generateRemarks } from './utils/remarksGenerator';
import { groupAndConvertLogs } from './utils/logProcessor';
import { generateBreaks } from './utils/breakGenerator';
import { createTrip } from './tripService';

const initialState = {
  routeGeometry: null,
  dailyLogs: [],
  remarks: [],
  routeStops: [],
  breaks: [],
  loading: false,
  error: null,
};

function tripReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...initialState, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, ...action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'UPDATE_MILES':
      return { ...state, miles: action.payload };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function App() {
  // Form state for inputs
  const [formData, setFormData] = useState({
    current_location: 'Washington, D.C.',
    pickup_location: 'Washington, D.C.',
    dropoff_location: 'Baltimore, MD',
    current_cycle_used_hours: 0,
  });

  // General info state for display
  const [info, setInfo] = useState({
    date: new Date().toISOString().substring(0, 10),
    carrier: "John Doe's Transportation",
    address: "Washington, D.C.",
    driver: "John E. Doe",
    vehicle: '',
    shippingNo: '',
    miles: '',
  });

  const [tripState, dispatch] = useReducer(tripReducer, initialState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "current_cycle_used_hours") {
      const valNum = Number(value);
      if (isNaN(valNum) || valNum < 0 || valNum > 70) {
        dispatch({
          type: 'FETCH_ERROR',
          payload: "Cycle Used must be between 0 and 70 hours."
        });
        return;
      } else {
        dispatch({ type: 'FETCH_ERROR', payload: null });
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Info input change handler
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: value }));
  };

  // Submit handler sends API call with current formData including cycle used
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: 'FETCH_START' });

    try {
      const response = await createTrip(formData);

      const dailyLogsApi = Array.isArray(response.data.dailyLogs) ? response.data.dailyLogs : [];
      const generatedBreaks = generateBreaks(dailyLogsApi);
      const realRouteStops = response.data.routeStops || [];
      const realTripStartTime = response.data.tripStartTime || new Date().toISOString();
      const generatedRemarks = generateRemarks(realRouteStops, realTripStartTime);

      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          routeGeometry: response.data.routeGeometry,
          dailyLogs: dailyLogsApi,
          breaks: generatedBreaks,
          remarks: generatedRemarks,
          routeStops: realRouteStops,
        },
      });

      const totalMeters = response.data.routeInstructions?.reduce((sum, step) => sum + (step.distance || 0), 0) || 0;
      const miles = (totalMeters * 0.000621371).toFixed(2);
      setInfo(prev => ({ ...prev, miles }));
    } catch (err) {
      dispatch({
        type: 'FETCH_ERROR',
        payload: err.message || 'An unexpected error occurred. Please try again.',
      });
    }
  };

  // Prepare grouped segments for rendering
  const groupedSegments = groupAndConvertLogs(tripState.dailyLogs);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Trip Planner & ELD Log Generator</h1>
      </header>
      <main>
        <form
          onSubmit={handleSubmit}
          style={{
            maxWidth: 720,
            margin: '2rem auto 1rem auto',
            background: '#f8faff',
            border: '1px solid #e0e8f2',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 20 }}>
            <div>
              <label>Date:</label><br />
              <input
                type="date"
                name="date"
                value={info.date}
                onChange={handleInfoChange}
                required
                placeholder="Date"
              />
            </div>
            <div>
              <label>Carrier:</label><br />
              <input
                type="text"
                name="carrier"
                value={info.carrier}
                onChange={handleInfoChange}
                required
                placeholder="Carrier"
              />
            </div>
            <div>
              <label>Address:</label><br />
              <input
                type="text"
                name="address"
                value={info.address}
                onChange={handleInfoChange}
                required
                placeholder="Address"
              />
            </div>
            <div>
              <label>Driver Name:</label><br />
              <input
                type="text"
                name="driver"
                value={info.driver}
                onChange={handleInfoChange}
                required
                placeholder="Driver"
              />
            </div>
            <div>
              <label>Vehicle No:</label><br />
              <input
                type="text"
                name="vehicle"
                value={info.vehicle}
                onChange={handleInfoChange}
                placeholder="Vehicle"
              />
            </div>
            <div>
              <label>Pro/Shipping No:</label><br />
              <input
                type="text"
                name="shippingNo"
                value={info.shippingNo}
                onChange={handleInfoChange}
                placeholder="Pro/Shipping No"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="current_location">Current Location:</label>
            <input
              type="text"
              name="current_location"
              value={formData.current_location}
              onChange={handleChange}
              required
              placeholder="Current location"
            />
          </div>

          <div className="form-group">
            <label htmlFor="pickup_location">Pickup Location:</label>
            <input
              type="text"
              name="pickup_location"
              value={formData.pickup_location}
              onChange={handleChange}
              required
              placeholder="Pickup location"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dropoff_location">Drop-off Location:</label>
            <input
              type="text"
              name="dropoff_location"
              value={formData.dropoff_location}
              onChange={handleChange}
              required
              placeholder="DropOff location"
            />
          </div>

          <div className="form-group">
            <label htmlFor="current_cycle_used_hours">Current Cycle Used (Hrs):</label>
            <input
              type="number"
              name="current_cycle_used_hours"
              value={formData.current_cycle_used_hours}
              onChange={handleChange}
              required
              placeholder="Current Cycle Used Hours"
              min={0}
            />
          </div>

          <button type="submit" disabled={tripState.loading}>
            {tripState.loading ? 'Calculating...' : 'Generate Trip'}
          </button>
        </form>

        {tripState.error && <div className="error-message">{tripState.error}</div>}

        <DailyLogHeader info={info} miles={info.miles} date={info.date} />

        {tripState.routeGeometry && (
          <div className="trip-results">
            <h2>Trip Plan Generated!</h2>
            <RouteMap routeStops={tripState.routeStops} routeGeometry={tripState.routeGeometry} />
          </div>
        )}

        {groupedSegments.length > 0 && (
          <div className="eld-logs" style={{ marginTop: '2rem' }}>
            <h3>ELD Daily Logs</h3>
            <MultiDayLogs dailyLogs={groupedSegments} remarks={tripState.remarks} breaks={tripState.breaks} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;