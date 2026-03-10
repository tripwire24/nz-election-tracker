"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Electorate {
  id: string;
  name: string;
  type: string;
  region: string | null;
}

interface NZMapProps {
  electorates: Electorate[];
}

/**
 * Approximate lat/lng centroids for NZ regions.
 * Used to place electorate markers geographically.
 */
const REGION_COORDS: Record<string, [number, number]> = {
  "Northland":       [-35.4, 174.3],
  "Auckland":        [-36.85, 174.76],
  "Waikato":         [-37.8, 175.5],
  "Bay of Plenty":   [-37.7, 176.5],
  "Gisborne":        [-38.5, 178.0],
  "East Coast":      [-38.5, 177.5],
  "Hawkes Bay":      [-39.5, 176.8],
  "Hawke's Bay":     [-39.5, 176.8],
  "Taranaki":        [-39.1, 174.1],
  "Manawatū":        [-39.9, 175.6],
  "Manawatu-Wanganui": [-39.9, 175.6],
  "Wellington":      [-41.28, 174.78],
  "Tasman":          [-41.3, 172.7],
  "Nelson":          [-41.27, 173.3],
  "Marlborough":     [-41.5, 173.9],
  "West Coast":      [-42.5, 171.2],
  "Canterbury":      [-43.5, 172.5],
  "Otago":           [-45.0, 170.5],
  "Southland":       [-46.1, 168.3],
  "South Island":    [-44.0, 171.0],
};

const TYPE_COLOURS: Record<string, string> = {
  general: "#3b82f6",
  maori:   "#ef4444",
};

export default function NZMap({ electorates }: NZMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(containerRef.current, {
      center: [-41.5, 173.0],
      zoom: 5,
      minZoom: 5,
      maxZoom: 12,
      zoomControl: true,
      attributionControl: false,
    });
    mapRef.current = map;

    // Dark tile layer — CartoDB Dark Matter (free, no API key)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    // Small attribution bottom-right
    L.control.attribution({ position: "bottomright", prefix: false })
      .addTo(map)
      .addAttribution('&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>');

    // Plot electorate markers
    if (electorates.length > 0) {
      const regionGroups: Record<string, Electorate[]> = {};
      for (const e of electorates) {
        const region = e.region || "Auckland";
        if (!regionGroups[region]) regionGroups[region] = [];
        regionGroups[region].push(e);
      }

      for (const [region, group] of Object.entries(regionGroups)) {
        const baseCoords = REGION_COORDS[region] || REGION_COORDS["Auckland"];

        group.forEach((e, i) => {
          // Spread dots in a spiral around the region centroid
          const angle = (i / group.length) * Math.PI * 2;
          const rings = Math.floor(i / 8);
          const spread = 0.08 + rings * 0.06;
          const lat = baseCoords[0] + Math.sin(angle) * spread * (1 + rings * 0.3);
          const lng = baseCoords[1] + Math.cos(angle) * spread * (1 + rings * 0.3);

          const color = TYPE_COLOURS[e.type] || "#3b82f6";

          const marker = L.circleMarker([lat, lng], {
            radius: 6,
            fillColor: color,
            color: "#0f172a",
            weight: 1,
            fillOpacity: 0.85,
          }).addTo(map);

          marker.bindPopup(
            `<div style="font-family:system-ui;font-size:13px;">
              <strong>${escapeHtml(e.name)}</strong><br/>
              <span style="color:${color};">&#9679;</span> ${e.type === "maori" ? "Māori" : "General"} electorate<br/>
              <span style="color:#94a3b8;">${escapeHtml(e.region || "Unknown")} region</span>
            </div>`,
            { className: "dark-popup" },
          );

          marker.on("mouseover", () => marker.openPopup());
          marker.on("mouseout", () => marker.closePopup());
        });
      }
    }

    // Fit NZ bounds
    map.fitBounds([[-34.3, 166.5], [-47.3, 178.6]]);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [electorates]);

  return (
    <>
      <style>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: #1e293b;
          color: #e2e8f0;
          border-radius: 8px;
          border: 1px solid #334155;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .dark-popup .leaflet-popup-tip {
          background: #1e293b;
          border: 1px solid #334155;
        }
        .leaflet-control-zoom a {
          background: #1e293b !important;
          color: #e2e8f0 !important;
          border-color: #334155 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #334155 !important;
        }
        .leaflet-control-attribution {
          background: rgba(15,23,42,0.8) !important;
          color: #64748b !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: #64748b !important;
        }
      `}</style>
      <div
        ref={containerRef}
        className="w-full rounded-lg"
        style={{ height: "600px" }}
      />
    </>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
