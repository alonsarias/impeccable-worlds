import { useId, useMemo } from "react";
import type { World } from "../../shared/types";
import { blobCardUrl } from "../lib/cardImages";
import { displayValue } from "../lib/display";
import { moreLikeThis } from "../lib/similarWorlds";
import { useCardSource } from "../lib/useCardSource";
import { shouldAllowNativeLink, worldPath } from "../lib/worldPath";
import { CompareMark } from "./CompareMark";

interface MoreLikeThisProps {
  world: World;
  catalog: World[];
  compareFull: boolean;
  inCompare: (id: string) => boolean;
  onOpen: (id: string) => void;
  onCompare: (id: string) => void;
}

function SimilarCard({
  world,
  catalog,
  compareFull,
  inCompare,
  onOpen,
  onCompare,
}: {
  world: World;
  catalog: World[];
  compareFull: boolean;
  inCompare: boolean;
  onOpen: (id: string) => void;
  onCompare: (id: string) => void;
}) {
  const upstream = world.cardHero ?? world.cardBoard;
  const image = useCardSource(
    upstream,
    blobCardUrl(world.id, world.cardHero ? "hero" : "board"),
  );
  const name = displayValue(world.name);

  return (
    <article className="card similar-card">
      <a
        className="card-main"
        href={worldPath(world, catalog)}
        onClick={(event) => {
          if (shouldAllowNativeLink(event)) return;
          event.preventDefault();
          onOpen(world.id);
        }}
      >
        <div className="card-thumb">
          {image.src ? (
            <img
              src={image.src}
              alt=""
              loading="lazy"
              decoding="async"
              onError={image.onError}
            />
          ) : (
            <span className="missing">No value</span>
          )}
        </div>
        <div className="card-body">
          <h4>{name}</h4>
        </div>
      </a>
      <button
        type="button"
        className={`compare-toggle compare-toggle-tiny${inCompare ? " is-on" : ""}`}
        aria-pressed={inCompare}
        aria-label={
          inCompare
            ? `Remove ${name} from compare`
            : compareFull
              ? `Add ${name} to compare, replacing the other side`
              : `Add ${name} to compare`
        }
        title={inCompare ? "Remove from compare" : "Add to compare"}
        onClick={() => onCompare(world.id)}
      >
        <CompareMark />
      </button>
    </article>
  );
}

export function MoreLikeThis({
  world,
  catalog,
  compareFull,
  inCompare,
  onOpen,
  onCompare,
}: MoreLikeThisProps) {
  const headingId = useId();
  const matches = useMemo(() => moreLikeThis(world, catalog), [world, catalog]);

  if (matches.length === 0) return null;

  return (
    <section className="more-like" aria-labelledby={headingId}>
      <h3 id={headingId}>More like this</h3>
      <ul className="more-like-grid">
        {matches.map((match) => (
          <li key={match.id}>
            <SimilarCard
              world={match}
              catalog={catalog}
              compareFull={compareFull}
              inCompare={inCompare(match.id)}
              onOpen={onOpen}
              onCompare={onCompare}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
