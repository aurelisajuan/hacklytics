// 'use client';

// import React from 'react';
// import { MapContainer, TileLayer } from 'react-leaflet';
// import HeatmapLayer from '../src/HeatmapLayer';
// import { addressPoints } from './realworld.10000.js';

// const MapExample = () => {
//   return (
//     <div>
//       <MapContainer center={[0,0]} zoom={13}>
//         <HeatmapLayer
//           fitBoundsOnLoad
//           fitBoundsOnUpdate
//           points={addressPoints}
//           longitudeExtractor={m => m[1]}
//           latitudeExtractor={m => m[0]} 
//           intensityExtractor={m => parseFloat(m[2])}
//         />
//         <TileLayer
//           url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
//           attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
//         />
//       </MapContainer>
//     </div>
//   );
// };

// export default MapExample;