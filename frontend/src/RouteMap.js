import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import polyline from 'polyline-encoded';

// Fix for default marker icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapBounds = ({ geometry }) => {
  const map = useMap();
  useEffect(() => {
    if (geometry) {
      const bounds = L.latLngBounds(geometry);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, geometry]);
  return null;
};

const RouteMap = ({ routeStops = [], routeGeometry }) => {
  if (!routeGeometry) {
    return <div>No route data available to draw.</div>;
  }

  // Decode the polyline from the API response
  const decodedPolyline = polyline.decode(routeGeometry);

  if (decodedPolyline.length < 2) {
    return <div>Not enough points to draw a route.</div>;
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <MapContainer
        bounds={decodedPolyline}
        boundsOptions={{ padding: [50, 50] }}
        scrollWheelZoom={true}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds geometry={decodedPolyline} />
        <Polyline pathOptions={{ color: 'blue' }} positions={decodedPolyline} />

        {/* Markers for all stops */}
        {routeStops.map((stop, index) => (
          <Marker key={index} position={[stop.location[1], stop.location[0]]}>
            <Popup>
              <b>{stop.name}</b>
              <br />
              {stop.details}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default RouteMap;