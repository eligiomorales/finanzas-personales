import { cardSurface } from '@/components/ui/styles'
import { MovementList } from '@/components/ui/MovementRow'
import { SkeletonBar } from '@/components/skeletons/SkeletonCard'
import { cn } from '@/lib/utils'

function SkeletonMovementRow() {
  return (
    <div className="space-y-1.5 px-4 py-2.5">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <SkeletonBar className="h-3 w-14" />
            <SkeletonBar className="h-3 w-12" />
          </div>
          <SkeletonBar className="h-4 w-3/4 max-w-xs" />
        </div>
        <SkeletonBar className="h-4 w-20 shrink-0" />
      </div>
      <SkeletonBar className="h-3 w-1/2 max-w-[10rem]" />
    </div>
  )
}

function SkeletonGroupedMovementRow() {
  return (
    <div className={cn(cardSurface, 'flex min-h-12 items-center gap-3 p-3')}>
      <SkeletonBar className="h-9 w-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <SkeletonBar className="h-4 w-28 max-w-[40%]" />
          <SkeletonBar className="h-5 w-10 rounded-full" />
        </div>
        <SkeletonBar className="h-3 w-2/3 max-w-xs" />
      </div>
      <SkeletonBar className="h-4 w-16 shrink-0" />
    </div>
  )
}

interface SkeletonListProps {
  count?: number
  className?: string
  grouped?: boolean
}

export function SkeletonList({ count = 5, className, grouped = false }: SkeletonListProps) {
  if (grouped) {
    return (
      <div role="status" aria-busy="true" aria-label="Cargando movimientos" className="space-y-5">
        <section className="space-y-2">
          <SkeletonBar className="h-4 w-16" />
          <div className="space-y-2">
            {Array.from({ length: Math.min(count, 3) }, (_, index) => (
              <SkeletonGroupedMovementRow key={index} />
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div role="status" aria-busy="true" aria-label="Cargando movimientos">
      <MovementList className={className}>
        {Array.from({ length: count }, (_, index) => (
          <SkeletonMovementRow key={index} />
        ))}
      </MovementList>
    </div>
  )
}
