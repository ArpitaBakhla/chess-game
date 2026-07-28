# Study Hall Chess

A responsive, two-player browser chess game built with plain HTML, CSS, and
JavaScript — no chess engine or move-validation library. Play it live: *(add
your GitHub Pages link here once deployed — step-by-step below)*

![status](https://img.shields.io/badge/build-static-informational)

## Features

- Full legal move validation for every piece, written from scratch
- Check, checkmate, and stalemate detection
- Castling (king-side and queen-side), with the "can't castle through check" rule enforced
- En passant capture
- Pawn promotion with a piece-choice modal
- Move log in simplified algebraic notation (e.g. `e4`, `Nf3`, `O-O`, `Qxd5+`)
- Captured-piece tray for both sides
- Undo and board-flip controls
- Responsive layout — playable on a phone screen or a desktop monitor

## Project structure

```
chess-game/
├── index.html          # page structure only
├── css/
│   └── styles.css      # all visual styling
└── js/
    ├── board.js         # board data model: starting position, cloning, glyphs
    ├── rules.js          # move generation + legality: check, checkmate, castling
    └── ui.js             # DOM rendering and event handling (the only file that touches the page)
```

The split mirrors how a real game engine separates concerns:

- **`board.js`** only knows about board *state* — what a fresh board looks like,
  how to clone it safely, and static data like piece glyphs and movement
  direction vectors. It has zero knowledge of chess rules.
- **`rules.js`** is the rules engine. Given a board and a square, it can tell
  you every legal move for the piece there, including whether a move would
  leave your own king in check. This file never touches the DOM — it could be
  reused as-is in a Node.js chess bot or a unit test suite.
- **`ui.js`** is the only file that calls `document.getElementById`,
  `addEventListener`, etc. It owns the mutable game state (whose turn it is,
  move history, captured pieces) and renders it to the page.

This separation means the actual chess logic in `rules.js` can be tested
independently of the browser (see "Testing" below), and it's the piece of the
codebase most worth showing an interviewer.

## How the move-legality check works

1. `rules.js` generates **pseudo-legal** moves for a piece — moves that follow
   how that piece type moves, ignoring check entirely.
2. For each pseudo-legal move, the move is simulated on a cloned board.
3. If simulating the move leaves the mover's own king in check, the move is
   discarded. What's left is the actual legal move list.

Castling and en passant are handled as flags on a move object (`{castle: 'K'}`,
`{enPassant: true}`, `{promo: true}`) rather than special-cased throughout the
codebase, which keeps `simulateMove` as the single place a move is actually
applied to a board.

## Running it locally

No build step and no dependencies. Either:

- Double-click `index.html` to open it directly in a browser, or
- Serve the folder with any static server, e.g. `python3 -m http.server` from
  inside `chess-game/`, then visit `http://localhost:8000`

## Testing

The logic in `board.js` and `rules.js` has no DOM dependency, so it can be
exercised headlessly (for example with `jsdom` in Node) by loading those two
files plus `ui.js` into a simulated `document` and dispatching click events on
`.sq` elements — useful for scripting full games (openings, castling, checkmate
sequences) to catch regressions before touching a browser.

## Possible next steps

- Persist move history / game state to `localStorage` so a reload doesn't lose the game
- Add a simple move-strength indicator or basic AI opponent
- Support drag-and-drop piece movement alongside click-to-move
- Export the move log as a downloadable PGN file
