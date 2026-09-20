import type { World } from "../../shared/types";
import { WorldCard } from "./WorldCard";

export type CardLayout = "comfortable" | "compact" | "list";

interface WorldGridProps {
  worlds: World[];
  catalog: World[];
  layout: CardLayout;
  onOpen: (id: string) => void;
  onFavorite: (id: string) => void;
}

export function WorldGrid({
  worlds,
  catalog,
  layout,
  onOpen,
  onFavorite,
}: WorldGridProps) {
  return (
    <div className={`grid layout-${layout}`}>
      {worlds.map((world) => (
        <WorldCard
          key={world.id}
          world={world}
          catalog={catalog}
          onOpen={onOpen}
          onFavorite={onFavorite}
        />
      ))}
    </div>
  );
}
