import { useState } from "react";
import type { World } from "../../shared/types";
import { displayValue } from "../lib/display";

interface WorldCardProps {
  world: World;
  onOpen: (id: string) => void;
  onFavorite: (id: string) => void;
}

export function WorldCard({ world, onOpen, onFavorite }: WorldCardProps) {
  const thumb = world.cardBoard ?? world.cardHero;
  const [broken, setBroken] = useState(false);
  const name = displayValue(world.name);
  const tier = displayValue(world.wellTier);

  return (
    <article className="card">
      <button type="button" className="card-main" onClick={() => onOpen(world.id)}>
        <div className="card-thumb">
          {thumb && !broken ? (
            <img src={thumb} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
          ) : (
            <span className="missing">No value</span>
          )}
        </div>
        <div className="card-body">
          <h2>{name}</h2>
          <span className={`tier tier-${world.wellTier ?? "unknown"}`}>{tier}</span>
        </div>
      </button>
      <button
        type="button"
        className={`fav ${world.favorite ? "is-on" : ""}`}
        aria-pressed={world.favorite}
        aria-label={world.favorite ? `Unfavorite ${name}` : `Favorite ${name}`}
        onClick={() => onFavorite(world.id)}
      >
        {world.favorite ? "★" : "☆"}
      </button>
    </article>
  );
}
