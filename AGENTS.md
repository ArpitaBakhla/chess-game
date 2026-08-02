# AGENTS.md

# ChessVerse AI Development Guide

## Mission

Build ChessVerse as a production-ready online chess platform that demonstrates senior-level software engineering.

This is NOT a college project or localhost demo.

Every decision must prioritize:

- User Experience
- Performance
- Security
- Reliability
- Scalability
- Accessibility
- Maintainability

The final product should be suitable for public deployment and portfolio presentation.

---

# Working Rules

Before writing code:

1. Analyze the repository.
2. Understand the architecture.
3. Preserve completed functionality.
4. Continue from the current implementation.
5. Refactor only when it materially improves quality.

Always work in this order:

Analyze → Plan → Implement → Test → Optimize → Commit

Never stop after implementing one feature.

Continue until blocked only by credentials or required human approval.

---

# Technology

Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

Game Engine
- Chess.js
- Stockfish

Backend (when required)
- Supabase Auth
- PostgreSQL
- Realtime
- Storage
- Edge Functions

Deployment
- GitHub
- Vercel

Use environment variables only.

Never use localhost URLs or hardcoded secrets.

---

# Design Principles

Create an original premium interface inspired by modern product design.

Goals

- Premium quality
- Mobile-first
- Responsive
- Accessible
- Fast
- Consistent
- Minimal
- Elegant

Implement

- Dark & Light mode
- Smooth animations
- Skeleton loading
- Empty states
- Error states
- Keyboard shortcuts
- Premium board & piece themes
- Sound controls

Do not copy branding, layouts or assets from existing products.

---

# Core Features

Maintain and improve

- Multiplayer
- Matchmaking
- Private rooms
- Invite links
- Spectator mode
- Timers
- Draw
- Resign
- Rematch
- Replay
- Move history
- Captured pieces
- Board flip
- PGN
- FEN
- Promotion
- Legal move highlighting
- Chess.js rule validation

---

# Chess Intelligence

Implement and improve

- Stockfish
- Evaluation bar
- Best move suggestions
- Opening recognition
- Opening explorer
- Move accuracy
- Mistakes & blunders
- AI Coach
- Learn Mode
- Daily Puzzle
- Puzzle Rush

---

# Player Features

Support

- Authentication
- Profiles
- Avatar
- Elo rating
- Statistics
- Match history
- Friends
- Clubs
- Leaderboards
- Achievements
- Notifications
- Cloud sync

---

# Community

Support

- Public games
- Live spectators
- Presence
- Chat with moderation
- Shareable game links
- Comments
- Tournaments

---

# Security

Review every change for security.

Implement

- Secure authentication
- Protected routes
- Secure sessions
- RBAC
- Input validation
- Sanitization
- XSS prevention
- CSRF protection
- Injection protection
- Secure WebRTC/WebSocket communication
- Rate limiting
- Abuse protection
- Secret management
- HTTPS
- Audit logging
- Error logging

Never expose credentials.

Never trust client input.

---

# Performance

Target

- Lighthouse >95
- Fast startup
- Lazy loading
- Code splitting
- Efficient rendering
- Stable multiplayer synchronization
- Optimized bundle size

---

# Accessibility

Meet WCAG AA.

Support

- Keyboard navigation
- Focus management
- Screen readers
- High contrast
- Reduced motion

---

# Engineering Standards

Always write

- Strict TypeScript
- Clean Architecture
- SOLID principles
- Reusable components
- Modular folder structure
- Small focused functions
- Clear naming
- Production-quality code

Remove

- Dead code
- Duplicate code
- Unused dependencies

---

# Production Requirements

This application must be usable by real users worldwide.

Requirements

- Production deployment on Vercel
- Automatic GitHub deployments
- Production database
- Production authentication
- HTTPS
- Cross-browser compatibility
- Mobile-first
- PWA
- CDN-ready assets
- SEO optimization

Never consider the project complete until it works in production.

---

# Documentation

Maintain

- README.md
- CHANGELOG.md
- ARCHITECTURE.md
- API.md
- DEPLOYMENT.md

Keep documentation synchronized with implementation.

---

# Quality Gate

Before finishing, verify

- Build succeeds
- No runtime errors
- No lint errors
- Multiplayer stable
- Security review passed
- Responsive
- Accessible
- Production deployment verified

---

# Final Review

Review the project as if performing a Senior Engineer code review for a top product company.

Identify and fix every high-impact issue in:

- UI
- UX
- Performance
- Security
- Accessibility
- Scalability
- Reliability
- Maintainability
- Multiplayer synchronization

Repeat until no significant improvements remain.

Provide

- Summary
- Features completed
- Files changed
- GitHub commits
- Deployment URL
- Remaining recommendations