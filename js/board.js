// board.js
// Core board data structures: starting position, piece glyphs, cloning,
// and the direction vectors sliding/stepping pieces use.
// No game rules live here on purpose - rules.js owns "is this move legal".

window.Chess = window.Chess || {};

(function(Chess){
  "use strict";

  Chess.FILES = ['a','b','c','d','e','f','g','h'];

  Chess.GLYPH = {
    w:{K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙'},
    b:{K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'}
  };

  Chess.squareName = function(r, c){
    return Chess.FILES[c] + (8 - r);
  };

  // 8x8 array, row 0 = rank 8 (black's back rank), row 7 = rank 1 (white's back rank).
  Chess.freshBoard = function(){
    const back = ['R','N','B','Q','K','B','N','R'];
    const b = Array.from({length:8}, () => Array(8).fill(null));
    for(let c=0;c<8;c++){
      b[0][c] = {type:back[c], color:'b', moved:false};
      b[1][c] = {type:'P', color:'b', moved:false};
      b[6][c] = {type:'P', color:'w', moved:false};
      b[7][c] = {type:back[c], color:'w', moved:false};
    }
    return b;
  };

  Chess.cloneBoard = function(b){
    return b.map(row => row.map(p => p ? {type:p.type, color:p.color, moved:p.moved} : null));
  };

  Chess.DIRS = {
    B:[[-1,-1],[-1,1],[1,-1],[1,1]],
    R:[[-1,0],[1,0],[0,-1],[0,1]],
    N:[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
    K:[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
  };
  Chess.DIRS.Q = Chess.DIRS.B.concat(Chess.DIRS.R);

  Chess.inBounds = function(r, c){
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  };

  Chess.findKing = function(board, color){
    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        const p = board[r][c];
        if(p && p.type === 'K' && p.color === color) return {r, c};
      }
    }
    return null;
  };

})(window.Chess);
