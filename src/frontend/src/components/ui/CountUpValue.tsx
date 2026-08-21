import { useEffect, useMemo, useRef, useState } from "react";

type CountUpValueProps = {
  className?: string;
  durationMs?: number;
  format?: (value: number) => string;
  value: number;
};

export function CountUpValue({
  className,
  durationMs = 700,
  format,
  value,
}: CountUpValueProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const currentValueRef = useRef(value);
  const formatter = useMemo(() => format ?? ((next: number) => String(next)), [format]);

  useEffect(() => {
    currentValueRef.current = displayValue;
  }, [displayValue]);

  useEffect(() => {
    if (typeof window === "undefined") {
      currentValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      currentValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    let frameId = 0;
    const startValue = currentValueRef.current;
    const delta = value - startValue;
    const startedAt = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - startedAt) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + delta * eased;
      currentValueRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [durationMs, value]);

  return <span className={className}>{formatter(displayValue)}</span>;
}
