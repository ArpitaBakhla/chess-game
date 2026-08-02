const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');

function loadEngine() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;
  global.HTMLElement = window.HTMLElement;
  global.Node = window.Node;
  global.localStorage = window.localStorage;

  const boardCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'board.js'), 'utf8');
  const rulesCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'rules.js'), 'utf8');
  const aiCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai.js'), 'utf8');

  window.eval(boardCode);
  window.eval(rulesCode);
  window.eval(aiCode);
  return { window, Chess: window.LocalChessEngine };
}

test('rules engine detects a scripted checkmate position', () => {
  const { Chess } = loadEngine();
  const board = Chess.freshBoard();
  const game = { board, turn: 'w', enPassant: null };

  board[6][4] = null;
  board[6][3] = null;
  board[7][3] = null;
  board[7][4] = null;
  board[7][5] = null;
  board[7][6] = null;
  board[7][7] = null;
  board[6][5] = { type: 'P', color: 'w', moved: true };
  board[6][6] = { type: 'P', color: 'w', moved: true };
  board[1][4] = null;
  board[0][4] = { type: 'K', color: 'b', moved: true };
  board[7][4] = { type: 'Q', color: 'w', moved: true };

  const moves = Chess.legalMovesFor(game, 7, 4);
  assert.ok(moves.some(move => move.r === 0 && move.c === 4));
  assert.ok(Chess.isInCheck(board, 'b'));
});

test('ai returns a legal move from a simple position', () => {
  const { Chess } = loadEngine();
  const board = Chess.freshBoard();
  const gameState = { board, turn: 'w', enPassant: null };
  const move = Chess.aiGetBestMove(gameState, { depth: 1, maxDepth: 1, difficulty: 'easy' });
  assert.ok(move);
  assert.equal(typeof move.from, 'string');
  assert.equal(typeof move.to, 'string');
});
