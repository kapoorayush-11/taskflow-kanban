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
All app state lives in `src/context/AppContext.tsx` via a single `useReducer`. Every mutation dispatches an action and the effect writes the full state to `localStorage` under key `kanban_app_v1` as `{ projects: Project[], tasks: Task[] }`. `activeProjectId` is intentionally NOT persisted — it resets to the first project on load.

A `loaded` boolean guards the save effect so it never runs on the initial empty state before `INIT` has fired, preventing accidental localStorage overwrites on mount.

### Theme System
`src/context/ThemeContext.tsx` toggles a `dark` class on `document.documentElement`. Tailwind's `darkMode: 'class'` strategy picks this up. Theme is saved to `localStorage` under `kanban_theme` and auto-detects system preference on first visit. The toggle button lives in `Header.tsx`.

### Drag and Drop
`src/hooks/useKanbanDnd.ts` owns all `@dnd-kit` wiring. Key decisions:
- `PointerSensor` with `distance: 5` activation — prevents accidental drag on card click
- `closestCorners` collision detection — handles dropping onto empty columns (closestCenter fails there)
- `onDragOver` does an **optimistic** `MOVE_TASK` dispatch when a card crosses column boundaries for live feedback
- `onDragEnd` commits the final sort order via `REORDER_TASKS`
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
