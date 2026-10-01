import { cn } from '@/lib/utils'
import type { CylinderMaterial } from '@/types/dive'

const DIVER_WIDTH_PX = 120
const DIVER_HEIGHT_PX = 52

const TANK_COLORS: Record<CylinderMaterial, string> = {
  aluminium: 'oklch(0.82 0.012 240)',
  steel: 'oklch(0.78 0.12 85)',
}
const SUIT_COLOR = 'oklch(0.3 0.03 250)'
const OUTLINE_COLOR = 'oklch(0.9 0.03 230 / 0.35)'
const FIN_COLOR = 'var(--caution)'

const BCD_BASE_RX = 20
const BCD_GROWTH_RX = 10
const BCD_BASE_RY = 3
const BCD_GROWTH_RY = 8

interface DiverFigureProps {
  /** 0 (empty) – 1 (full) BCD inflation. */
  bcdFill: number
  pitchDegrees: number
  finning: boolean
  tankMaterial: CylinderMaterial
}

/** Side view of a diver facing right. The BCD wing grows with the air inside it. */
export function DiverFigure({ bcdFill, pitchDegrees, finning, tankMaterial }: DiverFigureProps) {
  const fill = Math.min(1, Math.max(0, bcdFill))
  return (
    <svg
      viewBox={`0 0 ${DIVER_WIDTH_PX} ${DIVER_HEIGHT_PX}`}
      width={DIVER_WIDTH_PX}
      height={DIVER_HEIGHT_PX}
      className="overflow-visible drop-shadow-[0_6px_10px_rgb(0_0_0/0.35)] transition-transform duration-300"
      style={{ transform: `rotate(${pitchDegrees}deg)` }}
      aria-hidden
    >
      {/* BCD wing around the tank */}
      <ellipse
        cx={60}
        cy={15}
        rx={BCD_BASE_RX + BCD_GROWTH_RX * fill}
        ry={BCD_BASE_RY + BCD_GROWTH_RY * fill}
        fill="var(--primary)"
        fillOpacity={0.18 + 0.25 * fill}
        stroke="var(--primary)"
        strokeOpacity={0.7}
        strokeWidth={1.2}
      />
      {/* Fins */}
      <g
        className={cn(finning && 'animate-fin-kick')}
        style={{ transformBox: 'fill-box', transformOrigin: 'right center' }}
      >
        <path d="M0 14 L16 23 L16 31 L0 40 Z" fill={FIN_COLOR} fillOpacity={0.85} />
      </g>
      {/* Legs and torso */}
      <rect x={14} y={22} width={28} height={9} rx={4.5} fill={SUIT_COLOR} stroke={OUTLINE_COLOR} />
      <rect
        x={36}
        y={18}
        width={48}
        height={17}
        rx={8.5}
        fill={SUIT_COLOR}
        stroke={OUTLINE_COLOR}
      />
      {/* Tank and valve */}
      <rect x={40} y={9} width={40} height={10} rx={5} fill={TANK_COLORS[tankMaterial]} />
      <rect x={80} y={11} width={5} height={6} rx={1.5} fill="oklch(0.6 0.01 240)" />
      {/* Arm */}
      <rect x={68} y={30} width={20} height={5} rx={2.5} fill={SUIT_COLOR} stroke={OUTLINE_COLOR} />
      {/* Head, mask, regulator */}
      <circle cx={91} cy={26} r={8} fill={SUIT_COLOR} stroke={OUTLINE_COLOR} />
      <rect x={93} y={20} width={8} height={7} rx={2.5} fill="var(--primary)" fillOpacity={0.85} />
      <circle cx={98} cy={31} r={2.6} fill="oklch(0.55 0.01 240)" />
    </svg>
  )
}
