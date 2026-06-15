export const queryKeys = {
  settings: (coupleId: string) => ['settings', coupleId] as const,
  categories: (coupleId: string) => ['categories', coupleId] as const,
  movements: (coupleId: string) => ['movements', coupleId] as const,
  imports: (coupleId: string) => ['imports', coupleId] as const,
  pendingImports: (coupleId: string, importId?: string) =>
    ['pendingImports', coupleId, importId ?? 'all'] as const,
  budgets: (coupleId: string) => ['budgets', coupleId] as const,
  couplePersons: (
    coupleId: string,
    userId: string,
    fallbackKey: string,
  ) => ['couplePersons', coupleId, userId, fallbackKey] as const,
}
