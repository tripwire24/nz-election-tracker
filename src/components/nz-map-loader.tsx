"use client";

import dynamic from "next/dynamic";

const NZMap = dynamic(() => import("@/components/nz-map"), { ssr: false });

export default function NZMapLoader({ electorates }: { electorates: { id: string; name: string; type: string; region: string | null }[] }) {
  return <NZMap electorates={electorates} />;
}
