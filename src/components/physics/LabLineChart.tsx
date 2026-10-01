import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, XAxis, YAxis } from 'recharts'

import { ChartValueRow } from '@/components/dive/charts/ChartValueRow'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatNumber } from '@/lib/format'

export type LabPoint = { x: number; y: number }

export interface LabReferenceLine {
  y: number
  label: string
  color: string
}

interface LabLineChartProps {
  data: LabPoint[]
  label: string
  color: string
  xUnit: string
  yUnit: string
  current: LabPoint
  yDomain?: [number, number]
  xReversed?: boolean
  yFractionDigits?: number
  referenceLines?: LabReferenceLine[]
}

function isLabPoint(value: unknown): value is LabPoint {
  return typeof value === 'object' && value !== null && 'x' in value && 'y' in value
}

const CURRENT_POINT_RADIUS = 6
const REFERENCE_LABEL_FONT_SIZE = 10

/** A curve with the current experiment value highlighted on it. */
export function LabLineChart({
  data,
  label,
  color,
  xUnit,
  yUnit,
  current,
  yDomain,
  xReversed = false,
  yFractionDigits = 1,
  referenceLines = [],
}: LabLineChartProps) {
  const chartConfig = { y: { label, color } } satisfies ChartConfig
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="x"
          type="number"
          domain={['dataMin', 'dataMax']}
          reversed={xReversed}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `${value} ${xUnit}`}
        />
        <YAxis
          domain={yDomain ?? ['auto', 'auto']}
          width={48}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => formatNumber(value, yFractionDigits)}
        />
        {referenceLines.map((reference) => (
          <ReferenceLine
            key={reference.label}
            y={reference.y}
            stroke={reference.color}
            strokeDasharray="4 4"
            label={{
              value: reference.label,
              position: 'insideTopRight',
              fill: reference.color,
              fontSize: REFERENCE_LABEL_FONT_SIZE,
            }}
          />
        ))}
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const point: unknown = payload?.[0]?.payload
                return isLabPoint(point) ? `${formatNumber(point.x, 0)} ${xUnit}` : ''
              }}
              formatter={(value) => (
                <ChartValueRow
                  label={label}
                  value={`${formatNumber(Number(value), yFractionDigits)} ${yUnit}`}
                />
              )}
            />
          }
        />
        <Line
          dataKey="y"
          type="monotone"
          stroke="var(--color-y)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <ReferenceDot
          x={current.x}
          y={current.y}
          r={CURRENT_POINT_RADIUS}
          fill="var(--color-y)"
          stroke="var(--background)"
          strokeWidth={2}
        />
      </LineChart>
    </ChartContainer>
  )
}
