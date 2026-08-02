import { useGameStore } from '../store/useGameStore'
import { Chessboard } from 'react-chessboard'
import { useCallback, useEffect } from 'react'

export function ChessBoardComponent() {
  const { fen, makeMove, turn, isGameOver, game, resetGame, undoMove, mode, playAIMove, isAIThinking } = useGameStore()

  // AI turn handling
  useEffect(() => {
    if (mode === 'ai' && turn === 'b' && !isGameOver && !isAIThinking) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        playAIMove()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [mode, turn, isGameOver, isAIThinking, playAIMove])

  const onDrop = useCallback(
    ({ sourceSquare, targetSquare, piece }: { sourceSquare: string; targetSquare: string | null; piece: { pieceType: string } }) => {
      if (!targetSquare) return false;
      const move = makeMove({
        from: sourceSquare,
        to: targetSquare,
        promotion: piece.pieceType[1]?.toLowerCase() ?? 'q', // default to queen if pawn reaches end
      })
      return move
    },
    [makeMove]
  )

  let status = ''
  if (isGameOver) {
    if (game.isCheckmate()) status = `Game Over: ${turn === 'w' ? 'Black' : 'White'} won by Checkmate`
    else if (game.isDraw()) status = 'Game Over: Draw'
    else status = 'Game Over'
  } else {
    status = `${turn === 'w' ? 'White' : 'Black'} to move`
    if (game.isCheck()) status += ' (Check)'
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-card rounded-xl shadow-lg border relative">
      {isAIThinking && (
        <div className="absolute top-2 right-6 flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          Stockfish is thinking...
        </div>
      )}
      <div className="flex w-full justify-between items-center px-2">
        <h2 className="text-xl font-bold tracking-tight">{status}</h2>
        <div className="flex gap-2">
          <button
            onClick={undoMove}
            className="px-3 py-1.5 text-sm font-medium transition-colors border rounded-md hover:bg-muted"
          >
            Undo
          </button>
          <button
            onClick={resetGame}
            className="px-3 py-1.5 text-sm font-medium transition-colors border rounded-md hover:bg-muted bg-primary text-primary-foreground"
          >
            New Game
          </button>
        </div>
      </div>
      <div className="w-full shadow-2xl rounded-sm overflow-hidden">
        <Chessboard 
          options={{
            position: fen, 
            onPieceDrop: onDrop, 
            darkSquareStyle: { backgroundColor: '#769656' },
            lightSquareStyle: { backgroundColor: '#eeeed2' }
          }}
        />
      </div>
    </div>
  )
}
