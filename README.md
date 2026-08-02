# Study Hall Chess

A polished, vanilla JavaScript chess experience that keeps the architecture simple and reusable while feeling like a real product.

## Highlights

- AI opponent with selectable difficulty (Easy / Medium / Hard)
- Drag-and-drop plus click-to-move controls
- Local persistence with resume support
- PGN export and import
- Optional chess clock with selectable time controls
- Move highlighting, last-move glow, and check highlighting
- Sound effects for moves, captures, check, castling, and game over
- A polished start menu with settings and multiple visual themes
- Mobile-friendly touch interaction
- Post-game summary with move count and material swing

## Project structure

- js/board.js — board state and shared constants
- js/rules.js — legality engine, checks, castling, en passant, promotion, and move validation
- js/ai.js — DOM-free minimax AI with alpha-beta pruning
- js/clock.js — DOM-free clock model and time control helpers
- js/ui.js — DOM rendering, interactions, persistence, PGN support, and menus
- css/styles.css — polished responsive interface
- test/basic.test.js — headless engine tests using jsdom

## Run locally

```bash
npm install
npm test
```

Then open index.html in a browser.

## Status

The project now includes the full set of portfolio-ready features requested, while preserving the separation between state, rules, AI, clock logic, and UI rendering.
