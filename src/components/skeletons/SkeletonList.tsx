import { MovementList } from '@/components/ui/MovementRow'
import { SkeletonBar } from '@/components/skeletons/SkeletonCard'

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

interface SkeletonListProps {
  count?: number
  className?: string
}

export function SkeletonList({ count = 5, className }: SkeletonListProps) {
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
