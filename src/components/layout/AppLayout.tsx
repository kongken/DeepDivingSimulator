import { Outlet, ScrollRestoration } from 'react-router'

import { TooltipProvider } from '@/components/ui/tooltip'
import { usePauseDiveOffscreen } from '@/hooks/use-pause-dive-offscreen'

import { TopNav } from './TopNav'

const TOOLTIP_DELAY_MS = 200

export function AppLayout() {
  usePauseDiveOffscreen()
  return (
    <TooltipProvider delayDuration={TOOLTIP_DELAY_MS}>
      <div className="flex min-h-svh flex-col">
        <TopNav />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-6">
          <Outlet />
        </main>
        <footer className="border-t">
          <div className="mx-auto max-w-[1440px] px-4 py-4 text-xs text-muted-foreground md:px-6">
            Dive Lab uses simplified dive physics for education only — not a substitute for
            certified dive training, a dive computer, or real dive planning.
          </div>
        </footer>
      </div>
      <ScrollRestoration />
    </TooltipProvider>
  )
}
