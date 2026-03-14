import { PagePanel } from "@/components/page-primitives";

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(28,28,28,0.98),rgba(18,18,18,0.98))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.32)] md:p-8">
        <div className="space-y-4">
          <div className="h-5 w-28 rounded-full bg-white/[0.06]" />
          <div className="h-10 w-full max-w-2xl rounded bg-white/[0.06]" />
          <div className="h-4 w-full max-w-xl rounded bg-white/[0.04]" />
          <div className="flex flex-wrap gap-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 w-36 rounded-full bg-white/[0.05]" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <PagePanel className="h-72 xl:col-span-8" />
        <PagePanel className="h-72 xl:col-span-4" />
        <PagePanel className="h-80 xl:col-span-8" />
        <PagePanel className="h-80 xl:col-span-4" />
        {[1, 2].map((i) => (
          <PagePanel key={i} className="h-72 xl:col-span-6" />
        ))}
      </div>
    </div>
  );
}

