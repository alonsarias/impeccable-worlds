export const NO_VALUE = "No value";

export function displayValue(value: string | undefined | null): string {
  return value && value.trim() !== "" ? value : NO_VALUE;
}
