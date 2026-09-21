"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/provider";
import { HORMONE_COLOR, HORMONE_KEYS, HORMONE_REFERENCE, type HormoneKey } from "@/lib/hormones";
import type { HormoneLog } from "@/lib/supabase/types";

// The "all hormones at once" view. Hormones use different units and scales
// (pg/mL vs ng/mL) and no single "normal" fits all of them, so there is no
// reference band here. Each hormone's readings are scaled to its own
// lowest-to-highest logged value, which shows its direction over time; tap
// a point to see the real value and that hormone's typical range.
export function HormoneMultiTrendChart({
  logsByHormone,
}: {
  logsByHormone: Record<HormoneKey, HormoneLog[]>;
}) {
  const { t, lang } = useLanguage();
  const [selected, setSelected] = useState<{ hormone: HormoneKey; index: number } | null>(null);

  const W = 320;
  const H = 160;
  const padX = 14;
  const padY = 16;

  const series = HORMONE_KEYS.map((hormone) => {
    const rows = [...(logsByHormone[hormone] ?? [])].sort((a, b) =>
      a.measured_on.localeCompare(b.measured_on)
    );
    const values = rows.map((r) => r.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const points = rows.map((log) => ({
      log,
      norm: max === min ? 0.5 : (log.value - min) / (max - min),
    }));
    return { hormone, points };
  }).filter((s) => s.points.length > 0);

  const x = (i: number, count: number) =>
    count <= 1 ? W / 2 : padX + (i / (count - 1)) * (W - padX * 2);
  const yFromNorm = (n: number) => {
    return H - padY - n * (H - padY * 2);
  };

  const activePoint = (() => {
    if (!selected) return null;
    const s = series.find((s) => s.hormone === selected.hormone);
    const p = s?.points[selected.index];
    if (!s || !p) return null;
    return { s, p };
  })();

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full touch-none"
        role="img"
        aria-label="All hormones trend chart"
      >
        {series.map(({ hormone, points }) => {
          const path = points
            .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i, points.length)} ${yFromNorm(p.norm)}`)
            .join(" ");
          return (
            <g key={hormone}>
              <path
                d={path}
                fill="none"
                stroke={HORMONE_COLOR[hormone]}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.9}
              />
              {points.map((p, i) => (
                <circle
                  key={p.log.id}
                  cx={x(i, points.length)}
                  cy={yFromNorm(p.norm)}
                  r={selected?.hormone === hormone && selected.index === i ? 5 : 3}
                  fill={HORMONE_COLOR[hormone]}
                  stroke="#ffffff"
                  strokeWidth={1}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelected(
                      selected?.hormone === hormone && selected.index === i
                        ? null
                        : { hormone, index: i }
                    )
                  }
                />
              ))}
            </g>
          );
        })}
      </svg>

      {activePoint && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-plum-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{
            left: `${Math.min(80, Math.max(20, (x(selected!.index, activePoint.s.points.length) / W) * 100))}%`,
            top: `${(yFromNorm(activePoint.p.norm) / H) * 100}%`,
            marginTop: -8,
          }}
        >
          <p className="font-semibold">
            {t.track.hormones[activePoint.s.hormone]}: {activePoint.p.log.value} {activePoint.p.log.unit}
          </p>
          <p className="text-faint">
            {`typical ${HORMONE_REFERENCE[activePoint.s.hormone].low}–${HORMONE_REFERENCE[activePoint.s.hormone].high} ${HORMONE_REFERENCE[activePoint.s.hormone].unit}`}
          </p>
          <p className="text-faint">
            {new Date(activePoint.p.log.measured_on).toLocaleDateString(lang, {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Color-key legend so each line is identifiable at a glance */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {series.map(({ hormone }) => (
          <span key={hormone} className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: HORMONE_COLOR[hormone] }}
            />
            {t.track.hormones[hormone]}
          </span>
        ))}
      </div>
    </div>
  );
}
