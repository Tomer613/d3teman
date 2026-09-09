# Project: d3teman (Synagogue Community Platform)

## Tech Stack
- Framework: Next.js 16 (App Router) with Turbopack
- Language: TypeScript
- Database: PostgreSQL (Supabase) via Prisma ORM (v6.x)
- Styling: Tailwind CSS
- External Integrations: Nedarim Plus Webhooks

## Coding Guidelines
- All comments in code MUST be in English only.
- Strict typing (TypeScript).
- Always use the singleton Prisma client from `@/lib/prisma`.

## Current State & Milestones
- Prisma 6 is configured with `directUrl` in `prisma/schema.prisma` and `.env`.
- Database schema pushed and in sync with Supabase:
  - `Member`
  - `Yahrzeit`
  - `JoinRequest`
  - `Transaction`
- Join request flow is fully operational end-to-end (`src/app/join-request` -> `submitJoinRequest` action -> Supabase).
- Admin dashboard logic is pending implementation in `src/app/admin/page.tsx` and `src/app/actions/admin.ts`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
