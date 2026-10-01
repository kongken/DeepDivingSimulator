import { Pause, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatNumber, formatSigned } from '@/lib/format'
import { classifyBuoyancy } from '@/lib/physics/buoyancy'
import {
  BCD_MAX_VOLUME_L,
  BREATH_CYCLE_SECONDS,
  SAFETY_STOP_MAX_DEPTH_M,
  SAFETY_STOP_MIN_DEPTH_M,
  SAFETY_STOP_TRIGGER_DEPTH_M,
} from '@/lib/physics/constants'
import { calculateAmbientPressure } from '@/lib/physics/pressure'
import { isInSafetyStopZone } from '@/lib/physics/safety'
import { cn } from '@/lib/utils'
import { useDiveStore } from '@/store/dive-store'
import type { DiveSetup } from '@/types/dive'

import { BubbleBurst, DumpStream } from './Bubbles'
import { DiverFigure } from './DiverFigure'
import { REGULATOR_OFFSET_PX } from './diver-geometry'

const SKY_PX = 36
const SEABED_PX = 28
/** The water colour reaches its darkest at this depth. */
const DARKEST_WATER_DEPTH_M = 40
const TICK_INTERVALS = [
  { upTo: 6, step: 1 },
  { upTo: 20, step: 2 },
  { upTo: Infinity, step: 5 },
] as const
const PITCH_DEGREES_PER_MPS = 40
const MAX_PITCH_DEGREES = 15
const ARROW_MAX_PX = 64
const ARROW_FULL_SCALE_KG = 4
const BUBBLE_MIN_DEPTH_M = 0.5
/** Exhalation starts a quarter of the way through each breathing cycle. */
const EXHALE_START_FRACTION = 0.25
const FULL_PERCENT = 100

function depthTop(depth: number, seabedDepth: number): string {
  const fraction = Math.min(1, Math.max(0, depth / seabedDepth))
  return `calc(${SKY_PX}px + (100% - ${SKY_PX + SEABED_PX}px) * ${fraction})`
}

function depthSpan(fromDepth: number, toDepth: number, seabedDepth: number): string {
  return `calc((100% - ${SKY_PX + SEABED_PX}px) * ${(toDepth - fromDepth) / seabedDepth})`
}

function getTickDepths(seabedDepth: number): number[] {
  const { step } = TICK_INTERVALS.find(({ upTo }) => seabedDepth <= upTo) ?? TICK_INTERVALS[2]
  // The seabed itself is labelled separately.
  return Array.from({ length: Math.ceil(seabedDepth / step) }, (_, index) => index * step)
}

export function DepthView({ setup }: { setup: DiveSetup }) {
  const simulation = useDiveStore((state) => state.simulation)
  const controls = useDiveStore((state) => state.controls)
  const paused = useDiveStore((state) => state.phase === 'paused')
  const togglePause = useDiveStore((state) => state.togglePause)
  if (!simulation) return null

  const { site, plan, cylinder } = setup
  const seabed = site.maxDepth
  const { depth, netBuoyancyKg } = simulation
  const diverTop = depthTop(depth, seabed)
  const showSafetyBand = seabed >= SAFETY_STOP_TRIGGER_DEPTH_M
  const inStopZone = simulation.safetyStop.required && isInSafetyStopZone(depth)
  const waterDepthPercent = Math.min(1, seabed / DARKEST_WATER_DEPTH_M) * FULL_PERCENT
  const pitch = -Math.max(
    -MAX_PITCH_DEGREES,
    Math.min(MAX_PITCH_DEGREES, simulation.verticalVelocity * PITCH_DEGREES_PER_MPS),
  )
  const arrowPx = Math.min(1, Math.abs(netBuoyancyKg) / ARROW_FULL_SCALE_KG) * ARROW_MAX_PX
  const buoyancy = classifyBuoyancy(netBuoyancyKg)
  const breathIndex = Math.floor(
    simulation.elapsedSeconds / BREATH_CYCLE_SECONDS - EXHALE_START_FRACTION,
  )
  const dumping = controls.deflate && simulation.bcdVolume > 0 && depth > BUBBLE_MIN_DEPTH_M

  return (
    <section
      aria-label="Depth view"
      className="relative h-[460px] overflow-hidden rounded-2xl border bg-card select-none lg:h-auto lg:min-h-[460px]"
    >
      {/* Sky and surface */}
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-end bg-gradient-to-b from-sky-200/10 to-sky-300/5 pr-3 text-[0.65rem] tracking-widest text-muted-foreground"
        style={{ height: SKY_PX }}
      >
        SURFACE · 1.0 ATA
      </div>
      <div
        className="absolute inset-x-0"
        style={{
          top: SKY_PX,
          bottom: SEABED_PX,
          background: `linear-gradient(to bottom, var(--water-surface), color-mix(in oklch, var(--water-surface), var(--water-deep) ${waterDepthPercent}%))`,
        }}
      />
      <div className="absolute inset-x-0 overflow-hidden" style={{ top: SKY_PX - 4, height: 8 }}>
        <svg
          className="h-2 w-[calc(100%+40px)] animate-surface-drift text-water-surface"
          preserveAspectRatio="none"
          viewBox="0 0 40 8"
          aria-hidden
        >
          <defs>
            <pattern id="surface-wave" width="40" height="8" patternUnits="userSpaceOnUse">
              <path d="M0 4 Q10 0 20 4 T40 4 V8 H0 Z" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="8" fill="url(#surface-wave)" />
        </svg>
      </div>

      {/* Seabed */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-end bg-seabed bg-[radial-gradient(oklch(1_0_0/0.12)_1px,transparent_1px)] [background-size:6px_6px] pr-3 text-[0.65rem] tracking-widest text-foreground/70"
        style={{ height: SEABED_PX }}
      >
        SEABED · {seabed} m · {formatNumber(calculateAmbientPressure(seabed))} ATA
      </div>

      {/* Depth ruler with ambient pressure */}
      {getTickDepths(seabed).map((tick) => (
        <div
          key={tick}
          className="absolute inset-x-0 flex -translate-y-1/2 items-center"
          style={{ top: depthTop(tick, seabed) }}
        >
          <span className="w-12 pl-2 font-mono text-[0.68rem] text-foreground/70 tabular-nums">
            {tick} m
          </span>
          <span className="h-px flex-1 bg-white/8" />
          <span className="w-16 pr-2 text-right font-mono text-[0.62rem] text-foreground/50 tabular-nums">
            {formatNumber(calculateAmbientPressure(tick))} ATA
          </span>
        </div>
      ))}

      {/* Safety stop band */}
      {showSafetyBand ? (
        <div
          className={cn(
            'absolute inset-x-12 flex items-center border-y border-dashed px-3 text-[0.62rem] font-semibold tracking-widest transition-colors',
            inStopZone
              ? 'border-success/80 bg-success/25 text-success'
              : 'border-success/40 bg-success/10 text-success/70',
          )}
          style={{
            top: depthTop(SAFETY_STOP_MIN_DEPTH_M, seabed),
            height: depthSpan(SAFETY_STOP_MIN_DEPTH_M, SAFETY_STOP_MAX_DEPTH_M, seabed),
          }}
        >
          SAFETY STOP 4.5–5.5 m
        </div>
      ) : null}

      {/* Planned depth and max depth reached */}
      <div
        className="absolute inset-x-12 border-t border-dashed border-caution/60"
        style={{ top: depthTop(plan.maxDepth, seabed) }}
      >
        <span className="absolute right-2 -translate-y-full pb-0.5 text-[0.62rem] font-semibold tracking-widest text-caution">
          PLAN {plan.maxDepth} m
        </span>
      </div>
      {simulation.maxDepth > 0 ? (
        <div
          className="absolute left-10 size-0 -translate-y-1/2 border-y-4 border-l-6 border-y-transparent border-l-primary"
          style={{ top: depthTop(simulation.maxDepth, seabed) }}
          title={`Max depth ${formatNumber(simulation.maxDepth)} m`}
        />
      ) : null}

      {/* Exhaled bubbles stay where they were released */}
      {depth > BUBBLE_MIN_DEPTH_M && breathIndex >= 0 ? (
        <BubbleBurst
          key={breathIndex}
          seed={breathIndex}
          top={`calc(${diverTop} + ${REGULATOR_OFFSET_PX.y}px)`}
          left={`calc(50% + ${REGULATOR_OFFSET_PX.x}px)`}
        />
      ) : null}

      {/* Diver */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ top: diverTop }}
      >
        <div className="relative">
          <DiverFigure
            bcdFill={simulation.bcdVolume / BCD_MAX_VOLUME_L}
            pitchDegrees={pitch}
            finning={controls.finUp !== controls.finDown}
            tankMaterial={cylinder.material}
          />
          {dumping ? <DumpStream className="top-1 left-[70%]" /> : null}

          {/* Net buoyancy arrow */}
          <div className="absolute top-1/2 -left-14 flex w-10 flex-col items-center">
            <div
              className={cn(
                'absolute w-1 rounded-full',
                buoyancy === 'positive' && 'bottom-0 bg-info',
                buoyancy === 'negative' && 'top-0 bg-warning',
                buoyancy === 'neutral' && 'hidden',
              )}
              style={{ height: arrowPx }}
            />
          </div>
          <div className="absolute top-1/2 left-full ml-3 -translate-y-1/2 whitespace-nowrap">
            <div className="font-mono text-sm text-foreground tabular-nums">
              {formatNumber(depth)} m
            </div>
            <div
              className={cn(
                'font-mono text-xs tabular-nums',
                buoyancy === 'positive' && 'text-info',
                buoyancy === 'negative' && 'text-warning',
                buoyancy === 'neutral' && 'text-success',
              )}
            >
              {formatSigned(netBuoyancyKg)} kg
            </div>
          </div>
        </div>
      </div>

      {paused ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-[2px]">
          <Pause className="size-8 text-muted-foreground" aria-hidden />
          <div className="text-sm text-muted-foreground">Simulation paused</div>
          <Button onClick={togglePause}>
            <Play aria-hidden />
            Resume (P)
          </Button>
        </div>
      ) : null}
    </section>
  )
}
