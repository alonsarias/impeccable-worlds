import { useEffect } from "react";

function vantageFor(box: DOMRect): "far" | "mid" | "near" {
  if (box.bottom < 0 || box.top > window.innerHeight) return "far";
  const mid = window.innerHeight / 2;
  const dist =
    Math.abs(box.top + box.height / 2 - mid) / (window.innerHeight / 2);
  if (dist < 0.22) return "near";
  if (dist < 0.55) return "mid";
  return "far";
}

function wavePath(width: number, height: number, columns: number) {
  const parts: string[] = [];
  const step = width / columns;
  for (let col = 0; col < columns; col += 1) {
    const x = step * col + step * 0.35;
    const amp = step * 0.28;
    parts.push(
      `M ${x.toFixed(2)} 0`,
      `Q ${(x + amp).toFixed(2)} ${(height * 0.25).toFixed(2)} ${x.toFixed(2)} ${(height * 0.5).toFixed(2)}`,
      `Q ${(x - amp).toFixed(2)} ${(height * 0.75).toFixed(2)} ${x.toFixed(2)} ${height.toFixed(2)}`,
    );
  }
  return parts.join(" ");
}

export function WaveField({ token = 0 }: { token?: number | string }) {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    function density() {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      root.style.setProperty("--wave-dpr", dpr.toFixed(2));
      const specs = [
        ["wave-far", 36, 56, 2],
        ["wave-mid", 18, 32, 3],
        ["wave-near", 9, 16, 3],
        ["wave-accent", 5, 10, 3],
        ["wave-wall", 48, 72, 3],
      ] as const;
      for (const [id, width, height, columns] of specs) {
        const pattern = document.getElementById(id);
        const path = pattern?.querySelector("path");
        if (!pattern || !path) continue;
        const w = width / dpr;
        const h = height / dpr;
        pattern.setAttribute("width", w.toFixed(2));
        pattern.setAttribute("height", h.toFixed(2));
        path.setAttribute("d", wavePath(w, h, columns));
        path.setAttribute("stroke-width", Math.max(0.6, 1 / dpr).toFixed(2));
      }
    }

    function markCards() {
      document.querySelectorAll<HTMLElement>(".card").forEach((card) => {
        card.dataset.vantage = vantageFor(card.getBoundingClientRect());
      });
    }

    function onScroll() {
      markCards();
      if (reduce.matches) return;
      const shift = window.scrollY * 0.35;
      const wall = document.getElementById("wave-wall");
      if (wall) wall.setAttribute("y", String(shift % 72));
      root.style.setProperty("--wall-shift", `${shift}px`);
    }

    density();
    onScroll();
    const io = new IntersectionObserver(onScroll, {
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    document.querySelectorAll(".card").forEach((card) => io.observe(card));
    const onResize = () => {
      density();
      onScroll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const dprQuery = window.matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`,
    );
    dprQuery.addEventListener("change", density);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      dprQuery.removeEventListener("change", density);
    };
  }, [token]);

  return (
    <>
      <div className="gallery-wall" aria-hidden="true">
        <svg focusable="false">
          <rect width="100%" height="100%" fill="url(#wave-wall)" />
        </svg>
      </div>
      <svg className="wave-defs" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="wave-far" patternUnits="userSpaceOnUse" width="36" height="56">
            <path fill="none" stroke="#000" d="" />
          </pattern>
          <pattern id="wave-mid" patternUnits="userSpaceOnUse" width="18" height="32">
            <path fill="none" stroke="#000" d="" />
          </pattern>
          <pattern id="wave-near" patternUnits="userSpaceOnUse" width="9" height="16">
            <path fill="none" stroke="#000" d="" />
          </pattern>
          <pattern id="wave-accent" patternUnits="userSpaceOnUse" width="5" height="10">
            <path fill="none" stroke="#000" d="" />
          </pattern>
          <pattern id="wave-wall" patternUnits="userSpaceOnUse" width="48" height="72">
            <path fill="none" stroke="#000" d="" />
          </pattern>
          <pattern id="wave-accent-ink" patternUnits="userSpaceOnUse" width="5" height="8">
            <path fill="none" stroke="#fff" strokeWidth="0.7" d="M 1.2 0 Q 2.4 2 1.2 4 Q 0 6 1.2 8 M 3.4 0 Q 4.6 2 3.4 4 Q 2.2 6 3.4 8" />
          </pattern>
        </defs>
      </svg>
    </>
  );
}

export function CanvasFrame() {
  return (
    <svg className="canvas-frame" aria-hidden="true" focusable="false">
      <rect className="wave-fill" data-for="far" width="100%" height="100%" fill="url(#wave-far)" />
      <rect className="wave-fill" data-for="mid" width="100%" height="100%" fill="url(#wave-mid)" />
      <rect className="wave-fill" data-for="near" width="100%" height="100%" fill="url(#wave-near)" />
    </svg>
  );
}

export function WaveEndcap() {
  return (
    <svg className="wave-endcap" aria-hidden="true" focusable="false">
      <rect width="100%" height="100%" fill="url(#wave-accent)" />
    </svg>
  );
}
