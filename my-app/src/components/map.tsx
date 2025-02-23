import React from 'react'
import { DeckGL } from '@deck.gl/react'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import Map from 'react-map-gl/mapbox';
import { ScatterplotLayer } from '@deck.gl/aggregation-layers'
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '' // supply your token here
interface DataPoint {
  lat: number
  lng: number
}

const MapPoints: React.FC = () => {
  // Generate sample data:
  // 80% of the points are clustered around New York (40.7128, -74.0060),
  // 20% are randomly scattered across the globe.
  const totalPoints = 300
  const clusteredCount = Math.floor(totalPoints * 0.8)
  const randomCount = totalPoints - clusteredCount
  const data: DataPoint[] = []

  // Clustered data around New York.
  for (let i = 0; i < clusteredCount; i++) {
    const latOffset = (Math.random() - 0.5) * 1.0  // within ±0.5°
    const lngOffset = (Math.random() - 0.5) * 1.0
    data.push({
      lat: 40.7128 + latOffset,
      lng: -74.0060 + lngOffset
    })
  }

  // Random global data.
  for (let i = 0; i < randomCount; i++) {
    const lat = -90 + Math.random() * 180
    const lng = -180 + Math.random() * 360
    data.push({ lat, lng })
  }

  // Create a ScatterplotLayer for red dots.
  // The getPosition accessor expects [lng, lat].
  const scatterplotLayer = new ScatterplotLayer({
    id: 'scatterplot-layer',
    data,
    getPosition: (d: DataPoint) => [d.lng, d.lat],
    getFillColor: [255, 0, 0], // red color
    getRadius: 10000,         // radius in meters (adjustable)
    radiusMinPixels: 3,       // minimum pixel size
    radiusMaxPixels: 10,      // maximum pixel size
    pickable: true            // optional, for interactivity
  })

  // Configure the initial view state.
  const initialViewState = {
    longitude: -74.0060,
    latitude: 40.7128,
    zoom: 2,
    pitch: 0,
    bearing: 0
  }



  return (
    <DeckGL
      initialViewState={initialViewState}
      controller={true}
      layers={[heatmapLayer]}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
<Map

      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: -100,
        latitude: 40,
        zoom: 3.5
      }}
      style={{width: 600, height: 400}}
      mapStyle="mapbox://styles/mapbox/streets-v9"
    />
    </DeckGL>
  )
}

export default MapHeatmap
