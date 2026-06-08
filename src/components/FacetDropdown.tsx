import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export function FacetMenuPortal({
  open,
  anchorRef,
  menuRef,
  menuId,
  menuMinWidth = 168,
  children,
}: {
  open: boolean
  anchorRef: { current: HTMLButtonElement | null }
  menuRef: { current: HTMLUListElement | null }
  menuId: string
  menuMinWidth?: number
  children: ReactNode
}) {
  const [style, setStyle] = useState<CSSProperties>({})

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const width = Math.max(rect.width, menuMinWidth)
    const maxLeft = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
    setStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: maxLeft,
      minWidth: width,
      maxWidth: Math.min(menuMinWidth + 80, window.innerWidth - 16),
      zIndex: 60,
    })
  }, [open, anchorRef, menuMinWidth])

  if (!open) return null

  return createPortal(
    <ul
      ref={menuRef}
      id={menuId}
      role="listbox"
      style={style}
      className="max-h-60 touch-pan-y overflow-y-auto overscroll-contain rounded-lg border border-stone-200 bg-white py-1 [-webkit-overflow-scrolling:touch]"
    >
      {children}
    </ul>,
    document.body,
  )
}

export function FilterFacet({
  label,
  activeLabel,
  active,
  open,
  onOpen,
  onClose,
  menuMinWidth,
  children,
}: {
  label: string
  activeLabel?: string
  active: boolean
  open: boolean
  onOpen: () => void
  onClose: () => void
  menuMinWidth?: number
  children: ReactNode
}) {
  const menuId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open) return
    let removeListener: (() => void) | undefined
    const frame = requestAnimationFrame(() => {
      function handlePointerDown(e: PointerEvent) {
        if (e.pointerType === 'touch' && menuRef.current?.contains(e.target as Node)) return
        const target = e.target as Node
        if (buttonRef.current?.contains(target)) return
        if (menuRef.current?.contains(target)) return
        onClose()
      }
      document.addEventListener('pointerdown', handlePointerDown, { capture: true })
      removeListener = () =>
        document.removeEventListener('pointerdown', handlePointerDown, { capture: true })
    })
    return () => {
      cancelAnimationFrame(frame)
      removeListener?.()
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const main = document.querySelector('main')
    const prevOverflow = main?.style.overflow
    if (main) main.style.overflow = 'hidden'

    function onScroll(e: Event) {
      const target = e.target as Node | null
      if (target && menuRef.current?.contains(target)) return
      onClose()
    }
    document.addEventListener('scroll', onScroll, true)

    return () => {
      document.removeEventListener('scroll', onScroll, true)
      if (main) main.style.overflow = prevOverflow ?? ''
    }
  }, [open, onClose])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? menuId : undefined}
        className={cn(
          'inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
          active
            ? 'border-brand-600 bg-brand-50 text-brand-800'
            : 'border-stone-300 bg-white text-stone-700 hover:bg-surface-50',
        )}
        onClick={() => (open ? onClose() : onOpen())}
      >
        <span className="max-w-[7.5rem] truncate">{activeLabel ?? label}</span>
        <span className="text-stone-400" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>
      <FacetMenuPortal
        open={open}
        anchorRef={buttonRef}
        menuRef={menuRef}
        menuId={menuId}
        menuMinWidth={menuMinWidth}
      >
        {children}
      </FacetMenuPortal>
    </>
  )
}

export function FacetOptionItem({
  selected,
  onSelect,
  children,
}: {
  selected: boolean
  onSelect: () => void
  children: ReactNode
}) {
  return (
    <li role="presentation">
      <button
        type="button"
        role="option"
        aria-selected={selected}
        className={cn(
          'w-full px-3 py-2 text-left text-sm focus-visible:bg-surface-50 focus-visible:outline-none',
          selected ? 'bg-brand-50 font-medium text-brand-800' : 'text-stone-700 hover:bg-surface-50',
        )}
        onClick={onSelect}
      >
        {children}
      </button>
    </li>
  )
}

export type FacetOption = { value: string; label: string }

export function FacetMenu({
  facetId,
  label,
  value,
  options,
  openFacet,
  setOpenFacet,
  onChange,
}: {
  facetId: string
  label: string
  value: string | undefined
  options: FacetOption[]
  openFacet: string | null
  setOpenFacet: (id: string | null) => void
  onChange: (value: string | undefined) => void
}) {
  const active = value !== undefined && value !== ''
  const activeOption = options.find((o) => o.value === (value ?? ''))

  return (
    <FilterFacet
      label={label}
      activeLabel={activeOption && activeOption.value !== '' ? activeOption.label : undefined}
      active={active}
      open={openFacet === facetId}
      onOpen={() => setOpenFacet(facetId)}
      onClose={() => setOpenFacet(null)}
    >
      {options.map((opt) => (
        <FacetOptionItem
          key={opt.value || '__all'}
          selected={(value ?? '') === opt.value}
          onSelect={() => {
            onChange(opt.value || undefined)
            setOpenFacet(null)
          }}
        >
          {opt.label}
        </FacetOptionItem>
      ))}
    </FilterFacet>
  )
}
