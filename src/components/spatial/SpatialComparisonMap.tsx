import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Circle as GoogleCircle,
  GoogleMap,
  Polygon as GooglePolygon,
  Polyline as GooglePolyline,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  CircleMarker,
  MapContainer,
  Polygon as LeafletPolygon,
  Polyline as LeafletPolyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { latLngBounds } from "leaflet";
import clsx from "clsx";
import type { GeoJsonGeometry } from "../../api/types";
import { env } from "../../env";
import {
  collectAllPoints,
  extractGeoJsonShapes,
  toLeafletPositions,
  type ExtractedGeoJsonShapes,
  type LatLngPoint,
} from "../../lib/geojson";
import Alert from "../ui/Alert";
import { Card } from "../ui/Card";

type LayerVisibility = {
  pasillo: boolean;
  driver: boolean;
  passenger: boolean;
  overlap: boolean;
};

type RenderLayer = {
  key: keyof LayerVisibility;
  shapes: ExtractedGeoJsonShapes;
  color: string;
  weight: number;
  opacity: number;
  fillColor?: string;
  fillOpacity?: number;
  zIndex: number;
};

const DEFAULT_CENTER: LatLngPoint = { lat: 40.416775, lng: -3.70379 };

function computeCenter(points: LatLngPoint[]): LatLngPoint {
  if (points.length === 0) return DEFAULT_CENTER;
  return points[Math.floor(points.length / 2)];
}

function LeafletAutoFit({ positions }: { positions: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], Math.max(map.getZoom(), 14));
      return;
    }
    map.fitBounds(latLngBounds(positions), { padding: [24, 24] });
  }, [map, positions]);

  return null;
}

function GoogleSpatialMap({
  googleKey,
  height,
  fitPoints,
  layers,
}: {
  googleKey: string;
  height: number;
  fitPoints: LatLngPoint[];
  layers: RenderLayer[];
}) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const center = useMemo(() => computeCenter(fitPoints), [fitPoints]);

  // Debe coincidir con TripMap.tsx para compartir el mismo loader de Google Maps en TripDetailPage
  const { isLoaded, loadError } = useJsApiLoader({
    id: "youconnext-google-maps",
    googleMapsApiKey: googleKey,
  });

  const fitBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || !window.google?.maps || fitPoints.length === 0) {
      return;
    }
    if (fitPoints.length === 1) {
      map.setCenter(fitPoints[0]);
      map.setZoom(15);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    for (const pt of fitPoints) bounds.extend(pt);
    map.fitBounds(bounds, 40);
  }, [fitPoints, isLoaded]);

  useEffect(() => {
    fitBounds();
  }, [fitBounds]);

  if (loadError) {
    return (
      <Alert title="Error" variant="error">
        No se pudo cargar Google Maps.
      </Alert>
    );
  }

  if (!isLoaded || typeof window === "undefined" || !window.google) {
    return <Alert title="Cargando">Cargando mapa espacial…</Alert>;
  }

  return (
    <Card className="overflow-hidden p-0">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height }}
        zoom={13}
        center={center}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
        onLoad={(map) => {
          mapRef.current = map;
          requestAnimationFrame(() => {
            if (!window.google?.maps) return;
            window.google.maps.event.trigger(map, "resize");
            fitBounds();
          });
        }}
        onUnmount={() => {
          mapRef.current = null;
        }}
      >
        {layers.map((layer) => (
          <div key={layer.key}>
            {layer.shapes.polygons.map((rings, polyIdx) => (
              <GooglePolygon
                key={`${layer.key}-poly-${polyIdx}`}
                paths={rings}
                options={{
                  strokeColor: layer.color,
                  strokeOpacity: layer.opacity,
                  strokeWeight: layer.weight,
                  fillColor: layer.fillColor ?? layer.color,
                  fillOpacity: layer.fillOpacity ?? 0.18,
                  zIndex: layer.zIndex,
                }}
              />
            ))}
            {layer.shapes.lines.map((line, lineIdx) => (
              <GooglePolyline
                key={`${layer.key}-line-${lineIdx}`}
                path={line}
                options={{
                  strokeColor: layer.color,
                  strokeOpacity: layer.opacity,
                  strokeWeight: layer.weight,
                  zIndex: layer.zIndex,
                }}
              />
            ))}
            {layer.shapes.points.map((pt, ptIdx) => (
              <GoogleCircle
                key={`${layer.key}-pt-${ptIdx}`}
                center={pt}
                radius={12}
                options={{
                  strokeColor: layer.color,
                  strokeOpacity: 0.9,
                  strokeWeight: 2,
                  fillColor: layer.color,
                  fillOpacity: 0.5,
                  zIndex: layer.zIndex,
                }}
              />
            ))}
          </div>
        ))}
      </GoogleMap>
    </Card>
  );
}

function LeafletSpatialMap({
  height,
  fitPoints,
  layers,
}: {
  height: number;
  fitPoints: LatLngPoint[];
  layers: RenderLayer[];
}) {
  const center = useMemo(() => computeCenter(fitPoints), [fitPoints]);
  const leafletFitPositions = useMemo(
    () => toLeafletPositions(fitPoints),
    [fitPoints],
  );

  return (
    <Card className="overflow-hidden p-0">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height, width: "100%" }}
      >
        <LeafletAutoFit positions={leafletFitPositions} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {layers.map((layer) => (
          <div key={layer.key}>
            {layer.shapes.polygons.map((rings, polyIdx) => (
              <LeafletPolygon
                key={`${layer.key}-poly-${polyIdx}`}
                positions={rings.map(toLeafletPositions)}
                pathOptions={{
                  color: layer.color,
                  opacity: layer.opacity,
                  weight: layer.weight,
                  fillColor: layer.fillColor ?? layer.color,
                  fillOpacity: layer.fillOpacity ?? 0.18,
                }}
              />
            ))}
            {layer.shapes.lines.map((line, lineIdx) => (
              <LeafletPolyline
                key={`${layer.key}-line-${lineIdx}`}
                positions={toLeafletPositions(line)}
                pathOptions={{
                  color: layer.color,
                  opacity: layer.opacity,
                  weight: layer.weight,
                }}
              />
            ))}
            {layer.shapes.points.map((pt, ptIdx) => (
              <CircleMarker
                key={`${layer.key}-pt-${ptIdx}`}
                center={[pt.lat, pt.lng]}
                radius={5}
                pathOptions={{
                  color: layer.color,
                  fillColor: layer.color,
                  fillOpacity: 0.7,
                  weight: 2,
                }}
              />
            ))}
          </div>
        ))}
      </MapContainer>
    </Card>
  );
}

function hasAnyShape(shapes: ExtractedGeoJsonShapes): boolean {
  return (
    shapes.points.length > 0 ||
    shapes.lines.length > 0 ||
    shapes.polygons.length > 0
  );
}

/**
 * Mapa comparativo de capas espaciales (pasillo ST_Buffer, conductor, pasajero y tramo coincidente).
 */
export default function SpatialComparisonMap({
  driverGeojson,
  pasilloGeojson,
  passengerGeojson,
  tramoCoincidenteGeojson,
  isMatch = false,
  height = 420,
}: {
  driverGeojson?: GeoJsonGeometry | null;
  pasilloGeojson?: GeoJsonGeometry | null;
  passengerGeojson?: GeoJsonGeometry | null;
  tramoCoincidenteGeojson?: GeoJsonGeometry | null;
  isMatch?: boolean;
  height?: number;
}) {
  const [visible, setVisible] = useState<LayerVisibility>({
    pasillo: true,
    driver: true,
    passenger: true,
    overlap: true,
  });

  const pasilloShapes = useMemo(
    () => extractGeoJsonShapes(pasilloGeojson),
    [pasilloGeojson],
  );
  const driverShapes = useMemo(
    () => extractGeoJsonShapes(driverGeojson),
    [driverGeojson],
  );
  const passengerShapes = useMemo(
    () => extractGeoJsonShapes(passengerGeojson),
    [passengerGeojson],
  );
  const overlapShapes = useMemo(
    () => extractGeoJsonShapes(tramoCoincidenteGeojson),
    [tramoCoincidenteGeojson],
  );

  const passengerColor = isMatch ? "#f97316" : "#dc2626";

  const layerItems = useMemo(
    () => [
      {
        key: "pasillo" as const,
        label: "Pasillo (ST_Buffer)",
        color: "#0284c7",
        swatchBg: "bg-sky-200 border border-sky-600",
        hasData: hasAnyShape(pasilloShapes),
      },
      {
        key: "driver" as const,
        label: "Conductor",
        color: "#2563eb",
        swatchBg: "bg-blue-600",
        hasData: hasAnyShape(driverShapes),
      },
      {
        key: "passenger" as const,
        label: isMatch ? "Pasajero (coincide)" : "Pasajero (no coincide)",
        color: passengerColor,
        swatchBg: isMatch ? "bg-orange-500" : "bg-red-600",
        hasData: hasAnyShape(passengerShapes),
      },
      {
        key: "overlap" as const,
        label: "Tramo coincidente",
        color: "#16a34a",
        swatchBg: "bg-green-600",
        hasData: hasAnyShape(overlapShapes),
      },
    ],
    [
      driverShapes,
      isMatch,
      overlapShapes,
      pasilloShapes,
      passengerColor,
      passengerShapes,
    ],
  );

  const activeLayers = useMemo<RenderLayer[]>(() => {
    const out: RenderLayer[] = [];
    if (visible.pasillo && hasAnyShape(pasilloShapes)) {
      out.push({
        key: "pasillo",
        shapes: pasilloShapes,
        color: "#0284c7",
        weight: 1.5,
        opacity: 0.75,
        fillColor: "#0ea5e9",
        fillOpacity: 0.18,
        zIndex: 1,
      });
    }
    if (visible.driver && hasAnyShape(driverShapes)) {
      out.push({
        key: "driver",
        shapes: driverShapes,
        color: "#2563eb",
        weight: 4,
        opacity: 0.85,
        zIndex: 2,
      });
    }
    if (visible.passenger && hasAnyShape(passengerShapes)) {
      out.push({
        key: "passenger",
        shapes: passengerShapes,
        color: passengerColor,
        weight: 4,
        opacity: 0.9,
        zIndex: 3,
      });
    }
    if (visible.overlap && hasAnyShape(overlapShapes)) {
      out.push({
        key: "overlap",
        shapes: overlapShapes,
        color: "#16a34a",
        weight: 6,
        opacity: 0.95,
        zIndex: 4,
      });
    }
    return out;
  }, [
    driverShapes,
    overlapShapes,
    pasilloShapes,
    passengerColor,
    passengerShapes,
    visible,
  ]);

  const allPoints = useMemo(
    () =>
      collectAllPoints(
        pasilloGeojson,
        driverGeojson,
        passengerGeojson,
        tramoCoincidenteGeojson,
      ),
    [
      driverGeojson,
      pasilloGeojson,
      passengerGeojson,
      tramoCoincidenteGeojson,
    ],
  );

  const visiblePoints = useMemo(
    () =>
      collectAllPoints(
        visible.pasillo ? pasilloGeojson : null,
        visible.driver ? driverGeojson : null,
        visible.passenger ? passengerGeojson : null,
        visible.overlap ? tramoCoincidenteGeojson : null,
      ),
    [
      driverGeojson,
      pasilloGeojson,
      passengerGeojson,
      tramoCoincidenteGeojson,
      visible,
    ],
  );

  const fitPoints = visiblePoints.length > 0 ? visiblePoints : allPoints;

  const toggleLayer = (key: keyof LayerVisibility) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (allPoints.length === 0) {
    return (
      <Alert variant="info">
        No hay geometrías GeoJSON disponibles para representar en el mapa
        espacial.
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {layerItems.map((item) => {
          const active = visible[item.key];
          return (
            <button
              key={item.key}
              type="button"
              disabled={!item.hasData}
              onClick={() => toggleLayer(item.key)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                !item.hasData
                  ? "cursor-not-allowed border-panel-200 bg-panel-50 text-gray-400"
                  : active
                    ? "border-panel-800 bg-white text-panel-900 shadow-sm"
                    : "border-panel-200 bg-panel-50 text-gray-500 hover:bg-white",
              )}
              title={
                item.hasData
                  ? `Mostrar/ocultar capa: ${item.label}`
                  : `Sin geometría registrada para ${item.label}`
              }
            >
              <span
                className={clsx(
                  "h-2.5 w-2.5 rounded-sm",
                  item.swatchBg,
                  (!active || !item.hasData) && "opacity-40",
                )}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {env.googleMapsApiKey ? (
        <GoogleSpatialMap
          googleKey={env.googleMapsApiKey}
          height={height}
          fitPoints={fitPoints}
          layers={activeLayers}
        />
      ) : (
        <LeafletSpatialMap
          height={height}
          fitPoints={fitPoints}
          layers={activeLayers}
        />
      )}
    </div>
  );
}
