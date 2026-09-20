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

export function WaveField({ token = 0 }: { token?: number | string }) {
  useEffect(() => {
    function markCards() {
      document.querySelectorAll<HTMLElement>(".card").forEach((card) => {
        card.dataset.vantage = vantageFor(card.getBoundingClientRect());
      });
    }

    markCards();
    const io = new IntersectionObserver(markCards, {
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    document.querySelectorAll(".card").forEach((card) => io.observe(card));
    window.addEventListener("scroll", markCards, { passive: true });
    window.addEventListener("resize", markCards);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", markCards);
      window.removeEventListener("resize", markCards);
    };
  }, [token]);

  return (
    <svg className="wave-defs" aria-hidden="true" focusable="false">
      <defs>
        <pattern
          id="wave-far"
          patternUnits="userSpaceOnUse"
          width="28"
          height="48"
        >
          <path
            fill="none"
            stroke="#000"
            strokeWidth="1"
            d="M 4 0 L 8 8 L 2 16 L 9 24 L 3 32 L 8 40 L 4 48 M 18 0 L 22 8 L 16 16 L 23 24 L 17 32 L 22 40 L 18 48"
          />
        </pattern>
        <pattern
          id="wave-mid"
          patternUnits="userSpaceOnUse"
          width="16"
          height="32"
        >
          <path
            fill="none"
            stroke="#000"
            strokeWidth="1"
            d="M 3 0 L 6 5 L 1 11 L 7 16 L 2 21 L 6 27 L 3 32 M 11 0 L 14 5 L 9 11 L 15 16 L 10 21 L 14 27 L 11 32"
          />
        </pattern>
        <pattern
          id="wave-near"
          patternUnits="userSpaceOnUse"
          width="8"
          height="16"
        >
          <path
            fill="none"
            stroke="#000"
            strokeWidth="1"
            d="M 1 0 L 4 3 L 0 6 L 5 8 L 1 11 L 4 14 L 1 16 M 5 0 L 8 3 L 4 6 L 9 8 L 5 11 L 8 14 L 5 16"
          />
        </pattern>
      </defs>
    </svg>
  );
}

export function CanvasFrame() {
  return (
    <svg className="canvas-frame" aria-hidden="true" focusable="false">
      <rect
        className="wave-fill"
        data-for="far"
        width="100%"
        height="100%"
        fill="url(#wave-far)"
      />
      <rect
        className="wave-fill"
        data-for="mid"
        width="100%"
        height="100%"
        fill="url(#wave-mid)"
      />
      <rect
        className="wave-fill"
        data-for="near"
        width="100%"
        height="100%"
        fill="url(#wave-near)"
      />
    </svg>
  );
}
