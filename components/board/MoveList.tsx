import { toMoveListEntries } from "@/lib/chess/types";

export function MoveList({ sanHistory }: { sanHistory: string[] }) {
  const rows = toMoveListEntries(sanHistory);

  return (
    <div className="h-64 overflow-y-auto rounded-md border border-neutral-200 dark:border-neutral-700">
      {rows.length === 0 ? (
        <p className="p-3 text-sm text-neutral-400">No moves yet.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.moveNumber}
                className="odd:bg-neutral-50 dark:odd:bg-neutral-900/40"
              >
                <td className="w-10 px-2 py-1 text-neutral-400">{row.moveNumber}.</td>
                <td className="px-2 py-1 font-medium">{row.white}</td>
                <td className="px-2 py-1 font-medium">{row.black}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
