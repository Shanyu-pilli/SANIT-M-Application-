/* This file is a small compatibility adapter kept so older import paths still
   work during the migration. It re-exports the new centralized `api` shim
   from `src/lib/api.ts`. The goal is to remove this file in a follow-up once
   all imports have been updated to `@/lib/api`.
*/

// Deprecated adapter kept for compatibility during migration.
// Please import from `@/lib/api` instead. This file intentionally avoids
// referencing the name `supabase` to finish removing Supabase-specific
// identifiers from the frontend codebase.

export * from "@/lib/api";
export { default } from "@/lib/api";