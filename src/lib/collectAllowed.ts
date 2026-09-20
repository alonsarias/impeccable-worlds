export function isCollectAllowed(): boolean {
  return import.meta.env.DEV;
}
