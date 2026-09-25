import type { World } from "../../shared/types";
import { WorldCard } from "./WorldCard";

export type CardLayout = "comfortable" | "compact" | "list";

interface WorldGridProps {
  worlds: World[];
  catalog: World[];
  layout: CardLayout;
  compareFull: boolean;
  inCompare: (id: string) => boolean;
  onOpen: (id: string, opener?: HTMLElement | null) => void;
  onFavorite: (id: string) => void;
  onCompare: (id: string) => void;
}

export function WorldGrid({
  worlds,
  catalog,
  layout,
  compareFull,
  inCompare,
  onOpen,
  onFavorite,
  onCompare,
}: WorldGridProps) {
  return (
    <div className={`grid layout-${layout}`}>
      {worlds.map((world) => (
        <WorldCard
          key={world.id}
          world={world}
          catalog={catalog}
          inCompare={inCompare(world.id)}
          compareFull={compareFull}
          onOpen={onOpen}
          onFavorite={onFavorite}
          onCompare={onCompare}
        />
      ))}
    </div>
  );
}
