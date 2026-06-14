/**
 * Motion Design System
 * Tokens, easings, variants y helpers para animaciones consistentes.
 */

// Duraciones en milisegundos
export const motionDurations = {
  xxs: 80,
  xs: 120,
  sm: 180,
  md: 280,
  lg: 420,
} as const;

// Cubic bezier easings
export const motionEasings = {
  // Standard: entrada rápida, salida suave (ease-out)
  standard: [0.22, 1, 0.36, 1] as [number, number, number, number],
  // Decelerate: salida muy suave
  decel: [0.0, 0.0, 0.2, 1] as [number, number, number, number],
  // Accelerate: entrada rápida
  accel: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
  // Spring-like: para toggles y bounce
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
} as const;

// Delays en milisegundos
export const motionDelays = {
  none: 0,
  short: 30,
  medium: 80,
} as const;

/** Convierte ms de tokens a segundos (Framer Motion usa segundos en `transition.duration`). */
export const toMotionSeconds = (ms: number): number => ms / 1000;

const standardEaseCss = `cubic-bezier(${motionEasings.standard.join(", ")})`;

/** Estilo CSS para transiciones de focus en campos (border + shadow). */
export const fieldFocusStyle = {
  transitionProperty: "border-color, box-shadow",
  transitionDuration: `${motionDurations.xs}ms`,
  transitionTimingFunction: standardEaseCss,
} as const;

// Variantes reutilizables para Framer Motion
export const motionVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  },
  slideDown: {
    initial: { opacity: 0, y: -16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 16 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  buttonPress: {
    tap: { scale: 0.97 },
  },
  buttonHover: {
    hover: { y: -1 },
  },
  shimmer: {
    initial: { backgroundPosition: "200% 0" },
    animate: { backgroundPosition: "-200% 0" },
  },
} as const;

// Transiciones predefinidas (duration en segundos para Framer Motion)
export const motionTransitions = {
  microInteraction: {
    duration: toMotionSeconds(motionDurations.xs),
    ease: motionEasings.standard,
  },
  pageTransition: {
    duration: toMotionSeconds(motionDurations.sm),
    ease: motionEasings.standard,
  },
  sharedElement: {
    duration: toMotionSeconds(motionDurations.md),
    ease: motionEasings.standard,
  },
} as const;

// Helper para detectar si se debe animar
export const shouldReduceMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

// Helper para obtener props de motion según el tipo de componente
interface MotionProps {
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  whileHover?: Record<string, any>;
  whileTap?: Record<string, any>;
  transition?: Record<string, any>;
}

export const getMotionProps = (
  type: "button" | "page" | "card" | "input",
  shouldAnimate: boolean
): MotionProps => {
  if (!shouldAnimate) {
    return {};
  }

  switch (type) {
    case "button":
      return {
        whileHover: { y: -1 },
        whileTap: { scale: 0.97 },
        transition: motionTransitions.microInteraction,
      };

    case "page":
      return {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -16 },
        transition: motionTransitions.pageTransition,
      };

    case "card":
      return {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        transition: motionTransitions.microInteraction,
      };

    case "input":
      return {
        transition: motionTransitions.microInteraction,
      };

    default:
      return {};
  }
};

/** Tap feedback sin hover lift (segmented controls, chips). */
export const getTapMotionProps = (shouldAnimate: boolean): MotionProps => {
  if (!shouldAnimate) return {};
  return {
    whileTap: { scale: 0.97 },
    transition: motionTransitions.microInteraction,
  };
};

// Helper para transición suave sin saltos
export const getLayoutTransition = (shouldAnimate: boolean) => {
  return shouldAnimate ? motionTransitions.sharedElement : { duration: 0 };
};