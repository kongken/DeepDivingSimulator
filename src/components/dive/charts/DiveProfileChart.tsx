import { useId } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatDuration, formatNumber } from '@/lib/format'
import { SAFETY_STOP_MAX_DEPTH_M, SAFETY_STOP_MIN_DEPTH_M } from '@/lib/physics/constants'
import { cn } from '@/lib/utils'
import type { DiveSample } from '@/types/dive'

import { ChartValueRow } from './ChartValueRow'
import { TIME_AXIS_DOMAIN, getSampleTime } from './chart-utils'

const chartConfig = {
  depth: { label: 'Depth', color: 'var(--chart-1)' },
} satisfies ChartConfig

interface DiveProfileChartProps {
  samples: DiveSample[]
  seabedDepth: number
  plannedDepth: number
  showSafetyBand: boolean
  className?: string
}

/** Depth over time, drawn downward like a real dive profile. */
export function DiveProfileChart({
  samples,
  seabedDepth,
  plannedDepth,
  showSafetyBand,
  className,
}: DiveProfileChartProps) {
  const gradientId = `depth-fill-${useId().replace(/:/g, '')}`
  return (
    <ChartContainer config={chartConfig} className={cn('aspect-auto h-52 w-full', className)}>
      <AreaChart data={samples} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-depth)" stopOpacity={0.05} />
            <stop offset="100%" stopColor="var(--color-depth)" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          type="number"
          domain={TIME_AXIS_DOMAIN}
          allowDecimals={false}
          tickFormatter={formatDuration}
          tickLine={false}
          axisLine={false}
          minTickGap={40}
        />
        <YAxis
          reversed
          domain={[0, seabedDepth]}
          width={40}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `${value} m`}
        />
        {showSafetyBand ? (
          <ReferenceArea
            y1={SAFETY_STOP_MIN_DEPTH_M}
            y2={SAFETY_STOP_MAX_DEPTH_M}
            fill="var(--success)"
            fillOpacity={0.18}
            stroke="none"
          />
        ) : null}
        <ReferenceLine y={plannedDepth} stroke="var(--caution)" strokeDasharray="4 4" />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => formatDuration(getSampleTime(payload))}
              formatter={(value) => (
                <ChartValueRow label="Depth" value={`${formatNumber(Number(value))} m`} />
              )}
            />
          }
        />
        <Area
          dataKey="depth"
          type="monotone"
          stroke="var(--color-depth)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
