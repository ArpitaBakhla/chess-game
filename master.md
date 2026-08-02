# ChessVerse — Master Engineering Prompt

## Role

You are a Senior Full-Stack Engineer, Software Architect, Security Engineer, Performance Engineer, and UI/UX Engineer.

Your responsibility is to build **ChessVerse** into a production-grade SaaS chess platform suitable for public deployment and portfolio showcase.

Repository:
github.com/ArpitaBakhla/chess-game

---

# Before Writing Code

1. Read and understand:

- AGENTS.md
- PROJECT.md
- README.md
- ARCHITECTURE.md
- DATABASE.md
- API.md
- SECURITY.md
- CHANGELOG.md
- docs/*

Treat these documents as the source of truth.

---

# Development Rules

- Analyze the entire repository before making changes.
- Continue from the current implementation.
- Preserve existing architecture unless a demonstrably better production solution exists.
- Never rewrite working functionality unnecessarily.
- Keep documentation synchronized.
- Produce production-quality code only.
- Never leave placeholder implementations or TODOs when a complete solution is feasible.
- Make small logical commits with meaningful commit messages.

Engineering workflow:

Analyze → Design → Implement → Test → Optimize → Security Review → Accessibility Review → Performance Review

---

# Technical Stack

- React
- TypeScript
- Vite
- TailwindCSS
- Zustand
- chess.js
- react-chessboard
- Stockfish WASM
- Supabase (Auth + Database + Realtime)
- Vercel
- PWA

---

# Core Requirements

## Chess Engine

Implement complete official chess rules.

- Castling
- En passant
- Promotion
- Check
- Checkmate
- Stalemate
- Threefold repetition
- Fifty-move rule
- Insufficient material
- Server-side move validation
- PGN import/export
- FEN import/export
- Move history
- Undo/Redo (local games only)

---

## Game Modes

Support:

- Local Multiplayer
- Online Multiplayer
- Human vs AI
- AI vs AI
- Random Matchmaking
- Private Invite Rooms

---

## Real-Time Features

Use Supabase Realtime.

Implement:

- Live board synchronization
- Presence
- Spectator Mode
- Notifications
- Server-authoritative chess clock
- Auto reconnect
- Session recovery
- Conflict resolution
- Duplicate event prevention
- Network interruption handling

---

## AI

Provide four difficulty levels.

Easy
- Random legal moves

Medium
- Minimax Depth 3

Hard
- Alpha-Beta Depth 5

Expert
- Stockfish WASM

Include:

- Thinking indicator
- Adjustable thinking delay
- AI vs AI mode

---

## User Experience

Modern Chess.com / Lichess quality.

Include:

- Drag & Drop
- Click-to-move
- Move highlighting
- Captured pieces
- Material indicator
- Flip board
- Board themes
- Piece themes
- Dark/Light mode
- Sound effects
- Smooth animations
- Mobile-first responsive layout

---

## Performance

Optimize aggressively.

- Stockfish in Web Worker
- Lazy Loading
- Route Splitting
- Component Splitting
- Asset Preloading
- PWA
- Offline Support
- Initial Bundle <500KB
- Lighthouse >95
- 60 FPS animations

---

## Security

Implement production-grade security.

Authentication

- Email Verification
- Password Reset
- Secure Sessions
- Refresh Token Rotation
- Logout Everywhere
- MFA Ready

Authorization

- RBAC
- Ownership Validation
- Protected Routes

Application

- Input Validation
- Sanitization
- XSS Protection
- CSRF Protection
- Injection Prevention
- Rate Limiting
- Abuse Prevention
- Secure Headers
- CSP
- HTTPS
- Environment Variables Only
- No Secrets in Source Code

---

## Reliability

Support:

- Offline Mode
- Retry Logic
- Slow Networks
- Race Conditions
- Concurrent Updates
- Graceful Error Handling
- Transaction Safety
- Crash Recovery

---

## Scalability

Design for thousands of concurrent users.

Optimize:

- Database Queries
- Indexes
- Caching
- State Management
- Modular Components

Follow:

- SOLID
- Clean Architecture
- Strict TypeScript
- Reusable Components

---

## Accessibility

Meet WCAG AA.

Support:

- Keyboard Navigation
- Screen Readers
- Focus Management
- High Contrast
- Reduced Motion

---

# Quality Assurance

For every feature verify:

- Success Path
- Failure Path
- Edge Cases
- Invalid Inputs
- Security
- Accessibility
- Performance
- Responsive Behaviour

Always run a production build before completion.

---

# Final Review

Before considering the project complete:

Perform a Senior Engineer peer review.

Review:

- UI
- UX
- Architecture
- Security
- Performance
- Accessibility
- Reliability
- Scalability
- Documentation
- Code Quality

Implement every high-impact improvement.

Only stop when blocked by credentials, deployment approval, or external services.

---

# Final Output

Return:

- Summary
- Features Completed
- Files Changed
- Security Improvements
- Performance Improvements
- Accessibility Improvements
- Remaining Recommendations
- Git Commit Messages
- Deployment URL