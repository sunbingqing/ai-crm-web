import type { ReactNode } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

interface DataTableSectionProps {
  title: string
  description?: string
  total: number
  currentPage: number
  pageCount: number
  className?: string
  children: ReactNode
  headerExtra?: ReactNode
  onPageChange: (page: number) => void
}

export function DataTableSection({
  title,
  description,
  total,
  currentPage,
  pageCount,
  className,
  children,
  headerExtra,
  onPageChange,
}: DataTableSectionProps) {
  const paginationItems = buildPaginationItems(currentPage, pageCount)

  function goToPage(page: number) {
    if (page < 1 || page > pageCount || page === currentPage) {
      return
    }
    onPageChange(page)
  }

  return (
    <div className={cn('rounded-lg border p-6', className)}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {headerExtra}
      </div>

      {children}

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          共 {total} 条，第 {currentPage} / {pageCount} 页
        </p>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="上一页"
                aria-disabled={currentPage <= 1}
                className={cn(currentPage <= 1 && 'pointer-events-none opacity-50')}
                onClick={(event) => {
                  event.preventDefault()
                  goToPage(currentPage - 1)
                }}
              />
            </PaginationItem>

            {paginationItems.map((item, index) => (
              item === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={item === currentPage}
                    onClick={(event) => {
                      event.preventDefault()
                      goToPage(item)
                    }}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                text="下一页"
                aria-disabled={currentPage >= pageCount}
                className={cn(currentPage >= pageCount && 'pointer-events-none opacity-50')}
                onClick={(event) => {
                  event.preventDefault()
                  goToPage(currentPage + 1)
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

function buildPaginationItems(currentPage: number, pageCount: number) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', pageCount] as const
  }

  if (currentPage >= pageCount - 2) {
    return [1, 'ellipsis', pageCount - 3, pageCount - 2, pageCount - 1, pageCount] as const
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', pageCount] as const
}
