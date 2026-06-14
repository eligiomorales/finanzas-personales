/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, createElement, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AnimatedRoutes } from '@/components/AnimatedRoutes'
import { resetMotionPreferencesStoreForTests } from '@/hooks/useMotionPreferences'

vi.mock('framer-motion', () => {
  const React = require('react') as typeof import('react')

  return {
    AnimatePresence: ({
      children,
      mode,
      initial,
    }: {
      children: ReactNode
      mode?: string
      initial?: boolean
    }) =>
      React.createElement(
        'div',
        {
          'data-testid': 'animate-presence',
          'data-mode': mode,
          'data-initial': String(initial),
        },
        children,
      ),
    LayoutGroup: ({ children }: { children: ReactNode }) =>
      React.createElement('div', { 'data-testid': 'layout-group' }, children),
    motion: {
      div: ({
        children,
        variants,
        initial,
        animate,
        exit,
      }: {
        children?: ReactNode
        variants?: unknown
        initial?: string | boolean
        animate?: string
        exit?: string
      }) =>
        React.createElement(
          'div',
          {
            'data-testid': 'motion-page',
            'data-has-variants': String(Boolean(variants)),
            'data-initial': String(initial),
            'data-animate': String(animate),
            'data-exit': String(exit),
          },
          children,
        ),
    },
  }
})

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

function renderAnimatedRoutes(initialPath: string, outletKey = 'amounts-visible') {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  act(() => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries: [initialPath] },
        createElement(
          Routes,
          null,
          createElement(
            Route,
            { element: createElement(AnimatedRoutes, { outletKey }) },
            createElement(Route, {
              index: true,
              element: createElement('div', { 'data-testid': 'home-page' }, 'Inicio'),
            }),
            createElement(Route, {
              path: 'movimientos',
              element: createElement('div', { 'data-testid': 'movements-page' }, 'Movimientos'),
            }),
          ),
        ),
      ),
    )
  })

  return {
    container,
    unmount: () => {
      act(() => root.unmount())
      container.remove()
    },
  }
}

describe('AnimatedRoutes', () => {
  beforeEach(() => {
    resetMotionPreferencesStoreForTests()
    vi.stubEnv('VITE_ANIMATIONS_ENABLED', 'true')
    mockMatchMedia(false)
  })

  afterEach(() => {
    resetMotionPreferencesStoreForTests()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('renders the outlet without motion wrappers when shouldAnimate is false', () => {
    mockMatchMedia(true)
    const view = renderAnimatedRoutes('/')
    expect(view.container.querySelector('[data-testid="animate-presence"]')).toBeNull()
    expect(view.container.querySelector('[data-testid="home-page"]')).not.toBeNull()
    view.unmount()
  })

  it('wraps the outlet in LayoutGroup and AnimatePresence when shouldAnimate is true', () => {
    const view = renderAnimatedRoutes('/')
    expect(view.container.querySelector('[data-testid="layout-group"]')).not.toBeNull()
    expect(view.container.querySelector('[data-testid="animate-presence"]')).not.toBeNull()
    expect(view.container.querySelector('[data-testid="animate-presence"]')?.getAttribute('data-mode')).toBe(
      'popLayout',
    )
    view.unmount()
  })

  it('applies slideUp variants to the page motion wrapper', () => {
    const view = renderAnimatedRoutes('/')
    const motionPage = view.container.querySelector('[data-testid="motion-page"]')
    expect(motionPage?.getAttribute('data-has-variants')).toBe('true')
    expect(motionPage?.getAttribute('data-initial')).toBe('initial')
    expect(motionPage?.getAttribute('data-animate')).toBe('animate')
    expect(motionPage?.getAttribute('data-exit')).toBe('exit')
    view.unmount()
  })

  it('renders nested route content through the animated wrapper', () => {
    const view = renderAnimatedRoutes('/movimientos')
    expect(view.container.querySelector('[data-testid="movements-page"]')).not.toBeNull()
    view.unmount()
  })

  it('keeps a single motion wrapper when only the outlet remount key changes', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    act(() => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ['/'] },
          createElement(
            Routes,
            null,
            createElement(
              Route,
              { element: createElement(AnimatedRoutes, { outletKey: 'amounts-visible' }) },
              createElement(Route, {
                index: true,
                element: createElement('div', { 'data-testid': 'home-page' }, 'Inicio'),
              }),
            ),
          ),
        ),
      )
    })

    expect(container.querySelectorAll('[data-testid="motion-page"]')).toHaveLength(1)

    act(() => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ['/'] },
          createElement(
            Routes,
            null,
            createElement(
              Route,
              { element: createElement(AnimatedRoutes, { outletKey: 'amounts-hidden' }) },
              createElement(Route, {
                index: true,
                element: createElement('div', { 'data-testid': 'home-page' }, 'Inicio'),
              }),
            ),
          ),
        ),
      )
    })

    expect(container.querySelectorAll('[data-testid="motion-page"]')).toHaveLength(1)
    act(() => root.unmount())
    container.remove()
  })
})
