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