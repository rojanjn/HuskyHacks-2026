<div align="center">

<img src="https://img.shields.io/badge/SayWhat-Translation%20App-1e4db7?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyek0xMSAxN3YtNkg3bDUtOHY2aDRsLTUgOHoiLz48L3N2Zz4=" alt="SayWhat" />

# SayWhat 🤖

### *Translate words. Understand meaning.*

**Built for children of immigrants navigating high-stakes situations — medical, legal, school — where a mistranslation isn't just confusing, it's dangerous.**

[![Made with Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Express%205-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

<!-- [Demo](#demo) · [Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [API Reference](#api-reference)
-->
</div>

---

## The Problem

When a 12-year-old translates for their parent at a doctor's office, they're not just bridging a language gap — they're carrying the full weight of that conversation. A word-for-word translation of *"it's just a little blood"* misses the urgency. A literal reading of *"you have the right to remain silent"* misses the gravity.

**SayWhat** goes beyond translation. It delivers the *literal meaning* and the *contextual meaning* — so the person doing the translating actually understands what they're saying.

---

## Features

- 🌍 **Dual Translation** — Every phrase gets two outputs: what it literally says, and what it actually *means* in context
- 🎭 **Tone Detection** — Flags whether language is formal, casual, aggressive, sarcastic, affectionate, or humorous
- 🗣️ **Slang & Figurative Breakdown** — Identifies idioms, slang, and figurative language with plain-language explanations
- 📚 **Cultural Notes** — Surfaces cultural context that changes how a phrase should be understood
- 🔁 **Natural Equivalent** — Gives the closest natural phrasing in the target language
- 🎤 **Voice Input** — Speak directly into the app via Web Speech API
- 🏥 **Context Modes** — Medical, Legal, School, Business, Casual, Tech — each tuning the AI's register awareness
- 📖 **Translation History** — Full log of past translations, persisted to PostgreSQL
- 🤖 **Animated Robot Mascot** — A friendly guide that reacts to what's happening in the app

---

## Demo

> *Coming soon — screenshot / video walkthrough*

<div align="center">
<img width="700" alt="SayWhat UI showing dual translation cards for a medical phrase" src="./docs/screenshot.png" />
</div>

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion, shadcn/ui |
| Backend | Express 5, TypeScript |
| AI | Google Gemini API |
| Database | PostgreSQL + Drizzle ORM |
| Monorepo | pnpm workspaces |
| Voice | Web Speech API |

---

## Project Structure

```
saywhat/
├── artifacts/
│   ├── slangsense/          # React frontend (Vite + Tailwind)
│   │   └── src/
│   │       └── components/
│   │           └── workspace/
│   │               └── MainWorkspace.tsx
│   └── api-server/          # Express 5 backend
│       └── src/
│           └── routes/
│               └── translate/
│                   └── index.ts
├── lib/
│   ├── api-client-react/    # Generated React Query hooks
│   └── db/                  # Drizzle schema + migrations
├── tsconfig.base.json
└── pnpm-workspace.yaml
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A [Google Gemini API key](https://aistudio.google.com/) (free)
- A PostgreSQL database — [Neon.tech](https://neon.tech) works great (free tier)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/saywhat.git
cd saywhat
pnpm install --ignore-scripts
```

### 2. Configure Environment

Create `artifacts/api-server/.env`:

```env
PORT=8080
NODE_ENV=development
AI_INTEGRATIONS_GEMINI_BASE_URL=https://generativelanguage.googleapis.com
AI_INTEGRATIONS_GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=your_postgres_connection_string_here
```

### 3. Set Up the Database

```bash
pnpm --filter @workspace/db run push
```

### 4. Start the API Server

```bash
cd artifacts/api-server
pnpm run build
pnpm run start
```

API runs on `http://localhost:8080`

### 5. Start the Frontend

```bash
# From project root
pnpm --filter @workspace/slangsense run dev
```

Frontend runs on `http://localhost:23279`

---

### Windows Users

Use PowerShell to set environment variables before starting the server:

```powershell
$env:PORT="8080"
$env:NODE_ENV="development"
$env:AI_INTEGRATIONS_GEMINI_BASE_URL="https://generativelanguage.googleapis.com"
$env:AI_INTEGRATIONS_GEMINI_API_KEY="your_key"
$env:DATABASE_URL="your_postgres_url"
pnpm run start
```

---

## API Reference

### `POST /api/translate`

Translate text with full contextual analysis.

**Request body:**
```json
{
  "text": "It's not a big deal",
  "sourceLanguage": "auto",
  "targetLanguage": "Indonesian",
  "register": "casual"
}
```

**Response:**
```json
{
  "literal_translation": "Ini bukan masalah besar",
  "contextual_meaning": "The speaker is downplaying the severity of a situation — often used to reassure, but can also minimize real concerns.",
  "slang_breakdown": [],
  "tone": "casual",
  "cultural_notes": "In many Indonesian contexts, directly saying something 'is not a big deal' can come across as dismissive.",
  "equivalent_phrase": "Santai saja",
  "detected_language": "English"
}
```

**Register values:** `formal` | `casual` | `slang` | `street` | `internet`

---

### `GET /api/translate/history`

Returns all past translations, newest first.

---

### `GET /api/translate/examples`

Returns example phrases to help users get started.

---

## The Story

SayWhat was built at a hackathon with one specific user in mind: a kid who's been pulled out of class to translate for their parent at the hospital. That kid deserves more than Google Translate. They deserve to understand *what they're actually saying* — the weight of it, the tone of it, the cultural subtext of it.

---

## License

MIT

---

<div align="center">

Made with ❤️ at a hackathon

*SayWhat — because words matter, and so does what they mean.*

</div>
