import type { World } from "../../shared/types";
import { blobCardUrl } from "../lib/cardImages";
import { displayValue } from "../lib/display";
import { useCardSource } from "../lib/useCardSource";
import { shouldAllowNativeLink, worldPath } from "../lib/worldPath";
import { CompareMark } from "./CompareMark";
import { StarMark } from "./StarMark";
import { CanvasFrame } from "./WaveField";

interface WorldCardProps {
  world: World;
  catalog: World[];
  inCompare: boolean;
  compareFull: boolean;
  onOpen: (id: string) => void;
  onFavorite: (id: string) => void;
  onCompare: (id: string) => void;
}

export function WorldCard({
  world,
  catalog,
  inCompare,
  compareFull,
  onOpen,
  onFavorite,
  onCompare,
}: WorldCardProps) {
  const thumb = world.cardHero ?? world.cardBoard;
  const image = useCardSource(
    thumb,
    blobCardUrl(world.id, world.cardHero ? "hero" : "board"),
  );
  const name = displayValue(world.name);
  const tier = displayValue(world.wellTier);

  return (
    <article className="card" data-vantage="far">
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
          <CanvasFrame />
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
          <h2>
            {name}{" "}
            <span className={`tier tier-${world.wellTier ?? "unknown"}`}>
              {tier}
            </span>
          </h2>
        </div>
      </a>
      <button
        type="button"
        className={`card-action compare-toggle${inCompare ? " is-on" : ""}`}
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
      <button
        type="button"
        className={`card-action fav${world.favorite ? " is-on" : ""}`}
        aria-pressed={world.favorite}
        aria-label={world.favorite ? `Unfavorite ${name}` : `Favorite ${name}`}
        title={world.favorite ? "Favorited" : "Favorite"}
        onClick={() => onFavorite(world.id)}
      >
        <StarMark filled={world.favorite} />
      </button>
    </article>
  );
}
