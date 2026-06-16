import { cn } from '@/lib/utils'

function categoryInitials(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
}

export function CategoryAvatar({ name, color }: { name: string; color?: string }) {
  const initials = categoryInitials(name)
  const hasColor = Boolean(color)

  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
        hasColor ? 'text-white' : 'bg-surface-100 text-brand-700',
      )}
      style={hasColor ? { backgroundColor: color } : undefined}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
