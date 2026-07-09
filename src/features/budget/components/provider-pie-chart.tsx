"use client";

import { useState } from "react";

type ProviderPieSlice = {
  provider: string;
  color: string;
  dashArray: string;
  dashOffset: number;
  ariaLabel: string;
  contentLabel: string;
  percentLabel: string;
};

type ProviderPieChartProps = {
  slices: ProviderPieSlice[];
  size: number;
  center: number;
  radius: number;
  strokeWidth: number;
  providerCount: number;
};

export function ProviderPieChart({ slices, size, center, radius, strokeWidth, providerCount }: ProviderPieChartProps) {
  const [activeSlice, setActiveSlice] = useState<ProviderPieSlice | null>(null);

  function showSlice(slice: ProviderPieSlice) {
    setActiveSlice(slice);
  }

  function hideSlice() {
    setActiveSlice(null);
  }

  return (
    <div className="relative h-28 w-28 rounded-full">
      <svg aria-label="Provider content pie chart" className="absolute inset-0 h-full w-full" role="img" viewBox={`0 0 ${size} ${size}`}>
        {slices.length === 0 ? (
          <circle cx={center} cy={center} fill="none" r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} />
        ) : (
          slices.map((slice) => (
            <g key={slice.provider}>
              <circle
                aria-hidden="true"
                className="cursor-help"
                cx={center}
                cy={center}
                fill="none"
                onMouseEnter={() => showSlice(slice)}
                onMouseLeave={hideSlice}
                pointerEvents="stroke"
                r={radius}
                stroke="transparent"
                strokeDasharray={slice.dashArray}
                strokeDashoffset={slice.dashOffset}
                strokeWidth={strokeWidth + 18}
                transform={`rotate(-90 ${center} ${center})`}
              />
              <circle
                aria-label={slice.ariaLabel}
                className="cursor-help outline-none transition-opacity hover:opacity-80 focus:opacity-80"
                cx={center}
                cy={center}
                fill="none"
                onBlur={hideSlice}
                onFocus={() => showSlice(slice)}
                onMouseEnter={() => showSlice(slice)}
                onMouseLeave={hideSlice}
                r={radius}
                role="img"
                stroke={slice.color}
                strokeDasharray={slice.dashArray}
                strokeDashoffset={slice.dashOffset}
                strokeWidth={strokeWidth}
                tabIndex={0}
                transform={`rotate(-90 ${center} ${center})`}
              >
                <title>{slice.ariaLabel}</title>
              </circle>
            </g>
          ))
        )}
      </svg>
      <div className="pointer-events-none absolute inset-5 grid place-items-center rounded-full bg-amber-100 text-center">
        <span className="font-display text-3xl font-extrabold">{providerCount}</span>
      </div>
      {activeSlice ? (
        <div
          data-testid="provider-pie-tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max max-w-56 -translate-x-1/2 rounded-md bg-amber-950 px-3 py-2 text-center text-xs font-extrabold text-white shadow-lg"
        >
          <p>{activeSlice.provider}</p>
          <p className="font-bold opacity-85">
            {activeSlice.contentLabel} · {activeSlice.percentLabel}
          </p>
        </div>
      ) : null}
    </div>
  );
}
