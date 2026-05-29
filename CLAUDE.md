# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://127.0.0.1:5173
npm run build     # Type-check + production build (tsc && vite build)
npm run preview   # Serve the production build locally
```

There are no tests or linter configured. Type-check only runs as part of `build`.

## Node Version Constraint

This project runs on **Node 16**. Do not upgrade Vite past 4.x (requires Node 18+) or Tailwind past 3.x (v4 requires `@tailwindcss/vite` which needs Vite 5+). Tailwind is configured via `tailwind.config.js` with PostCSS — not the v4 CSS-based approach.

## Architecture

### State & Persistence
All app state lives in `src/context/AppContext.tsx` via a single `useReducer`. The actions are **generic and id-keyed** — `HYDRATE`, `UPSERT_PROJECT` / `REMOVE_PROJECT`, `UPSERT_TASKS` / `REMOVE_TASK`, `SET_ACTIVE_PROJECT`. Mutation methods (`createTask`, `moveTask`, …) build the *full* record themselves (id, timestamps, contiguous `order`), dispatch it locally for an optimistic update, **and** write it to the backend. Because state is keyed by id, an optimistic write and the realtime echo of that same row reconcile idempotently — no duplicates.

Persistence is **dual-mode** (see Backend below): with Supabase configured the cloud DB is the source of truth; otherwise the full state is saved to `localStorage` under key `kanban_app_v1` as `{ projects, tasks }`. The save effect is gated by `if (!loaded || supabase) return`, so it runs only in fallback mode and never overwrites on the initial empty mount (`loaded` flips true after `HYDRATE`). `activeProjectId` is never persisted — it resets to the first project on load.

Mutation callbacks are stable (`useCallback` with `[]` deps) and read the latest state through a `stateRef` mirror, so they don't churn the DnD hook's memoized handlers.

### Backend (Supabase)
`src/lib/supabase.ts` builds the client from `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. If either is missing, `supabase` is `null` and `isSupabaseEnabled` is `false`, and the app silently falls back to localStorage — so it builds and runs with no backend. **These are Vite build-time vars**, baked into the bundle, so they must exist at build time: a local `.env` (gitignored; `.env.example` is the template) and Vercel's Environment Variables for the deployed build. The anon key is public by design — access is governed by Row Level Security, not by hiding the key.

When enabled, `AppContext` hydrates from Supabase on mount and opens a realtime channel; `postgres_changes` events dispatch the same generic `UPSERT_*` / `REMOVE_*` actions, so other users' edits stream in live. Each mutation method also fires a fire-and-forget write (`.then(logWrite(...))`, never awaited — a failed sync logs to console but can't block the UI).

DB columns are snake_case; `toRow`/`fromRow` in `supabase.ts` map them to the camelCase app types — note `order` → `sort_order` (reserved word), and timestamps + `due_date` are stored as `text` for exact round-trip. The schema, **permissive demo RLS policies (anon full access — demo-grade, not production-secure)**, and the realtime publication live in `supabase/schema.sql`; run it once in the Supabase SQL editor. The Header shows a Live/Local badge driven by `isSupabaseEnabled`.

### Theme System
`src/context/ThemeContext.tsx` toggles a `dark` class on `document.documentElement`. Tailwind's `darkMode: 'class'` strategy picks this up. Theme is saved to `localStorage` under `kanban_theme` and auto-detects system preference on first visit. The toggle button lives in `Header.tsx`.

### Drag and Drop
`src/hooks/useKanbanDnd.ts` owns all `@dnd-kit` wiring. Key decisions:
- `PointerSensor` with `distance: 5` activation — prevents accidental drag on card click
- `closestCorners` collision detection — handles dropping onto empty columns (closestCenter fails there)
- `onDragOver` calls `moveTask` only when a card **crosses** a column boundary (a few times per drag, not continuously) — it optimistically reindexes the destination column locally and upserts those rows to the backend
- `onDragEnd` calls `reorderTasks` to commit the final within-column order (also persisted)
- Column droppable IDs are the `ColumnId` string literals (`'todo'`, `'in-progress'`, `'done'`); task sortable IDs are UUIDs — they must stay distinguishable

### Task Ordering
Tasks have an integer `order` field scoped to `(projectId, columnId)`. After any reorder, contiguous integers are reassigned to all affected tasks. This avoids float gaps and keeps sorting deterministic.

### Views & Navigation
`App.tsx` holds a local `view: AppView` state (`'board' | 'analytics'`) — UI navigation only, so it is NOT persisted (same rationale as `activeProjectId`). The sidebar "Workload" item switches to analytics; clicking any project returns to its board. `Header.tsx` branches on `view` for its title/subtitle and hides "Add Task" in analytics.

### Workload Analytics
`src/utils/analytics.ts` is a **pure** module (`computeWorkloadAnalytics(tasks, projects, now)`) consumed via the `useWorkloadAnalytics` hook (which supplies `new Date()` and memoizes on tasks/projects). Components live in `src/components/analytics/`. Two derived models, both deliberately heuristic and explained inline in the dashboard's methodology footnote:
- **Capacity** — a member's load is the priority-weighted sum of their *active* (non-done) tasks (`PRIORITY_WEIGHTS`: urgent 5, high 3, medium 2, low 1), bucketed by `CAPACITY_THRESHOLDS` into available / balanced / overloaded. Empty assignees aggregate into a synthetic "Unassigned" bucket that is never classified as over/under capacity.
- **Due-date risk** — "typical" completion time is the **median** `updatedAt − createdAt` of *done* tasks of the same priority (falling back to the overall median, then `DEFAULT_DURATIONS` when there's no history; confidence tracks the sample). A task is projected late when its remaining estimate exceeds the days until its due date. NOTE: `updatedAt` is the only completion signal in the data model — there is no dedicated `completedAt`, so later edits to a done card can inflate its measured duration.

View-model types (`TaskRisk`, `MemberWorkload`, etc.) live in `analytics.ts`; the shared union types (`AppView`, `WorkloadStatus`, `RiskLevel`, `RiskConfidence`) live in `src/types/index.ts` so `constants/index.ts` can reference them without a circular import.

### JSX Runtime
`tsconfig` uses `"jsx": "react-jsx"` (automatic runtime) with `noUnusedLocals`, so a bare `import React from 'react'` is a build error (TS6133) when `React` isn't referenced. Do not add it — import only the named hooks/types you actually use.

## Styling

Always use Tailwind utility classes for styling. The only exception is **dynamic project colors** — these are user-chosen hex strings known only at runtime and cannot be expressed as Tailwind classes, so they use inline `style={{ borderColor: project.color }}`. The 8 palette options are in `src/constants/index.ts`. Everything else — spacing, colors, typography, layout — must use Tailwind.

### Constants as Class Strings
`PRIORITY_META` and `COLUMN_META` in `src/constants/index.ts` store Tailwind class strings (including `dark:` variants). These drive badge and column header rendering throughout the app. When adding new visual states, add them here rather than hardcoding in components.
