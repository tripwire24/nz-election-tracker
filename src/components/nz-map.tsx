"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapElectorate } from "@/types/map";

interface NZMapProps {
  electorates: MapElectorate[];
}

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

/** Default polygon fill colour when no winner data */
const DEFAULT_FILL = "#555555";

export default function NZMap({ electorates }: NZMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

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

    // Dark tile layer — CartoDB Dark Matter (matches site theme)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19 },
    ).addTo(map);

    L.control.attribution({ position: "bottomright", prefix: false })
      .addTo(map)
      .addAttribution(
        '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      );

    // Build a lookup from electorate id → data
    const electorateById = new Map(electorates.map((e) => [e.id, e]));

    // Separate into general / Māori and build FeatureCollections
    const general = electorates.filter((e) => e.type === "general" && e.geojson);
    const maori = electorates.filter((e) => e.type === "maori" && e.geojson);

    const toFeatureCollection = (list: MapElectorate[]) => ({
      type: "FeatureCollection" as const,
      features: list.map((e) => ({
        type: "Feature" as const,
        geometry: e.geojson!,
        properties: { _eid: e.id },
      })),
    });

    // Track which layer is currently highlighted so we can clean it up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let highlightedLayer: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let highlightedParent: any = null;

    // --- General electorates layer ---
    const generalLayer = L.geoJSON(toFeatureCollection(general) as GeoJSON.GeoJsonObject, {
      style: (feature) => {
        const e = feature?.properties?._eid ? electorateById.get(feature.properties._eid) : null;
        return {
          fillColor: e?.winnerColour || DEFAULT_FILL,
          fillOpacity: 0.55,
          color: "#ffffff",
          weight: 1,
          opacity: 0.6,
        };
      },
      onEachFeature: (feature, layer) => {
        const e = feature?.properties?._eid ? electorateById.get(feature.properties._eid) : null;
        if (!e) return;
        // Lightweight tooltip on hover (follows cursor)
        layer.bindTooltip(
          `<strong>${escapeHtml(e.name)}</strong>${e.winnerParty ? `<br/><span style="color:${e.winnerColour || "#666"}">⬤ ${escapeHtml(e.winnerParty)}</span>` : ""}`,
          { sticky: true, direction: "top", className: "map-tooltip" },
        );
        // Detailed popup on click
        layer.bindPopup(buildPopup(e), { className: "stone-popup", maxWidth: 280 });
        layer.on("mouseover", () => {
          if (highlightedLayer && highlightedParent) {
            highlightedParent.resetStyle(highlightedLayer);
          }
          layer.setStyle({ fillOpacity: 0.85, weight: 2, opacity: 1 });
          highlightedLayer = layer;
          highlightedParent = generalLayer;
        });
        layer.on("mouseout", () => {
          generalLayer.resetStyle(layer);
          if (highlightedLayer === layer) {
            highlightedLayer = null;
            highlightedParent = null;
          }
        });
      },
    }).addTo(map);

    // --- Māori electorates overlay layer ---
    const maoriLayer = L.geoJSON(toFeatureCollection(maori) as GeoJSON.GeoJsonObject, {
      style: (feature) => {
        const e = feature?.properties?._eid ? electorateById.get(feature.properties._eid) : null;
        return {
          fillColor: e?.winnerColour || "#B2001A",
          fillOpacity: 0.18,
          color: "#ef4444",
          weight: 2,
          opacity: 0.7,
          dashArray: "6 4",
        };
      },
      onEachFeature: (feature, layer) => {
        const e = feature?.properties?._eid ? electorateById.get(feature.properties._eid) : null;
        if (!e) return;
        layer.bindTooltip(
          `<strong>${escapeHtml(e.name)}</strong> <span style="opacity:0.6">(Māori)</span>${e.winnerParty ? `<br/><span style="color:${e.winnerColour || "#666"}">⬤ ${escapeHtml(e.winnerParty)}</span>` : ""}`,
          { sticky: true, direction: "top", className: "map-tooltip" },
        );
        layer.bindPopup(buildPopup(e), { className: "stone-popup", maxWidth: 280 });
        layer.on("mouseover", () => {
          if (highlightedLayer && highlightedParent) {
            highlightedParent.resetStyle(highlightedLayer);
          }
          layer.setStyle({ fillOpacity: 0.35, weight: 3, opacity: 1 });
          highlightedLayer = layer;
          highlightedParent = maoriLayer;
        });
        layer.on("mouseout", () => {
          maoriLayer.resetStyle(layer);
          if (highlightedLayer === layer) {
            highlightedLayer = null;
            highlightedParent = null;
          }
        });
      },
    }).addTo(map);

    // Fit NZ bounds
    map.fitBounds([[-34.3, 166.5], [-47.3, 178.6]]);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // electorates is set once from SSR props — stable reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          background: #292524 !important;
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
          background: #292524 !important;
          color: #d6d3d1 !important;
          border-color: #44403c !important;
        }
        .leaflet-control-zoom a:hover {
          background: #44403c !important;
        }
        .leaflet-control-attribution {
          background: rgba(28,25,23,0.85) !important;
          color: #78716c !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: #78716c !important;
        }
      `}</style>
      <div
        ref={containerRef}
        className="h-[320px] sm:h-[440px] lg:h-[600px] w-full rounded-lg"
      />
    </>
  );
}
