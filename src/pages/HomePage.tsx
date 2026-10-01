import { ArrowRight, ClipboardList, FlaskConical } from 'lucide-react'
import { Link } from 'react-router'

import { DiveFlow } from '@/components/home/DiveFlow'
import { FeatureGrid } from '@/components/home/FeatureGrid'
import { HeroComputer } from '@/components/home/HeroComputer'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl py-6 md:py-12">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="text-xs font-semibold tracking-[0.35em] text-primary">DIVE LAB</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Interactive Scuba Diving Simulator
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Learn buoyancy, gas management and ascent control through an interactive dive
            simulation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="h-11 px-5 text-base">
              <Link to="/planner">
                <ClipboardList aria-hidden />
                Plan a Dive
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-5 text-base">
              <Link to="/physics">
                <FlaskConical aria-hidden />
                Physics Lab
              </Link>
            </Button>
          </div>
        </div>
        <HeroComputer />
      </section>

      <FeatureGrid className="mt-16" />
      <DiveFlow className="mt-12" />
    </div>
  )
}
