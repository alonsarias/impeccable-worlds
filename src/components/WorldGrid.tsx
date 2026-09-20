import type { World } from "../../shared/types";
import { WorldCard } from "./WorldCard";

interface WorldGridProps {
  worlds: World[];
  onOpen: (id: string) => void;
  onFavorite: (id: string) => void;
}

export function WorldGrid({ worlds, onOpen, onFavorite }: WorldGridProps) {
  return (
    <div className="grid">
      {worlds.map((world) => (
        <WorldCard key={world.id} world={world} onOpen={onOpen} onFavorite={onFavorite} />
      ))}
    </div>
  );
}
