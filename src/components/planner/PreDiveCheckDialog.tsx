import { Play, TriangleAlert } from 'lucide-react'

import { KeyboardLegend } from '@/components/dive/KeyboardLegend'
import { PreDiveChecklist } from '@/components/dive/PreDiveChecklist'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import type { DiveSetup } from '@/types/dive'

interface PreDiveCheckDialogProps {
  setup: DiveSetup
  disabled: boolean
  hasActiveDive: boolean
  onConfirm: () => void
}

export function PreDiveCheckDialog({
  setup,
  disabled,
  hasActiveDive,
  onConfirm,
}: PreDiveCheckDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-11 w-full text-base" disabled={disabled}>
          <Play aria-hidden />
          Start Dive
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pre-Dive Check</DialogTitle>
          <DialogDescription>
            BWRAF — BCD, Weights, Releases, Air, Final OK. Review your kit before you descend.
          </DialogDescription>
        </DialogHeader>

        <PreDiveChecklist setup={setup} />

        {hasActiveDive ? (
          <Alert className="border-caution/40 text-caution">
            <TriangleAlert aria-hidden />
            <AlertDescription className="text-caution/90">
              A dive is already in progress. Starting a new one discards it without a log entry.
            </AlertDescription>
          </Alert>
        ) : null}

        <Separator />
        <KeyboardLegend />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Back to plan</Button>
          </DialogClose>
          <Button onClick={onConfirm}>
            <Play aria-hidden />
            Begin Dive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
