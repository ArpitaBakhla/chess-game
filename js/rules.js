// rules.js
// Everything about legality: pseudo-legal move generation per piece type,
// attack detection, check detection, and filtering pseudo-legal moves down
// to truly legal ones (i.e. moves that don't leave your own king in check).
// Depends on board.js being loaded first.

(function(Chess){
  "use strict";

  // Pseudo-legal moves for the piece at (r,c): obeys how each piece type moves,
  // but does NOT check whether the move leaves the mover's own king in check.
  function pseudoMoves(board, r, c, enPassant){
    const piece = board[r][c];
    if(!piece) return [];
    const moves = [];
    const color = piece.color;
    const enemy = color === 'w' ? 'b' : 'w';

    if(piece.type === 'P'){
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      const promoRow = color === 'w' ? 0 : 7;
      if(Chess.inBounds(r+dir,c) && !board[r+dir][c]){
        moves.push({r:r+dir, c, promo: r+dir===promoRow});
        if(r === startRow && !board[r+2*dir][c]){
          moves.push({r:r+2*dir, c, double:true});
        }
      }
      for(const dc of [-1,1]){
        const nr = r+dir, nc = c+dc;
        if(!Chess.inBounds(nr,nc)) continue;
        const target = board[nr][nc];
        if(target && target.color === enemy){
          moves.push({r:nr, c:nc, capture:true, promo: nr===promoRow});
        } else if(enPassant && enPassant.r === nr && enPassant.c === nc){
          moves.push({r:nr, c:nc, capture:true, enPassant:true});
        }
      }
      return moves;
    }

    if(piece.type === 'N' || piece.type === 'K'){
      for(const [dr,dc] of Chess.DIRS[piece.type]){
        const nr=r+dr, nc=c+dc;
        if(!Chess.inBounds(nr,nc)) continue;
        const target = board[nr][nc];
        if(!target || target.color === enemy){
          moves.push({r:nr, c:nc, capture: !!target});
        }
      }
      return moves; // castling is added separately in legalMovesFor, since it needs check info
    }

    // sliding pieces: B, R, Q
    for(const [dr,dc] of Chess.DIRS[piece.type]){
      let nr=r+dr, nc=c+dc;
      while(Chess.inBounds(nr,nc)){
        const target = board[nr][nc];
        if(!target){
          moves.push({r:nr,c:nc});
        } else {
          if(target.color === enemy) moves.push({r:nr,c:nc,capture:true});
          break;
        }
        nr+=dr; nc+=dc;
      }
    }
    return moves;
  }

  // Is square (r,c) attacked by `attacker` color, on the given board?
  function isAttacked(board, r, c, attacker){
    for(let rr=0; rr<8; rr++){
      for(let cc=0; cc<8; cc++){
        const p = board[rr][cc];
        if(!p || p.color !== attacker) continue;
        if(p.type === 'P'){
          const dir = attacker === 'w' ? -1 : 1;
          if(rr+dir === r && (cc-1===c || cc+1===c)) return true;
          continue;
        }
        const mv = pseudoMoves(board, rr, cc, null);
        if(mv.some(m => m.r===r && m.c===c)) return true;
      }
    }
    return false;
  }

  function isInCheck(board, color){
    const k = Chess.findKing(board, color);
    if(!k) return false;
    return isAttacked(board, k.r, k.c, color === 'w' ? 'b' : 'w');
  }

  // Applies a move to a CLONE of the board and returns the resulting board,
  // any captured piece, and a fresh en-passant target (if this move created one).
  function simulateMove(board, move, currentEnPassant){
    const b = Chess.cloneBoard(board);
    const {from, to, flags} = move;
    const piece = b[from.r][from.c];
    let capturedPiece = b[to.r][to.c];

    if(flags && flags.enPassant){
      const dir = piece.color === 'w' ? 1 : -1;
      capturedPiece = b[to.r+dir][to.c];
      b[to.r+dir][to.c] = null;
    }

    b[to.r][to.c] = piece;
    b[from.r][from.c] = null;
    piece.moved = true;

    if(flags && flags.promo){
      piece.type = flags.promoteTo || 'Q';
    }

    if(flags && flags.castle === 'K'){
      const row = from.r;
      b[row][5] = b[row][7];
      b[row][7] = null;
      if(b[row][5]) b[row][5].moved = true;
    }
    if(flags && flags.castle === 'Q'){
      const row = from.r;
      b[row][3] = b[row][0];
      b[row][0] = null;
      if(b[row][3]) b[row][3].moved = true;
    }

    let enPassantTarget = null;
    if(flags && flags.double){
      const dir = piece.color === 'w' ? -1 : 1;
      enPassantTarget = {r: from.r + dir, c: from.c};
    }

    return {board:b, capturedPiece, enPassantTarget};
  }

  // Full legal moves for the piece at (r,c), including castling, filtered so
  // that none of them leave the mover's own king in check.
  function legalMovesFor(gameState, r, c){
    const board = gameState.board;
    const piece = board[r][c];
    if(!piece || piece.color !== gameState.turn) return [];
    let moves = pseudoMoves(board, r, c, gameState.enPassant);

    if(piece.type === 'K' && !piece.moved){
      const color = piece.color;
      const row = color === 'w' ? 7 : 0;
      const enemy = color === 'w' ? 'b' : 'w';
      if(!isAttacked(board, row, 4, enemy)){
        const rookK = board[row][7];
        if(rookK && rookK.type==='R' && !rookK.moved && !board[row][5] && !board[row][6]
           && !isAttacked(board,row,5,enemy) && !isAttacked(board,row,6,enemy)){
          moves.push({r:row, c:6, castle:'K'});
        }
        const rookQ = board[row][0];
        if(rookQ && rookQ.type==='R' && !rookQ.moved && !board[row][1] && !board[row][2] && !board[row][3]
           && !isAttacked(board,row,3,enemy) && !isAttacked(board,row,2,enemy)){
          moves.push({r:row, c:2, castle:'Q'});
        }
      }
    }

    const legal = [];
    for(const m of moves){
      const test = simulateMove(board, {from:{r,c}, to:{r:m.r,c:m.c}, flags:m}, gameState.enPassant);
      if(!isInCheck(test.board, piece.color)){
        legal.push(m);
      }
    }
    return legal;
  }

  function hasAnyLegalMove(gameState, color){
    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        const p = gameState.board[r][c];
        if(p && p.color === color){
          const savedTurn = gameState.turn;
          gameState.turn = color;
          const mv = legalMovesFor(gameState, r, c);
          gameState.turn = savedTurn;
          if(mv.length) return true;
        }
      }
    }
    return false;
  }

  function algebraicOf(piece, from, to, flags, wasCapture, checkChar){
    if(flags && flags.castle === 'K') return 'O-O' + checkChar;
    if(flags && flags.castle === 'Q') return 'O-O-O' + checkChar;
    const dest = Chess.squareName(to.r, to.c);
    let s = '';
    if(piece.type === 'P'){
      if(wasCapture) s += Chess.FILES[from.c] + 'x';
      s += dest;
      if(flags && flags.promo) s += '=' + (flags.promoteTo || 'Q');
    } else {
      s += piece.type;
      if(wasCapture) s += 'x';
      s += dest;
    }
    return s + checkChar;
  }

  Chess.pseudoMoves = pseudoMoves;
  Chess.isAttacked = isAttacked;
  Chess.isInCheck = isInCheck;
  Chess.simulateMove = simulateMove;
  Chess.legalMovesFor = legalMovesFor;
  Chess.hasAnyLegalMove = hasAnyLegalMove;
  Chess.algebraicOf = algebraicOf;

})(window.Chess);
