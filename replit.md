# Code Red FRC 2026 Scout

## Overview

A full-stack FRC 2026 scouting application for Code Red Robotics (Team #2771). Built as a pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + Shadcn UI + Framer Motion
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## App Features

- **Match Scouting** — 4-page wizard with live match timer: Pre-Match, Auto, Teleop, Post-Match
  - Scouter name, team #, match #, starting position (A-E)
  - Shooting cycle tracking (start/stop with timestamps)
  - Climbing tracking (location, level, success)
  - Defense played/rating, comments
- **Pit Scouting** — Embedded Google Form
- **Human Player Scouting** — Shot counter per match with alliance tracking
- **Data Viewer** — Tabbed view of all match and HP entries from the database

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── frc-scout/          # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── matchEntries.ts  # Match scouting table
│           └── hpEntries.ts     # Human player scouting table
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## API Endpoints

- `GET /api/match-entries` — Fetch all match scouting entries
- `POST /api/match-entries` — Submit a match scouting entry
- `DELETE /api/match-entries/:id` — Delete a match entry
- `GET /api/hp-entries` — Fetch all human player entries
- `POST /api/hp-entries` — Submit a human player entry
- `DELETE /api/hp-entries/:id` — Delete an HP entry

## Development

- `pnpm --filter @workspace/frc-scout run dev` — Start frontend dev server
- `pnpm --filter @workspace/api-server run dev` — Start API server
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API client from OpenAPI spec
- `pnpm --filter @workspace/db run push` — Push schema changes to DB
