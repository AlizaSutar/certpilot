import React from "react";

/**
 * CertPilot signature element: an instrument-panel style gauge,
 * modeled on an aircraft readiness/altitude dial. Renders a 220deg
 * arc with tick marks and a needle pointing at `value` (0-100).
 */
export default function Gauge({ value = 0, label = "Readiness", size = 180, sublabel }) {
  const v = Math.max(0, Math.min(100, value ?? 0));

  const startAngle = -130; // degrees
  const endAngle = 130;
  const sweep = endAngle - startAngle;

  const angleFor = (pct) => startAngle + (pct / 100) * sweep;

  const polar = (cx, cy, r, angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const cx = size / 2;
  const cy = size / 2 + size * 0.06;
  const r = size * 0.38;

  const arcPath = (a0, a1, radius) => {
    const p0 = polar(cx, cy, radius, a0);
    const p1 = polar(cx, cy, radius, a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${p0.x} ${p0.y} A ${radius} ${radius} 0 ${large} 1 ${p1.x} ${p1.y}`;
  };

  const needleAngle = angleFor(v);
  const needleTip = polar(cx, cy, r * 0.92, needleAngle);

  const color = v >= 70 ? "#3DDC97" : v >= 40 ? "#F2A93B" : "#FB6B6B";

  const ticks = Array.from({ length: 11 }, (_, i) => i * 10);

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${label}: ${v} percent`}>
      <svg width={size} height={size * 0.78} viewBox={`0 0 ${size} ${size * 0.78}`}>
        {/* Background track */}
        <path
          d={arcPath(startAngle, endAngle, r)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={size * 0.045}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={arcPath(startAngle, needleAngle, r)}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.045}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
        {/* Ticks */}
        {ticks.map((t) => {
          const a = angleFor(t);
          const outer = polar(cx, cy, r + size * 0.05, a);
          const inner = polar(cx, cy, r + size * 0.005, a);
          return (
            <line
              key={t}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={t % 50 === 0 ? 2 : 1}
            />
          );
        })}
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="#F2A93B"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={size * 0.02} fill="#F2A93B" />
        {/* Value label */}
        <text
          x={cx}
          y={cy - size * 0.06}
          textAnchor="middle"
          className="font-display"
          fill="#E6EBF2"
          fontSize={size * 0.16}
          fontWeight="700"
        >
          {Math.round(v)}%
        </text>
      </svg>
      <div className="text-center -mt-1">
        <div className="text-[11px] uppercase tracking-wider text-ink-muted font-medium">{label}</div>
        {sublabel && <div className="text-[11px] text-ink-faint">{sublabel}</div>}
      </div>
    </div>
  );
}
