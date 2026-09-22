import { useEffect, useRef, useState } from "react";

type SourceMode = "primary" | "fallback" | "failed";

/**
 * Try the upstream URL first. On load error, switch to the Blob URL once.
 * A second error gives up. State lives in a ref so a single error event
 * cannot skip the fallback.
 */
export function useCardSource(
  upstream: string | undefined,
  fallback: string | null,
) {
  const modeRef = useRef<SourceMode>("primary");
  const [mode, setMode] = useState<SourceMode>("primary");

  useEffect(() => {
    modeRef.current = "primary";
    setMode("primary");
  }, [upstream, fallback]);

  function onError() {
    const next: SourceMode =
      modeRef.current === "primary" && fallback && fallback !== upstream
        ? "fallback"
        : "failed";
    if (modeRef.current === next) return;
    modeRef.current = next;
    setMode(next);
  }

  const src =
    mode === "failed"
      ? undefined
      : mode === "fallback"
        ? (fallback ?? undefined)
        : upstream;

  return { src, failed: src === undefined, onError };
}
