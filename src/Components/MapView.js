import React, { useEffect, useState } from 'react';

import vehicle from '../Data/Vehicle.json';

import L from 'leaflet';

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';




const boatIcon = L.divIcon({
  html: '🚤',
  className: 'boat-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});




const carIcon = L.divIcon({
  html: '🚗',
  className: 'car-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});




const bikeIcon = L.divIcon({
  html: '🏍️',
  className: 'bike-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});




function MapView() {

  // Current position of each vehicle
  const [vehiclePositions, setVehiclePositions] = useState(
    vehicle.map(item => item.locations[0])
  );
 const [travelledPaths, setTravelledPaths] = useState(
    vehicle.map(() => [])
  );
 const indexes = React.useRef(
    vehicle.map(() => 0)
  );


  
  useEffect(() => {

    const interval = setInterval(() => {

      setVehiclePositions(() => {

        return vehicle.map((item, index) => {

          // Move to next location
          indexes.current[index] =
            indexes.current[index] + 1;


          // If the vehicle reaches the last point
          // start again from the first point
          if (
            indexes.current[index] >=
            item.locations.length
          ) {

            indexes.current[index] = 0;

          }


          return item.locations[
            indexes.current[index]
          ];

        });

      });



      setTravelledPaths(prevPaths => {

        return vehicle.map((item, index) => {

          const currentIndex =
            indexes.current[index];


          // Get locations travelled so far
          const travelledLocations =
            item.locations.slice(
              0,
              currentIndex + 1
            );


          return travelledLocations;

        });

      });

    }, 1000);


    return () => clearInterval(interval);

  }, []);


  return (

    <MapContainer
      center={[15.0, 78.0]}
      zoom={6}
      style={{
        height: '600px',
        width: '100%'
      }}
    >

     

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
         {vehicle.map((item, index) => (

        <React.Fragment key={item.id}>
           {travelledPaths[index].length > 1 && (

            <Polyline
              positions={travelledPaths[index].map(
                location => [
                  location.lat,
                  location.lng
                ]
              )}
            />

          )}
        <Marker
            position={[
              vehiclePositions[index].lat,
              vehiclePositions[index].lng
            ]}
            icon={
              item.type === 'boat'
                ? boatIcon
                : item.type === 'car'
                  ? carIcon
                  : bikeIcon
            }
          >

            <Popup>

              <strong>
                {item.name}
              </strong>

              <br />

              Vehicle Type: {item.type}

              <br />

              Route Type: {item.routeType}

              <br />

              Latitude: {
                vehiclePositions[index].lat
              }

              <br />

              Longitude: {
                vehiclePositions[index].lng
              }

            </Popup>

          </Marker>

        </React.Fragment>

      ))}

    </MapContainer>

  );
}

export default MapView;