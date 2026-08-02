(function(ChessEngine){
  "use strict";

  if (!ChessEngine) {
    console.error('Local chess engine is not available.');
    return;
  }

  const FILES = ChessEngine.FILES;
  const Clock = window.LocalClock;

  const state = {
    board: ChessEngine.freshBoard(),
    turn: 'w',
    enPassant: null,
    history: [],
    captureLog: { w: [], b: [] },
    lastMove: null,
    selectedSquare: null,
    legalMoves: [],
    flipped: false,
    gameOver: false,
    result: null,
    pendingPromotion: null,
    mode: 'local',
    aiEnabled: false,
    snapshotStack: [],
    clockInterval: null,
    aiDifficulty: 'medium',
    timeControl: '5|3',
    clock: null,
    soundsEnabled: true,
    theme: 'classic',
    pieceStyle: 'classic',
    drag: null,
    statusMessage: 'Choose a game mode to begin.',
    multiplayer: {
      peer: null,
      conn: null,
      roomId: '',
      myColor: null,
      status: 'idle',
      error: '',
      suppressBroadcast: false,
      roomLink: ''
    }
  };

  const elements = {
    board: document.getElementById('board'),
    turnLabel: document.getElementById('turnLabel'),
    turnBadge: document.getElementById('turnBadge'),
    statusText: document.getElementById('statusText'),
    historyBody: document.getElementById('historyBody'),
    whiteCaptured: document.getElementById('whiteCaptured'),
    blackCaptured: document.getElementById('blackCaptured'),
    menuOverlay: document.getElementById('menuOverlay'),
    menuTitle: document.getElementById('menuTitle'),
    resumeButton: document.getElementById('resumeButton'),
    startButton: document.getElementById('startButton'),
    modeSelect: document.getElementById('modeSelect'),
    difficultySelect: document.getElementById('difficultySelect'),
    timeControlSelect: document.getElementById('timeControlSelect'),
    soundToggle: document.getElementById('soundToggle'),
    themeSelect: document.getElementById('themeSelect'),
    pieceStyleSelect: document.getElementById('pieceStyleSelect'),
    pgnInput: document.getElementById('pgnInput'),
    summaryCard: document.getElementById('summaryCard'),
    summaryText: document.getElementById('summaryText'),
    promotionOverlay: document.getElementById('promotionOverlay'),
    promotionChoices: document.getElementById('promotionChoices'),
    resultBanner: document.getElementById('resultBanner'),
    clockWhite: document.getElementById('clockWhite'),
    clockBlack: document.getElementById('clockBlack'),
    clockBadge: document.getElementById('clockBadge'),
    newGameButton: document.getElementById('newGameButton'),
    undoButton: document.getElementById('undoButton'),
    flipButton: document.getElementById('flipButton'),
    exportButton: document.getElementById('exportButton'),
    importButton: document.getElementById('importButton'),
    menuButton: document.getElementById('menuButton'),
    overlayHint: document.getElementById('overlayHint'),
    createRoomButton: document.getElementById('createRoomButton'),
    joinRoomButton: document.getElementById('joinRoomButton'),
    roomInput: document.getElementById('roomInput'),
    roomLinkInput: document.getElementById('roomLinkInput'),
    copyRoomButton: document.getElementById('copyRoomButton'),
    connectionBadge: document.getElementById('connectionBadge'),
    connectionStatus: document.getElementById('connectionStatus')
  };

  const glyphs = {
    classic: {
      w: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
      b: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' }
    },
    minimal: {
      w: { K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N', P: 'P' },
      b: { K: 'k', Q: 'q', R: 'r', B: 'b', N: 'n', P: 'p' }
    }
  };

  const sounds = {
    ctx: null,
    init(){
      if (!this.ctx) { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      if (this.ctx.state === 'suspended') { this.ctx.resume(); }
    },
    play(type){
      if (!state.soundsEnabled) return;
      this.init();
      const now = this.ctx.currentTime;
      if (type === 'move') {
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.type = 'triangle'; osc.frequency.setValueAtTime(180, now); osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
        gain.gain.setValueAtTime(0.18, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
      } else if (type === 'capture') {
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.type = 'square'; osc.frequency.setValueAtTime(360, now); osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.18, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now); osc.stop(now + 0.08);
      } else if (type === 'check') {
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(520, now);
        gain.gain.setValueAtTime(0.16, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.start(now); osc.stop(now + 0.16);
      } else if (type === 'castle') {
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(240, now); osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
        gain.gain.setValueAtTime(0.14, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now); osc.stop(now + 0.12);
      } else if (type === 'gameover') {
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.type = 'triangle'; osc.frequency.setValueAtTime(220, now); osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
        gain.gain.setValueAtTime(0.16, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now); osc.stop(now + 0.18);
      }
    }
  };

  function algebraicToCoords(square){
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square.charAt(1), 10);
    return { r: rank, c: file };
  }

  function coordsToAlgebraic(r, c){
    return FILES[c] + (8 - r);
  }

  function getPieceAt(square){
    const { r, c } = algebraicToCoords(square);
    return state.board[r][c];
  }

  function getLegalMovesForSquare(square){
    const { r, c } = algebraicToCoords(square);
    return ChessEngine.legalMovesFor({ board: state.board, turn: state.turn, enPassant: state.enPassant }, r, c);
  }

  function clearSelection(){
    state.selectedSquare = null;
    state.legalMoves = [];
  }

  function saveGame(){
    const payload = {
      board: state.board,
      turn: state.turn,
      enPassant: state.enPassant,
      history: state.history,
      captureLog: state.captureLog,
      lastMove: state.lastMove,
      flipped: state.flipped,
      mode: state.mode,
      aiEnabled: state.aiEnabled,
      aiDifficulty: state.aiDifficulty,
      timeControl: state.timeControl,
      theme: state.theme,
      pieceStyle: state.pieceStyle,
      soundsEnabled: state.soundsEnabled,
      result: state.result,
      gameOver: state.gameOver,
      statusMessage: state.statusMessage,
      clock: state.clock,
      multiplayer: state.multiplayer
    };
    localStorage.setItem('chess-game-save', JSON.stringify(payload));
  }

  function loadGame(){
    const raw = localStorage.getItem('chess-game-save');
    if (!raw) return false;
    try {
      const payload = JSON.parse(raw);
      state.board = payload.board ? payload.board.map(row => row.map(piece => piece ? { ...piece } : null)) : ChessEngine.freshBoard();
      state.turn = payload.turn || 'w';
      state.enPassant = payload.enPassant ? { ...payload.enPassant } : null;
      state.history = payload.history || [];
      state.captureLog = payload.captureLog || { w: [], b: [] };
      state.lastMove = payload.lastMove || null;
      state.flipped = Boolean(payload.flipped);
      state.mode = payload.mode || 'local';
      state.aiEnabled = Boolean(payload.aiEnabled);
      state.aiDifficulty = payload.aiDifficulty || 'medium';
      state.timeControl = payload.timeControl || '5|3';
      state.theme = payload.theme || 'classic';
      state.pieceStyle = payload.pieceStyle || 'classic';
      state.soundsEnabled = payload.soundsEnabled !== false;
      state.result = payload.result || null;
      state.gameOver = Boolean(payload.gameOver);
      state.statusMessage = payload.statusMessage || '';
      state.clock = payload.clock ? { config: payload.clock.config, active: payload.clock.active, time: { w: payload.clock.time.w, b: payload.clock.time.b } } : null;
      state.multiplayer = payload.multiplayer ? { ...state.multiplayer, ...payload.multiplayer } : state.multiplayer;
      return true;
    } catch (err) {
      console.error('Unable to restore saved game.', err);
      return false;
    }
  }

  function clearSavedGame(){ localStorage.removeItem('chess-game-save'); }

  function resetClock(){ state.clock = Clock.createClock(state.timeControl); updateClockUI(); }

  function startClock(){
    if (!state.clock || !state.clock.active) return;
    if (state.clockInterval) clearInterval(state.clockInterval);
    state.clockInterval = window.setInterval(() => {
      if (state.gameOver) return;
      const activeSide = state.turn;
      state.clock.time[activeSide] = Math.max(0, (state.clock.time[activeSide] || 0) - 1);
      updateClockUI();
      if (state.clock.time[activeSide] <= 0) { clearInterval(state.clockInterval); handleTimeout(activeSide); }
    }, 1000);
  }

  function stopClock(){ if (state.clockInterval) { clearInterval(state.clockInterval); state.clockInterval = null; } }

  function updateClockUI(){
    if (!state.clock || !state.clock.active) {
      elements.clockBadge.textContent = 'Unlimited'; elements.clockWhite.textContent = '—'; elements.clockBlack.textContent = '—'; return;
    }
    elements.clockWhite.textContent = Clock.formatTime(state.clock.time.w);
    elements.clockBlack.textContent = Clock.formatTime(state.clock.time.b);
    elements.clockBadge.textContent = state.timeControl;
  }

  function updateConnectionUI(){
    const badge = state.multiplayer.status;
    if (badge === 'connected') {
      elements.connectionBadge.textContent = state.multiplayer.myColor === 'w' ? 'White ready' : 'Black ready';
      elements.connectionBadge.className = 'chip online';
      elements.connectionStatus.textContent = state.multiplayer.roomId ? `Connected to room ${state.multiplayer.roomId}` : 'Connected';
    } else if (badge === 'connecting') {
      elements.connectionBadge.textContent = 'Connecting';
      elements.connectionBadge.className = 'chip loading';
      elements.connectionStatus.textContent = 'Connecting to your opponent…';
    } else if (badge === 'error') {
      elements.connectionBadge.textContent = 'Offline';
      elements.connectionBadge.className = 'chip error';
      elements.connectionStatus.textContent = state.multiplayer.error || 'Unable to connect right now.';
    } else {
      elements.connectionBadge.textContent = 'Offline';
      elements.connectionBadge.className = 'chip';
      elements.connectionStatus.textContent = 'Create or join a room to play live.';
    }
    elements.roomLinkInput.value = state.multiplayer.roomLink || '';
  }

  function handleTimeout(color){
    const winner = color === 'w' ? 'Black' : 'White';
    state.result = `${winner} wins on time`;
    state.gameOver = true; state.statusMessage = `${winner} wins on time.`; stopClock(); sounds.play('gameover'); render(); showGameOverModal('Timeout', `${winner} wins on time.`);
  }

  function startNewGame(options = {}){
    state.board = ChessEngine.freshBoard(); state.turn = 'w'; state.snapshotStack = []; state.enPassant = null; state.history = []; state.captureLog = { w: [], b: [] }; state.lastMove = null; state.selectedSquare = null; state.legalMoves = []; state.gameOver = false; state.result = null; state.pendingPromotion = null;
    state.mode = options.mode || 'local'; state.aiEnabled = options.mode === 'ai'; state.aiDifficulty = options.aiDifficulty || 'medium'; state.timeControl = options.timeControl || '5|3'; state.statusMessage = 'New game ready.'; state.flipped = false;
    if (state.mode === 'online' && state.multiplayer.myColor === 'b') {
      state.flipped = true;
    }
    resetClock(); startClock(); hideMenu(); clearSavedGame(); saveGame(); render();
  }

  function makeAiMove(){
    if (!state.aiEnabled || state.turn !== 'b' || state.gameOver) return;
    const gameState = { board: ChessEngine.cloneBoard(state.board), turn: state.turn, enPassant: state.enPassant ? { ...state.enPassant } : null };
    const move = ChessEngine.aiGetBestMove(gameState, { difficulty: state.aiDifficulty, depth: state.aiDifficulty === 'hard' ? 4 : state.aiDifficulty === 'medium' ? 3 : 2 });
    if (!move) return;
    window.setTimeout(() => { if (move.from && move.to) applyMove(move.from, move.to, null); }, 450);
  }

  function getMoveTarget(from, to, promotion){
    const fromCoords = algebraicToCoords(from); const toCoords = algebraicToCoords(to); const piece = state.board[fromCoords.r][fromCoords.c]; const legalMoves = getLegalMovesForSquare(from); const moveInfo = legalMoves.find(candidate => candidate.r === toCoords.r && candidate.c === toCoords.c); if (!moveInfo) return null; return { fromCoords, toCoords, piece, moveInfo, flags: { ...moveInfo, promoteTo: promotion ? promotion.toUpperCase() : (moveInfo.promo ? 'Q' : undefined) } };
  }

  function sendMoveToPeer(from, to, promotion){
    if (state.mode === 'online' && state.multiplayer.conn && state.multiplayer.conn.open) {
      state.multiplayer.conn.send({ type: 'move', from, to, promotion });
    }
  }

  function applyMove(from, to, promotion){
    state.snapshotStack.push({ board: ChessEngine.cloneBoard(state.board), turn: state.turn, enPassant: state.enPassant ? { ...state.enPassant } : null, history: state.history.slice(), captureLog: { w: [...state.captureLog.w], b: [...state.captureLog.b] }, lastMove: state.lastMove, gameOver: state.gameOver, result: state.result, statusMessage: state.statusMessage, clock: state.clock ? { config: { ...state.clock.config }, active: state.clock.active, time: { w: state.clock.time.w, b: state.clock.time.b } } : null, flipped: state.flipped });
    const moveData = getMoveTarget(from, to, promotion); if (!moveData) return false;
    const { piece, moveInfo, flags, fromCoords, toCoords } = moveData; const captureTarget = state.board[toCoords.r][toCoords.c]; const sideBeforeMove = state.turn;
    if (piece.type === 'P' && ((state.turn === 'w' && toCoords.r === 0) || (state.turn === 'b' && toCoords.r === 7))) {
      if (!promotion) { state.pendingPromotion = { from, to }; openPromotionModal(); return true; }
      flags.promo = true; flags.promoteTo = promotion.toUpperCase();
    }
    const result = ChessEngine.simulateMove(state.board, { from: fromCoords, to: toCoords, flags }, state.enPassant);
    state.board = result.board; state.enPassant = result.enPassantTarget; const san = buildSan(from, to, flags, captureTarget, piece);
    state.history.push({ san, from, to, flags, pieceType: piece.type, capture: Boolean(captureTarget || flags.enPassant) });
    if (captureTarget) { state.captureLog[sideBeforeMove === 'w' ? 'b' : 'w'].push(captureTarget.type.toUpperCase()); } else if (flags.enPassant) { state.captureLog[sideBeforeMove === 'w' ? 'b' : 'w'].push('P'); }
    state.lastMove = { from: fromCoords, to: toCoords }; state.selectedSquare = null; state.legalMoves = []; state.turn = state.turn === 'w' ? 'b' : 'w';
    if (state.clock && state.clock.active) { Clock.applyIncrement(state.clock, sideBeforeMove); stopClock(); startClock(); }
    const activeSide = state.turn; let soundType = 'move'; if (flags.castle) soundType = 'castle'; else if (captureTarget || flags.enPassant) soundType = 'capture'; if (ChessEngine.isInCheck(state.board, activeSide)) soundType = 'check'; sounds.play(soundType);
    state.statusMessage = `Moved ${san}.`; saveGame(); render();
    if (checkGameOver()) return true;
    if (state.mode === 'online' && !state.multiplayer.suppressBroadcast) { sendMoveToPeer(from, to, promotion); }
    if (state.aiEnabled && state.turn === 'b' && !state.gameOver) { makeAiMove(); }
    return true;
  }

  function buildSan(from, to, flags, captureTarget, piece){
    if (flags.castle === 'K') return 'O-O'; if (flags.castle === 'Q') return 'O-O-O'; let san = ''; if (piece.type === 'P') { san = captureTarget ? from[0] + 'x' : ''; san += to; } else { san = piece.type.toUpperCase(); if (captureTarget) san += 'x'; san += to; } if (flags.promo) san += '=' + (flags.promoteTo || 'Q'); return san;
  }

  function checkGameOver(){
    const sideToMove = state.turn; const hasMoves = ChessEngine.hasAnyLegalMove({ board: state.board, turn: sideToMove, enPassant: state.enPassant }, sideToMove); if (!hasMoves) { const isCheck = ChessEngine.isInCheck(state.board, sideToMove); state.gameOver = true; state.result = isCheck ? `${sideToMove === 'w' ? 'Black' : 'White'} wins by checkmate` : 'Draw by stalemate'; state.statusMessage = isCheck ? 'Checkmate.' : 'Stalemate.'; stopClock(); sounds.play('gameover'); render(); showGameOverModal(isCheck ? 'Checkmate' : 'Draw', isCheck ? `${sideToMove === 'w' ? 'Black' : 'White'} wins by checkmate.` : 'Stalemate. The game is a draw.'); return true; } return false;
  }

  function renderBoard(){
    elements.board.innerHTML = ''; const rows = state.flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]; const cols = state.flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]; rows.forEach((rowIndex, displayRow) => { cols.forEach((colIndex, displayCol) => { const r = rowIndex; const c = colIndex; const squareName = coordsToAlgebraic(r, c); const piece = state.board[r][c]; const isLight = (r + c) % 2 === 0; const cell = document.createElement('button'); cell.type = 'button'; cell.className = `square ${isLight ? 'light' : 'dark'}`; cell.dataset.square = squareName; if (state.selectedSquare === squareName) cell.classList.add('selected'); if (state.legalMoves.some(move => move.r === r && move.c === c)) cell.classList.add('legal'); if (state.lastMove && state.lastMove.from.r === r && state.lastMove.from.c === c) cell.classList.add('last-from'); if (state.lastMove && state.lastMove.to.r === r && state.lastMove.to.c === c) cell.classList.add('last-to'); if (piece && piece.type === 'K' && ChessEngine.isInCheck(state.board, piece.color)) cell.classList.add('check'); if (state.drag && state.drag.square === squareName) cell.classList.add('drag-target'); const label = document.createElement('span'); label.className = 'coord coord-rank'; label.textContent = displayCol === 0 ? 8 - r : ''; cell.appendChild(label); const fileLabel = document.createElement('span'); fileLabel.className = 'coord coord-file'; fileLabel.textContent = displayRow === 7 ? FILES[c] : ''; cell.appendChild(fileLabel); if (piece) { const glyph = document.createElement('span'); glyph.className = `piece ${state.pieceStyle} ${piece.color}`; glyph.textContent = glyphs[state.pieceStyle][piece.color][piece.type]; cell.appendChild(glyph); } cell.addEventListener('click', () => handleSquareClick(squareName)); cell.addEventListener('pointerdown', event => handlePointerDown(event, squareName)); cell.addEventListener('pointermove', event => handlePointerMove(event, squareName)); cell.addEventListener('pointerup', event => handlePointerUp(event, squareName)); cell.addEventListener('pointerleave', event => handlePointerLeave(event, squareName)); elements.board.appendChild(cell); }); }); }

  function renderStatus(){ const turnName = state.turn === 'w' ? 'White' : 'Black'; elements.turnLabel.textContent = `${turnName} to move`; elements.turnBadge.textContent = state.turn === 'w' ? 'White' : 'Black'; elements.statusText.textContent = state.statusMessage || 'Ready to play.'; elements.statusText.className = ChessEngine.isInCheck(state.board, state.turn) ? 'status check' : 'status'; }

  function renderHistory(){ elements.historyBody.innerHTML = ''; state.history.forEach((entry, index) => { const row = document.createElement('tr'); const moveNumber = document.createElement('td'); moveNumber.textContent = `${Math.floor(index / 2) + 1}.`; const moveEntry = document.createElement('td'); moveEntry.textContent = entry.san; row.appendChild(moveNumber); row.appendChild(moveEntry); elements.historyBody.appendChild(row); }); }

  function renderCaptured(){ const glyphMap = { w: { P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕' }, b: { P: '♟', N: '♞', B: '♝', R: '♜', Q: '♛' } }; elements.whiteCaptured.innerHTML = state.captureLog.w.map(piece => `<span>${glyphMap.b[piece]}</span>`).join(''); elements.blackCaptured.innerHTML = state.captureLog.b.map(piece => `<span>${glyphMap.w[piece]}</span>`).join(''); }

  function renderSummary(){ if (!state.result) { elements.summaryCard.classList.remove('show'); return; } const material = state.captureLog.w.reduce((sum, piece) => sum + valueForPiece(piece), 0) - state.captureLog.b.reduce((sum, piece) => sum + valueForPiece(piece), 0); elements.summaryText.innerHTML = `<strong>${state.result}</strong><br>Moves: ${state.history.length}<br>Material swing: ${material >= 0 ? '+' : ''}${material}`; elements.summaryCard.classList.add('show'); }

  function valueForPiece(piece){ const values = { P: 1, N: 3, B: 3, R: 5, Q: 9 }; return values[piece] || 0; }

  function showMenu(){ elements.menuOverlay.classList.add('show'); elements.overlayHint.textContent = localStorage.getItem('chess-game-save') ? 'Resume or start a fresh game.' : 'Start a polished chess session with AI, clocks, and PGN support.'; elements.resumeButton.style.display = localStorage.getItem('chess-game-save') ? 'inline-flex' : 'none'; elements.menuTitle.textContent = state.gameOver ? 'Play again' : 'Study Hall Chess'; }

  function hideMenu(){ elements.menuOverlay.classList.remove('show'); }

  function openPromotionModal(){ elements.promotionChoices.innerHTML = ''; ['q', 'r', 'b', 'n'].forEach(option => { const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = glyphs[state.pieceStyle][state.turn === 'w' ? 'w' : 'b'][option.toUpperCase()]; btn.className = 'promotion-piece'; btn.addEventListener('click', () => { const pending = state.pendingPromotion; state.pendingPromotion = null; elements.promotionOverlay.classList.remove('show'); if (pending) { applyMove(pending.from, pending.to, option); } }); elements.promotionChoices.appendChild(btn); }); elements.promotionOverlay.classList.add('show'); }

  function showGameOverModal(title, message){ elements.resultBanner.querySelector('h2').textContent = title; elements.resultBanner.querySelector('p').textContent = message; elements.resultBanner.classList.add('show'); }
  function hideGameOverModal(){ elements.resultBanner.classList.remove('show'); }

  function handleSquareClick(square){ if (state.pendingPromotion || state.gameOver) return; if (state.mode === 'online' && state.multiplayer.myColor && state.turn !== state.multiplayer.myColor) return; if (state.aiEnabled && state.turn === 'b' && state.mode === 'ai') return; if (!state.selectedSquare) { const piece = getPieceAt(square); if (piece && piece.color === state.turn) { state.selectedSquare = square; state.legalMoves = getLegalMovesForSquare(square); renderBoard(); } } else if (state.selectedSquare === square) { clearSelection(); renderBoard(); } else { const legalMove = state.legalMoves.some(move => coordsToAlgebraic(move.r, move.c) === square); if (legalMove) { applyMove(state.selectedSquare, square, null); } else { const piece = getPieceAt(square); if (piece && piece.color === state.turn) { state.selectedSquare = square; state.legalMoves = getLegalMovesForSquare(square); renderBoard(); } else { clearSelection(); renderBoard(); } } } }

  function handlePointerDown(event, square){ if (state.pendingPromotion || state.gameOver || event.button !== 0) return; if (state.mode === 'online' && state.multiplayer.myColor && state.turn !== state.multiplayer.myColor) return; const piece = getPieceAt(square); if (!piece || piece.color !== state.turn) return; if (state.aiEnabled && state.turn === 'b' && state.mode === 'ai') return; state.drag = { square, pointerId: event.pointerId }; event.currentTarget.setPointerCapture(event.pointerId); state.selectedSquare = square; state.legalMoves = getLegalMovesForSquare(square); renderBoard(); }

  function handlePointerMove(event){ if (!state.drag || state.drag.pointerId !== event.pointerId) return; const boardRect = elements.board.getBoundingClientRect(); const x = event.clientX - boardRect.left; const y = event.clientY - boardRect.top; const cellSize = boardRect.width / 8; const row = Math.min(7, Math.max(0, Math.floor(y / cellSize))); const col = Math.min(7, Math.max(0, Math.floor(x / cellSize))); const targetSquare = state.flipped ? coordsToAlgebraic(7 - row, 7 - col) : coordsToAlgebraic(row, col); state.drag.targetSquare = targetSquare; renderBoard(); }

  function handlePointerUp(event){ if (!state.drag || state.drag.pointerId !== event.pointerId) return; const targetSquare = state.drag.targetSquare || state.drag.square; state.drag = null; if (targetSquare && targetSquare !== state.selectedSquare) { const legalMove = state.legalMoves.some(move => coordsToAlgebraic(move.r, move.c) === targetSquare); if (legalMove) { applyMove(state.selectedSquare, targetSquare, null); } } clearSelection(); renderBoard(); }

  function handlePointerLeave(){ if (!state.drag) return; state.drag.targetSquare = state.drag.square; }

  function exportPgn(){ const header = ['[Event "Study Hall Chess"]', '[Site "Local"]', `[Date "${new Date().toISOString().slice(0, 10)}"]`, '[Result "*"]']; const moves = state.history.map((entry, index) => index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ${entry.san}` : entry.san).join(' '); const blob = new Blob([`${header.join('\n')}\n\n${moves} *\n`], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'game.pgn'; link.click(); URL.revokeObjectURL(url); }

  function importPgnFromText(text){ const tokens = text.split(/\s+/).map(token => token.trim()).filter(token => token && !token.startsWith('[') && !token.startsWith('%')); const moveTokens = tokens.filter(token => !/^\d+\.(\.\.)?$/.test(token) && !/^\d+\.\.\.$/.test(token) && !['1-0','0-1','1/2-1/2','*'].includes(token)); startNewGame({ mode: state.mode, aiDifficulty: state.aiDifficulty, timeControl: state.timeControl }); moveTokens.forEach(token => { const san = token.replace(/[+#!?]/g, ''); if (!applySanMove(san)) state.statusMessage = `Unable to parse move: ${san}`; }); render(); }

  function applySanMove(san){ const legalMoves = []; for (let r = 0; r < 8; r++) { for (let c = 0; c < 8; c++) { const piece = state.board[r][c]; if (!piece || piece.color !== state.turn) continue; const moves = getLegalMovesForSquare(coordsToAlgebraic(r, c)); moves.forEach(move => legalMoves.push({ from: coordsToAlgebraic(r, c), to: coordsToAlgebraic(move.r, move.c), flags: move })); } } const match = legalMoves.find(move => buildSan(move.from, move.to, move.flags, state.board[algebraicToCoords(move.to).r][algebraicToCoords(move.to).c], getPieceAt(move.from)) === san); if (!match) return false; return applyMove(match.from, match.to, null); }

  function resetMultiplayer(){ state.multiplayer.conn = null; state.multiplayer.roomId = ''; state.multiplayer.myColor = null; state.multiplayer.status = 'idle'; state.multiplayer.error = ''; state.multiplayer.roomLink = ''; updateConnectionUI(); }

  function createPeerConnection(){
    if (!window.Peer) {
      state.multiplayer.status = 'error';
      state.multiplayer.error = 'PeerJS failed to load.';
      updateConnectionUI();
      return null;
    }
    if (state.multiplayer.peer) return state.multiplayer.peer;
    const peer = new window.Peer(undefined, { debug: 1 });
    state.multiplayer.peer = peer;
    state.multiplayer.status = 'connecting'; state.multiplayer.error = ''; updateConnectionUI();
    peer.on('open', (id) => {
      state.multiplayer.roomId = id;
      state.multiplayer.roomLink = `${window.location.origin}${window.location.pathname}?room=${id}`;
      state.multiplayer.status = 'ready';
      state.multiplayer.error = '';
      updateConnectionUI();
    });
    peer.on('connection', (incomingConn) => {
      state.multiplayer.conn = incomingConn;
      state.multiplayer.myColor = 'w';
      state.multiplayer.status = 'connected';
      state.multiplayer.error = '';
      setupConnectionHandlers();
      state.statusMessage = 'Opponent joined. Your turn.';
      state.mode = 'online';
      state.aiEnabled = false;
      startNewGame({ mode: 'online', aiDifficulty: state.aiDifficulty, timeControl: state.timeControl });
      incomingConn.send({ type: 'init', color: 'b' });
    });
    peer.on('error', (err) => {
      state.multiplayer.status = 'error'; state.multiplayer.error = err.message || 'Connection failed.'; updateConnectionUI();
    });
    return peer;
  }

  function joinRoom(roomId){
    if (!roomId) return;
    const peer = createPeerConnection();
    if (!peer) return;
    state.multiplayer.status = 'connecting'; state.multiplayer.error = ''; updateConnectionUI();
    const conn = peer.connect(roomId);
    state.multiplayer.conn = conn;
    state.multiplayer.myColor = 'b';
    state.mode = 'online'; state.aiEnabled = false;
    state.multiplayer.roomId = roomId;
    state.multiplayer.roomLink = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    setupConnectionHandlers();
  }

  function setupConnectionHandlers(){
    if (!state.multiplayer.conn) return;
    state.multiplayer.conn.on('open', () => {
      state.multiplayer.status = 'connected'; state.multiplayer.error = ''; updateConnectionUI();
      state.statusMessage = state.multiplayer.myColor === 'w' ? 'Opponent joined. Your turn.' : 'Connected. Waiting for the host to move.';
      render();
    });
    state.multiplayer.conn.on('data', (payload) => {
      if (payload.type === 'init') {
        state.multiplayer.myColor = payload.color;
        state.mode = 'online'; state.aiEnabled = false;
        startNewGame({ mode: 'online', aiDifficulty: state.aiDifficulty, timeControl: state.timeControl });
        state.statusMessage = payload.color === 'w' ? 'Connected. Your turn.' : 'Connected. Waiting for the host to move.';
        render();
      } else if (payload.type === 'move') {
        const isOurTurn = state.turn === state.multiplayer.myColor;
        state.multiplayer.suppressBroadcast = true;
        applyMove(payload.from, payload.to, payload.promotion || null);
        state.multiplayer.suppressBroadcast = false;
        if (isOurTurn) {
          state.statusMessage = 'Opponent moved.';
        }
      } else if (payload.type === 'restart') {
        startNewGame({ mode: 'online', aiDifficulty: state.aiDifficulty, timeControl: state.timeControl });
      } else if (payload.type === 'resign') {
        state.gameOver = true; state.result = `${payload.player === 'w' ? 'Black' : 'White'} wins by resignation`; state.statusMessage = `${payload.player === 'w' ? 'Black' : 'White'} wins by resignation.`; sounds.play('gameover'); render(); showGameOverModal('Resignation', `${payload.player === 'w' ? 'Black' : 'White'} wins by resignation.`);
      } else if (payload.type === 'timeout') {
        state.gameOver = true; state.result = `${payload.loser === 'White' ? 'Black' : 'White'} wins on time`; state.statusMessage = `${payload.loser === 'White' ? 'Black' : 'White'} wins on time.`; sounds.play('gameover'); render(); showGameOverModal('Timeout', `${payload.loser === 'White' ? 'Black' : 'White'} wins on time.`);
      }
    });
    state.multiplayer.conn.on('close', () => { state.multiplayer.status = 'error'; state.multiplayer.error = 'The other player disconnected.'; state.mode = 'local'; state.aiEnabled = false; state.multiplayer.conn = null; state.multiplayer.myColor = null; updateConnectionUI(); showGameOverModal('Connection lost', 'Your opponent disconnected. Return to local play and start a new game.'); });
    state.multiplayer.conn.on('error', () => { state.multiplayer.status = 'error'; state.multiplayer.error = 'Connection error.'; updateConnectionUI(); });
  }

  function copyRoomLink(){ if (!state.multiplayer.roomLink) return; if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(state.multiplayer.roomLink).then(() => { elements.copyRoomButton.textContent = 'Copied'; window.setTimeout(() => { elements.copyRoomButton.textContent = 'Copy'; }, 1500); }); } }

  function bindEvents(){
    elements.newGameButton.addEventListener('click', () => { if (state.mode === 'online') { startNewGame({ mode: 'online', aiDifficulty: state.aiDifficulty, timeControl: state.timeControl }); if (state.multiplayer.conn && state.multiplayer.conn.open) { state.multiplayer.conn.send({ type: 'restart' }); } } else { showMenu(); } });
    elements.undoButton.addEventListener('click', () => { if (!state.snapshotStack.length) return; const snapshot = state.snapshotStack.pop(); state.board = ChessEngine.cloneBoard(snapshot.board); state.turn = snapshot.turn; state.enPassant = snapshot.enPassant ? { ...snapshot.enPassant } : null; state.history = snapshot.history; state.captureLog = { w: [...snapshot.captureLog.w], b: [...snapshot.captureLog.b] }; state.lastMove = snapshot.lastMove; state.gameOver = snapshot.gameOver; state.result = snapshot.result; state.statusMessage = snapshot.statusMessage || 'Undid last move.'; state.clock = snapshot.clock ? { config: { ...snapshot.clock.config }, active: snapshot.clock.active, time: { w: snapshot.clock.time.w, b: snapshot.clock.time.b } } : null; state.flipped = snapshot.flipped; state.selectedSquare = null; state.legalMoves = []; state.pendingPromotion = null; stopClock(); if (state.clock && state.clock.active) startClock(); saveGame(); render(); });
    elements.flipButton.addEventListener('click', () => { state.flipped = !state.flipped; renderBoard(); });
    elements.exportButton.addEventListener('click', exportPgn); elements.importButton.addEventListener('click', () => elements.pgnInput.click()); elements.pgnInput.addEventListener('change', (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => importPgnFromText(reader.result); reader.readAsText(file); });
    elements.menuButton.addEventListener('click', showMenu); elements.resumeButton.addEventListener('click', () => { if (loadGame()) { render(); hideMenu(); return; } showMenu(); });
    elements.startButton.addEventListener('click', () => { const mode = elements.modeSelect.value; startNewGame({ mode, aiDifficulty: elements.difficultySelect.value, timeControl: elements.timeControlSelect.value }); });
    elements.soundToggle.addEventListener('change', () => { state.soundsEnabled = elements.soundToggle.checked; render(); }); elements.themeSelect.addEventListener('change', () => { state.theme = elements.themeSelect.value; document.body.dataset.theme = state.theme; renderBoard(); }); elements.pieceStyleSelect.addEventListener('change', () => { state.pieceStyle = elements.pieceStyleSelect.value; renderBoard(); }); elements.resultBanner.querySelector('button').addEventListener('click', () => { hideGameOverModal(); startNewGame({ mode: state.mode, aiDifficulty: state.aiDifficulty, timeControl: state.timeControl }); });
    elements.createRoomButton.addEventListener('click', () => { createPeerConnection(); state.multiplayer.roomLink = `${window.location.origin}${window.location.pathname}?room=${state.multiplayer.roomId || ''}`; updateConnectionUI(); });
    elements.joinRoomButton.addEventListener('click', () => { const roomId = elements.roomInput.value.trim(); if (!roomId) return; joinRoom(roomId); }); elements.copyRoomButton.addEventListener('click', copyRoomLink);
  }

  function render(){ renderBoard(); renderStatus(); renderHistory(); renderCaptured(); renderSummary(); updateClockUI(); updateConnectionUI(); document.body.dataset.theme = state.theme; elements.themeSelect.value = state.theme; elements.pieceStyleSelect.value = state.pieceStyle; elements.soundToggle.checked = state.soundsEnabled; elements.modeSelect.value = state.aiEnabled ? 'ai' : 'local'; elements.difficultySelect.value = state.aiDifficulty; elements.timeControlSelect.value = state.timeControl; }

  function bootstrap(){ bindEvents(); resetClock(); const urlParams = new URLSearchParams(window.location.search); const roomParam = urlParams.get('room'); if (roomParam) { elements.roomInput.value = roomParam; joinRoom(roomParam); } if (loadGame()) { render(); showMenu(); } else { startNewGame({ mode: 'local', aiDifficulty: 'medium', timeControl: '5|3' }); showMenu(); } }

  bootstrap();
})(window.LocalChessEngine);
