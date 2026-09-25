import { toMoveListEntries } from "@/lib/chess/types";

export function MoveList({
  sanHistory,
  currentIndex,
  onSelectMove,
}: {
  sanHistory: string[];
  currentIndex?: number;
  onSelectMove?: (index: number) => void;
}) {
  const rows = toMoveListEntries(sanHistory);

  function cellClass(flatIndex: number) {
    const base = "px-2 py-1 font-medium";
    if (onSelectMove) {
      const active = flatIndex === currentIndex;
      return `${base} cursor-pointer rounded ${active ? "bg-blue-100 dark:bg-blue-900/50" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`;
    }
    return base;
  }

  return (
    <div className="h-64 overflow-y-auto rounded-md border border-neutral-200 dark:border-neutral-700">
      {rows.length === 0 ? (
        <p className="p-3 text-sm text-neutral-400">No moves yet.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => {
              const whiteIndex = (row.moveNumber - 1) * 2;
              const blackIndex = whiteIndex + 1;
              return (
                <tr key={row.moveNumber} className="odd:bg-neutral-50 dark:odd:bg-neutral-900/40">
                  <td className="w-10 px-2 py-1 text-neutral-400">{row.moveNumber}.</td>
                  <td className={cellClass(whiteIndex)} onClick={() => onSelectMove?.(whiteIndex)}>
                    {row.white}
                  </td>
                  <td className={cellClass(blackIndex)} onClick={() => row.black && onSelectMove?.(blackIndex)}>
                    {row.black}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
