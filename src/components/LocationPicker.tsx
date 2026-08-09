import { useEffect, useRef, useState } from "react";
import { env } from "../env";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMapEvents,
} from "react-leaflet";
import Alert from "./ui/Alert";

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
};

const PLACES_LIBRARIES = ["places"] as const;

const DEFAULT_CENTER = { lat: 40.416775, lng: -3.70379 };

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
}: Props) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: env.googleMapsApiKey ?? "",
    libraries: [...PLACES_LIBRARIES],
  });

  const hasLocation = latitude != null && longitude != null;
  const [center, setCenter] = useState(
    hasLocation ? { lat: latitude!, lng: longitude! } : DEFAULT_CENTER,
  );
  const [error, setError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (hasLocation) {
      setCenter({ lat: latitude!, lng: longitude! });
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (!isLoaded || !env.googleMapsApiKey || !searchInputRef.current) return;
    if (autocompleteRef.current) return;

    const ac = new google.maps.places.Autocomplete(searchInputRef.current, {
      types: ["establishment"],
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setPlaceName(place.name ?? place.formatted_address ?? null);
        onChange(lat, lng);
        setCenter({ lat, lng });
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
        }
      }
    });
    autocompleteRef.current = ac;

    return () => {
      google.maps.event.clearInstanceListeners(ac);
      autocompleteRef.current = null;
    };
  }, [isLoaded, onChange]);

  const handleUseCurrent = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("La geolocalización no está disponible en este navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        onChange(lat, lng);
        setCenter({ lat, lng });
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
        }
      },
      (err) => {
        setError(err.message || "No se pudo obtener la ubicación.");
      },
    );
  };

  const handleMapClick = (lat: number, lng: number) => {
    onChange(lat, lng);
  };

  const handleClear = () => {
    onChange(0, 0);
    setError(null);
    setPlaceName(null);
    if (searchInputRef.current) searchInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {isLoaded && env.googleMapsApiKey ? (
        <div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar lugar (ej. Estadio Wanda Metropolitano)…"
            className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm"
          />
          <div className="mt-1 text-xs text-gray-500">
            Busca lugares y establecimientos, no direcciones.
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleUseCurrent}
          className="rounded-lg border border-panel-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-panel-50"
        >
          Usar ubicación actual
        </button>
        <button
          type="button"
          onClick={() => setMapOpen((v) => !v)}
          className="rounded-lg border border-panel-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-panel-50"
        >
          {mapOpen ? "Cerrar mapa" : "Seleccionar en mapa"}
        </button>
        {hasLocation ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-medium text-red-600 hover:text-red-700"
          >
            Quitar
          </button>
        ) : null}
      </div>

      {hasLocation ? (
        <div className="rounded-lg bg-panel-50 px-3 py-2 text-xs text-gray-700">
          {placeName ? (
            <span className="font-medium text-gray-900">{placeName}</span>
          ) : null}
          {placeName ? " — " : ""}
          Lat: {latitude!.toFixed(6)}, Lng: {longitude!.toFixed(6)}
        </div>
      ) : null}

      {error ? <Alert variant="error">{error}</Alert> : null}

      {mapOpen ? (
        <div className="h-64 w-full overflow-hidden rounded-lg border border-panel-200">
          {isLoaded && env.googleMapsApiKey ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={center}
              zoom={hasLocation ? 14 : 6}
              onClick={(e) => {
                if (e.latLng) {
                  handleMapClick(e.latLng.lat(), e.latLng.lng());
                }
              }}
              onLoad={(map) => {
                mapRef.current = map;
              }}
            >
              {hasLocation ? (
                <Marker position={{ lat: latitude!, lng: longitude! }} />
              ) : null}
            </GoogleMap>
          ) : (
            <LeafletPicker
              center={center}
              hasLocation={hasLocation}
              latitude={latitude}
              longitude={longitude}
              onClick={handleMapClick}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function LeafletPicker({
  center,
  hasLocation,
  latitude,
  longitude,
  onClick,
}: {
  center: { lat: number; lng: number };
  hasLocation: boolean;
  latitude?: number | null;
  longitude?: number | null;
  onClick: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={hasLocation ? 14 : 6}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />
      <ClickHandler onClick={onClick} />
      {hasLocation ? (
        <CircleMarker
          center={[latitude!, longitude!]}
          radius={8}
          pathOptions={{
            color: "#1e40af",
            fillColor: "#3b82f6",
            fillOpacity: 0.8,
          }}
        />
      ) : null}
    </MapContainer>
  );
}

function ClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
