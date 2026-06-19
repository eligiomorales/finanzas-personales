/**
 * Motion Design System
 * Tokens, easings, variants y helpers para animaciones consistentes.
 */

// Duraciones en milisegundos
export const motionDurations = {
  xxs: 80,
  xs: 120,
  fast: 150,
  sm: 180,
  normal: 200,
  page: 220,
  pageExit: 140,
  slow: 280,
  md: 280,
  lg: 420,
} as const;

// Cubic bezier easings
export const motionEasings = {
  // Standard/smooth: default para casi todo
  standard: [0.22, 1, 0.36, 1] as [number, number, number, number],
  // Out: entradas decorativas
  out: [0.17, 1, 0.32, 1] as [number, number, number, number],
  // Decelerate: salida muy suave (page enter)
  decel: [0.0, 0.0, 0.2, 1] as [number, number, number, number],
  // Accelerate: entrada rápida (page exit)
  accel: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
  // InOut: movimientos simétricos
  inOut: [0.66, 0, 0.34, 1] as [number, number, number, number],
  // Spring: badges, pops, overshoot
  spring: [0.35, 1.55, 0.65, 1] as [number, number, number, number],
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
    initial: { opacity: 0, y: 24 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: toMotionSeconds(motionDurations.page),
        ease: motionEasings.decel,
      },
    },
    exit: {
      opacity: 0,
      y: -12,
      transition: {
        duration: toMotionSeconds(motionDurations.pageExit),
        ease: motionEasings.accel,
      },
    },
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
  blurIn: {
    initial: { opacity: 0, y: 6, filter: "blur(2px)" },
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: toMotionSeconds(motionDurations.slow),
        ease: motionEasings.standard,
      },
    },
    exit: { opacity: 0, y: -4, filter: "blur(2px)" },
  },
  buttonPress: {
    tap: { scale: 0.98 },
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
    duration: toMotionSeconds(motionDurations.page),
    ease: motionEasings.decel,
  },
  pageExitTransition: {
    duration: toMotionSeconds(motionDurations.pageExit),
    ease: motionEasings.accel,
  },
  sharedElement: {
    duration: toMotionSeconds(motionDurations.md),
    ease: motionEasings.standard,
  },
  shimmer: {
    duration: toMotionSeconds(motionDurations.lg),
    ease: "linear",
    repeat: Infinity,
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
        whileTap: { scale: 0.98 },
        transition: motionTransitions.microInteraction,
      };

    case "page":
      return {
        initial: motionVariants.slideUp.initial,
        animate: motionVariants.slideUp.animate,
        exit: motionVariants.slideUp.exit,
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
    whileTap: { scale: 0.98 },
    transition: motionTransitions.microInteraction,
  };
};

// Helper para transición suave sin saltos
export const getLayoutTransition = (shouldAnimate: boolean) => {
  return shouldAnimate ? motionTransitions.sharedElement : { duration: 0 };
};