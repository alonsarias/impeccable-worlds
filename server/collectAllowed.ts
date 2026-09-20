export const COLLECT_FORBIDDEN = {
  error: "Collect is local-only. Catalog is updated via git push.",
} as const;

export function isCollectAllowed(): boolean {
  if (process.env.VERCEL === "1") return false;
  if (process.env.NODE_ENV === "production") return false;
  return true;
}
