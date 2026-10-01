import { Waves } from 'lucide-react'

/** Shown while a lazily loaded page is fetched on first load. */
export function RouteFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center text-muted-foreground">
      <Waves className="size-6 animate-pulse text-primary" aria-label="Loading" />
    </div>
  )
}
