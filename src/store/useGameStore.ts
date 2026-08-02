import { create } from 'zustand'
import { Chess, Move } from 'chess.js'
import { engineService, type AIDifficulty } from '../lib/engine'

type GameMode = 'hotseat' | 'ai' | 'online'

interface GameState {
  game: Chess
  fen: string
  mode: GameMode
  difficulty: AIDifficulty
  isGameOver: boolean
  turn: 'w' | 'b'
  isAIThinking: boolean
  history: Move[]
  makeMove: (move: { from: string; to: string; promotion?: string }) => boolean
  playAIMove: () => Promise<void>
  resetGame: () => void
  setGameMode: (mode: GameMode) => void
  setDifficulty: (diff: AIDifficulty) => void
  undoMove: () => void
}

export const useGameStore = create<GameState>((set, get) => {
  const initialGame = new Chess()
  return {
    game: initialGame,
    fen: initialGame.fen(),
    mode: 'hotseat',
    difficulty: 'medium',
    isGameOver: initialGame.isGameOver(),
    turn: initialGame.turn(),
    isAIThinking: false,
    history: [],

    makeMove: (move) => {
      const { game } = get()
      // Create a new instance to trigger re-renders
      const newGame = new Chess(game.fen())
      try {
        const result = newGame.move(move)
        if (result) {
          set({
            game: newGame,
            fen: newGame.fen(),
            isGameOver: newGame.isGameOver(),
            turn: newGame.turn(),
            history: newGame.history({ verbose: true }) as Move[],
          })
          return true
        }
      } catch (e) {
        return false
      }
      return false
    },

    playAIMove: async () => {
      const { game, difficulty, isGameOver, mode, turn } = get()
      if (isGameOver || mode !== 'ai' || turn === 'w') return // Assuming player is always white for now
      
      set({ isAIThinking: true })
      try {
        const bestMove = await engineService.getBestMove(game.fen(), difficulty)
        if (bestMove) {
          const from = bestMove.substring(0, 2)
          const to = bestMove.substring(2, 4)
          const promotion = bestMove.length > 4 ? bestMove[4] : undefined
          get().makeMove({ from, to, promotion })
        }
      } finally {
        set({ isAIThinking: false })
      }
    },

    resetGame: () => {
      engineService.stop()
      const newGame = new Chess()
      set({
        game: newGame,
        fen: newGame.fen(),
        isGameOver: false,
        turn: 'w',
        isAIThinking: false,
        history: [],
      })
    },

    setGameMode: (mode) => {
      engineService.stop()
      set({ mode })
    },
    
    setDifficulty: (difficulty) => set({ difficulty }),

    undoMove: () => {
      const { game, mode } = get()
      const newGame = new Chess(game.fen())
      newGame.undo()
      // If playing against AI, undo twice (AI's move and player's move)
      if (mode === 'ai') {
        newGame.undo()
      }
      set({
        game: newGame,
        fen: newGame.fen(),
        isGameOver: newGame.isGameOver(),
        turn: newGame.turn(),
        history: newGame.history({ verbose: true }) as Move[],
      })
    },
  }
})
