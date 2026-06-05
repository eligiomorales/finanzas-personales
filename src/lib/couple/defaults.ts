import type { Category } from '@/types'

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Salario', type: 'income', color: '#22c55e' },
  { name: 'Freelance', type: 'income', color: '#16a34a' },
  { name: 'Supermercado', type: 'expense', color: '#f97316' },
  { name: 'Restaurantes', type: 'expense', color: '#ef4444' },
  { name: 'Transporte', type: 'expense', color: '#3b82f6' },
  { name: 'Servicios', type: 'expense', color: '#8b5cf6' },
  { name: 'Entretenimiento', type: 'expense', color: '#ec4899' },
  { name: 'Salud', type: 'expense', color: '#14b8a6' },
  { name: 'Hogar', type: 'expense', color: '#a855f7' },
  { name: 'Ropa', type: 'expense', color: '#f59e0b' },
  { name: 'Suscripciones', type: 'expense', color: '#6366f1' },
  { name: 'Otros', type: 'expense', color: '#64748b' },
]
