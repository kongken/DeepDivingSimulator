import { type CSSProperties, useState } from 'react'

const BUBBLES_PER_BREATH = 5
const DUMP_STREAM_BUBBLES = 4
const MIN_SIZE_PX = 3
const SIZE_RANGE_PX = 5
const MIN_RISE_PX = 90
const RISE_RANGE_PX = 70
const DRIFT_RANGE_PX = 22
const SPREAD_PX = 8
const MAX_DELAY_S = 0.45
const DUMP_STAGGER_S = 0.25

/** Deterministic pseudo-random number in [0, 1) so renders stay pure. */
function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return value - Math.floor(value)
}

interface BubbleProps {
  size: number
  offsetX: number
  drift: number
  rise: number
  delay: number
  infinite?: boolean
}

function Bubble({ size, offsetX, drift, rise, delay, infinite = false }: BubbleProps) {
  const style = {
    width: size,
    height: size,
    left: offsetX,
    animationDelay: `${delay}s`,
    animationIterationCount: infinite ? 'infinite' : 1,
    '--bubble-drift': `${drift}px`,
    '--bubble-rise': `${-rise}px`,
  } as CSSProperties
  return (
    <span
      className="absolute bottom-0 animate-bubble rounded-full border border-white/60 bg-white/15 opacity-0"
      style={style}
    />
  )
}

interface BubbleBurstProps {
  seed: number
  /** CSS `top` of the burst origin — captured once so bubbles stay where they were exhaled. */
  top: string
  left: string
}

/** One exhaled breath: a handful of bubbles rising from where the diver was. */
export function BubbleBurst({ seed, top, left }: BubbleBurstProps) {
  const [origin] = useState(() => ({ top, left }))
  return (
    <div className="pointer-events-none absolute size-0" style={origin} aria-hidden>
      {Array.from({ length: BUBBLES_PER_BREATH }, (_, index) => {
        const random = (salt: number) => pseudoRandom(seed * BUBBLES_PER_BREATH + index + salt)
        return (
          <Bubble
            key={index}
            size={MIN_SIZE_PX + random(0.1) * SIZE_RANGE_PX}
            offsetX={(random(0.2) - 0.5) * SPREAD_PX}
            drift={(random(0.3) - 0.5) * DRIFT_RANGE_PX}
            rise={MIN_RISE_PX + random(0.4) * RISE_RANGE_PX}
            delay={random(0.5) * MAX_DELAY_S}
          />
        )
      })}
    </div>
  )
}

/** Continuous stream from the BCD dump valve while deflating. */
export function DumpStream({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute size-0 ${className ?? ''}`} aria-hidden>
      {Array.from({ length: DUMP_STREAM_BUBBLES }, (_, index) => (
        <Bubble
          key={index}
          size={MIN_SIZE_PX + pseudoRandom(index) * SIZE_RANGE_PX}
          offsetX={(pseudoRandom(index + 0.5) - 0.5) * SPREAD_PX}
          drift={(pseudoRandom(index + 0.7) - 0.5) * DRIFT_RANGE_PX}
          rise={MIN_RISE_PX}
          delay={index * DUMP_STAGGER_S}
          infinite
        />
      ))}
    </div>
  )
}
