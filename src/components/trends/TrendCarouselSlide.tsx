import { type ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/utils'
import { TREND_CAROUSEL_BODY_MIN_H } from '@/components/trends/chart-layout'

interface TrendCarouselSlideProps {
  label: string
  filter?: ReactNode
  children: ReactNode
}

export function TrendCarouselSlide({ label, filter, children }: TrendCarouselSlideProps) {
  return (
    <div className="space-y-2">
      <SectionHeader label={label} className="mb-0" />
      <Card className="overflow-hidden py-6">
        {filter ? <div className="mb-2 shrink-0 overflow-hidden">{filter}</div> : null}
        <div className={cn('flex flex-col overflow-hidden', TREND_CAROUSEL_BODY_MIN_H)}>
          {children}
        </div>
      </Card>
    </div>
  )
}
