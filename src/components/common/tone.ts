import type { AlertTone, ComputerStatusTone } from '@/lib/dive-status'
import type { AssessmentRating } from '@/types/dive'

export type Tone = 'neutral' | 'info' | 'success' | 'caution' | 'warning' | 'danger'

export const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-foreground',
  info: 'text-info',
  success: 'text-success',
  caution: 'text-caution',
  warning: 'text-warning',
  danger: 'text-danger',
}

export const TONE_SURFACE: Record<Tone, string> = {
  neutral: 'border-border bg-muted/40 text-foreground',
  info: 'border-info/40 bg-info/10 text-info',
  success: 'border-success/40 bg-success/10 text-success',
  caution: 'border-caution/40 bg-caution/10 text-caution',
  warning: 'border-warning/50 bg-warning/15 text-warning',
  danger: 'border-danger/60 bg-danger/15 text-danger',
}

export function toneFromAlert(tone: AlertTone | ComputerStatusTone): Tone {
  return tone === 'ok' ? 'success' : tone
}

export const RATING_TONE: Record<AssessmentRating, Tone> = {
  good: 'success',
  'needs-improvement': 'caution',
  unsafe: 'danger',
}

export const RATING_LABEL: Record<AssessmentRating, string> = {
  good: 'Good',
  'needs-improvement': 'Needs Improvement',
  unsafe: 'Unsafe',
}
