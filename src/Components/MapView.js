import React, {
  useEffect,
  useRef,
  useState
} from "react";

import vehicle from "../Data/Vehicle.json";
import routes from "../Data/Routes.json";

import L from "leaflet";

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup
} from "react-leaflet";

import "leaflet/dist/leaflet.css";


// =====================================================
// VEHICLE ICONS
// =====================================================

const boatIcon = L.divIcon({
  html: `
    <div style="
      font-size: 28px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      🚤
    </div>
  `,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});


const carIcon = L.divIcon({
  html: `
    <div style="
      font-size: 28px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      🚗
    </div>
  `,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});


const bikeIcon = L.divIcon({
  html: `
    <div style="
      font-size: 28px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      🏍️
    </div>
  `,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});


// =====================================================
// GET VEHICLE ICON
// =====================================================

const getVehicleIcon = (type) => {

  if (type === "boat") {
    return boatIcon;
  }

  if (type === "car") {
    return carIcon;
  }

  return bikeIcon;
};


// =====================================================
// GET POSITION
// =====================================================

const getPosition = (route, progress) => {

  if (
    !route ||
    !route.locations ||
    route.locations.length === 0
  ) {
    return {
      lat: 20,
      lng: 78
    };
  }


  const locations = route.locations;

  const lastIndex = locations.length - 1;


  // Destination reached
  if (progress >= lastIndex) {
    return locations[lastIndex];
  }


  // Starting point
  if (progress <= 0) {
    return locations[0];
  }


  const index = Math.floor(progress);

  const nextIndex = index + 1;

  const point1 = locations[index];

  const point2 = locations[nextIndex];


  // Smooth interpolation
  const percentage = progress - index;


  return {

    lat:
      point1.lat +
      (point2.lat - point1.lat) *
      percentage,

    lng:
      point1.lng +
      (point2.lng - point1.lng) *
      percentage

  };
};


// =====================================================
// GET TRAVELLED PATH
// =====================================================

const getTravelledPath = (
  route,
  progress
) => {

  if (
    !route ||
    !route.locations ||
    route.locations.length === 0
  ) {
    return [];
  }


  const locations = route.locations;

  const lastIndex =
    locations.length - 1;


  // Destination reached
  if (progress >= lastIndex) {
    return locations;
  }


  const index =
    Math.floor(progress);


  const path =
    locations.slice(
      0,
      index + 1
    );


  // Add current moving position
  if (index < lastIndex) {

    const currentPosition =
      getPosition(
        route,
        progress
      );

    path.push(currentPosition);
  }


  return path;
};


// =====================================================
// CHECK VEHICLE ROUTE
// =====================================================

const isVehicleAllowedOnRoute = (
  item,
  route
) => {

  if (!route) {
    return false;
  }


  // Boat → sea route only
  if (
    item.type === "boat" &&
    route.routeType !== "sea"
  ) {
    return false;
  }


  // Car / Bike → land route only
  if (
    item.type !== "boat" &&
    route.routeType === "sea"
  ) {
    return false;
  }


  return true;
};


// =====================================================
// MAIN COMPONENT
// =====================================================

function MapView() {


  // ===================================================
  // INITIAL PROGRESS
  // ===================================================

  const initialProgress =
    vehicle.map((item) => {

      const route =
        routes[item.routeId];


      if (!route) {
        return 0;
      }


      const lastIndex =
        route.locations.length - 1;


      const startingPoint =
        Number(item.startIndex) || 0;


      return Math.min(
        Math.max(
          startingPoint,
          0
        ),
        lastIndex
      );

    });


  // ===================================================
  // PROGRESS STATE
  // ===================================================

  const [progress, setProgress] =
    useState(initialProgress);


  // ===================================================
  // PROGRESS REF
  // ===================================================

  const progressRef =
    useRef(initialProgress);


  // ===================================================
  // FAST ANIMATION
  // ===================================================

  useEffect(() => {

    /*
      Animation settings

      50ms  = very frequent screen update
      speed = how far vehicle moves
    */

    const interval =
      setInterval(() => {


        const current =
          [...progressRef.current];


        // =================================================
        // GROUP VEHICLES BY ROUTE
        // =================================================

        const routeGroups = {};


        vehicle.forEach(
          (item, index) => {

            if (!routeGroups[item.routeId]) {

              routeGroups[item.routeId] = [];

            }


            routeGroups[
              item.routeId
            ].push(index);

          }
        );


        // =================================================
        // PROCESS EACH ROUTE
        // =================================================

        Object.values(routeGroups)
          .forEach(
            (vehicleIndexes) => {


              // Sort vehicles based on
              // current progress

              vehicleIndexes.sort(
                (a, b) =>
                  current[b] -
                  current[a]
              );


              let frontPosition =
                null;


              // =================================================
              // MOVE EACH VEHICLE
              // =================================================

              vehicleIndexes.forEach(
                (vehicleIndex) => {


                  const item =
                    vehicle[
                      vehicleIndex
                    ];


                  const route =
                    routes[
                      item.routeId
                    ];


                  // Route doesn't exist
                  if (!route) {
                    return;
                  }


                  // Vehicle not allowed
                  // on this route
                  if (
                    !isVehicleAllowedOnRoute(
                      item,
                      route
                    )
                  ) {
                    return;
                  }


                  const lastIndex =
                    route.locations.length - 1;


                  const currentPosition =
                    current[
                      vehicleIndex
                    ];


                  // =================================================
                  // DESTINATION REACHED
                  // =================================================

                  if (
                    currentPosition >=
                    lastIndex
                  ) {

                    current[
                      vehicleIndex
                    ] = lastIndex;


                    frontPosition =
                      lastIndex;


                    return;
                  }


                  // =================================================
                  // FAST SPEED
                  // =================================================

                  /*
                    You can control speed
                    directly from Vehicle.json.

                    Example:

                    "speed": 0.20

                    Higher number = faster
                  */

                  const speed =
                    Number(item.speed) ||
                    0.20;


                  let newPosition =
                    currentPosition +
                    speed;


                  // Never go beyond destination

                  if (
                    newPosition >
                    lastIndex
                  ) {

                    newPosition =
                      lastIndex;

                  }


                  // =================================================
                  // TRAFFIC GAP
                  // =================================================

                  const minimumGap =
                    0.8;


                  if (
                    frontPosition !== null
                  ) {

                    const maximumPosition =
                      frontPosition -
                      minimumGap;


                    if (
                      newPosition >
                      maximumPosition
                    ) {

                      newPosition =
                        Math.max(
                          currentPosition,
                          maximumPosition
                        );

                    }

                  }


                  // =================================================
                  // SAVE POSITION
                  // =================================================

                  current[
                    vehicleIndex
                  ] = newPosition;


                  frontPosition =
                    newPosition;

                }
              );

            }
          );


        // =================================================
        // UPDATE REF
        // =================================================

        progressRef.current =
          current;


        // =================================================
        // UPDATE SCREEN
        // =================================================

        setProgress(current);


      }, 50);


    // ===================================================
    // CLEANUP
    // ===================================================

    return () => {

      clearInterval(interval);

    };

  }, []);


  // =====================================================
  // MAP
  // =====================================================

  return (

    <MapContainer

      center={[
        20.0,
        78.0
      ]}

      zoom={5}

      style={{
        height: "600px",
        width: "100%"
      }}

    >


      {/* =================================================
          OPEN STREET MAP
      ================================================= */}

      <TileLayer

        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

        attribution="&copy; OpenStreetMap contributors"

      />


      {/* =================================================
          VEHICLES
      ================================================= */}

      {vehicle.map(
        (item, index) => {


          // =================================================
          // GET ROUTE
          // =================================================

          const route =
            routes[
              item.routeId
            ];


          // Route not found

          if (!route) {

            console.warn(
              `Route not found: ${item.routeId}`
            );

            return null;

          }


          // =================================================
          // CHECK ROUTE TYPE
          // =================================================

          if (
            !isVehicleAllowedOnRoute(
              item,
              route
            )
          ) {

            return null;

          }


          // =================================================
          // CURRENT PROGRESS
          // =================================================

          const currentProgress =
            progress[index];


          // =================================================
          // CURRENT POSITION
          // =================================================

          const currentPosition =
            getPosition(
              route,
              currentProgress
            );


          // =================================================
          // TRAVELLED PATH
          // =================================================

          const travelledPath =
            getTravelledPath(
              route,
              currentProgress
            );


          // =================================================
          // LEAFLET COORDINATES
          // =================================================

          const pathCoordinates =
            travelledPath.map(
              (location) => [
                location.lat,
                location.lng
              ]
            );


          // =================================================
          // RENDER
          // =================================================

          return (

            <React.Fragment
              key={item.id}
            >


              {/* ==========================================
                  TRAVELLED PATH
              ========================================== */}

              {pathCoordinates.length > 1 && (

                <Polyline

                  positions={
                    pathCoordinates
                  }

                  weight={3}

                  opacity={0.6}

                />

              )}


              {/* ==========================================
                  VEHICLE MARKER
              ========================================== */}

              <Marker

                position={[
                  currentPosition.lat,
                  currentPosition.lng
                ]}

                icon={
                  getVehicleIcon(
                    item.type
                  )
                }

              >


                {/* ========================================
                    VEHICLE POPUP
                ======================================== */}

                <Popup>

                  <div>

                    <strong>
                      {item.name}
                    </strong>

                    <br />
                    <br />

                    <strong>
                      Vehicle:
                    </strong>{" "}
                    {item.type}

                    <br />

                    <strong>
                      From:
                    </strong>{" "}
                    {item.start}

                    <br />

                    <strong>
                      To:
                    </strong>{" "}
                    {item.end}

                    <br />

                    <strong>
                      Route:
                    </strong>{" "}
                    {item.routeId}

                    <br />

                    <strong>
                      Route Type:
                    </strong>{" "}
                    {route.routeType}

                    <br />

                    <strong>
                      Speed:
                    </strong>{" "}
                    {item.speed}

                    <br />
                    <br />

                    <strong>
                      Latitude:
                    </strong>{" "}

                    {currentPosition.lat.toFixed(
                      4
                    )}

                    <br />

                    <strong>
                      Longitude:
                    </strong>{" "}

                    {currentPosition.lng.toFixed(
                      4
                    )}

                  </div>

                </Popup>


              </Marker>


            </React.Fragment>

          );

        }
      )}


    </MapContainer>

  );

}


export default MapView;