import type { LucideIcon } from 'lucide-react'
import type { KeyboardEvent, PointerEvent } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ControlName } from '@/types/dive'

interface HoldButtonProps {
  control: ControlName
  label: string
  shortcut: string
  Icon: LucideIcon
  active: boolean
  disabled?: boolean
  onHoldChange: (control: ControlName, active: boolean) => void
}

/** A button that stays "on" for as long as it is held — by pointer, touch or Enter. */
export function HoldButton({
  control,
  label,
  shortcut,
  Icon,
  active,
  disabled = false,
  onHoldChange,
}: HoldButtonProps) {
  const press = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    onHoldChange(control, true)
  }
  const release = () => onHoldChange(control, false)
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' && !event.repeat) onHoldChange(control, true)
  }
  const onKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter') release()
  }

  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      aria-pressed={active}
      disabled={disabled}
      className={cn('h-14 flex-1 touch-none flex-col gap-0.5', active && 'ring-3 ring-primary/30')}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={release}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="flex items-center gap-1.5">
        <Icon aria-hidden />
        {label}
      </span>
      <kbd
        className={cn(
          'font-mono text-[0.62rem] font-normal',
          active ? 'text-primary-foreground/80' : 'text-muted-foreground',
        )}
      >
        {shortcut}
      </kbd>
    </Button>
  )
}
