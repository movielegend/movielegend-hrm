import { useEffect, useState } from 'react';

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

export function useMinuteTicker(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const listener = () => setNow(new Date());
    listeners.add(listener);
    if (!timer) {
      timer = setInterval(() => {
        listeners.forEach((item) => item());
      }, 60_000);
    }
    return () => {
      listeners.delete(listener);
      if (!listeners.size && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);

  return now;
}
