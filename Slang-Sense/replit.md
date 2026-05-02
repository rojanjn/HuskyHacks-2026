# SlangSense

## Overview

SlangSense is a full-stack smart language and slang translation app powered by the Gemini AI API. It translates not just words, but meaning, cultural context, tone, and figurative language across any major language.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS
- **AI**: Gemini API via Replit AI Integrations (`gemini-3-flash-preview`)
- **Animations**: Framer Motion

## Artifacts

- **slangsense** (`/`) — Main React frontend (dark neon theme)
- **api-server** (`/api`) — Express backend with Gemini integration

## Features

- Multi-line text input with voice input (Web Speech API)
- Language selector: Auto-detect + 12 major languages
- Register/formality selector: Formal / Casual / Slang / Street / Internet
- Gemini-powered translation returning:
  - Literal translation
  - Contextual meaning
  - Slang breakdown (pills with tooltip explanations)
  - Tone analysis (color-coded badge)
  - Cultural notes (collapsible)
  - Natural equivalent phrase (with copy button)
- Translation history sidebar (last 10, from database)
- Example phrases from multiple languages
- Loading skeletons, smooth animations

## Database Tables

- `translations` — stores translation history (text, languages, register, result JSON, created_at)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## API Endpoints

- `POST /api/translate` — translate text with Gemini AI
- `GET /api/translate/history` — fetch last 10 translations
- `GET /api/translate/examples` — get sample phrases to try

## Environment Variables

- `AI_INTEGRATIONS_GEMINI_BASE_URL` — auto-set by Replit AI Integrations
- `AI_INTEGRATIONS_GEMINI_API_KEY` — auto-set by Replit AI Integrations
- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit DB)
