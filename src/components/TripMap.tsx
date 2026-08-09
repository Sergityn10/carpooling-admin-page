import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { env } from "../env";
import { Card } from "./ui/Card";
import Alert from "./ui/Alert";

import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";

import {
  CircleMarker,
  MapContainer,
  Polyline as LeafletPolyline,
  TileLayer,
  useMap,
} from "react-leaflet";

import { latLngBounds } from "leaflet";

type LatLng = { lat: number; lng: number };

function isValidLatLng(p: LatLng) {
  if (!p) return false;
  const lat = Number(p.lat);
  const lng = Number(p.lng);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

function normalizePath(points: LatLng[]) {
  const filtered = points.filter(isValidLatLng);
  const out: LatLng[] = [];
  for (const p of filtered) {
    const lat = Number(p.lat);
    const lng = Number(p.lng);
    const last = out[out.length - 1];
    if (last && last.lat === lat && last.lng === lng) continue;
    out.push({ lat, lng });
  }
  return out;
}

function LeafletAutoFit(props: { positions: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    if (props.positions.length === 0) return;

    if (props.positions.length === 1) {
      map.setView(props.positions[0], Math.max(map.getZoom(), 13));
      return;
    }

    const b = latLngBounds(props.positions);
    map.fitBounds(b, { padding: [20, 20] });
  }, [map, props.positions]);

  return null;
}

function GoogleTripMap(props: {
  googleKey: string;
  center: LatLng;
  start: LatLng;
  end: LatLng;
  points: LatLng[];
  height: number;
}) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [directionsError, setDirectionsError] = useState(false);

  const start = useMemo(() => ({ lat: Number(props.start.lat), lng: Number(props.start.lng) }), [props.start]);
  const end = useMemo(() => ({ lat: Number(props.end.lat), lng: Number(props.end.lng) }), [props.end]);

  const directionsPath = useMemo<LatLng[]>(() => {
    if (!directions?.routes?.[0]?.overview_path) return [];
    return directions.routes[0].overview_path.map((p) => ({
      lat: p.lat(),
      lng: p.lng(),
    }));
  }, [directions]);

  const path = useMemo(() => {
    const normalized = normalizePath(props.points);
    if (normalized.length >= 2) return normalized;
    return normalizePath([start, end]);
  }, [end, props.points, start]);

  const waypoints = useMemo(() => {
    if (path.length <= 2) return [];
    const inner = path.slice(1, -1);
    // Limitamos los waypoints para evitar sobrepasar el límite de la API de Directions de Google
    if (inner.length > 20) {
      const step = Math.ceil(inner.length / 20);
      return inner
        .filter((_, i) => i % step === 0)
        .map((p) => ({ location: p, stopover: false }));
    }
    return inner.map((p) => ({ location: p, stopover: false }));
  }, [path]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "youconnext-google-maps",
    googleMapsApiKey: props.googleKey,
  });

  const fitToPath = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || !window.google) return;
    if (path.length < 2) return;

    const bounds = new window.google.maps.LatLngBounds();
    for (const p of path) bounds.extend(p);
    map.fitBounds(bounds, 40);
  }, [isLoaded, path]);

  useEffect(() => {
    fitToPath();
  }, [fitToPath]);

  useEffect(() => {
    if (!isLoaded || !window.google?.maps) return;

    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin: start,
        destination: end,
        waypoints,
        optimizeWaypoints: false,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          setDirectionsError(false);
          if (mapRef.current && result.routes[0]?.bounds) {
            mapRef.current.fitBounds(result.routes[0].bounds, 40);
          }
        } else {
          setDirections(null);
          setDirectionsError(true);
        }
      },
    );
  }, [isLoaded, start, end, waypoints]);

  if (loadError) {
    return (
      <Alert title="Error" variant="error">
        No se pudo cargar Google Maps.
      </Alert>
    );
  }

  // Prevenir renderizado si window.google no está hidratado todavía
  if (!isLoaded || typeof window === "undefined" || !window.google) {
    return <Alert title="Cargando">Cargando mapa…</Alert>;
  }

  return (
    <Card className="p-0 overflow-hidden">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: props.height }}
        zoom={13}
        center={props.center}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
        onLoad={(map) => {
          mapRef.current = map;
          fitToPath();
          // El contenedor puede no tener su tamaño final en el momento del onLoad
          // (layouts flex/grid), lo que provoca que fitBounds calcule mal el viewport
          // y los marcadores queden fuera de la vista. Forzamos un resize y reajuste.
          requestAnimationFrame(() => {
            if (!window.google) return;
            window.google.maps.event.trigger(map, "resize");
            fitToPath();
          });
        }}
        onUnmount={() => {
          mapRef.current = null;
        }}
      >
        {/* Iconos vectoriales (SymbolPath) en vez del icono por defecto (imagen),
            ya que muchos ad-blockers bloquean los assets de maps.gstatic.com */}

        <Marker
          position={start}
          label={{ text: "A", color: "#ffffff", fontWeight: "bold" }}
          // icon={{
          //   path: window.google.maps.SymbolPath.CIRCLE,
          //   scale: 12,
          //   fillColor: "black",
          //   fillOpacity: 1,
          //   strokeColor: "#ffffff",
          //   strokeWeight: 2,
          // }}
        />

        <Marker
          position={end}
          label={{ text: "B", color: "#ffffff", fontWeight: "bold" }}
          // icon={{
          //   path: window.google.maps.SymbolPath.CIRCLE,
          //   scale: 12,
          //   fillColor: "#dc2626",
          //   fillOpacity: 1,
          //   strokeColor: "#ffffff",
          //   strokeWeight: 2,
          // }}
        />

        {path.map((point, i) => {
          const isStart =
            point.lat === start.lat && point.lng === start.lng;
          const isEnd =
            point.lat === end.lat && point.lng === end.lng;

          if (isStart || isEnd) return null;

          return (
            <Marker
              key={`path-marker-${i}-${point.lat}-${point.lng}`} // CORRECCIÓN: Key único añadido
              position={point}
              icon={{
                path: window.google.maps.SymbolPath.BACKWARD_OPEN_ARROW,
                scale: 4,
                fillColor: "#22c55e",
                fillOpacity: 0.7,
                strokeColor: "#22c55e",
                strokeWeight: 1,
              }}
            />
          );
        })}

        {path.length > 1 && (
          <Polyline
            path={path}
            options={{
              strokeColor: "green",
              strokeOpacity: 0.8,
              strokeWeight: 3,
            }}
          />
        )}

        {directionsPath.length > 1 && (
          <Polyline
            path={directionsPath}
            options={{
              strokeColor: "#2563eb",
              strokeOpacity: 0.9,
              strokeWeight: 4,
            }}
          />
        )}
      </GoogleMap>
    </Card>
  );
}

function computeCenter(start: LatLng, end: LatLng, points: LatLng[]) {
  if (points.length > 0) return points[Math.floor(points.length / 2)];
  return { lat: (start.lat + end.lat) / 2, lng: (start.lng + end.lng) / 2 };
}

export default function TripMap(props: {
  start: LatLng;
  end: LatLng;
  points: LatLng[];
  height?: number;
}) {
  const [loading, setLoading] = useState(true);
  const height = props.height ?? 422;

  const start = useMemo(() => ({ lat: Number(props.start.lat), lng: Number(props.start.lng) }), [props.start]);
  const end = useMemo(() => ({ lat: Number(props.end.lat), lng: Number(props.end.lng) }), [props.end]);

  const path = useMemo(() => {
    const normalized = normalizePath(props.points);
    if (normalized.length >= 2) return normalized;
    setLoading(false);
    return normalizePath([start, end]);
  }, [end, props.points, start]);

  const center = useMemo(
    () => computeCenter(start, end, path),
    [start, end, path],
  );

  const googleKey = env.googleMapsApiKey;
  // if (loading) {
  //   return <p>Loading</p>;
  // }
  if (googleKey) {
    return (
      <GoogleTripMap
        googleKey={googleKey}
        center={center}
        start={start}
        end={end}
        points={props.points}
        height={height}
      />
    );
  }
  const leafletPoints = useMemo(
    () => path.map((p) => [p.lat, p.lng] as [number, number]),
    [path],
  );

  return (
    <Card className="p-0 overflow-hidden">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height, width: "100%" }}
      >
        <LeafletAutoFit positions={leafletPoints} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {start && (
          <CircleMarker
            center={[start.lat, start.lng]}
            radius={8}
            pathOptions={{
              color: "#16a34a",
              fillColor: "#16a34a",
              fillOpacity: 0.8,
            }}
          />
        )}

        {end && (
          <CircleMarker
            center={[end.lat, end.lng]}
            radius={8}
            pathOptions={{
              color: "#dc2626",
              fillColor: "#dc2626",
              fillOpacity: 0.8,
            }}
          />
        )}

        {leafletPoints
          .filter(
            (p) =>
              !(
                (p[0] === start.lat && p[1] === start.lng) ||
                (p[0] === end.lat && p[1] === end.lng)
              ),
          )
          .map((p, i) => (
            <CircleMarker
              key={`leaflet-marker-${i}-${p[0]}`} // Key mejorado
              center={p}
              radius={3}
              pathOptions={{
                color: "#22c55e",
                fillColor: "#22c55e",
                fillOpacity: 0.5,
                weight: 1,
              }}
            />
          ))}

        {leafletPoints.length > 1 && (
          <LeafletPolyline
            positions={leafletPoints}
            pathOptions={{ color: "#22c55e", weight: 3, opacity: 0.8 }}
          />
        )}
      </MapContainer>
    </Card>
  );
}
