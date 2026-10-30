import { useEffect } from 'react';

let locks = 0;
let saved = null;

// Freezes the page behind a pop-up. Counts, so stacked pop-ups only unlock when the last one closes.
export function useScrollLock() {
  useEffect(() => {
    if (locks === 0) {
      const y = window.scrollY;
      const gap = window.innerWidth - document.documentElement.clientWidth; // desktop scroll bar width
      const b = document.body.style;
      saved = { y, position: b.position, top: b.top, width: b.width, paddingRight: b.paddingRight };
      b.position = 'fixed';
      b.top = `-${y}px`;
      b.width = '100%';
      if (gap > 0) b.paddingRight = `${gap}px`; // stops the page shifting sideways when the scroll bar disappears
    }
    locks += 1;
    return () => {
      locks -= 1;
      if (locks === 0 && saved) {
        const b = document.body.style;
        b.position = saved.position; b.top = saved.top; b.width = saved.width; b.paddingRight = saved.paddingRight;
        window.scrollTo(0, saved.y);
        saved = null;
      }
    };
  }, []);
}
