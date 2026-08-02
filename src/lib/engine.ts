export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert'

const DIFFICULTY_DEPTH_MAP: Record<AIDifficulty, number> = {
  easy: 1, // Random-ish / very shallow
  medium: 5, // Medium depth
  hard: 10, // Harder
  expert: 18, // Very strong
}

export class Engine {
  private worker: Worker | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;
    
    // Create the stockfish web worker
    this.worker = new Worker('/stockfish/stockfish.js');
    
    this.worker.onmessage = (event) => {
      const line = event.data;
      if (line === 'readyok') {
        // Ready
      }
    };

    // Initialize UCI mode
    this.worker.postMessage('uci');
    this.worker.postMessage('isready');
  }

  public async getBestMove(fen: string, difficulty: AIDifficulty = 'medium'): Promise<string> {
    if (!this.worker) throw new Error("Engine not initialized");

    const depth = DIFFICULTY_DEPTH_MAP[difficulty];

    return new Promise((resolve) => {
      const messageHandler = (event: MessageEvent) => {
        const line = event.data;
        // Looking for "bestmove e2e4 ponder e7e5"
        if (typeof line === 'string' && line.startsWith('bestmove')) {
          this.worker?.removeEventListener('message', messageHandler);
          const parts = line.split(' ');
          const move = parts[1]; // e.g. 'e2e4'
          resolve(move);
        }
      };

      this.worker?.addEventListener('message', messageHandler);
      this.worker?.postMessage(`position fen ${fen}`);
      this.worker?.postMessage(`go depth ${depth}`);
    });
  }

  public stop() {
    this.worker?.postMessage('stop');
  }

  public quit() {
    this.worker?.postMessage('quit');
    this.worker?.terminate();
    this.worker = null;
  }
}

// Export a singleton instance for ease of use
export const engineService = new Engine();
