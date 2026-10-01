import { useSearchParams } from 'react-router'

import { Disclaimer } from '@/components/common/Disclaimer'
import { PageHeader } from '@/components/common/PageHeader'
import { BcdLab } from '@/components/physics/BcdLab'
import { BuoyancyLab } from '@/components/physics/BuoyancyLab'
import { GasLab } from '@/components/physics/GasLab'
import { PressureLab } from '@/components/physics/PressureLab'
import { TankLab } from '@/components/physics/TankLab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const LABS = [
  { id: 'pressure', label: 'Pressure', Lab: PressureLab },
  { id: 'gas', label: 'Gas Consumption', Lab: GasLab },
  { id: 'buoyancy', label: 'Buoyancy', Lab: BuoyancyLab },
  { id: 'bcd', label: 'BCD Expansion', Lab: BcdLab },
  { id: 'tank', label: 'Tank Weight', Lab: TankLab },
] as const

export default function PhysicsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('lab')
  const activeLab = LABS.find((lab) => lab.id === requested)?.id ?? LABS[0].id

  return (
    <>
      <PageHeader
        eyebrow="Physics Lab"
        title="Dive physics, one variable at a time"
        description="Move a slider and watch the numbers respond. These are the same formulas that drive the simulator."
      />
      <Disclaimer className="mb-6" />
      <Tabs
        value={activeLab}
        onValueChange={(lab) => setSearchParams({ lab }, { replace: true })}
        className="gap-6"
      >
        <TabsList className="h-auto flex-wrap">
          {LABS.map(({ id, label }) => (
            <TabsTrigger key={id} value={id} className="px-3">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {LABS.map(({ id, Lab }) => (
          <TabsContent key={id} value={id}>
            <Lab />
          </TabsContent>
        ))}
      </Tabs>
    </>
  )
}
