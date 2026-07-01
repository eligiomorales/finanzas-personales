import { useCallback, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TrendChartCarouselProps {
  slides: { id: string; label: string; content: ReactNode }[]
}

export function TrendChartCarousel({ slides }: TrendChartCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || el.clientWidth === 0) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    setActive(Math.min(Math.max(index, 0), slides.length - 1))
  }, [slides.length])

  const scrollTo = useCallback((index: number) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
    setActive(index)
  }, [])

  return (
    <div className="space-y-3">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-roledescription="carrusel"
        aria-label="Gráficos de tendencias"
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="w-full shrink-0 snap-center overflow-hidden"
            aria-hidden={i !== active}
          >
            {slide.content}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5" role="tablist" aria-label="Gráfico activo">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={slide.label}
            onClick={() => scrollTo(i)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-200 ease-out',
              i === active ? 'w-4 bg-stone-700' : 'w-1.5 bg-stone-300',
            )}
          />
        ))}
      </div>
    </div>
  )
}
