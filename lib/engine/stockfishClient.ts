export type EngineMove = { from: string; to: string; promotion?: string };

export type EngineInfo = {
  depth?: number;
  scoreCp?: number;
  scoreMate?: number;
  pv?: string[];
};

function parseUciMove(uci: string): EngineMove {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci.slice(4, 5) : undefined,
  };
}

function parseInfoLine(line: string): EngineInfo | null {
  if (!line.startsWith("info") || !line.includes(" pv ")) return null;
  const info: EngineInfo = {};

  const depthMatch = line.match(/\bdepth (\d+)/);
  if (depthMatch) info.depth = Number(depthMatch[1]);

  const cpMatch = line.match(/score cp (-?\d+)/);
  if (cpMatch) info.scoreCp = Number(cpMatch[1]);

  const mateMatch = line.match(/score mate (-?\d+)/);
  if (mateMatch) info.scoreMate = Number(mateMatch[1]);

  const pvMatch = line.match(/ pv (.+)$/);
  if (pvMatch) info.pv = pvMatch[1].trim().split(/\s+/);

  return info;
}

/**
 * One instance = one independent engine process (a dedicated Web Worker).
 * Arena mode spins up two of these so each side has its own strength/state.
 */
export class StockfishClient {
  private worker: Worker;
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;
  private pendingBestMove: ((move: EngineMove) => void) | null = null;

  onInfo: ((info: EngineInfo) => void) | null = null;

  constructor() {
    this.worker = new Worker("/stockfish/stockfish.js");
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
    this.worker.onmessage = (event: MessageEvent) => {
      const line = typeof event.data === "string" ? event.data : "";
      this.handleLine(line);
    };
    this.send("uci");
  }

  private handleLine(line: string) {
    if (line === "uciok") {
      this.send("isready");
      return;
    }
    if (line === "readyok") {
      this.resolveReady();
      return;
    }
    if (line.startsWith("bestmove")) {
      const uci = line.split(" ")[1];
      if (uci && this.pendingBestMove) {
        const resolve = this.pendingBestMove;
        this.pendingBestMove = null;
        resolve(parseUciMove(uci));
      }
      return;
    }
    if (line.startsWith("info")) {
      const info = parseInfoLine(line);
      if (info && this.onInfo) this.onInfo(info);
    }
  }

  private send(cmd: string) {
    this.worker.postMessage(cmd);
  }

  async ready(): Promise<void> {
    return this.readyPromise;
  }

  /** Elo ~1320-3190. Uses UCI_LimitStrength for human-like weaker play. */
  async setStrength(options: { elo?: number; skillLevel?: number }): Promise<void> {
    await this.ready();
    if (options.elo != null) {
      this.send("setoption name UCI_LimitStrength value true");
      this.send(`setoption name UCI_Elo value ${Math.round(options.elo)}`);
    } else {
      this.send("setoption name UCI_LimitStrength value false");
    }
    if (options.skillLevel != null) {
      this.send(`setoption name Skill Level value ${Math.round(options.skillLevel)}`);
    }
  }

  async newGame(): Promise<void> {
    await this.ready();
    this.send("ucinewgame");
  }

  async getBestMove(
    fen: string,
    limit: { depth?: number; movetimeMs?: number } = { depth: 12 },
  ): Promise<EngineMove> {
    await this.ready();
    this.send(`position fen ${fen}`);
    return new Promise((resolve) => {
      this.pendingBestMove = resolve;
      if (limit.movetimeMs) this.send(`go movetime ${limit.movetimeMs}`);
      else this.send(`go depth ${limit.depth ?? 12}`);
    });
  }

  stop() {
    this.send("stop");
  }

  quit() {
    this.pendingBestMove = null;
    this.send("quit");
    this.worker.terminate();
  }
}
