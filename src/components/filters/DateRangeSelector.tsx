import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CalendarDays } from 'lucide-react'

const MAX_RANGE_DAYS = 30

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export type RangePreset = '7d' | '30d' | 'custom'

export interface DateRangeState {
  preset: RangePreset
  startDate: string
  endDate: string
}

const RANGE_OPTIONS: Array<{ key: RangePreset; label: string }> = [
  { key: '7d', label: '近 7 天' },
  { key: '30d', label: '近 30 天' },
  { key: 'custom', label: '自定义时间' },
]

export function buildPresetRange(preset: Exclude<RangePreset, 'custom'>): DateRangeState {
  const end = new Date()
  const start = new Date(end)
  start.setDate(end.getDate() - (preset === '7d' ? 6 : 29))

  return {
    preset,
    startDate: formatDateInputValue(start),
    endDate: formatDateInputValue(end),
  }
}

export function formatDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateInputValue(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function toStartOfDay(date: string) {
  return new Date(`${date}T00:00:00`).getTime()
}

export function toEndOfDay(date: string) {
  return new Date(`${date}T23:59:59`).getTime()
}

export function buildPreviousPeriodRequest(orgId: string, startDate: string, endDate: string) {
  const start = parseDateInputValue(startDate)
  const end = parseDateInputValue(endDate)
  if (!start || !end) {
    return null
  }

  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / MILLISECONDS_PER_DAY) + 1)
  const previousEnd = new Date(start)
  previousEnd.setDate(start.getDate() - 1)
  const previousStart = new Date(previousEnd)
  previousStart.setDate(previousEnd.getDate() - days + 1)

  return {
    orgId,
    startTime: toStartOfDay(formatDateInputValue(previousStart)),
    endTime: toEndOfDay(formatDateInputValue(previousEnd)),
  }
}

interface DateRangeSelectorProps {
  value: DateRangeState
  onChange: (range: DateRangeState) => void
  className?: string
}

export function DateRangeSelector({ value, onChange, className }: DateRangeSelectorProps) {
  function handleSelectPreset(preset: RangePreset) {
    if (preset === 'custom') {
      onChange({ ...value, preset })
      return
    }
    onChange(buildPresetRange(preset))
  }

  function handleRangeSelect(range: { from?: Date; to?: Date } | undefined) {
    if (!range) return

    let { from, to } = range
    if (!from || !to) {
      if (from) {
        onChange({
          preset: 'custom',
          startDate: formatDateInputValue(from),
          endDate: formatDateInputValue(from),
        })
      }
      return
    }

    if (from > to) {
      ;[from, to] = [to, from]
    }

    const spanDays = Math.round((to.getTime() - from.getTime()) / MILLISECONDS_PER_DAY)
    if (spanDays > MAX_RANGE_DAYS) {
      to = new Date(from)
      to.setDate(from.getDate() + MAX_RANGE_DAYS)
    }

    onChange({
      preset: 'custom',
      startDate: formatDateInputValue(from),
      endDate: formatDateInputValue(to),
    })
  }

  const selectedRange =
    value.startDate && value.endDate
      ? {
          from: parseDateInputValue(value.startDate) ?? undefined,
          to: parseDateInputValue(value.endDate) ?? undefined,
        }
      : undefined

  const calendarDisabled = [
    { after: new Date() },
    ...(selectedRange?.from
      ? [{ before: new Date(selectedRange.from.getTime() - MAX_RANGE_DAYS * MILLISECONDS_PER_DAY) }]
      : []),
  ]

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {RANGE_OPTIONS.map((option) => (
        <Button
          key={option.key}
          type="button"
          variant={value.preset === option.key ? 'default' : 'outline'}
          size="lg"
          className={cn(
            'h-9 px-4 text-sm',
            value.preset === option.key
              ? 'shadow-sm'
              : 'bg-card text-muted-foreground hover:text-foreground',
          )}
          onClick={() => handleSelectPreset(option.key)}
        >
          {option.label}
        </Button>
      ))}

      {value.preset === 'custom' && (
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="lg"
                className={cn(
                  'h-9 px-4 text-sm bg-card text-muted-foreground hover:text-foreground font-normal justify-start',
                  (!value.startDate || !value.endDate) && 'text-muted-foreground',
                )}
              >
                <CalendarDays className="mr-2 size-4" />
                {value.startDate && value.endDate ? (
                  <>
                    {value.startDate}
                    <span className="mx-1 text-muted-foreground/60">—</span>
                    {value.endDate}
                  </>
                ) : (
                  '选择日期范围'
                )}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={handleRangeSelect}
              disabled={calendarDisabled}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
