"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

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
 * NZ geographic regions with approximate centroids (lat, lng)
 * for plotting electorate dots when full GeoJSON boundaries aren't available.
 */
const REGION_COORDS: Record<string, [number, number]> = {
  northland:    [174.3, -35.4],
  auckland:     [174.7, -36.85],
  waikato:      [175.5, -37.8],
  "bay of plenty": [176.5, -37.7],
  gisborne:     [178.0, -38.5],
  "hawke's bay": [176.8, -39.5],
  taranaki:     [174.1, -39.1],
  "manawatu-wanganui": [175.6, -39.9],
  wellington:   [174.8, -41.3],
  tasman:       [172.7, -41.3],
  nelson:       [173.3, -41.3],
  marlborough:  [173.9, -41.5],
  "west coast":  [171.2, -42.5],
  canterbury:   [172.5, -43.5],
  otago:        [170.5, -45.0],
  southland:    [168.3, -46.1],
};

const PARTY_COLOURS: Record<string, string> = {
  general: "#3b82f6",
  maori: "#ef4444",
};

export default function NZMap({ electorates }: NZMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ name: string; type: string; x: number; y: number } | null>(null);
  const [geoLoaded, setGeoLoaded] = useState(false);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 500;
    const height = 700;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();

    // NZ-centered Mercator projection
    const projection = d3.geoMercator()
      .center([173, -41])
      .scale(1800)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath(projection);

    // Try loading NZ outline from Stats NZ GeoJSON API
    const geoUrl = "https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/newzealand.json";

    fetch(geoUrl)
      .then((res) => {
        if (!res.ok) throw new Error("GeoJSON fetch failed");
        return res.json();
      })
      .then((geojson) => {
        setGeoLoaded(true);

        // Draw NZ boundary
        svg.append("g")
          .selectAll("path")
          .data(((geojson as { type: string; features: Array<{ type: string; geometry: unknown; properties: unknown }> }).features))
          .join("path")
          .attr("d", path as unknown as string)
          .attr("fill", "#1e293b")
          .attr("stroke", "#334155")
          .attr("stroke-width", 0.5);

        addElectorateDots(svg, projection);
      })
      .catch(() => {
        // Fallback: draw simplified NZ outline manually
        setGeoLoaded(false);
        drawFallbackOutline(svg, projection);
        addElectorateDots(svg, projection);
      });

    function addElectorateDots(
      svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
      proj: d3.GeoProjection,
    ) {
      if (electorates.length === 0) return;

      // Group electorates by region and scatter dots
      const regionGroups: Record<string, Electorate[]> = {};
      for (const e of electorates) {
        const region = (e.region || "auckland").toLowerCase();
        if (!regionGroups[region]) regionGroups[region] = [];
        regionGroups[region].push(e);
      }

      const dots: DotDatum[] = [];

      for (const [region, group] of Object.entries(regionGroups)) {
        const coords = REGION_COORDS[region] || REGION_COORDS["auckland"];
        const projected = proj(coords);
        if (!projected) continue;

        // Scatter dots around the region center
        group.forEach((e, i) => {
          const angle = (i / group.length) * Math.PI * 2;
          const radius = Math.min(group.length * 2, 20);
          dots.push({
            e,
            cx: projected[0] + Math.cos(angle) * radius,
            cy: projected[1] + Math.sin(angle) * radius,
          });
        });
      }

      svg.append("g")
        .selectAll("circle")
        .data(dots)
        .join("circle")
        .attr("cx", (d: DotDatum) => d.cx)
        .attr("cy", (d: DotDatum) => d.cy)
        .attr("r", 4)
        .attr("fill", (d: DotDatum) => PARTY_COLOURS[d.e.type] || "#3b82f6")
        .attr("fill-opacity", 0.7)
        .attr("stroke", "#0f172a")
        .attr("stroke-width", 0.5)
        .attr("cursor", "pointer")
        .on("mouseenter", (event: MouseEvent, d: DotDatum) => {
          const rect = svgRef.current!.getBoundingClientRect();
          setTooltip({
            name: d.e.name,
            type: d.e.type,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top - 10,
          });
        })
        .on("mouseleave", () => setTooltip(null));
    }

    function drawFallbackOutline(
      svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
      proj: d3.GeoProjection,
    ) {
      // Simplified NZ outline points (North + South Island)
      const northIsland: [number, number][] = [
        [173.0, -34.4], [175.5, -36.0], [176.5, -37.8],
        [178.0, -38.7], [177.0, -39.5], [176.2, -40.0],
        [175.5, -41.1], [174.8, -41.5], [174.0, -41.0],
        [173.5, -39.5], [173.8, -38.5], [174.5, -37.0],
        [173.0, -34.4],
      ];
      const southIsland: [number, number][] = [
        [173.5, -41.0], [174.0, -41.7], [174.3, -42.5],
        [173.5, -43.5], [172.5, -44.0], [171.0, -44.5],
        [169.0, -45.5], [167.5, -46.0], [166.5, -46.3],
        [168.0, -45.0], [169.5, -44.0], [170.5, -43.0],
        [171.5, -42.0], [172.5, -41.2], [173.5, -41.0],
      ];

      const lineGen = d3.line<[number, number]>()
        .x((d: [number, number]) => proj(d)?.[0] || 0)
        .y((d: [number, number]) => proj(d)?.[1] || 0)
        .curve(d3.curveBasisClosed);

      svg.append("path")
        .attr("d", lineGen(northIsland)!)
        .attr("fill", "#1e293b")
        .attr("stroke", "#334155")
        .attr("stroke-width", 1);

      svg.append("path")
        .attr("d", lineGen(southIsland)!)
        .attr("fill", "#1e293b")
        .attr("stroke", "#334155")
        .attr("stroke-width", 1);
    }
  }, [electorates]);

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full max-w-lg mx-auto" />
      {tooltip && (
        <div
          className="absolute pointer-events-none rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
        >
          <span className="font-medium">{tooltip.name}</span>
          <span className="ml-1.5 text-slate-400">({tooltip.type})</span>
        </div>
      )}
      {!geoLoaded && (
        <p className="mt-2 text-center text-[10px] text-slate-600">
          Simplified outline — full LINZ GeoJSON boundaries coming soon
        </p>
      )}
    </div>
  );
}
