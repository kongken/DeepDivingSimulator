import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <div className="font-mono text-5xl text-primary">404</div>
      <p className="text-muted-foreground">Nothing down here but sand.</p>
      <Button asChild>
        <Link to="/">Back to the surface</Link>
      </Button>
    </div>
  )
}
