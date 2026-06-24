import { cn } from '@/lib/utils'

export function LabelSwitch({
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-[52px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        checked ? 'bg-primary' : 'bg-input',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none absolute text-[10px] font-medium transition-all',
          checked ? 'left-1.5 text-primary-foreground' : 'right-1.5 text-muted-foreground',
        )}
      >
        {checked ? '启用' : '停用'}
      </span>
      <span
        className={cn(
          'pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform',
          checked ? 'translate-x-[30px]' : 'translate-x-[2px]',
        )}
      />
    </button>
  )
}
