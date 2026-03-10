"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { NZ_GEOJSON } from "./nz-outline";

interface Electorate {
  id: string;
  name: string;
  type: string;
  region: string | null;
}

interface NZMapProps {
  electorates: Electorate[];
}

interface DotDatum {
  e: Electorate;
  cx: number;
  cy: number;
}

/**
 * NZ geographic regions with approximate centroids (lng, lat)
 * for plotting electorate dots.
 */
const REGION_COORDS: Record<string, [number, number]> = {
  northland:           [174.3, -35.4],
  auckland:            [174.7, -36.85],
  waikato:             [175.5, -37.8],
  "bay of plenty":     [176.5, -37.7],
  gisborne:            [178.0, -38.5],
  "hawke's bay":       [176.8, -39.5],
  taranaki:            [174.1, -39.1],
  "manawatu-wanganui": [175.6, -39.9],
  wellington:          [174.8, -41.3],
  tasman:              [172.7, -41.3],
  nelson:              [173.3, -41.3],
  marlborough:         [173.9, -41.5],
  "west coast":        [171.2, -42.5],
  canterbury:          [172.5, -43.5],
  otago:               [170.5, -45.0],
  southland:           [168.3, -46.1],
};

const TYPE_COLOURS: Record<string, string> = {
  general: "#3b82f6",
  maori: "#ef4444",
};

export default function NZMap({ electorates }: NZMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    name: string;
    type: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 480;
    const height = 680;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();

    // NZ-centred Mercator projection
    const projection = d3
      .geoMercator()
      .center([172.5, -41.5])
      .scale(2200)
      .translate([width / 2, height / 2]);

    const pathGen = d3.geoPath().projection(projection);

    // --- Draw NZ coastline from embedded data ---
    svg
      .append("g")
      .attr("class", "coastline")
      .selectAll("path")
      .data(NZ_GEOJSON.features)
      .join("path")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("d", (d: any) => pathGen(d as d3.GeoPermissibleObjects) || "")
      .attr("fill", "#1e293b")
      .attr("stroke", "#475569")
      .attr("stroke-width", 1);

    // --- Ocean / background grid lines for visual polish ---
    svg
      .insert("rect", ":first-child")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#0f172a");

    // --- Electorate dots ---
    if (electorates.length > 0) {
      const regionGroups: Record<string, Electorate[]> = {};
      for (const e of electorates) {
        const region = (e.region || "auckland").toLowerCase();
        if (!regionGroups[region]) regionGroups[region] = [];
        regionGroups[region].push(e);
      }

      const dots: DotDatum[] = [];

      for (const [region, group] of Object.entries(regionGroups)) {
        const coords = REGION_COORDS[region] || REGION_COORDS["auckland"];
        const projected = projection(coords);
        if (!projected) continue;

        group.forEach((e, i) => {
          const angle = (i / group.length) * Math.PI * 2;
          const radius = Math.min(group.length * 1.5, 18);
          dots.push({
            e,
            cx: projected[0] + Math.cos(angle) * radius,
            cy: projected[1] + Math.sin(angle) * radius,
          });
        });
      }

      svg
        .append("g")
        .attr("class", "electorates")
        .selectAll("circle")
        .data(dots)
        .join("circle")
        .attr("cx", (d: DotDatum) => d.cx)
        .attr("cy", (d: DotDatum) => d.cy)
        .attr("r", 3.5)
        .attr("fill", (d: DotDatum) => TYPE_COLOURS[d.e.type] || "#3b82f6")
        .attr("fill-opacity", 0.8)
        .attr("stroke", "#0f172a")
        .attr("stroke-width", 0.5)
        .attr("cursor", "pointer")
        .on("mouseenter", (event: MouseEvent, d: DotDatum) => {
          const rect = svgRef.current!.getBoundingClientRect();
          setTooltip({
            name: d.e.name,
            type: d.e.type,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top - 12,
          });
        })
        .on("mouseleave", () => setTooltip(null));
    }
  }, [electorates]);

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full max-w-md mx-auto rounded-lg" />
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 rounded bg-slate-800 border border-slate-600 px-2.5 py-1 text-xs text-slate-200 shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className="font-medium">{tooltip.name}</span>
          <span className="ml-1.5 text-slate-400">
            ({tooltip.type === "maori" ? "Māori" : "General"})
          </span>
        </div>
      )}
    </div>
  );
}
