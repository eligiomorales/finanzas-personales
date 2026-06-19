import { describe, it, expect } from 'vitest'
import {
  getLayoutTransition,
  getMotionProps,
  getTapMotionProps,
  motionDurations,
  motionTransitions,
  motionVariants,
  toMotionSeconds,
} from '@/design/motion'

describe('toMotionSeconds', () => {
  it('converts milliseconds to seconds for Framer Motion', () => {
    expect(toMotionSeconds(120)).toBe(0.12)
    expect(toMotionSeconds(220)).toBe(0.22)
    expect(toMotionSeconds(280)).toBe(0.28)
  })

  it('returns 0 for zero input', () => {
    expect(toMotionSeconds(0)).toBe(0)
  })
})

describe('motionTransitions durations', () => {
  it('expresses token durations in seconds, not milliseconds', () => {
    expect(motionTransitions.microInteraction.duration).toBe(
      toMotionSeconds(motionDurations.xs),
    )
    expect(motionTransitions.pageTransition.duration).toBe(
      toMotionSeconds(motionDurations.page),
    )
    expect(motionTransitions.pageExitTransition.duration).toBe(
      toMotionSeconds(motionDurations.pageExit),
    )
    expect(motionTransitions.sharedElement.duration).toBe(
      toMotionSeconds(motionDurations.md),
    )
    expect(motionTransitions.shimmer.duration).toBe(toMotionSeconds(motionDurations.lg))
  })

  it('keeps all transition durations under one second', () => {
    for (const transition of Object.values(motionTransitions)) {
      expect(transition.duration).toBeLessThan(1)
    }
  })
})

describe('getMotionProps', () => {
  it('returns an empty object when shouldAnimate is false', () => {
    expect(getMotionProps('button', false)).toEqual({})
    expect(getMotionProps('page', false)).toEqual({})
    expect(getMotionProps('card', false)).toEqual({})
    expect(getMotionProps('input', false)).toEqual({})
  })

  it('returns button micro-interaction props when shouldAnimate is true', () => {
    expect(getMotionProps('button', true)).toEqual({
      whileHover: { y: -1 },
      whileTap: { scale: 0.98 },
      transition: motionTransitions.microInteraction,
    })
  })

  it('returns slideUp page variants when shouldAnimate is true', () => {
    expect(getMotionProps('page', true)).toEqual({
      initial: motionVariants.slideUp.initial,
      animate: motionVariants.slideUp.animate,
      exit: motionVariants.slideUp.exit,
    })
  })

  it('returns card scale-in props when shouldAnimate is true', () => {
    expect(getMotionProps('card', true)).toEqual({
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: motionTransitions.microInteraction,
    })
  })

  it('returns input transition only when shouldAnimate is true', () => {
    expect(getMotionProps('input', true)).toEqual({
      transition: motionTransitions.microInteraction,
    })
  })
})

describe('getTapMotionProps', () => {
  it('returns empty props when shouldAnimate is false', () => {
    expect(getTapMotionProps(false)).toEqual({})
  })

  it('returns tap scale when shouldAnimate is true', () => {
    expect(getTapMotionProps(true)).toEqual({
      whileTap: { scale: 0.98 },
      transition: motionTransitions.microInteraction,
    })
  })
})

describe('getLayoutTransition', () => {
  it('disables layout animation when shouldAnimate is false', () => {
    expect(getLayoutTransition(false)).toEqual({ duration: 0 })
  })

  it('uses sharedElement transition when shouldAnimate is true', () => {
    expect(getLayoutTransition(true)).toEqual(motionTransitions.sharedElement)
  })
})
