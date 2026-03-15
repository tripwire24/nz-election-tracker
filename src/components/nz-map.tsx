"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapElectorate } from "@/types/map";

interface NZMapProps {
  electorates: MapElectorate[];
}

type MapView = "dots" | "boundaries" | "maori";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-NZ");
}

/** Build rich HTML popup content for an electorate (click detail) */
function buildPopup(e: MapElectorate): string {
  const isMaori = e.type === "maori";
  const typeLabel = isMaori ? "Māori electorate" : "General electorate";
  const popStr = e.population ? formatNumber(e.population) : "—";

  let barsHtml = "";
  if (e.partyVotes.length > 0) {
    const rows = e.partyVotes.map((pv) => {
      const w = Math.max(pv.pct * 2, 2);
      return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;">
        <span style="width:32px;text-align:right;font-size:11px;color:#a8a29e;flex-shrink:0;">${pv.pct.toFixed(1)}%</span>
        <div style="height:14px;border-radius:3px;background:${pv.partyColour};width:${w}px;min-width:2px;"></div>
        <span style="font-size:11px;color:#57534e;flex-shrink:0;">${escapeHtml(pv.partyShort)}</span>
      </div>`;
    });
    barsHtml = `<div style="margin-top:6px;border-top:1px solid #e7e5e4;padding-top:6px;">
      <div style="font-size:10px;color:#a8a29e;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">2023 Party Vote</div>
      ${rows.join("")}
    </div>`;
  }

  return `<div style="font-family:system-ui;font-size:13px;line-height:1.5;min-width:180px;">
    <strong style="font-size:14px;">${escapeHtml(e.name)}</strong><br/>
    <span style="color:#78716c;">${typeLabel}${e.region ? ` · ${escapeHtml(e.region)}` : ""}</span><br/>
    <span style="color:#78716c;">Pop: ${popStr}</span>
    ${e.winnerParty ? `<br/><span style="color:${e.winnerColour || "#666"};font-weight:600;">⬤ ${escapeHtml(e.winnerParty)} won seat</span>` : ""}
    ${barsHtml}
  </div>`;
}

const DEFAULT_FILL = "#6b7280";

/** Compute centroid [lat, lng] from a GeoJSON Polygon or MultiPolygon geometry */
function getCentroid(geojson: Record<string, unknown>): [number, number] | null {
  const type = geojson.type as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coords = geojson.coordinates as any;
  if (!coords) return null;

  let ring: number[][];
  if (type === "Polygon") {
    ring = coords[0];
  } else if (type === "MultiPolygon") {
    // Use the largest polygon (most points = likely main island)
    let best = coords[0][0];
    for (const poly of coords) {
      if (poly[0].length > best.length) best = poly[0];
    }
    ring = best;
  } else {
    return null;
  }

  let sumLng = 0, sumLat = 0;
  for (const pt of ring) {
    sumLng += pt[0];
    sumLat += pt[1];
  }
  return [sumLat / ring.length, sumLng / ring.length]; // [lat, lng] for Leaflet
}

export default function NZMap({ electorates }: NZMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const dotsLayerRef = useRef<L.LayerGroup | null>(null);
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const maoriLayerRef = useRef<L.GeoJSON | null>(null);

  const [activeView, setActiveView] = useState<MapView>("dots");

  // --- Initialise map and create all layers (stored in refs) ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-41.5, 173.0],
      zoom: 5,
      minZoom: 5,
      maxZoom: 14,
      zoomControl: true,
      attributionControl: false,
    });
    mapRef.current = map;

    // Light tile layer — CartoDB Positron (white ocean, light land)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19 },
    ).addTo(map);

    L.control.attribution({ position: "bottomright", prefix: false })
      .addTo(map)
      .addAttribution(
        '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      );

    const electorateById = new Map(electorates.map((e) => [e.id, e]));
    const general = electorates.filter((e) => e.type === "general" && e.geojson);
    const maori = electorates.filter((e) => e.type === "maori" && e.geojson);
    const allWithGeo = electorates.filter((e) => e.geojson);

    // --- 1. Dots layer (circle markers at centroids) ---
    const dotsGroup = L.layerGroup();
    for (const e of allWithGeo) {
      const center = getCentroid(e.geojson!);
      if (!center) continue;
      const colour = e.winnerColour || DEFAULT_FILL;
      const isMaori = e.type === "maori";
      const marker = L.circleMarker(center, {
        radius: isMaori ? 7 : 6,
        fillColor: colour,
        fillOpacity: 0.9,
        color: isMaori ? "#991b1b" : "#ffffff",
        weight: isMaori ? 2 : 1.5,
        opacity: 0.9,
      });
      marker.bindTooltip(
        `<strong>${escapeHtml(e.name)}</strong>${isMaori ? " <span style='opacity:0.5'>(Māori)</span>" : ""}${e.winnerParty ? `<br/><span style="color:${e.winnerColour || "#666"}">⬤ ${escapeHtml(e.winnerParty)}</span>` : ""}`,
        { sticky: true, direction: "top", className: "map-tooltip" },
      );
      marker.bindPopup(buildPopup(e), { className: "stone-popup", maxWidth: 280 });
      dotsGroup.addLayer(marker);
    }
    dotsLayerRef.current = dotsGroup;

    // --- 2. Boundary layer (general electorate polygons) ---
    const toFeatureCollection = (list: MapElectorate[]) => ({
      type: "FeatureCollection" as const,
      features: list.map((e) => ({
        type: "Feature" as const,
        geometry: e.geojson!,
        properties: { _eid: e.id },
      })),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let highlightedLayer: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let highlightedParent: any = null;

    const boundaryLayer = L.geoJSON(toFeatureCollection(general) as GeoJSON.GeoJsonObject, {
      style: (feature) => {
        const e = feature?.properties?._eid ? electorateById.get(feature.properties._eid) : null;
        return {
          fillColor: e?.winnerColour || DEFAULT_FILL,
          fillOpacity: 0.65,
          color: "#374151",
          weight: 1,
          opacity: 0.7,
        };
      },
      onEachFeature: (feature, layer) => {
        const e = feature?.properties?._eid ? electorateById.get(feature.properties._eid) : null;
        if (!e) return;
        layer.bindTooltip(
          `<strong>${escapeHtml(e.name)}</strong>${e.winnerParty ? `<br/><span style="color:${e.winnerColour || "#666"}">⬤ ${escapeHtml(e.winnerParty)}</span>` : ""}`,
          { sticky: true, direction: "top", className: "map-tooltip" },
        );
        layer.bindPopup(buildPopup(e), { className: "stone-popup", maxWidth: 280 });
        layer.on("mouseover", () => {
          if (highlightedLayer && highlightedParent) highlightedParent.resetStyle(highlightedLayer);
          layer.setStyle({ fillOpacity: 0.85, weight: 2, opacity: 1 });
          highlightedLayer = layer;
          highlightedParent = boundaryLayer;
        });
        layer.on("mouseout", () => {
          boundaryLayer.resetStyle(layer);
          if (highlightedLayer === layer) { highlightedLayer = null; highlightedParent = null; }
        });
      },
    });
    boundaryLayerRef.current = boundaryLayer;

    // --- 3. Māori electorates overlay ---
    const maoriLayer = L.geoJSON(toFeatureCollection(maori) as GeoJSON.GeoJsonObject, {
      style: (feature) => {
        const e = feature?.properties?._eid ? electorateById.get(feature.properties._eid) : null;
        return {
          fillColor: e?.winnerColour || "#B2001A",
          fillOpacity: 0.25,
          color: "#dc2626",
          weight: 2,
          opacity: 0.8,
          dashArray: "6 4",
        };
      },
      onEachFeature: (feature, layer) => {
        const e = feature?.properties?._eid ? electorateById.get(feature.properties._eid) : null;
        if (!e) return;
        layer.bindTooltip(
          `<strong>${escapeHtml(e.name)}</strong> <span style="opacity:0.5">(Māori)</span>${e.winnerParty ? `<br/><span style="color:${e.winnerColour || "#666"}">⬤ ${escapeHtml(e.winnerParty)}</span>` : ""}`,
          { sticky: true, direction: "top", className: "map-tooltip" },
        );
        layer.bindPopup(buildPopup(e), { className: "stone-popup", maxWidth: 280 });
        layer.on("mouseover", () => {
          if (highlightedLayer && highlightedParent) highlightedParent.resetStyle(highlightedLayer);
          layer.setStyle({ fillOpacity: 0.4, weight: 3, opacity: 1 });
          highlightedLayer = layer;
          highlightedParent = maoriLayer;
        });
        layer.on("mouseout", () => {
          maoriLayer.resetStyle(layer);
          if (highlightedLayer === layer) { highlightedLayer = null; highlightedParent = null; }
        });
      },
    });
    maoriLayerRef.current = maoriLayer;

    // Default: show dots
    dotsGroup.addTo(map);

    map.fitBounds([[-34.3, 166.5], [-47.3, 178.6]]);

    return () => {
      map.remove();
      mapRef.current = null;
      dotsLayerRef.current = null;
      boundaryLayerRef.current = null;
      maoriLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Sync layer visibility with activeView ---
  useEffect(() => {
    const map = mapRef.current;
    const dots = dotsLayerRef.current;
    const boundaries = boundaryLayerRef.current;
    const maoriL = maoriLayerRef.current;
    if (!map || !dots || !boundaries || !maoriL) return;

    // Remove all first
    if (map.hasLayer(dots)) map.removeLayer(dots);
    if (map.hasLayer(boundaries)) map.removeLayer(boundaries);
    if (map.hasLayer(maoriL)) map.removeLayer(maoriL);

    // Add the selected view
    if (activeView === "dots") {
      dots.addTo(map);
    } else if (activeView === "boundaries") {
      boundaries.addTo(map);
    } else if (activeView === "maori") {
      maoriL.addTo(map);
    }
  }, [activeView]);

  const views: { key: MapView; label: string; desc: string }[] = [
    { key: "dots", label: "Electorates", desc: "Dot per electorate" },
    { key: "boundaries", label: "Boundaries", desc: "General electorate areas" },
    { key: "maori", label: "Māori seats", desc: "Māori electorate areas" },
  ];

  return (
    <>
      <style>{`
        .stone-popup .leaflet-popup-content-wrapper {
          background: #fafaf9;
          color: #1c1917;
          border-radius: 8px;
          border: 1px solid #d6d3d1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .stone-popup .leaflet-popup-tip {
          background: #fafaf9;
          border: 1px solid #d6d3d1;
        }
        .map-tooltip {
          background: #1c1917 !important;
          color: #e7e5e4 !important;
          border: 1px solid #44403c !important;
          border-radius: 6px !important;
          padding: 4px 10px !important;
          font-size: 12px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        }
        .map-tooltip::before {
          border-top-color: #44403c !important;
        }
        .leaflet-control-zoom a {
          background: #ffffff !important;
          color: #374151 !important;
          border-color: #d1d5db !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f3f4f6 !important;
        }
        .leaflet-control-attribution {
          background: rgba(255,255,255,0.85) !important;
          color: #6b7280 !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: #6b7280 !important;
        }
      `}</style>
      <div className="relative">
        {/* View switcher */}
        <div className="absolute top-3 left-14 z-[1000] flex rounded-lg overflow-hidden shadow-md border border-neutral-200">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setActiveView(v.key)}
              title={v.desc}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                activeView === v.key
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div
          ref={containerRef}
          className="h-[320px] sm:h-[440px] lg:h-[600px] w-full rounded-lg"
        />
      </div>
    </>
  );
}
