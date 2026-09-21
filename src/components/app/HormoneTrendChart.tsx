"use client";

import { useId, useState } from "react";
import { useLanguage } from "@/lib/i18n/provider";
import type { HormoneLog } from "@/lib/supabase/types";

// A hand-built, dependency-free line/area chart: colorful and interactive
// (tap a point to see its date and value) without needing a charting
// library, and simple enough to read at a glance, per request ("for a lay
// audience"). Shows the typical reference band behind the line so someone
// can see at a glance whether they're inside it, tying back to the Home
// page's "on track / worth a look" language.
export function HormoneTrendChart({
  logs,
  low,
  high,
  unit,
  color = "#c2185b",
}: {
  logs: HormoneLog[];
  low: number;
  high: number;
  unit: string;
  /** Accent color for this hormone's line/fill/dots — lets different
   * hormones read as visually distinct at a glance. */
  color?: string;
}) {
  const { lang } = useLanguage();
  const [selected, setSelected] = useState<number | null>(null);
  const gradientId = `trendFill-${useId()}`;

  const W = 320;
  const H = 140;
  const padX = 14;
  const padY = 16;

  const values = logs.map((l) => l.value);
  const dataMin = Math.min(...values, low);
  const dataMax = Math.max(...values, high);
  const span = Math.max(1, dataMax - dataMin);

  const x = (i: number) =>
    logs.length <= 1 ? W / 2 : padX + (i / (logs.length - 1)) * (W - padX * 2);
  const y = (v: number) => H - padY - ((v - dataMin) / span) * (H - padY * 2);

  const points = logs.map((l, i) => ({ x: x(i), y: y(l.value), log: l }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${H - padY} L ${points[0]?.x ?? 0} ${H - padY} Z`;

  const bandTop = y(Math.min(high, dataMax));
  const bandBottom = y(Math.max(low, dataMin));

  const active = selected !== null ? points[selected] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full touch-none"
        role="img"
        aria-label="Hormone trend chart"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Typical reference band */}
        <rect
          x={0}
          y={bandTop}
          width={W}
          height={Math.max(1, bandBottom - bandTop)}
          fill="#4caf50"
          fillOpacity={0.12}
        />
        <text x={W - padX} y={Math.max(10, bandTop - 4)} textAnchor="end" fontSize="8" fill="#81c784">
          {`typical ${low}–${high} ${unit}`}
        </text>

        {points.length > 0 && (
          <>
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
              <circle
                key={p.log.id}
                cx={p.x}
                cy={p.y}
                r={selected === i ? 6 : 4}
                fill={selected === i ? "#ffffff" : color}
                stroke="#ffffff"
                strokeWidth={selected === i ? 2.5 : 1.5}
                className="cursor-pointer transition-all"
                onClick={() => setSelected(selected === i ? null : i)}
              />
            ))}
          </>
        )}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-plum-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${Math.min(80, Math.max(20, (active.x / W) * 100))}%`, top: `${(active.y / H) * 100}%`, marginTop: -8 }}
        >
          <p className="font-semibold">
            {active.log.value} {unit}
          </p>
          <p className="text-faint">
            {new Date(active.log.measured_on).toLocaleDateString(lang, {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
