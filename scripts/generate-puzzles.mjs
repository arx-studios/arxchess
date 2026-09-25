import { Chess } from "chess.js";
import { writeFileSync } from "fs";

/**
 * Puzzle source of truth. Each entry is hand-authored and mechanically
 * verified below before being written to public/puzzles/puzzle-set.json —
 * every move in `solution` must be legal in sequence, every opponent reply
 * (odd index) must be their only legal move, and the final position must
 * be checkmate. Add new puzzles here and re-run this script; anything that
 * fails validation is reported and excluded rather than silently shipped.
 */
const candidates = [
  {
    id: "mate-r1-1",
    fen: "6k1/5ppp/8/8/8/8/8/4R2K w - - 0 1",
    solution: ["e1e8"],
    themes: ["mateIn1", "backRankMate"],
    rating: 700,
  },
  {
    id: "mate-n1-1",
    fen: "6rk/6pp/3N4/8/8/8/8/6K1 w - - 0 1",
    solution: ["d6f7"],
    themes: ["mateIn1", "smotheredMate"],
    rating: 900,
  },
  {
    id: "mate-r1-2",
    fen: "4r2k/8/8/8/8/8/5PPP/6K1 b - - 0 1",
    solution: ["e8e1"],
    themes: ["mateIn1", "backRankMate"],
    rating: 700,
  },
  {
    id: "mate-q1-1",
    fen: "7k/6pp/8/8/3Q4/2B5/8/6K1 w - - 0 1",
    solution: ["d4g7"],
    themes: ["mateIn1", "supportedMate"],
    rating: 900,
  },
  {
    id: "mate-r1-3",
    fen: "k7/pp6/8/8/8/8/8/3R2K1 w - - 0 1",
    solution: ["d1d8"],
    themes: ["mateIn1", "backRankMate"],
    rating: 600,
  },
  {
    id: "mate-q1-2",
    fen: "6k1/6pp/8/8/8/1B6/8/Q5K1 w - - 0 1",
    solution: ["a1a8"],
    themes: ["mateIn1", "backRankMate"],
    rating: 750,
  },
  {
    id: "mate-kr-1",
    fen: "k7/8/1KR5/8/8/8/8/8 w - - 0 1",
    solution: ["c6c8"],
    themes: ["mateIn1", "rookEndgame"],
    rating: 500,
  },
  {
    id: "mate-kr-2",
    fen: "k7/8/1K6/8/8/8/8/7R w - - 0 1",
    solution: ["h1h8"],
    themes: ["mateIn1", "rookEndgame"],
    rating: 500,
  },
];

function validate(candidate) {
  const chess = new Chess(candidate.fen);
  const solverColor = chess.turn();
  for (let i = 0; i < candidate.solution.length; i++) {
    const uci = candidate.solution[i];
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci.slice(4, 5) : undefined;

    const isOpponentReply = i % 2 === 1;
    if (isOpponentReply) {
      const legal = chess.moves({ verbose: true });
      if (legal.length !== 1) {
        return {
          ok: false,
          reason: `move ${i} (${uci}): expected a forced unique reply, found ${legal.length} legal moves (${legal.map((m) => m.lan).join(", ")})`,
        };
      }
      const only = legal[0];
      if (`${only.from}${only.to}${only.promotion ?? ""}` !== uci) {
        return { ok: false, reason: `move ${i} (${uci}): forced reply was actually ${only.from}${only.to}` };
      }
    }

    let move;
    try {
      move = chess.move({ from, to, promotion });
    } catch (e) {
      return { ok: false, reason: `move ${i} (${uci}) illegal: ${e.message}` };
    }
    if (!move) return { ok: false, reason: `move ${i} (${uci}) rejected` };

    if (i === candidate.solution.length - 1 && !chess.isCheckmate()) {
      return { ok: false, reason: `final move ${uci} did not result in checkmate (fen now: ${chess.fen()})` };
    }
  }
  return { ok: true, solverColor };
}

const results = [];
let failures = 0;
for (const c of candidates) {
  const result = validate(c);
  console.log(c.id, result.ok ? "OK" : `FAIL - ${result.reason}`);
  if (result.ok) {
    results.push({
      id: c.id,
      fen: c.fen,
      solution: c.solution,
      themes: c.themes,
      rating: c.rating,
      solverColor: result.solverColor,
    });
  } else {
    failures++;
  }
}

console.log(`\n${results.length}/${candidates.length} puzzles validated.`);

const outPath = new URL("../public/puzzles/puzzle-set.json", import.meta.url);
writeFileSync(outPath, JSON.stringify(results, null, 2) + "\n");
console.log(`Wrote ${outPath.pathname}`);

if (failures > 0) process.exit(1);
