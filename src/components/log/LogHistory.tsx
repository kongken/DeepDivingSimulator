import { Trash2 } from 'lucide-react'

import { RATING_TONE, TONE_TEXT } from '@/components/common/tone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { getOverallRating } from '@/lib/dive-log'
import { formatDateTime, formatDuration, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DiveLog } from '@/types/dive'

interface LogHistoryProps {
  logs: DiveLog[]
  selectedId: string
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function LogHistory({ logs, selectedId, onSelect, onDelete }: LogHistoryProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Logbook</CardTitle>
        <CardDescription>
          {logs.length} dive{logs.length === 1 ? '' : 's'} saved in this browser
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-1.5">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSelect(log.id)}
                aria-current={log.id === selectedId ? 'true' : undefined}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors outline-none hover:bg-secondary/60 focus-visible:ring-3 focus-visible:ring-ring/50',
                  log.id === selectedId ? 'border-primary/60 bg-primary/10' : 'border-transparent',
                )}
              >
                <span
                  className={cn(
                    'size-2 shrink-0 rounded-full bg-current',
                    TONE_TEXT[RATING_TONE[getOverallRating(log)]],
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{log.siteName}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {formatDateTime(log.endedAt)}
                  </span>
                </span>
                <span className="text-right font-mono text-xs text-muted-foreground tabular-nums">
                  {formatNumber(log.maxDepth)} m
                  <br />
                  {formatDuration(log.diveTimeSeconds)}
                </span>
              </button>
              <DeleteLogButton log={log} onDelete={onDelete} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function DeleteLogButton({ log, onDelete }: { log: DiveLog; onDelete: (id: string) => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Delete dive at ${log.siteName}`}>
          <Trash2 aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete this dive?</DialogTitle>
          <DialogDescription>
            {log.siteName} · {formatDateTime(log.endedAt)}. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive" onClick={() => onDelete(log.id)}>
              Delete
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
