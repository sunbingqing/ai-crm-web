"use client"

import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { getDateLocale } from "@/lib/locale"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "lucide-react"

const defaultClassNames = getDefaultClassNames()

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  buttonVariant = "ghost",
  captionLayout = "label",
  locale,
  components: userComponents,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const resolvedLocale = locale ?? getDateLocale()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={resolvedLocale}
      className={cn(
        "group/calendar bg-background p-3",
        className,
      )}
      captionLayout={captionLayout}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months,
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-7 p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-7 p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-7 w-full items-center justify-center px-7",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "font-medium select-none text-sm",
          defaultClassNames.caption_label,
        ),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 text-[0.8rem] font-normal text-muted-foreground select-none text-center",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        day: cn(
          "group/day relative aspect-square h-full w-full p-0 text-center select-none rounded-md",
          defaultClassNames.day,
        ),
        range_start: cn(
          "rounded-l-md bg-muted",
          defaultClassNames.range_start,
        ),
        range_middle: cn("rounded-none bg-muted", defaultClassNames.range_middle),
        range_end: cn(
          "rounded-r-md bg-muted",
          defaultClassNames.range_end,
        ),
        today: cn(
          "rounded-md bg-accent text-accent-foreground",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className="size-4" />
          }
          if (orientation === "right") {
            return <ChevronRightIcon className="size-4" />
          }
          return <ChevronDownIcon className="size-4" />
        },
        DayButton: ({ day, modifiers, className: dayButtonClassName, ...dayButtonProps }: React.ComponentProps<typeof DayButton>) => {
          const ref = React.useRef<HTMLButtonElement>(null)
          React.useEffect(() => {
            if (modifiers.focused) ref.current?.focus()
          }, [modifiers.focused])

          return (
            <Button
              ref={ref}
              variant="ghost"
              size="icon"
              data-selected-single={
                modifiers.selected &&
                !modifiers.range_start &&
                !modifiers.range_end &&
                !modifiers.range_middle
              }
              data-range-start={modifiers.range_start}
              data-range-end={modifiers.range_end}
              data-range-middle={modifiers.range_middle}
              className={cn(
                "relative isolate z-10 flex aspect-square size-auto w-full min-w-7 flex-col gap-1 border-0 leading-none font-normal",
                "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50",
                "data-[range-end=true]:rounded-md data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
                "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground",
                "data-[range-start=true]:rounded-md data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
                "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
                "dark:hover:text-foreground",
                defaultClassNames.day,
                dayButtonClassName,
              )}
              {...dayButtonProps}
            />
          )
        },
        ...userComponents,
      }}
      {...props}
    />
  )
}

export { Calendar }
