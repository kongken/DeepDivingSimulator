import { useEffect } from 'react'

import { useDiveStore } from '@/store/dive-store'
import type { ControlName } from '@/types/dive'

export const KEY_BINDINGS: Readonly<Record<string, ControlName>> = {
  KeyW: 'inhale',
  KeyS: 'exhale',
  Space: 'inflate',
  ShiftLeft: 'deflate',
  ShiftRight: 'deflate',
  ArrowUp: 'finUp',
  ArrowDown: 'finDown',
}

export const PAUSE_KEY = 'KeyP'

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

/** Hold-to-act keyboard controls for the dive simulator. */
export function useDiveKeyboard(enabled: boolean): void {
  const setControl = useDiveStore((state) => state.setControl)
  const releaseControls = useDiveStore((state) => state.releaseControls)
  const togglePause = useDiveStore((state) => state.togglePause)

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target) || event.metaKey || event.ctrlKey) return
      const control = KEY_BINDINGS[event.code]
      if (control) {
        event.preventDefault()
        if (!event.repeat) setControl(control, true)
      } else if (event.code === PAUSE_KEY && !event.repeat) {
        togglePause()
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      const control = KEY_BINDINGS[event.code]
      if (!control) return
      event.preventDefault()
      setControl(control, false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', releaseControls)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', releaseControls)
      releaseControls()
    }
  }, [enabled, setControl, releaseControls, togglePause])
}
