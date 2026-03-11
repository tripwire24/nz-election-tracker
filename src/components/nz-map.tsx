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
 * Approximate geographic centroids for each NZ electorate (2024 boundaries).
 * Coordinates sourced from electorate geographic centres.
 */
const ELECTORATE_COORDS: Record<string, [number, number]> = {
  // ── Auckland (23 general) ──────────────────────────────────
  "Auckland Central":      [-36.855, 174.770],
  "Botany":                [-36.935, 174.920],
  "Epsom":                 [-36.880, 174.783],
  "Flat Bush":             [-36.965, 174.935],
  "Kaipara ki Mahurangi":  [-36.450, 174.680],
  "Kelston":               [-36.905, 174.635],
  "Māngere":               [-36.970, 174.800],
  "Manurewa":              [-37.023, 174.892],
  "Maungakiekie":          [-36.900, 174.825],
  "Mt Albert":             [-36.877, 174.725],
  "Mt Roskill":            [-36.900, 174.740],
  "New Lynn":              [-36.908, 174.680],
  "North Shore":           [-36.783, 174.770],
  "Northcote":             [-36.800, 174.740],
  "Pakuranga":             [-36.905, 174.885],
  "Panmure-Ōtāhuhu":      [-36.930, 174.845],
  "Papakura":              [-37.065, 174.950],
  "Takanini":              [-37.045, 174.920],
  "Tamaki":                [-36.860, 174.830],
  "Te Atatū":              [-36.845, 174.650],
  "Upper Harbour":         [-36.750, 174.660],
  "Waitākere":             [-36.920, 174.580],
  "Whangaparāoa":          [-36.630, 174.750],

  // ── Canterbury (9) ─────────────────────────────────────────
  "Banks Peninsula":        [-43.750, 172.720],
  "Christchurch Central":   [-43.530, 172.630],
  "Christchurch East":      [-43.530, 172.700],
  "Ilam":                   [-43.520, 172.560],
  "Kaikōura":               [-42.400, 173.680],
  "Rangitata":              [-44.100, 171.500],
  "Selwyn":                 [-43.600, 172.200],
  "Waimakariri":            [-43.380, 172.400],
  "Wigram":                 [-43.560, 172.520],

  // ── Wellington (7) ─────────────────────────────────────────
  "Hutt South":             [-41.220, 174.920],
  "Mana":                   [-41.100, 174.870],
  "Ōhāriu":                [-41.180, 174.820],
  "Remutaka":               [-41.150, 174.960],
  "Rongotai":               [-41.320, 174.800],
  "Wairarapa":              [-41.100, 175.500],
  "Wellington Central":     [-41.290, 174.775],

  // ── Waikato (6) ────────────────────────────────────────────
  "Coromandel":             [-36.760, 175.500],
  "Hamilton East":          [-37.800, 175.300],
  "Hamilton West":          [-37.780, 175.250],
  "Port Waikato":           [-37.400, 175.200],
  "Taupō":                  [-38.680, 176.080],
  "Waikato":                [-37.600, 175.400],

  // ── Manawatū (4) ──────────────────────────────────────────
  "Ōtaki":                  [-40.750, 175.150],
  "Palmerston North":       [-40.350, 175.620],
  "Rangitīkei":             [-39.930, 175.600],
  "Whanganui":              [-39.930, 175.050],

  // ── Bay of Plenty (3) ─────────────────────────────────────
  "Bay of Plenty":          [-37.750, 176.950],
  "Rotorua":                [-38.140, 176.250],
  "Tauranga":               [-37.690, 176.170],

  // ── Hawke's Bay (2) ───────────────────────────────────────
  "Napier":                 [-39.490, 176.910],
  "Tukituki":               [-39.650, 176.850],

  // ── Taranaki (2) ──────────────────────────────────────────
  "New Plymouth":           [-39.060, 174.080],
  "Taranaki-King Country":  [-38.700, 175.000],

  // ── Northland (2) ─────────────────────────────────────────
  "Northland":              [-35.400, 174.300],
  "Whangārei":              [-35.720, 174.330],

  // ── Otago (2) ─────────────────────────────────────────────
  "Dunedin":                [-45.870, 170.500],
  "Taieri":                 [-45.950, 170.350],

  // ── Southland (2) ─────────────────────────────────────────
  "Invercargill":           [-46.410, 168.350],
  "Southland":              [-46.050, 168.100],

  // ── Single-electorate regions ─────────────────────────────
  "East Coast":             [-38.500, 177.500],
  "Nelson":                 [-41.270, 173.300],
  "West Coast-Tasman":      [-42.450, 171.210],

  // ── Māori electorates (7) ─────────────────────────────────
  "Hauraki-Waikato":        [-37.700, 175.800],
  "Ikaroa-Rāwhiti":         [-39.500, 176.500],
  "Tāmaki Makaurau":        [-36.950, 174.870],
  "Te Tai Hauāuru":         [-39.500, 175.000],
  "Te Tai Tokerau":         [-35.600, 174.300],
  "Te Tai Tonga":           [-43.500, 172.000],
  "Waiariki":               [-38.200, 176.500],
};

/** Fallback: region centroids for any electorate not in the lookup */
const REGION_COORDS: Record<string, [number, number]> = {
  "Northland":       [-35.4, 174.3],
  "Auckland":        [-36.85, 174.76],
  "Waikato":         [-37.8, 175.5],
  "Bay of Plenty":   [-37.7, 176.5],
  "Gisborne":        [-38.5, 178.0],
  "East Coast":      [-38.5, 177.5],
  "Hawkes Bay":      [-39.5, 176.8],
  "Taranaki":        [-39.1, 174.1],
  "Manawatū":        [-39.9, 175.6],
  "Wellington":      [-41.28, 174.78],
  "Nelson":          [-41.27, 173.3],
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

    const map = L.map(containerRef.current, {
      center: [-41.5, 173.0],
      zoom: 5,
      minZoom: 5,
      maxZoom: 14,
      zoomControl: true,
      attributionControl: false,
    });
    mapRef.current = map;

    // Light tile layer — CartoDB Positron
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19 },
    ).addTo(map);

    L.control.attribution({ position: "bottomright", prefix: false })
      .addTo(map)
      .addAttribution(
        '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      );

    // Plot electorate markers at real geographic coordinates
    for (const e of electorates) {
      const coords =
        ELECTORATE_COORDS[e.name] ??
        REGION_COORDS[e.region || ""] ??
        REGION_COORDS["Auckland"];

      const color = TYPE_COLOURS[e.type] || "#3b82f6";
      const isMaori = e.type === "maori";

      const marker = L.circleMarker(coords, {
        radius: isMaori ? 8 : 6,
        fillColor: color,
        color: "#ffffff",
        weight: 1.5,
        fillOpacity: 0.85,
      }).addTo(map);

      marker.bindPopup(
        `<div style="font-family:system-ui;font-size:13px;line-height:1.5;">
          <strong>${escapeHtml(e.name)}</strong><br/>
          <span style="color:${color};">&#9679;</span> ${isMaori ? "Māori" : "General"} electorate<br/>
          <span style="color:#78716c;">${escapeHtml(e.region || "Unknown")} region</span>
        </div>`,
        { className: "stone-popup" },
      );

      marker.on("mouseover", () => marker.openPopup());
      marker.on("mouseout",  () => marker.closePopup());
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
        .stone-popup .leaflet-popup-content-wrapper {
          background: #fafaf9;
          color: #1c1917;
          border-radius: 8px;
          border: 1px solid #d6d3d1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .stone-popup .leaflet-popup-tip {
          background: #fafaf9;
          border: 1px solid #d6d3d1;
        }
        .leaflet-control-zoom a {
          background: #fafaf9 !important;
          color: #44403c !important;
          border-color: #d6d3d1 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #e7e5e4 !important;
        }
        .leaflet-control-attribution {
          background: rgba(250,250,249,0.85) !important;
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
