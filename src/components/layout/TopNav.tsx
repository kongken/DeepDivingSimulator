import { ClipboardList, FlaskConical, Menu, NotebookPen, Waves } from 'lucide-react'
import { Link, NavLink } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { ActiveDiveIndicator } from './ActiveDiveIndicator'

const NAV_ITEMS = [
  { to: '/planner', label: 'Planner', Icon: ClipboardList },
  { to: '/dive', label: 'Dive', Icon: Waves },
  { to: '/physics', label: 'Physics Lab', Icon: FlaskConical },
  { to: '/log', label: 'Dive Log', Icon: NotebookPen },
] as const

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
    isActive
      ? 'bg-secondary text-foreground'
      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
  )
}

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-[0.18em]">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Waves className="size-4" aria-hidden />
          </span>
          DIVE LAB
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              <Icon className="size-4" aria-hidden />
              <span className="hidden md:inline">{label}</span>
              <span className="md:hidden">{label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ActiveDiveIndicator />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle className="tracking-[0.18em]">DIVE LAB</SheetTitle>
              </SheetHeader>
              <nav className="grid gap-1 px-4" aria-label="Main">
                {NAV_ITEMS.map(({ to, label, Icon }) => (
                  <SheetClose key={to} asChild>
                    <NavLink to={to} className={navLinkClass}>
                      <Icon className="size-4" aria-hidden />
                      {label}
                    </NavLink>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
