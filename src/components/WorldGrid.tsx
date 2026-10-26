import type { World } from "../../shared/types";
import { useGridColumnCount } from "../lib/gridColumns";
import { cardImagePriority } from "../lib/cardThumb";
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
  const columns = useGridColumnCount(layout);

  return (
    <div className={`grid layout-${layout}`}>
      {worlds.map((world, index) => (
        <WorldCard
          key={world.id}
          world={world}
          catalog={catalog}
          inCompare={inCompare(world.id)}
          compareFull={compareFull}
          imagePriority={cardImagePriority(index, columns)}
          onOpen={onOpen}
          onFavorite={onFavorite}
          onCompare={onCompare}
        />
      ))}
    </div>
  );
}
