// Paging controls. page is 0-based like the API; people see it 1-based.
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function Pagination({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
  onSizeChange,
  sizes = [10, 20, 50],
  itemLabel = 'results',
  disabled = false,
  className,
}) {
  const pageCount = Math.max(totalPages, 1)
  const isFirst = page <= 0
  const isLast = page >= pageCount - 1

  return (
    <div
      className={cn(
        'flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-center gap-3 text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{totalElements}</span> {itemLabel}
        </span>
        {onSizeChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="whitespace-nowrap">
              Rows per page
            </label>
            <Select
              value={String(size)}
              onValueChange={(value) => onSizeChange(Number(value))}
              disabled={disabled}
            >
              <SelectTrigger id="page-size" size="sm" className="w-18 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-muted-foreground" aria-live="polite">
          Page <span className="font-semibold text-foreground">{page + 1}</span> of{' '}
          <span className="font-semibold text-foreground">{pageCount}</span>
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            className="bg-card"
            onClick={() => onPageChange(page - 1)}
            disabled={disabled || isFirst}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="bg-card"
            onClick={() => onPageChange(page + 1)}
            disabled={disabled || isLast}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
