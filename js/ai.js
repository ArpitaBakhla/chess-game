// ai.js
// Lightweight, DOM-free chess AI built around the existing rules engine.
(function(Chess){
  "use strict";

  const pieceValues = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };
  const positionalWeights = {
    P: [ [0,0,0,0,0,0,0,0], [50,50,50,50,50,50,50,50], [10,10,20,30,30,20,10,10], [5,5,10,25,25,10,5,5], [0,0,0,20,20,0,0,0], [5,5,5,-10,-10,5,5,5], [10,10,10,-20,-20,10,10,10], [0,0,0,0,0,0,0,0] ],
    N: [ [ -50,-40,-30,-30,-30,-30,-40,-50], [ -40,-20,0,0,0,0,-20,-40], [ -30,0,10,15,15,10,0,-30], [ -30,5,15,20,20,15,5,-30], [ -30,0,15,20,20,15,0,-30], [ -30,5,10,15,15,10,5,-30], [ -40,-20,0,5,5,0,-20,-40], [ -50,-40,-30,-30,-30,-30,-40,-50] ],
    B: [ [ -20,-10,-10,-10,-10,-10,-10,-20], [ -10,0,0,0,0,0,0,-10], [ -10,0,5,10,10,5,0,-10], [ -10,5,5,10,10,5,5,-10], [ -10,0,10,10,10,10,0,-10], [ -10,10,10,10,10,10,10,-10], [ -10,5,0,0,0,0,5,-10], [ -20,-10,-10,-10,-10,-10,-10,-20] ],
    R: [ [ 0,0,0,5,5,0,0,0], [ -5,0,0,0,0,0,0,-5], [ -5,0,0,0,0,0,0,-5], [ -5,0,0,0,0,0,0,-5], [ -5,0,0,0,0,0,0,-5], [ -5,0,0,0,0,0,0,-5], [ 5,10,10,10,10,10,10,5], [ 0,0,0,0,0,0,0,0] ],
    Q: [ [ -20,-10,-10,-5,-5,-10,-10,-20], [ -10,0,0,0,0,0,0,-10], [ -10,0,5,5,5,5,0,-10], [ -5,0,5,5,5,5,0,-5], [ 0,0,5,5,5,5,0,-5], [ -10,5,5,5,5,5,0,-10], [ -10,0,5,0,0,0,0,-10], [ -20,-10,-10,-5,-5,-10,-10,-20] ],
    K: [ [ 20,30,10,0,0,10,30,20], [ 20,20,0,0,0,0,20,20], [ -10,-20,-20,-20,-20,-20,-20,-10], [ -30,-40,-40,-50,-50,-40,-40,-30], [ -30,-40,-40,-50,-50,-40,-40,-30], [ -10,-20,-20,-20,-20,-20,-20,-10], [ 20,20,0,0,0,0,20,20], [ 20,30,10,0,0,10,30,20] ]
  };

  function cloneGameState(gameState){
    return {
      board: Chess.cloneBoard(gameState.board),
      turn: gameState.turn,
      enPassant: gameState.enPassant ? { r: gameState.enPassant.r, c: gameState.enPassant.c } : null
    };
  }

  function evaluateBoard(gameState){
    let score = 0;
    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        const p = gameState.board[r][c];
        if(!p) continue;
        const value = pieceValues[p.type] || 0;
        const weight = positionalWeights[p.type] ? positionalWeights[p.type][p.color === 'w' ? r : 7 - r][c] : 0;
        score += p.color === 'w' ? value + weight : -(value + weight);
      }
    }
    return score;
  }

  function generateMoves(gameState){
    const moves = [];
    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        const p = gameState.board[r][c];
        if(!p || p.color !== gameState.turn) continue;
        const legal = Chess.legalMovesFor(gameState, r, c);
        for(const move of legal){
          moves.push({ from: { r, c }, to: { r: move.r, c: move.c }, flags: move });
        }
      }
    }
    return moves;
  }

  function applyMove(gameState, move){
    const next = cloneGameState(gameState);
    const result = Chess.simulateMove(next.board, { from: move.from, to: move.to, flags: move.flags }, next.enPassant);
    next.board = result.board;
    next.enPassant = result.enPassantTarget;
    next.turn = gameState.turn === 'w' ? 'b' : 'w';
    return next;
  }

  function minimax(gameState, depth, alpha, beta, maximizingPlayer){
    if(depth === 0) return evaluateBoard(gameState);
    const moves = generateMoves(gameState);
    if(!moves.length) return Chess.isInCheck(gameState.board, gameState.turn) ? -100000 : 0;

    if(maximizingPlayer){
      let best = -Infinity;
      for(const move of moves){
        const next = applyMove(gameState, move);
        const score = minimax(next, depth - 1, alpha, beta, false);
        best = Math.max(best, score);
        alpha = Math.max(alpha, score);
        if(beta <= alpha) break;
      }
      return best;
    }

    let best = Infinity;
    for(const move of moves){
      const next = applyMove(gameState, move);
      const score = minimax(next, depth - 1, alpha, beta, true);
      best = Math.min(best, score);
      beta = Math.min(beta, score);
      if(beta <= alpha) break;
    }
    return best;
  }

  function pickBestMove(gameState, depth){
    const moves = generateMoves(gameState);
    if(!moves.length) return null;
    let bestMove = null;
    let bestScore = -Infinity;
    for(const move of moves){
      const next = applyMove(gameState, move);
      const score = minimax(next, depth - 1, -Infinity, Infinity, false);
      if(score > bestScore){
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  Chess.aiGetBestMove = function(gameState, options){
    const difficulty = options && options.difficulty ? options.difficulty : 'medium';
    const requestedDepth = options && options.depth ? options.depth : 2;
    const maxDepth = options && options.maxDepth ? options.maxDepth : requestedDepth;
    const depthMap = { easy: 1, medium: Math.max(2, maxDepth), hard: Math.max(3, maxDepth) };
    const depth = depthMap[difficulty] || maxDepth || requestedDepth;
    const move = pickBestMove(gameState, depth);
    if(!move) return null;
    return {
      from: Chess.squareName(move.from.r, move.from.c),
      to: Chess.squareName(move.to.r, move.to.c)
    };
  };

})(window.LocalChessEngine);
