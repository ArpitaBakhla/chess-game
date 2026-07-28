// ui.js
// Game state, DOM rendering, and event wiring. This is the only file that
// touches the document - board.js and rules.js know nothing about the DOM.
// Depends on board.js and rules.js being loaded first.

(function(Chess){
  "use strict";

  let state;
  function newGame(){
    state = {
      board: Chess.freshBoard(),
      turn: 'w',
      enPassant: null,
      history: [],
      selected: null,
      legalTargets: [],
      lastMove: null,
      gameOver: false,
      flipped: false,
      captured: {w:[], b:[]} // captured.w = pieces captured BY white (i.e. black pieces taken)
    };
  }
  newGame();

  const boardEl = document.getElementById('board');
  const turnLabel = document.getElementById('turnLabel');
  const turnDot = document.getElementById('turnDot');
  const statusMsg = document.getElementById('statusMsg');
  const historyList = document.getElementById('historyList');
  const capByWhiteEl = document.getElementById('capByWhite');
  const capByBlackEl = document.getElementById('capByBlack');
  const promoBackdrop = document.getElementById('promoBackdrop');
  const promoOptions = document.getElementById('promoOptions');

  let pendingPromotion = null;
  const undoStack = [];

  function performMove(from, to, flags){
    const piece = state.board[from.r][from.c];
    const wasCapture = !!(state.board[to.r][to.c] || (flags && flags.enPassant));

    if(flags && flags.promo && !flags.promoteTo){
      pendingPromotion = {from, to, flags};
      openPromotionModal(piece.color);
      return;
    }

    undoStack.push({
      board: Chess.cloneBoard(state.board),
      turn: state.turn,
      enPassant: state.enPassant,
      captured: {w:[...state.captured.w], b:[...state.captured.b]},
      lastMove: state.lastMove,
      gameOver: state.gameOver,
      winner: state.winner,
      history: state.history.map(h => ({...h}))
    });

    const result = Chess.simulateMove(state.board, {from, to, flags}, state.enPassant);
    state.board = result.board;
    state.enPassant = result.enPassantTarget;

    if(result.capturedPiece){
      state.captured[piece.color].push(result.capturedPiece.type);
    }

    const nextTurn = piece.color === 'w' ? 'b' : 'w';
    const oppInCheck = Chess.isInCheck(state.board, nextTurn);
    state.turn = nextTurn;
    const oppHasMove = Chess.hasAnyLegalMove(state, nextTurn);
    let checkChar = '';
    if(oppInCheck && !oppHasMove) checkChar = '#';
    else if(oppInCheck) checkChar = '+';

    const notation = Chess.algebraicOf(piece, from, to, flags, wasCapture, checkChar);
    state.history.push({text: notation, color: piece.color});

    state.lastMove = {from, to};
    state.selected = null;
    state.legalTargets = [];

    if(oppInCheck && !oppHasMove){
      state.gameOver = true;
      state.winner = piece.color;
    } else if(!oppInCheck && !oppHasMove){
      state.gameOver = true;
      state.winner = null; // stalemate
    }

    renderCaptured();
    renderBoard();
    renderStatus();
    renderHistory();
  }

  function openPromotionModal(color){
    promoOptions.innerHTML = '';
    const opts = ['Q','R','B','N'];
    opts.forEach(t => {
      const btn = document.createElement('button');
      btn.className = color === 'w' ? 'piece white' : 'piece black';
      btn.textContent = Chess.GLYPH[color][t];
      btn.addEventListener('click', () => {
        promoBackdrop.classList.remove('show');
        const {from, to, flags} = pendingPromotion;
        flags.promoteTo = t;
        pendingPromotion = null;
        performMove(from, to, flags);
      });
      promoOptions.appendChild(btn);
    });
    promoBackdrop.classList.add('show');
  }

  function renderStatus(){
    turnDot.className = 'turn-dot ' + (state.turn === 'w' ? 'white' : 'black');
    turnLabel.textContent = (state.turn === 'w' ? 'White' : 'Black') + ' to move';
    statusMsg.className = 'msg';
    statusMsg.textContent = '';

    if(state.gameOver){
      turnLabel.textContent = 'Game over';
      statusMsg.classList.add('over');
      statusMsg.textContent = state.winner
        ? (state.winner === 'w' ? 'White' : 'Black') + ' wins by checkmate'
        : 'Draw by stalemate';
      return;
    }
    if(Chess.isInCheck(state.board, state.turn)){
      statusMsg.classList.add('check');
      statusMsg.textContent = 'Check!';
    }
  }

  function renderHistory(){
    historyList.innerHTML = '';
    for(let i=0;i<state.history.length;i+=2){
      const li = document.createElement('li');
      li.className = 'pair';
      const w = state.history[i] ? state.history[i].text : '';
      const bMove = state.history[i+1] ? state.history[i+1].text : '';
      li.innerHTML = `<span>${w}</span><span>${bMove}</span>`;
      historyList.appendChild(li);
    }
    historyList.parentElement.scrollTop = historyList.parentElement.scrollHeight;
  }

  function renderCaptured(){
    capByWhiteEl.innerHTML = state.captured.w.map(t => `<span class="black">${Chess.GLYPH.b[t]}</span>`).join('');
    capByBlackEl.innerHTML = state.captured.b.map(t => `<span class="white">${Chess.GLYPH.w[t]}</span>`).join('');
  }

  function renderBoard(){
    boardEl.innerHTML = '';
    for(let displayRow=0; displayRow<8; displayRow++){
      for(let displayCol=0; displayCol<8; displayCol++){
        const r = state.flipped ? 7-displayRow : displayRow;
        const c = state.flipped ? 7-displayCol : displayCol;

        const sq = document.createElement('div');
        const isLight = (r+c) % 2 === 0;
        sq.className = 'sq ' + (isLight ? 'light' : 'dark');
        sq.dataset.r = r; sq.dataset.c = c;

        if(state.lastMove && state.lastMove.from.r===r && state.lastMove.from.c===c) sq.classList.add('last-from');
        if(state.lastMove && state.lastMove.to.r===r && state.lastMove.to.c===c) sq.classList.add('last-to');
        if(state.selected && state.selected.r===r && state.selected.c===c) sq.classList.add('selected');

        const piece = state.board[r][c];
        if(piece && piece.type === 'K' && Chess.isInCheck(state.board, piece.color)){
          sq.classList.add('in-check');
        }

        if(piece){
          const span = document.createElement('span');
          span.className = 'piece ' + (piece.color === 'w' ? 'white' : 'black');
          span.textContent = Chess.GLYPH[piece.color][piece.type];
          sq.appendChild(span);
        }

        const target = state.legalTargets.find(t => t.r===r && t.c===c);
        if(target){
          const marker = document.createElement('div');
          marker.className = piece ? 'ring' : 'dot';
          sq.appendChild(marker);
        }

        if(displayCol === 0){
          const rankLabel = document.createElement('span');
          rankLabel.className = 'coord-rank';
          rankLabel.textContent = 8-r;
          sq.appendChild(rankLabel);
        }
        if(displayRow === 7){
          const fileLabel = document.createElement('span');
          fileLabel.className = 'coord-file';
          fileLabel.textContent = Chess.FILES[c];
          sq.appendChild(fileLabel);
        }

        sq.addEventListener('click', onSquareClick);
        boardEl.appendChild(sq);
      }
    }
  }

  function onSquareClick(e){
    if(state.gameOver) return;
    const r = parseInt(e.currentTarget.dataset.r, 10);
    const c = parseInt(e.currentTarget.dataset.c, 10);
    const piece = state.board[r][c];

    if(state.selected){
      const target = state.legalTargets.find(t => t.r===r && t.c===c);
      if(target){
        performMove(state.selected, {r,c}, target);
        return;
      }
    }

    if(piece && piece.color === state.turn){
      state.selected = {r,c};
      state.legalTargets = Chess.legalMovesFor(state, r, c);
      renderBoard();
      return;
    }

    state.selected = null;
    state.legalTargets = [];
    renderBoard();
  }

  document.getElementById('newGameBtn').addEventListener('click', () => {
    const flipped = state.flipped;
    newGame();
    state.flipped = flipped;
    undoStack.length = 0;
    renderCaptured();
    renderBoard();
    renderStatus();
    renderHistory();
  });

  document.getElementById('flipBtn').addEventListener('click', () => {
    state.flipped = !state.flipped;
    renderBoard();
  });

  document.getElementById('undoBtn').addEventListener('click', () => {
    if(undoStack.length === 0) return;
    const prev = undoStack.pop();
    state.board = prev.board;
    state.turn = prev.turn;
    state.enPassant = prev.enPassant;
    state.captured = prev.captured;
    state.lastMove = prev.lastMove;
    state.gameOver = prev.gameOver;
    state.winner = prev.winner;
    state.history = prev.history;
    state.selected = null;
    state.legalTargets = [];
    renderCaptured();
    renderBoard();
    renderStatus();
    renderHistory();
  });

  // initial render
  renderCaptured();
  renderBoard();
  renderStatus();
  renderHistory();

})(window.Chess);
