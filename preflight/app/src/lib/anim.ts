import { useEffect, useRef, useState } from "react";

/** Fires once when the element scrolls into view. Drives every entrance animation. */
export function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    // If the element is already on screen at mount, start immediately. Relying on the
    // observer alone left content that was visible from the first paint frozen at zero:
    // an element taller than the viewport can never reach a fractional threshold, so the
    // callback never reports it as intersecting.
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (r.top < vh && r.bottom > 0) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Counts a number up from zero. Respects prefers-reduced-motion. */
export function useCountUp(target: number, active: boolean, duration = 1000) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    const reduce =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    // requestAnimationFrame is paused while the tab is hidden. Without this the number
    // is stuck at zero until a frame fires, which on this product means a wrong figure
    // sitting on screen. An animation is decoration; the value is not.
    const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
    if (reduce || hidden || duration === 0) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setValue(target * easeOut(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // If the tab is hidden mid animation, land on the final value rather than freezing
    // part way through.
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(raf);
        setValue(target);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [target, active, duration]);

  return value;
}

/** Staggered entrance delay, as an inline custom property. */
export const stagger = (i: number, step = 60) =>
  ({ "--d": `${i * step}ms` }) as React.CSSProperties;
