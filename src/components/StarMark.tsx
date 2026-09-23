export function StarMark({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 2L9.44 6.17L13.85 6.25L10.33 8.91L11.61 13.13L8 10.6L4.39 13.13L5.67 8.91L2.15 6.25L6.56 6.17Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}
