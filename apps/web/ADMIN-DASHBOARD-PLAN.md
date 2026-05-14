# Admin Dashboard — 100% Completion Plan

## Phase 1: Fix Critical Bugs ✅
- [x] Fix messages API schema (`content` -> `message_text`, add `recipient_id`)
- [x] Fix hardcoded admin UUID in assign/reassign routes
- [x] Fix metadata in layout.tsx
- [x] Fix CORS for production origins
- [x] Add logout functionality in topbar dropdown
- [x] Fix sidebar route collision (jobs/job-queue)
- [x] Fix module-level supabase client in messages page

## Phase 2: Add Missing UI Components ✅
- [x] DropdownMenu (for topbar user menu)
- [x] Toast/Sonner (notifications)
- [x] Skeleton (loading states)
- [x] Switch (settings toggles)
- [x] Sheet (detail panels)
- [x] Tooltip
- [x] Separator
- [x] Progress
- [x] Alert

## Phase 3: Implement Missing Features ✅
- [x] Settings page (system mode, notifications, security tabs + API)
- [x] Job detail view/sheet with edit, cancel, reassign
- [x] Engineer detail view with assignment history, current jobs
- [x] Customer detail view with job history, contact
- [x] Reassign UI on jobs page
- [x] Create job from accepted custom service request

## Phase 4: Toast System, Skeletons, Pagination ✅
- [x] Replace all `alert()` calls with toasts
- [x] Add loading skeletons to all pages
- [x] Add pagination to jobs, engineers, customers tables

## Phase 5: Technical Debt Cleanup ✅
- [x] Remove dead code in admin-data.ts (unused functions)
- [x] Fix dialog component (was a stub)
- [x] Fix label component (unused className)
- [x] Add env var validation
- [x] Add missing package scripts (seed, typecheck, lint:fix)

## Phase 6: Mobile API Routes + Realtime ✅
- [x] PUT /api/customers/[id] - update customer profile
- [x] Add Realtime subscriptions for messages in admin dashboard

## Phase 7: Polish ✅
- [x] Add charts/visualizations to dashboard (job status bar chart)
- [x] Dark mode toggle in topbar
- [x] Seed scripts integration (npm run seed)
