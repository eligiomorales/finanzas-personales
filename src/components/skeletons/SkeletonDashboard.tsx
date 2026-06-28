import { Card } from '@/components/ui/Card'
import { SkeletonBar } from '@/components/skeletons/SkeletonCard'
import { SkeletonList } from '@/components/skeletons/SkeletonList'

export function SkeletonDashboard() {
  return (
    <>
      <div
        className="flex min-h-[42dvh] flex-col rounded-b-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 px-4 pb-5 pt-[max(0.75rem,env(safe-area-inset-top))]"
        role="status"
        aria-busy="true"
        aria-label="Cargando inicio"
      >
        <div className="flex items-center justify-between gap-2">
          <SkeletonBar className="h-8 w-16 bg-white/20" />
          <div className="flex gap-1">
            <SkeletonBar className="h-9 w-9 rounded-lg bg-white/15" />
            <SkeletonBar className="h-9 w-9 rounded-lg bg-white/15" />
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6">
          <SkeletonBar className="h-3 w-32 bg-white/20" />
          <SkeletonBar className="h-12 w-40 bg-white/25" />
          <SkeletonBar className="h-3 w-24 bg-white/15" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBar className="h-10 bg-white/15" />
          <SkeletonBar className="h-10 bg-white/15" />
        </div>
      </div>

      <div className="space-y-4 px-4 pt-4">
        <Card compact className="space-y-3 p-4">
          <SkeletonBar className="h-4 w-28" />
          <SkeletonBar className="h-6 w-3/4" />
          <SkeletonBar className="h-4 w-full" />
        </Card>

        <SkeletonList count={3} />
      </div>
    </>
  )
}
