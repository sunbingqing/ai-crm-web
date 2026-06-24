import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import type { ComboboxRoot } from '@base-ui/react/combobox'

export interface SearchableSelectOption {
  key: string
  label: string
  description?: string
}

interface SearchableSelectProps<T extends SearchableSelectOption> {
  options: T[]
  value: T | null
  inputValue: string
  open: boolean
  placeholder: string
  emptyText: string
  errorText: string
  isLoading?: boolean
  isError?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  disabled?: boolean
  className?: string
  showClear?: boolean
  onOpenChange: (open: boolean) => void
  onInputValueChange: (value: string, details: ComboboxRoot.ChangeEventDetails) => void
  onValueChange: (value: T | null, details: ComboboxRoot.ChangeEventDetails) => void
  onReachEnd?: () => void
  isOptionEqual?: (option: T, value: T) => boolean
}

export function SearchableSelect<T extends SearchableSelectOption>({
  options,
  value,
  inputValue,
  open,
  placeholder,
  emptyText,
  errorText,
  isLoading = false,
  isError = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  disabled = false,
  className,
  showClear = false,
  onOpenChange,
  onInputValueChange,
  onValueChange,
  onReachEnd,
  isOptionEqual,
}: SearchableSelectProps<T>) {
  function handleListScroll(event: React.UIEvent<HTMLDivElement>) {
    if (!hasNextPage || isFetchingNextPage || !onReachEnd) {
      return
    }

    const element = event.currentTarget
    const reachedBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 24
    if (reachedBottom) {
      onReachEnd()
    }
  }

  return (
    <Combobox
      items={options}
      value={value}
      open={open}
      inputValue={inputValue}
      autoHighlight
      disabled={disabled}
      itemToStringLabel={(option) => option.label}
      itemToStringValue={(option) => option.label}
      isItemEqualToValue={isOptionEqual}
      onOpenChange={onOpenChange}
      onInputValueChange={onInputValueChange}
      onValueChange={onValueChange}
    >
      <ComboboxInput placeholder={placeholder} className={className} showClear={showClear} />
      <ComboboxContent>
        {isLoading ? (
          <div className="px-3 py-3 text-sm text-muted-foreground">加载中...</div>
        ) : isError ? (
          <div className="px-3 py-3 text-sm text-destructive">{errorText}</div>
        ) : (
          <>
            <ComboboxEmpty>{emptyText}</ComboboxEmpty>
            <ComboboxList onScroll={handleListScroll}>
              {(option) => (
                <ComboboxItem key={option.key} value={option}>
                  <div className="space-y-0.5">
                    <p className="font-medium">{option.label}</p>
                    {option.description && (
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                </ComboboxItem>
              )}
            </ComboboxList>
            {isFetchingNextPage && (
              <div className="px-3 py-2 text-xs text-muted-foreground">加载更多中...</div>
            )}
          </>
        )}
      </ComboboxContent>
    </Combobox>
  )
}
