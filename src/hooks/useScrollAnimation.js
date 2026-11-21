import { useEffect } from 'react';

/**
 * useScrollAnimation
 * Attaches an IntersectionObserver to all [data-animate] elements,
 * toggling the "is-visible" class when they enter the viewport.
 */
export function useScrollAnimation() {
  useEffect(() => {
    const elements = document.querySelectorAll('[data-animate]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Once visible, stop observing (animation plays once)
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}
