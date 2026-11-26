import type { GeoJsonGeometry, GeoJsonPosition } from "../api/types";

export type LatLngPoint = {
  lat: number;
  lng: number;
};

export type ExtractedGeoJsonShapes = {
  points: LatLngPoint[];
  lines: LatLngPoint[][];
  polygons: LatLngPoint[][][];
};

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/**
 * Convierte una posición GeoJSON [lng, lat] en { lat, lng } si es válida.
 */
export function positionToLatLng(
  pos: GeoJsonPosition | number[] | null | undefined,
): LatLngPoint | null {
  if (!Array.isArray(pos) || pos.length < 2) return null;
  const lng = Number(pos[0]);
  const lat = Number(pos[1]);
  if (!isValidLatLng(lat, lng)) return null;
  return { lat, lng };
}

function positionsToPath(
  positions: GeoJsonPosition[] | null | undefined,
): LatLngPoint[] {
  if (!Array.isArray(positions)) return [];
  const out: LatLngPoint[] = [];
  for (const pos of positions) {
    const pt = positionToLatLng(pos);
    if (pt) out.push(pt);
  }
  return out;
}

function appendGeometryShapes(
  geometry: GeoJsonGeometry | null | undefined,
  target: ExtractedGeoJsonShapes,
): void {
  if (!geometry || typeof geometry !== "object") return;

  switch (geometry.type) {
    case "Point": {
      const pt = positionToLatLng(geometry.coordinates);
      if (pt) target.points.push(pt);
      break;
    }
    case "MultiPoint": {
      for (const pos of geometry.coordinates ?? []) {
        const pt = positionToLatLng(pos);
        if (pt) target.points.push(pt);
      }
      break;
    }
    case "LineString": {
      const path = positionsToPath(geometry.coordinates);
      if (path.length >= 2) {
        target.lines.push(path);
      } else if (path.length === 1) {
        target.points.push(path[0]);
      }
      break;
    }
    case "MultiLineString": {
      for (const line of geometry.coordinates ?? []) {
        const path = positionsToPath(line);
        if (path.length >= 2) {
          target.lines.push(path);
        } else if (path.length === 1) {
          target.points.push(path[0]);
        }
      }
      break;
    }
    case "Polygon": {
      const rings = (geometry.coordinates ?? [])
        .map((ring) => positionsToPath(ring))
        .filter((ring) => ring.length >= 3);
      if (rings.length > 0) target.polygons.push(rings);
      break;
    }
    case "MultiPolygon": {
      for (const poly of geometry.coordinates ?? []) {
        const rings = (poly ?? [])
          .map((ring) => positionsToPath(ring))
          .filter((ring) => ring.length >= 3);
        if (rings.length > 0) target.polygons.push(rings);
      }
      break;
    }
    case "GeometryCollection": {
      for (const child of geometry.geometries ?? []) {
        appendGeometryShapes(child, target);
      }
      break;
    }
  }
}

/**
 * Extrae puntos, polilíneas y polígonos de cualquier geometría GeoJSON
 * en coordenadas { lat, lng } listas para Google Maps y Leaflet.
 */
export function extractGeoJsonShapes(
  geometry: GeoJsonGeometry | null | undefined,
): ExtractedGeoJsonShapes {
  const shapes: ExtractedGeoJsonShapes = {
    points: [],
    lines: [],
    polygons: [],
  };
  appendGeometryShapes(geometry, shapes);
  return shapes;
}

export function toLeafletPositions(
  points: LatLngPoint[],
): Array<[number, number]> {
  return points.map((p) => [p.lat, p.lng]);
}

export function collectAllPoints(
  ...geometries: Array<GeoJsonGeometry | null | undefined>
): LatLngPoint[] {
  const all: LatLngPoint[] = [];
  for (const geom of geometries) {
    const shapes = extractGeoJsonShapes(geom);
    all.push(...shapes.points);
    for (const line of shapes.lines) all.push(...line);
    for (const poly of shapes.polygons) {
      for (const ring of poly) all.push(...ring);
    }
  }
  return all;
}
