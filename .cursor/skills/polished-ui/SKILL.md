---
name: polished-ui
description: >-
  Enforce polished, tactile UI with proper easing, layered shadows, physics-based
  interactions, and state-driven design. Auto-activates when building or editing
  UI components, animations, transitions, or interactive elements.
---

# Polished UI

Polish = consistency + physicality + state coverage. This skill enforces the philosophy; **all token values live in `docs/DESIGN.md` and `src/design/motion.ts`**. Read those for exact numbers.

## Non-negotiable rules

1. **No default easing.** Never use `ease`, `ease-in-out`, or `linear` as default. Use `motionEasings.standard` for everything unless a specific token applies.
2. **Token-only values.** Every duration, radius, shadow, and curve must come from project tokens. No magic `13px`, `0.3s`, or one-off `box-shadow`. If you need a new value, add it as a token first.
3. **No single shadows.** Always use `--shadow-card` or `--shadow-elevated` (layered stacks). Hairline ring replaces border. Opacities 2%–8%.
4. **Entrances blur in.** Use `motionVariants.blurIn` (opacity + 6px rise + 2px blur clear, 280ms). Never a plain fade.
5. **Everything is tactile.** Every clickable element gets `whileTap: { scale: 0.98 }`. Tooltips blur+lift in, never instant pop.
6. **Physics for draggables.** Velocity tracking, momentum on release, soft boundary stretch. No dead stops.
7. **Snap points.** Small pull-in zone, larger release zone. Flash label on catch.
8. **Reveal with grid-rows.** `grid-template-rows: 0fr → 1fr`. Never `max-height` hack.
9. **Reduced motion always honored.** `useMotionPreferences()` → `shouldAnimate`. Collapse to instant, stop loops.
10. **State-driven.** Think: idle/hover/pressed/focus/disabled/loading/success/error. Discover missing states during build—shimmer labels, rolling numbers, cross-fading icons.

## How to prompt for polish

- **Numbers, never adjectives.** "Smooth" is meaningless; reference the token name and ms value.
- **Tokens first.** State which tokens apply; forbid one-off values.
- **Think in states.** List every state before implementing. The model builds exactly what you name.
- **Isolate when iterating.** "Now only tune the shadow." One variable at a time.
- **Describe feeling + reference.** "Should feel like an iOS sheet: weighty, slightly springy, settles fast."

## Reference

- Motion tokens & helpers: `src/design/motion.ts`
- Shadow & radius tokens: `src/index.css`
- Full design system: `docs/DESIGN.md` (section "Motion")
- Motion preferences hook: `src/hooks/useMotionPreferences.ts`
