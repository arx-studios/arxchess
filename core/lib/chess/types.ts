export type PieceColor = "w" | "b";

export type MoveListEntry = {
  moveNumber: number;
  white?: string;
  black?: string;
};

export function toMoveListEntries(sanHistory: string[]): MoveListEntry[] {
  const rows: MoveListEntry[] = [];
  for (let i = 0; i < sanHistory.length; i += 2) {
    rows.push({
      moveNumber: i / 2 + 1,
      white: sanHistory[i],
      black: sanHistory[i + 1],
    });
  }
  return rows;
}
