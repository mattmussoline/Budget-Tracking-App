import { cn } from "@/components/ui/soft-surface";

type LikelihoodDialProps = {
  value: number;
  size?: number;
};

/**
 * The likelihood read as a ring rather than a number alone, so a stalled
 * opportunity and a nearly-closed one look different at a glance. Colour is
 * semantic here, not the page accent.
 */
export function LikelihoodDial({ value, size = 60 }: LikelihoodDialProps) {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);
  const center = size / 2;

  return (
    <div className="grid justify-items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Likelihood ${value} percent`}
        className="block"
      >
        <circle cx={center} cy={center} r={radius} className="fill-none stroke-hairline" strokeWidth={6} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference.toFixed(1)}
          strokeDashoffset={offset.toFixed(1)}
          transform={`rotate(-90 ${center} ${center})`}
          className={cn(
            "fill-none",
            value >= 65 ? "stroke-tone-green-line" : value >= 40 ? "stroke-tone-amber-line" : "stroke-tone-orange-line"
          )}
        />
        <text
          x={center}
          y={center + 4}
          textAnchor="middle"
          className="fill-foreground text-[13px] font-semibold tabular-nums"
        >
          {value}%
        </text>
      </svg>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">Likelihood</span>
    </div>
  );
}
