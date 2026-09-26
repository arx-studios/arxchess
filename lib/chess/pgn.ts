/** Movetext for a game from the start position: "1. e4 e5 2. Nf3". */
export function toPgn(sanHistory: string[]): string {
  const parts: string[] = [];
  sanHistory.forEach((san, i) => {
    if (i % 2 === 0) parts.push(`${i / 2 + 1}.`);
    parts.push(san);
  });
  return parts.join(" ");
}
