import { useEffect, useRef, useState } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches);
  useEffect(() => {
    const mql = window.matchMedia?.(query);
    if (!mql) return undefined;
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

/** Prevents background scrolling while an overlay is open (ref-counted). */
let lockCount = 0;
export function useLockBodyScroll(active) {
  useEffect(() => {
    if (!active) return undefined;
    lockCount += 1;
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = overflow;
        document.body.style.paddingRight = paddingRight;
      }
    };
  }, [active]);
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

/** Keeps keyboard focus inside `ref` while active and restores it on close. */
export function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return undefined;
    const node = ref.current;
    const previously = document.activeElement;
    const first = node.querySelector('[data-autofocus]') || node.querySelector(FOCUSABLE);
    (first || node).focus({ preventScroll: true });

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      if (previously instanceof HTMLElement) previously.focus({ preventScroll: true });
    };
  }, [ref, active]);
}

export function useEscapeKey(handler, active = true) {
  const saved = useRef(handler);
  useEffect(() => {
    saved.current = handler;
  }, [handler]);
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => e.key === 'Escape' && saved.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}

export function useOnClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('pointerdown', listener);
    return () => document.removeEventListener('pointerdown', listener);
  }, [ref, handler, active]);
}
