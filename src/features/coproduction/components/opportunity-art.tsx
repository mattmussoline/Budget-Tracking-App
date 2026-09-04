import type { ReactNode } from "react";
import { cn } from "@/components/ui/soft-surface";
import type { ArtMotif, OpportunityArt } from "../coproduction-types";

/**
 * Geometric stand-ins keyed to each title's subject. They hold the shape of the
 * thumbnail slot until a partner sends real key art or a logo, and they are
 * drawn from plain circles, lines, and polygons so there is no path data to
 * maintain.
 */
const MOTIFS: Record<ArtMotif, ReactNode> = {
  ripples: (
    <g fill="none" stroke="#ffffff" strokeOpacity={0.18} strokeWidth={2}>
      <circle cx={80} cy={86} r={18} />
      <circle cx={80} cy={86} r={32} />
      <circle cx={80} cy={86} r={46} />
      <circle cx={80} cy={86} r={60} />
      <circle cx={80} cy={86} r={74} />
    </g>
  ),
  flame: (
    <g>
      <circle cx={80} cy={52} r={34} fill="#ffffff" fillOpacity={0.09} />
      <circle cx={80} cy={40} r={20} fill="#ffffff" fillOpacity={0.1} />
      <polygon points="80,4 104,52 56,52" fill="#ffffff" fillOpacity={0.08} />
    </g>
  ),
  table: (
    <g>
      <g fill="#ffffff" fillOpacity={0.09}>
        <rect x={26} y={58} width={108} height={5} rx={2} />
        <rect x={40} y={63} width={6} height={22} rx={2} />
        <rect x={114} y={63} width={6} height={22} rx={2} />
        <circle cx={80} cy={30} r={19} />
      </g>
      <circle cx={80} cy={30} r={27} fill="none" stroke="#ffffff" strokeOpacity={0.16} strokeWidth={2} />
    </g>
  ),
  rays: (
    <g>
      <g stroke="#ffffff" strokeOpacity={0.14} strokeWidth={2}>
        <line x1={80} y1={14} x2={20} y2={90} />
        <line x1={80} y1={14} x2={50} y2={90} />
        <line x1={80} y1={14} x2={80} y2={90} />
        <line x1={80} y1={14} x2={110} y2={90} />
        <line x1={80} y1={14} x2={140} y2={90} />
      </g>
      <circle cx={80} cy={14} r={9} fill="#ffffff" fillOpacity={0.22} />
    </g>
  ),
  path: (
    <g>
      <polygon points="0,90 46,34 92,90" fill="#ffffff" fillOpacity={0.08} />
      <polygon points="62,90 110,26 160,90" fill="#ffffff" fillOpacity={0.11} />
      <circle cx={132} cy={22} r={10} fill="#ffffff" fillOpacity={0.18} />
    </g>
  ),
  bloom: (
    <g>
      <g fill="#ffffff" fillOpacity={0.12}>
        <circle cx={80} cy={26} r={15} />
        <circle cx={80} cy={64} r={15} />
        <circle cx={47} cy={45} r={15} />
        <circle cx={113} cy={45} r={15} />
        <circle cx={56} cy={27} r={13} />
        <circle cx={104} cy={63} r={13} />
      </g>
      <circle cx={80} cy={45} r={10} fill="#ffffff" fillOpacity={0.28} />
    </g>
  ),
  hours: (
    <g>
      <g fill="none" stroke="#ffffff" strokeOpacity={0.2} strokeWidth={2}>
        <circle cx={80} cy={45} r={30} />
        <circle cx={80} cy={45} r={40} />
      </g>
      <g stroke="#ffffff" strokeOpacity={0.3} strokeWidth={3} strokeLinecap="round">
        <line x1={80} y1={45} x2={80} y2={24} />
        <line x1={80} y1={45} x2={97} y2={55} />
      </g>
    </g>
  )
};

type OpportunityArtPanelProps = {
  art: OpportunityArt;
  title: string;
  /** "card" is the full slate banner; "thumb" is the small modal-header tile. */
  variant?: "card" | "thumb";
  isMuted?: boolean;
  /** Uploaded key art or logo. When present it replaces the placeholder motif. */
  imageUrl?: string | null;
};

export function OpportunityArtPanel({ art, title, variant = "card", isMuted, imageUrl }: OpportunityArtPanelProps) {
  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden",
        variant === "card" ? "aspect-[16/9]" : "h-full w-full",
        isMuted && "saturate-[0.35]"
      )}
      style={imageUrl ? undefined : { backgroundImage: `linear-gradient(135deg, ${art.from} 0%, ${art.to} 100%)` }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={variant === "card" ? "" : `${title} key art`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 160 90"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {MOTIFS[art.motif]}
          <rect x={0} y={0} width={160} height={90} fill="#000000" fillOpacity={0.07} />
        </svg>
      )}

      {variant === "card" ? (
        <>
          {imageUrl ? <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" /> : null}
          <span className="relative z-10 px-7 text-center font-display text-2xl leading-tight tracking-tight text-white [text-shadow:0_1px_14px_rgba(0,0,0,0.3)]">
            {title}
          </span>
          {!imageUrl ? (
            <span className="absolute bottom-2 right-2 z-10 rounded-full bg-black/35 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/90">
              Placeholder key art
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
