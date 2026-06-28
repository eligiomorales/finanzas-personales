import { dashboardHeroShellClass } from '@/components/DashboardHero'
import { Card } from '@/components/ui/Card'
import { SkeletonBar } from '@/components/skeletons/SkeletonCard'
import { SkeletonList } from '@/components/skeletons/SkeletonList'

export function SkeletonDashboard() {
  return (
    <>
      <div
        className={dashboardHeroShellClass}
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
          <SkeletonBar className="h-14 w-44 bg-white/25" />
          <SkeletonBar className="h-3 w-24 bg-white/15" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBar className="h-10 bg-white/15" />
          <SkeletonBar className="h-10 bg-white/15" />
        </div>
      </div>

      <div className="relative z-10 -mt-6 space-y-4 rounded-t-3xl bg-surface-50 px-4 pt-5">
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
