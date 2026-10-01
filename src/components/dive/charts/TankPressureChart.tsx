import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatDuration } from '@/lib/format'
import { LOW_GAS_PRESSURE_BAR, TURN_PRESSURE_BAR } from '@/lib/physics/constants'
import { cn } from '@/lib/utils'
import type { DiveSample } from '@/types/dive'

import { ChartValueRow } from './ChartValueRow'
import { TIME_AXIS_DOMAIN, getSampleTime } from './chart-utils'

const chartConfig = {
  tankPressure: { label: 'Tank', color: 'var(--chart-2)' },
} satisfies ChartConfig

const REFERENCE_LABEL_FONT_SIZE = 10

interface TankPressureChartProps {
  samples: DiveSample[]
  startPressure: number
  reservePressure: number
  className?: string
}

export function TankPressureChart({
  samples,
  startPressure,
  reservePressure,
  className,
}: TankPressureChartProps) {
  const thresholds = [
    { value: LOW_GAS_PRESSURE_BAR, label: 'Low', color: 'var(--caution)' },
    { value: TURN_PRESSURE_BAR, label: 'Turn', color: 'var(--caution)' },
    { value: reservePressure, label: 'Reserve', color: 'var(--warning)' },
  ].filter((threshold) => threshold.value < startPressure)

  return (
    <ChartContainer config={chartConfig} className={cn('aspect-auto h-52 w-full', className)}>
      <LineChart data={samples} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
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
          domain={[0, startPressure]}
          width={40}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `${value}`}
        />
        {thresholds.map(({ value, label, color }) => (
          <ReferenceLine
            key={label}
            y={value}
            stroke={color}
            strokeOpacity={0.6}
            strokeDasharray="4 4"
            label={{
              value: label,
              position: 'insideTopRight',
              fill: color,
              fontSize: REFERENCE_LABEL_FONT_SIZE,
            }}
          />
        ))}
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => formatDuration(getSampleTime(payload))}
              formatter={(value) => (
                <ChartValueRow label="Tank" value={`${Math.round(Number(value))} bar`} />
              )}
            />
          }
        />
        <Line
          dataKey="tankPressure"
          type="monotone"
          stroke="var(--color-tankPressure)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
