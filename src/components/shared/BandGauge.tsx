"use client";

import { useEffect, useState } from "react";

interface BandGaugeProps {
  band: number; // 0-9
  correct: number;
  total: number;
}

export default function BandGauge({ band, correct, total }: BandGaugeProps) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(band), 150);
    return () => clearTimeout(t);
  }, [band]);

  // Semi-circle gauge from 0 to 9, mapped across 180 degrees.
  const radius = 90;
  const cx = 110;
  const cy = 110;
  const startAngle = 180;
  const endAngle = 0;
  const pct = Math.min(animated / 9, 1);
  const angle = startAngle + (endAngle - startAngle) * pct;

  const polarToCartesian = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy - radius * Math.sin(rad),
    };
  };

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(angle);
  const largeArc = angle < 90 ? 1 : 0;

  const bgArcEnd = polarToCartesian(endAngle);

  return (
    <div
      className="flex flex-col items-center"
      role="img"
      aria-label={`Estimated band ${animated.toFixed(1)} out of 9`}
    >
      <svg width="220" height="130" viewBox="0 0 220 130" aria-hidden="true">
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 1 1 ${bgArcEnd.x} ${bgArcEnd.y}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
          fill="none"
          stroke="url(#bandGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          style={{ transition: "d 1s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
        <defs>
          <linearGradient id="bandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <div className="-mt-14 flex flex-col items-center">
        <span className="font-display text-5xl font-bold gradient-text">
          {animated.toFixed(1)}
        </span>
        <span className="text-xs uppercase tracking-widest text-slate-400 mt-1">
          Estimated band
        </span>
        <span className="text-sm text-slate-400 mt-2">
          {correct} / {total} correct
        </span>
      </div>
    </div>
  );
}
