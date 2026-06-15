import { Card } from '@/components/ui/Card'
import { SkeletonBar } from '@/components/skeletons/SkeletonCard'
import { SkeletonList } from '@/components/skeletons/SkeletonList'

export function SkeletonDashboard() {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-label="Cargando inicio">
      <div className="flex items-center justify-between gap-3">
        <SkeletonBar className="h-7 w-40" />
        <SkeletonBar className="h-9 w-28" />
      </div>

      <Card compact>
        <div className="space-y-3">
          <SkeletonBar className="h-4 w-24" />
          <SkeletonBar className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <SkeletonBar className="h-16" />
            <SkeletonBar className="h-16" />
          </div>
        </div>
      </Card>

      <Card compact>
        <SkeletonBar className="mb-3 h-4 w-32" />
        <SkeletonBar className="h-3 w-full" />
        <SkeletonBar className="mt-2 h-3 w-4/5" />
        <SkeletonBar className="mt-2 h-3 w-3/5" />
      </Card>

      <SkeletonList count={3} />
    </div>
  )
}
