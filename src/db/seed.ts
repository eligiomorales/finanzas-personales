import { db } from '@/db/database'
import { DEFAULT_CATEGORIES } from '@/lib/couple/defaults'
import type { Category, Movement, Person } from '@/types'

let seedPromise: Promise<void> | null = null

export async function seedDatabase(): Promise<void> {
  if (seedPromise) return seedPromise
  seedPromise = runSeed()
  return seedPromise
}

async function runSeed(): Promise<void> {
  const existingSettings = await db.settings.get('settings')
  if (existingSettings) return

  const personA: Person = { id: 'personA', name: 'Persona A' }
  const personB: Person = { id: 'personB', name: 'Persona B' }

  const categories: Category[] = DEFAULT_CATEGORIES.map((cat, i) => ({
    ...cat,
    id: `cat-${i + 1}`,
  }))

  await db.transaction('rw', [db.persons, db.categories, db.settings, db.movements], async () => {
    await db.persons.bulkPut([personA, personB])
    await db.categories.bulkPut(categories)
    await db.settings.put({
      id: 'settings',
      personAName: 'Persona A',
      personBName: 'Persona B',
      displayCurrency: 'ARS',
      defaultExchangeRateUsd: 1200,
    })

    const now = new Date().toISOString()
    const sampleMovements: Movement[] = [
      {
        id: crypto.randomUUID(),
        type: 'income',
        amount: 850000,
        currency: 'ARS',
        date: getMonthDate(5),
        description: 'Salario mensual',
        categoryId: 'cat-1',
        paidBy: 'personA',
        sharePersonA: 100,
        sharePersonB: 0,
        isShared: false,
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        type: 'income',
        amount: 620000,
        currency: 'ARS',
        date: getMonthDate(5),
        description: 'Salario mensual',
        categoryId: 'cat-1',
        paidBy: 'personB',
        sharePersonA: 0,
        sharePersonB: 100,
        isShared: false,
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        type: 'income',
        amount: 500,
        currency: 'USD',
        date: getMonthDate(8),
        description: 'Freelance en USD',
        categoryId: 'cat-2',
        paidBy: 'personA',
        sharePersonA: 100,
        sharePersonB: 0,
        isShared: false,
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        type: 'expense',
        amount: 45000,
        currency: 'ARS',
        date: getMonthDate(12),
        description: 'Compras del super',
        categoryId: 'cat-3',
        paidBy: 'personA',
        sharePersonA: 50,
        sharePersonB: 50,
        isShared: true,
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        type: 'expense',
        amount: 28000,
        currency: 'ARS',
        date: getMonthDate(15),
        description: 'Cena fuera',
        categoryId: 'cat-4',
        paidBy: 'personB',
        sharePersonA: 50,
        sharePersonB: 50,
        isShared: true,
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        type: 'expense',
        amount: 15,
        currency: 'USD',
        date: getMonthDate(16),
        description: 'Suscripción internacional',
        categoryId: 'cat-11',
        paidBy: 'personB',
        sharePersonA: 50,
        sharePersonB: 50,
        isShared: true,
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        type: 'expense',
        amount: 15000,
        currency: 'ARS',
        date: getMonthDate(18),
        description: 'Uber al trabajo',
        categoryId: 'cat-5',
        paidBy: 'personA',
        sharePersonA: 100,
        sharePersonB: 0,
        isShared: false,
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      },
    ]

    await db.movements.bulkPut(sampleMovements)
  })
}

function getMonthDate(day: number): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${month}-${d}`
}

export async function resetDatabase(): Promise<void> {
  seedPromise = null
  await db.delete()
  await db.open()
  await seedDatabase()
}
