"use client"
// app/page.tsx
import dynamic from 'next/dynamic';

// Dynamically import the client component with SSR disabled
const MapComponent = dynamic(() => import('../../components/map'), {
  ssr: false,
});

export default function HomePage() {
  return (
    <main>
      <h1>My Leaflet Heatmap</h1>
      <MapComponent />
    </main>
  );
}
