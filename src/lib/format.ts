import { SECONDS_PER_MINUTE } from '@/lib/physics/constants'

const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * SECONDS_PER_MINUTE

/** Formats seconds as `mm:ss`, or `h:mm:ss` past one hour. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / SECONDS_PER_HOUR)
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds % SECONDS_PER_MINUTE).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

/** Countdown format: rounds up so a fresh 180 s timer reads 03:00. */
export function formatCountdown(remainingSeconds: number): string {
  return formatDuration(Math.ceil(remainingSeconds))
}

/** Fixed-precision number that never renders as "-0.0". */
export function formatNumber(value: number, fractionDigits = 1): string {
  const rounded = Number(value.toFixed(fractionDigits))
  return (rounded === 0 ? 0 : rounded).toFixed(fractionDigits)
}

/** Like formatNumber, with an explicit sign for non-zero values. */
export function formatSigned(value: number, fractionDigits = 1): string {
  const text = formatNumber(value, fractionDigits)
  return Number(text) > 0 ? `+${text}` : text.replace('-', '−')
}

/** Ascent / descent rate with a direction arrow, e.g. "↑ 6.2" or "↓ 3.0". */
export function formatVerticalRate(rateMpm: number): string {
  const magnitude = formatNumber(Math.abs(rateMpm))
  if (Number(magnitude) === 0) return magnitude
  return `${rateMpm > 0 ? '↑' : '↓'} ${magnitude}`
}

const DATE_TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatDateTime(isoTimestamp: string): string {
  return DATE_TIME_FORMAT.format(new Date(isoTimestamp))
}
