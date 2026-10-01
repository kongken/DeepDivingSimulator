import { Lightbulb } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LabLayoutProps {
  title: string
  description: string
  controls: ReactNode
  insight: ReactNode
  readouts: ReactNode
  visual: ReactNode
  visualTitle: string
}

/** Controls on the left; live numbers and a visual on the right. */
export function LabLayout({
  title,
  description,
  controls,
  insight,
  readouts,
  visual,
  visualTitle,
}: LabLayoutProps) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {controls}
          <div className="flex gap-2.5 rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div className="text-muted-foreground">{insight}</div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{readouts}</div>
        <Card size="sm">
          <CardHeader>
            <CardTitle>{visualTitle}</CardTitle>
          </CardHeader>
          <CardContent>{visual}</CardContent>
        </Card>
      </div>
    </div>
  )
}
