// ui.js
// Chess game user interface, rendering, timers, theme toggle, and PeerJS multiplayer.
// Powered by chess.js & PeerJS.

(function(ChessEngine){
  "use strict";

  if (!ChessEngine) {
    console.error("chess.js library not loaded!");
    return;
  }

  // Core Game Objects
  let game = new ChessEngine();
  const state = {
    flipped: false
  };

  let myColor = null; // 'w' or 'b' (only used in online mode)
  let gameMode = 'local'; // 'local' or 'online'
  let lastMove = null; // { from: {r, c}, to: {r, c} }
  let selectedSquare = null; // square name e.g. "e2"
  let legalTargets = []; // array of move objects from chess.js

  // PeerJS Connection State
  let peer = null;
  let conn = null;

  // Timer State
  let timerInterval = null;
  const timeRemaining = {
    w: 120,
    b: 120
  };

  // DOM elements
  const boardEl = document.getElementById('board');
  const turnLabel = document.getElementById('turnLabel');
  const turnDot = document.getElementById('turnDot');
  const statusMsg = document.getElementById('statusMsg');
  const historyTableBody = document.getElementById('historyTableBody');
  const capByWhiteEl = document.getElementById('capByWhite');
  const capByBlackEl = document.getElementById('capByBlack');
  const promoBackdrop = document.getElementById('promoBackdrop');
  const promoOptions = document.getElementById('promoOptions');
  
  // Game Over Modal Elements
  const gameOverBackdrop = document.getElementById('gameOverBackdrop');
  const gameOverTitle = document.getElementById('gameOverTitle');
  const gameOverText = document.getElementById('gameOverText');
  const gameOverCloseBtn = document.getElementById('gameOverCloseBtn');

  // Lobby Elements
  const modeLocalBtn = document.getElementById('modeLocalBtn');
  const modeOnlineBtn = document.getElementById('modeOnlineBtn');
  const lobbyOnlineSection = document.getElementById('lobbyOnlineSection');
  const lobbySetupActions = document.getElementById('lobbySetupActions');
  const lobbyConnectedStatus = document.getElementById('lobbyConnectedStatus');
  const lobbyRoomDisplay = document.getElementById('lobbyRoomDisplay');
  const roomInput = document.getElementById('roomInput');
  const roomLinkVal = document.getElementById('roomLinkVal');
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  
  // Controls
  const undoBtn = document.getElementById('undoBtn');
  const flipBtn = document.getElementById('flipBtn');
  const resignBtn = document.getElementById('resignBtn');
  
  let pendingPromotion = null;

  // Constants
  const FILES = ['a','b','c','d','e','f','g','h'];
  const GLYPH = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
  };

  // Web Audio Synthesizer for Chess.com Chess Sounds
  const ChessSound = {
    ctx: null,

    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    },

    play(type) {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      
      const now = this.ctx.currentTime;
      
      if (type === 'move') {
        // Satisfying wooden knock sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.12);
      } 
      else if (type === 'capture') {
        // Sharp capture click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
      } 
      else if (type === 'check') {
        // Dual tone high-pitch alert
        const playBeep = (freq, start, duration) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.2, start);
          gain.gain.exponentialRampToValueAtTime(0.01, start + duration);

          osc.start(start);
          osc.stop(start + duration);
        };
        playBeep(290, now, 0.08);
        playBeep(290, now + 0.08, 0.12);
      } 
      else if (type === 'gameover') {
        // Chime falling chord
        const playNote = (freq, start, duration) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.15, start);
          gain.gain.exponentialRampToValueAtTime(0.01, start + duration);

          osc.start(start);
          osc.stop(start + duration);
        };
        playNote(220, now, 0.25);
        playNote(261.63, now + 0.1, 0.25);
        playNote(329.63, now + 0.2, 0.35);
      }
    }
  };

  // Coords & Algebraic conversion helper
  function coordsToAlgebraic(r, c) {
    return FILES[c] + (8 - r);
  }

  function algebraicToCoords(square) {
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square.charAt(1), 10);
    return { r: rank, c: file };
  }

  // Timer Management
  function startTurnTimer() {
    if (timerInterval) clearInterval(timerInterval);

    const activeColor = game.turn();
    timeRemaining[activeColor] = 120; // reset to 2 minutes

    // Update active class
    document.getElementById('whiteTimer').classList.toggle('active', activeColor === 'w');
    document.getElementById('blackTimer').classList.toggle('active', activeColor === 'b');

    updateTimerDisplay();

    timerInterval = setInterval(() => {
      timeRemaining[activeColor]--;
      updateTimerDisplay();

      if (timeRemaining[activeColor] <= 0) {
        clearInterval(timerInterval);
        handleTimeout(activeColor);
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    document.getElementById('whiteTimer').textContent = formatTime(timeRemaining.w);
    document.getElementById('blackTimer').textContent = formatTime(timeRemaining.b);
  }

  function handleTimeout(color) {
    const loser = color === 'w' ? 'White' : 'Black';
    const winner = color === 'w' ? 'Black' : 'White';

    if (gameMode === 'online' && color === myColor) {
      if (conn && conn.open) {
        conn.send({ type: 'timeout', loser });
      }
    }

    ChessSound.play('gameover');
    showGameOverModal("Timeout!", `${winner} wins on time.`);
  }

  // Move Logic
  function performMove(from, to, promotion) {
    // Initialize sound synthesis on user click gesture
    ChessSound.init();

    if (!promotion) {
      const moves = game.moves({ square: from, verbose: true });
      const isPromo = moves.some(m => m.to === to && m.flags.includes('p'));
      if (isPromo) {
        pendingPromotion = { from, to };
        openPromotionModal(game.turn());
        return;
      }
    }

    const isCapture = game.get(to) !== null || (game.get(from) && game.get(from).type === 'p' && from[0] !== to[0] && game.get(to) === null);

    const moveResult = game.move({ from, to, promotion: promotion || 'q' });
    if (!moveResult) return;

    // Send move to peer if online
    if (gameMode === 'online' && game.turn() !== myColor) {
      if (conn && conn.open) {
        conn.send({
          type: 'move',
          from,
          to,
          promotion: promotion
        });
      }
    }

    // Play sounds
    if (game.in_check()) {
      ChessSound.play('check');
    } else if (isCapture) {
      ChessSound.play('capture');
    } else {
      ChessSound.play('move');
    }

    // Update coordinates for last move highlights
    lastMove = {
      from: algebraicToCoords(from),
      to: algebraicToCoords(to)
    };

    selectedSquare = null;
    legalTargets = [];

    // Switch timer
    startTurnTimer();

    // Redraw interface
    renderCaptured();
    renderBoard();
    renderStatus();
    renderHistory();
    
    // Check game status
    checkGameOver();
  }

  function openPromotionModal(color){
    promoOptions.innerHTML = '';
    const opts = ['q','r','b','n'];
    opts.forEach(t => {
      const btn = document.createElement('button');
      btn.className = color === 'w' ? 'piece white' : 'piece black';
      
      const glyphMap = {
        w: { q: '♕', r: '♖', b: '♗', n: '♘' },
        b: { q: '♛', r: '♜', b: '♝', n: '♞' }
      };
      btn.textContent = glyphMap[color][t];
      
      btn.addEventListener('click', () => {
        promoBackdrop.classList.remove('show');
        const {from, to} = pendingPromotion;
        pendingPromotion = null;
        performMove(from, to, t);
      });
      promoOptions.appendChild(btn);
    });
    promoBackdrop.classList.add('show');
  }

  // Captured pieces panel
  function getCapturedPieces() {
    const initial = {
      w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
      b: { p: 8, n: 2, b: 2, r: 2, q: 1 }
    };
    const current = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
    };
    
    game.board().forEach(row => {
      row.forEach(sq => {
        if (sq && sq.type !== 'k') {
          current[sq.color][sq.type]++;
        }
      });
    });
    
    const captured = { w: [], b: [] }; // captured.w = pieces taken BY white (black pieces)
    const types = ['p', 'n', 'b', 'r', 'q'];
    
    types.forEach(t => {
      const blackTaken = initial.b[t] - current.b[t];
      for (let i = 0; i < blackTaken; i++) {
        captured.w.push(t.toUpperCase());
      }
      const whiteTaken = initial.w[t] - current.w[t];
      for (let i = 0; i < whiteTaken; i++) {
        captured.b.push(t.toUpperCase());
      }
    });
    
    return captured;
  }

  function renderCaptured(){
    const cap = getCapturedPieces();
    const capGlyphs = {
      w: { P:'♙', N:'♘', B:'♗', R:'♖', Q:'♕' },
      b: { P:'♟', N:'♞', B:'♝', R:'♜', Q:'♛' }
    };
    capByWhiteEl.innerHTML = cap.w.map(t => `<span class="black">${capGlyphs.b[t]}</span>`).join('');
    capByBlackEl.innerHTML = cap.b.map(t => `<span class="white">${capGlyphs.w[t]}</span>`).join('');
  }

  // Main board renderer
  function renderBoard(){
    boardEl.innerHTML = '';
    const board = game.board();
    for(let displayRow=0; displayRow<8; displayRow++){
      for(let displayCol=0; displayCol<8; displayCol++){
        const r = state.flipped ? 7-displayRow : displayRow;
        const c = state.flipped ? 7-displayCol : displayCol;

        const sq = document.createElement('div');
        const isLight = (r+c) % 2 === 0;
        sq.className = 'sq ' + (isLight ? 'light' : 'dark');
        sq.dataset.r = r; sq.dataset.c = c;
        
        const squareName = coordsToAlgebraic(r, c);

        // Highlight last move
        if(lastMove && lastMove.from.r===r && lastMove.from.c===c) sq.classList.add('last-from');
        if(lastMove && lastMove.to.r===r && lastMove.to.c===c) sq.classList.add('last-to');
        
        // Highlight selection
        if(selectedSquare === squareName) sq.classList.add('selected');

        const piece = board[r][c];
        
        // Highlight king in check
        if(piece && piece.type === 'k' && game.in_check() && piece.color === game.turn()){
          sq.classList.add('in-check');
        }

        if(piece){
          const span = document.createElement('span');
          span.className = 'piece ' + (piece.color === 'w' ? 'white' : 'black');
          span.textContent = GLYPH[piece.color][piece.type];
          sq.appendChild(span);
        }

        // Legal target highlighting
        const target = legalTargets.find(t => t.to === squareName);
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
          fileLabel.textContent = FILES[c];
          sq.appendChild(fileLabel);
        }

        sq.addEventListener('click', onSquareClick);
        boardEl.appendChild(sq);
      }
    }
  }

  function onSquareClick(e){
    if (game.game_over()) return;
    
    // In online mode, restrict move playing to matching color
    if (gameMode === 'online' && game.turn() !== myColor) {
      return;
    }

    const r = parseInt(e.currentTarget.dataset.r, 10);
    const c = parseInt(e.currentTarget.dataset.c, 10);
    const squareName = coordsToAlgebraic(r, c);

    if (selectedSquare) {
      const target = legalTargets.find(t => t.to === squareName);
      if (target) {
        performMove(selectedSquare, squareName, null);
        return;
      }
    }

    const piece = game.get(squareName);
    if (piece && piece.color === game.turn()) {
      selectedSquare = squareName;
      legalTargets = game.moves({ square: squareName, verbose: true });
      renderBoard();
      return;
    }

    selectedSquare = null;
    legalTargets = [];
    renderBoard();
  }

  function renderStatus(){
    const turn = game.turn();
    turnDot.className = 'turn-dot ' + (turn === 'w' ? 'white' : 'black');
    turnLabel.textContent = (turn === 'w' ? 'White' : 'Black') + ' to move';
    statusMsg.className = 'msg';
    statusMsg.textContent = '';

    if(game.in_check()){
      statusMsg.classList.add('check');
      statusMsg.textContent = 'Check!';
    }
  }

  function renderHistory(){
    historyTableBody.innerHTML = '';
    const history = game.history();
    
    for(let i=0; i<history.length; i+=2){
      const tr = document.createElement('tr');
      
      const moveNumTd = document.createElement('td');
      moveNumTd.className = 'move-num';
      moveNumTd.textContent = `${Math.floor(i/2) + 1}.`;
      tr.appendChild(moveNumTd);
      
      const whiteMoveTd = document.createElement('td');
      whiteMoveTd.textContent = history[i] || '';
      tr.appendChild(whiteMoveTd);
      
      const blackMoveTd = document.createElement('td');
      blackMoveTd.textContent = history[i+1] || '';
      tr.appendChild(blackMoveTd);
      
      historyTableBody.appendChild(tr);
    }
    
    const historyContainer = historyTableBody.closest('.history');
    if (historyContainer) {
      historyContainer.scrollTop = historyContainer.scrollHeight;
    }
  }

  // Popups and Modals
  function showGameOverModal(title, text) {
    if (timerInterval) clearInterval(timerInterval);
    gameOverTitle.textContent = title;
    gameOverText.textContent = text;
    gameOverBackdrop.classList.add('show');
  }

  function closeGameOverModal() {
    gameOverBackdrop.classList.remove('show');
  }

  function checkGameOver() {
    if (game.game_over()) {
      let title = "Game Over";
      let message = "";
      if (game.in_checkmate()) {
        const winner = game.turn() === 'w' ? 'Black' : 'White';
        title = "Checkmate!";
        message = `${winner} wins by checkmate.`;
      } else if (game.in_stalemate()) {
        title = "Draw";
        message = "Stalemate! The game is a draw.";
      } else if (game.in_threefold_repetition()) {
        title = "Draw";
        message = "Draw by threefold repetition.";
      } else if (game.insufficient_material()) {
        title = "Draw";
        message = "Draw by insufficient material.";
      } else {
        title = "Draw";
        message = "Draw by 50-move rule or agreement.";
      }
      ChessSound.play('gameover');
      showGameOverModal(title, message);
      return true;
    }
    return false;
  }

  // Theme Management
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const sunIcon = themeToggleBtn.querySelector('.theme-icon.sun');
  const moonIcon = themeToggleBtn.querySelector('.theme-icon.moon');

  function updateThemeUI(theme) {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      document.body.classList.remove('light-theme');
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }

  themeToggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-theme');
    const nextTheme = isLight ? 'dark' : 'light';
    localStorage.setItem('chess-theme', nextTheme);
    updateThemeUI(nextTheme);
  });

  // Load Initial Theme
  const savedTheme = localStorage.getItem('chess-theme') || 'dark';
  updateThemeUI(savedTheme);

  // Online Matchmaking and Lobby Management
  function updateConnectionStatus(status, text) {
    const textEl = document.getElementById('connectionStatusText');
    const pulseEl = document.getElementById('lobbyPulseDot');
    
    textEl.textContent = text;
    pulseEl.className = 'pulse-dot';
    
    if (status === 'connecting') {
      pulseEl.classList.add('connecting');
    } else if (status === 'error') {
      pulseEl.classList.add('error');
    } else if (status === 'success') {
      pulseEl.classList.add('success');
    }
  }

  function setupShareLink(id) {
    roomLinkVal.value = id;
    
    copyLinkBtn.addEventListener('click', () => {
      // Copy room ID to clipboard
      navigator.clipboard.writeText(id).then(() => {
        copyLinkBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#55a350" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg>`;
        setTimeout(() => {
          copyLinkBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        }, 1500);
      });
    });
  }

  function initPeer() {
    if (peer) return;

    updateConnectionStatus('connecting', 'Connecting to network...');
    
    const genRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    const myId = genRoomId();

    peer = new Peer(myId, {
      debug: 1
    });

    peer.on('open', (id) => {
      updateConnectionStatus('ready', 'Room ID: ' + id);
      setupShareLink(id);
    });

    peer.on('error', (err) => {
      console.error('PeerJS connection error:', err);
      updateConnectionStatus('error', 'Network error. Try again.');
    });

    peer.on('connection', (incomingConn) => {
      if (conn && conn.open) {
        incomingConn.close();
        return;
      }

      conn = incomingConn;
      myColor = 'w';
      document.getElementById('gameModeTag').textContent = 'Online · Playing White';
      
      setupConnectionListeners();
      
      // Delay to let channels open securely
      setTimeout(() => {
        if (conn && conn.open) {
          conn.send({ type: 'init', color: 'b' });
          startNewOnlineGame();
        }
      }, 500);
    });
  }

  function joinRoom(roomId) {
    if (!roomId) return;
    initPeer();

    const attemptConnect = () => {
      if (peer && peer.open) {
        updateConnectionStatus('connecting', 'Connecting to ' + roomId + '...');
        conn = peer.connect(roomId);
        setupConnectionListeners();
      } else {
        setTimeout(attemptConnect, 100);
      }
    };
    attemptConnect();
  }

  function setupConnectionListeners() {
    conn.on('open', () => {
      updateConnectionStatus('success', 'Connected!');
      lobbySetupActions.style.display = 'none';
      lobbyConnectedStatus.style.display = 'block';
      lobbyRoomDisplay.style.display = 'block';
    });

    conn.on('data', (data) => {
      if (data.type === 'init') {
        myColor = data.color;
        document.getElementById('gameModeTag').textContent = 'Online · Playing Black';
        startNewOnlineGame();
      } else if (data.type === 'move') {
        const isCapture = game.get(data.to) !== null || (game.get(data.from) && game.get(data.from).type === 'p' && data.from[0] !== data.to[0] && game.get(data.to) === null);
        
        game.move({
          from: data.from,
          to: data.to,
          promotion: data.promotion
        });

        lastMove = {
          from: algebraicToCoords(data.from),
          to: algebraicToCoords(data.to)
        };
        
        selectedSquare = null;
        legalTargets = [];

        // Play sound for opponent's move
        if (game.in_check()) {
          ChessSound.play('check');
        } else if (isCapture) {
          ChessSound.play('capture');
        } else {
          ChessSound.play('move');
        }

        startTurnTimer();

        renderCaptured();
        renderBoard();
        renderStatus();
        renderHistory();
        checkGameOver();
      } else if (data.type === 'timeout') {
        ChessSound.play('gameover');
        showGameOverModal("Timeout!", `${data.loser === 'White' ? 'Black' : 'White'} wins on time.`);
      } else if (data.type === 'resign') {
        const winner = data.player === 'w' ? 'Black' : 'White';
        ChessSound.play('gameover');
        showGameOverModal("Resignation", `Opponent resigned. ${winner} wins!`);
      } else if (data.type === 'restart') {
        startNewOnlineGame(false);
      }
    });

    conn.on('close', () => {
      handleDisconnect();
    });

    conn.on('error', (err) => {
      console.error(err);
      handleDisconnect();
    });
  }

  function handleDisconnect() {
    updateConnectionStatus('error', 'Disconnected');
    lobbySetupActions.style.display = 'block';
    lobbyConnectedStatus.style.display = 'none';
    lobbyRoomDisplay.style.display = 'none';

    if (gameMode === 'online') {
      ChessSound.play('gameover');
      showGameOverModal("Disconnected", "Opponent disconnected from the room.");
    }

    conn = null;
    gameMode = 'local';
    myColor = null;
    document.getElementById('gameModeTag').textContent = 'two-player · local board';
    
    // Reset back controls to local view
    undoBtn.style.display = 'block';
    flipBtn.style.display = 'block';
    resignBtn.style.display = 'none';

    if (timerInterval) clearInterval(timerInterval);
    document.getElementById('whiteTimer').classList.remove('active');
    document.getElementById('blackTimer').classList.remove('active');
    updateTimerDisplay();
  }

  function startNewOnlineGame(notifyOpponent = true) {
    game.reset();
    timeRemaining.w = 120;
    timeRemaining.b = 120;
    lastMove = null;
    selectedSquare = null;
    legalTargets = [];

    // Flip the board for Black
    state.flipped = (myColor === 'b');

    if (notifyOpponent && conn && conn.open) {
      conn.send({ type: 'restart' });
    }

    startTurnTimer();
    renderCaptured();
    renderBoard();
    renderStatus();
    renderHistory();
    closeGameOverModal();
  }

  function switchGameMode(mode) {
    if (mode === 'local') {
      modeLocalBtn.classList.add('active');
      modeOnlineBtn.classList.remove('active');
      lobbyOnlineSection.style.display = 'none';

      if (peer) {
        peer.destroy();
        peer = null;
      }
      conn = null;
      gameMode = 'local';
      myColor = null;
      document.getElementById('gameModeTag').textContent = 'two-player · local board';
      
      // Update local buttons
      undoBtn.style.display = 'block';
      flipBtn.style.display = 'block';
      resignBtn.style.display = 'none';

      resetLocalGame();
    } else {
      modeLocalBtn.classList.remove('active');
      modeOnlineBtn.classList.add('active');
      lobbyOnlineSection.style.display = 'flex';

      gameMode = 'online';
      
      // Update online buttons
      undoBtn.style.display = 'none';
      flipBtn.style.display = 'none';
      resignBtn.style.display = 'block';

      initPeer();
    }
  }

  function resetLocalGame() {
    game.reset();
    timeRemaining.w = 120;
    timeRemaining.b = 120;
    lastMove = null;
    selectedSquare = null;
    legalTargets = [];
    state.flipped = false;

    startTurnTimer();
    renderCaptured();
    renderBoard();
    renderStatus();
    renderHistory();
    closeGameOverModal();
  }

  // Event Listeners
  modeLocalBtn.addEventListener('click', () => switchGameMode('local'));
  modeOnlineBtn.addEventListener('click', () => switchGameMode('online'));

  document.getElementById('createRoomBtn').addEventListener('click', () => {
    initPeer();
    const waitPeer = () => {
      if (peer && peer.open) {
        updateConnectionStatus('connecting', 'Waiting for opponent to join...');
        lobbySetupActions.style.display = 'none';
        lobbyConnectedStatus.style.display = 'block';
        lobbyRoomDisplay.style.display = 'block';
      } else {
        setTimeout(waitPeer, 100);
      }
    };
    waitPeer();
  });

  document.getElementById('joinRoomBtn').addEventListener('click', () => {
    const id = roomInput.value.trim().toUpperCase();
    if (id) joinRoom(id);
  });

  document.getElementById('disconnectBtn').addEventListener('click', () => {
    handleDisconnect();
  });

  document.getElementById('newGameBtn').addEventListener('click', () => {
    if (gameMode === 'online') {
      startNewOnlineGame(true);
    } else {
      resetLocalGame();
    }
  });

  document.getElementById('flipBtn').addEventListener('click', () => {
    state.flipped = !state.flipped;
    renderBoard();
  });

  resignBtn.addEventListener('click', () => {
    if (gameMode !== 'online') return;
    if (conn && conn.open) {
      conn.send({ type: 'resign', player: myColor });
    }
    const loserColor = myColor === 'w' ? 'White' : 'Black';
    const winnerColor = myColor === 'w' ? 'Black' : 'White';
    ChessSound.play('gameover');
    showGameOverModal("Resignation", `You resigned. ${winnerColor} wins!`);
  });

  undoBtn.addEventListener('click', () => {
    if (gameMode === 'online') return;
    
    // Undo twice in local to undo the move pair
    game.undo();
    updateLastMoveFromHistory();
    
    selectedSquare = null;
    legalTargets = [];

    startTurnTimer();
    renderCaptured();
    renderBoard();
    renderStatus();
    renderHistory();
  });

  function updateLastMoveFromHistory() {
    const history = game.history({ verbose: true });
    if (history.length > 0) {
      const last = history[history.length - 1];
      lastMove = {
        from: algebraicToCoords(last.from),
        to: algebraicToCoords(last.to)
      };
    } else {
      lastMove = null;
    }
  }

  gameOverCloseBtn.addEventListener('click', () => {
    closeGameOverModal();
    if (gameMode === 'online') {
      startNewOnlineGame(true);
    } else {
      resetLocalGame();
    }
  });

  // URL Auto-joining Flow
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  if (roomParam) {
    switchGameMode('online');
    roomInput.value = roomParam;
    joinRoom(roomParam);
  }

  // Initial Game Boot
  resetLocalGame();

})(window.Chess);
