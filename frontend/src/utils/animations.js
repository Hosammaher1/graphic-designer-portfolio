import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const isReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const registerScrollReveal = (targets, options = {}) => {
  if (isReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0 });
    return null;
  }

  const {
    y = 30,
    duration = 0.8,
    stagger = 0.12,
    delay = 0,
    trigger,
    start = 'top 85%',
  } = options;

  return gsap.fromTo(
    targets,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration,
      stagger,
      delay,
      ease: 'power3.out',
      scrollTrigger: trigger
        ? {
            trigger,
            start,
            toggleActions: 'play none none none',
          }
        : undefined,
    }
  );
};
