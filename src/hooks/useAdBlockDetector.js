import { useEffect, useState } from "react";

const BAIT_CLASS = "ad-banner adsbox pub_300x250 sponsored-ad";

export function useAdBlockDetector({ delay = 250 } = {}) {
  const [blocked, setBlocked] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    let alive = true;

    const id = setTimeout(() => {
      if (!alive) return;
      try {
        const bait = document.createElement("div");
        bait.className = BAIT_CLASS;
        bait.style.cssText =
          "width:1px;height:1px;position:absolute;left:-10000px;top:-10000px;pointer-events:none;";
        bait.innerHTML = "&nbsp;";
        document.body.appendChild(bait);

        requestAnimationFrame(() => {
          if (!alive) {
            try {
              bait.remove();
            } catch {
              /* ignore */
            }
            return;
          }

          let hidden = false;
          try {
            const style = window.getComputedStyle(bait);
            hidden =
              bait.offsetHeight === 0 ||
              bait.offsetWidth === 0 ||
              bait.offsetParent === null ||
              style.display === "none" ||
              style.visibility === "hidden";
          } catch {
            hidden = false;
          }

          try {
            bait.remove();
          } catch {
            /* ignore */
          }

          setBlocked(hidden);
          setChecked(true);
        });
      } catch {
        if (alive) setChecked(true);
      }
    }, delay);

    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [delay]);

  return { blocked, checked };
}
