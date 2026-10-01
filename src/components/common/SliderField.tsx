import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

interface SliderFieldProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  fractionDigits?: number
  hint?: ReactNode
  /** Put the minimum on the right, e.g. for "ascend from depth to the surface". */
  inverted?: boolean
  className?: string
  onChange: (value: number) => void
}

export function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  fractionDigits = 0,
  hint,
  inverted = false,
  className,
  onChange,
}: SliderFieldProps) {
  return (
    <div className={cn('grid gap-2.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-muted-foreground">
          {label}
        </Label>
        <span className="font-mono text-base tabular-nums">
          {formatNumber(value, fractionDigits)}
          <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
        </span>
      </div>
      <Slider
        id={id}
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        inverted={inverted}
        onValueChange={([next]) => onChange(next)}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
