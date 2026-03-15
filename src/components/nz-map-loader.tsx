"use client";

import dynamic from "next/dynamic";
import type { MapElectorate } from "@/types/map";

const NZMap = dynamic(() => import("@/components/nz-map"), { ssr: false });

export default function NZMapLoader({ electorates }: { electorates: MapElectorate[] }) {
  return <NZMap electorates={electorates} />;
}
