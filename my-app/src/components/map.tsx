// components/MapComponent.tsx
'use client';

import { useEffect } from 'react';
import 'leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

const MapComponent: React.FC = () => {
  useEffect(() => {
    // Initialize the map once the component mounts
    const map = L.map('map').setView([51.505, -0.09], 13);

    // Add an OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Sample heatmap data: [latitude, longitude, intensity]
    const heatData: [number, number, number][] = [
      [51.505, -0.09, 0.5],
      [51.51, -0.1, 0.8],
      [51.51, -0.12, 0.2],
    ];

    // Create and add the heat layer
    L.heatLayer(heatData, { radius: 25 }).addTo(map);
  }, []);

  return <div id="map" style={{ height: '500px', width: '100%' }} />;
};

export default MapComponent;
