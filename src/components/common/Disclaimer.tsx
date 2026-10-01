import { Info } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function Disclaimer({ className }: { className?: string }) {
  return (
    <Alert className={className}>
      <Info aria-hidden />
      <AlertTitle>Training simulator — not a dive planner</AlertTitle>
      <AlertDescription>
        This simulator uses simplified dive physics for education and experimentation. It must not
        be used as a replacement for certified dive training, a dive computer, or real dive
        planning.
      </AlertDescription>
    </Alert>
  )
}
