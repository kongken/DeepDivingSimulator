import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'

import { StatTile } from '@/components/common/StatTile'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CYLINDERS, getCylinder } from '@/data/cylinders'
import { formatNumber, formatSigned } from '@/lib/format'
import { calculateGasVolume } from '@/lib/physics/gas'
import { calculateTankBuoyancy, calculateTankGasMass } from '@/lib/physics/tank'
import { useDiveStore } from '@/store/dive-store'

import { LabLayout } from './LabLayout'

const PRESSURES_BAR = [200, 150, 100, 50] as const
const LABEL_FONT_SIZE = 11
const MASS_FRACTION_DIGITS = 2

const chartConfig = {
  gasMass: { label: 'Gas mass', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function TankLab() {
  const plannedCylinderId = useDiveStore((state) => state.plan.cylinderId)
  const [cylinderId, setCylinderId] = useState(plannedCylinderId)
  const cylinder = getCylinder(cylinderId)

  const rows = PRESSURES_BAR.map((pressure) => ({
    pressure,
    label: `${pressure} bar`,
    gasVolume: calculateGasVolume(cylinder.waterVolume, pressure),
    gasMass: calculateTankGasMass(cylinder.waterVolume, pressure),
    buoyancy: calculateTankBuoyancy(cylinder, pressure).total,
  }))
  const full = rows[0]
  const reserve = rows[rows.length - 1]
  const lighterBy = full.gasMass - reserve.gasMass

  return (
    <LabLayout
      title="Tank Weight"
      description="Gas mass = cylinder volume × pressure × 0.001225 kg/L"
      controls={
        <div className="grid gap-2">
          <Label htmlFor="lab-tank-cylinder" className="text-muted-foreground">
            Cylinder
          </Label>
          <Select value={cylinderId} onValueChange={setCylinderId}>
            <SelectTrigger id="lab-tank-cylinder" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CYLINDERS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {cylinder.waterVolume} L internal volume · empty{' '}
            {formatSigned(cylinder.emptyBuoyancyKg)} kg in water
          </p>
        </div>
      }
      insight={
        <>
          Air has weight. Breathing this {cylinder.name} from 200 to 50 bar removes{' '}
          {formatNumber(lighterBy)} kg — you finish the dive that much more buoyant, which is why
          divers weight themselves for a near-empty tank.
        </>
      }
      readouts={rows.map((row) => (
        <StatTile
          key={row.pressure}
          label={row.label}
          value={formatNumber(row.gasMass, MASS_FRACTION_DIGITS)}
          unit="kg air"
          hint={`${Math.round(row.gasVolume)} L · tank ${formatSigned(row.buoyancy)} kg`}
        />
      ))}
      visualTitle="Gas mass by tank pressure"
      visual={
        <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
          <BarChart data={rows} margin={{ top: 24, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              width={48}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `${formatNumber(value)} kg`}
            />
            <Bar
              dataKey="gasMass"
              fill="var(--color-gasMass)"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="gasMass"
                position="top"
                fill="var(--foreground)"
                fontSize={LABEL_FONT_SIZE}
                formatter={(value: unknown) =>
                  `${formatNumber(Number(value), MASS_FRACTION_DIGITS)} kg`
                }
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      }
    />
  )
}
