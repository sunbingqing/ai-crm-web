import { Pill } from './Pill'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface TagGroupProps {
  values: string[]
  emptyText: string
}

export function TagGroup({ values, emptyText }: TagGroupProps) {
  if (values.length === 0) {
    return <span className="text-sm text-muted-foreground">{emptyText}</span>
  }

  const visibleValues = values.slice(0, 3)
  const overflowValues = values.slice(3)
  const overflowCount = values.length - 3

  return (
    <div className="flex flex-wrap gap-2">
      {visibleValues.map((value) => (
        <Pill key={value} value={value} />
      ))}
      {overflowCount > 0 && (
        <Tooltip>
          <TooltipTrigger className="inline-flex cursor-pointer border-0 bg-transparent p-0">
            <Pill tone="muted" value={`+${overflowCount}`} />
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            <div className="flex flex-col gap-1 max-w-48">
              {overflowValues.map((value) => (
                <span key={value} className="whitespace-nowrap">{value}</span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
