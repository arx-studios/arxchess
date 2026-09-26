import type { ReactNode } from "react";
import "./game-layout.css";

/**
 * The shared game screen: player card / board / player card, with the panel on
 * the right (below the board under 1024px). The board is sized by CSS to fill
 * the viewport; see game-layout.css.
 */
export function GameLayout({
  top,
  bottom,
  board,
  beside,
  overlay,
  panel,
}: {
  top: ReactNode;
  bottom: ReactNode;
  board: ReactNode;
  /** Shown left of the board at full board height (the eval bar). */
  beside?: ReactNode;
  /** Covers the board (game-over card). */
  overlay?: ReactNode;
  panel: ReactNode;
}) {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6">
      <div className="game-layout" data-beside={beside ? "true" : undefined}>
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
          <div className="game-layout__column flex max-w-full flex-col gap-2">
            <div className={beside ? "pl-8" : ""}>{top}</div>
            <div className="flex gap-2">
              {beside && <div className="w-6 shrink-0">{beside}</div>}
              <div className="game-layout__board relative shrink-0">
                {board}
                {overlay}
              </div>
            </div>
            <div className={beside ? "pl-8" : ""}>{bottom}</div>
          </div>

          <aside className="game-layout__panel flex w-full flex-col overflow-hidden rounded-lg bg-panel lg:w-[360px] lg:shrink-0">
            {panel}
          </aside>
        </div>
      </div>
    </div>
  );
}
