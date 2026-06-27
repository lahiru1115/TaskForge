import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import type { PaginationData } from '@/hooks/useTasks'

interface TaskPaginationProps {
  pagination: PaginationData
  onPageChange: (page: number) => void
}

// Builds the sequence of page numbers and ellipsis markers to render.
// Example: current=6, total=23 → [1, 'gap', 5, 6, 7, 'gap', 23]
function buildItems(current: number, total: number): Array<number | 'gap'> {
  // Window of 3 around current, clamped to [2, total-1] to avoid overlap with first/last
  const lo = Math.max(2, current - 1)
  const hi = Math.min(total - 1, current + 1)

  const items: Array<number | 'gap'> = [1]

  if (lo > 2) items.push('gap')
  for (let p = lo; p <= hi; p++) items.push(p)
  if (hi < total - 1) items.push('gap')

  if (total > 1) items.push(total)

  return items
}

export default function TaskPagination({ pagination, onPageChange }: TaskPaginationProps) {
  const { page, pages } = pagination
  const items = buildItems(page, pages)

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => page > 1 && onPageChange(page - 1)}
            aria-disabled={page === 1}
            className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>

        {items.map((item, i) =>
          item === 'gap' ? (
            <PaginationItem key={`gap-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                isActive={item === page}
                onClick={() => onPageChange(item)}
                className="cursor-pointer"
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => page < pages && onPageChange(page + 1)}
            aria-disabled={page === pages}
            className={page === pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
