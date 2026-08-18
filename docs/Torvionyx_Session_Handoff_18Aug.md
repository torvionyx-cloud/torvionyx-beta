# Torvionyx — Session Handoff
**Timestamp:** Tuesday, 18 August 2026 — 17:50 UTC (~13:50 local, given earlier Terminal timestamps)

---

## Where things stand right now — unresolved

**Currently mid-task:** verifying `npm run build` after a simple revert (removing temporary diagnostic logging from `src/app/dashboard/knowledge/page.tsx`, restoring the original two-line `if (...) throw new Error(...)` pattern). No logic changed. This should be a clean, fast build.

**Immediate next step when the new chat starts:** paste the result of that `npm run build` — either it finished cleanly (proceed to commit/push per the pattern below), or it's still hanging (see "Known issue" below — try a full Mac restart next, not just Terminal).

**Not yet committed/pushed:** the revert itself. Nothing should be lost — it's a pure deletion of debug logging.

---

## What shipped today — confirmed working, built, pushed, deployed

1. **Knowledge → Rate Card** (`/dashboard/knowledge` — "Rate card" tab)
   - Add, inline edit, delete, empty state
   - Table: `rate_card` (migration `0005_add_rate_card.sql`)
   - Fixed a pre-existing production bug in the process (see below)

2. **Knowledge → Projects** (`/dashboard/knowledge` — "Projects" tab, default)
   - Add/edit via slide-over panel, delete from panel footer, empty state, responsive card grid
   - Table: `projects` (migration `0006_add_projects.sql`)
   - Image upload deliberately deferred — placeholder in the form says "Image upload coming next"
   - Knowledge restructured from two separate pages into one tabbed page (`/dashboard/knowledge/rates` now redirects)

3. **Bug fixed — tab-switching data "disappearing"**
   - Real cause: each tab kept its own `useState` seeded once on mount; switching tabs unmounted/remounted and re-seeded from stale initial props
   - Fix: state lifted to `KnowledgeTabs`, both panels kept mounted (CSS `display:none` toggle instead of ternary unmount), single source of truth per list
   - Verified fixed and confirmed via Supabase MCP query — **no data was ever actually lost at any point today**, this was purely a display bug

4. **Bug fixed — production environment variable**
   - `NEXT_PUBLIC_SUPABASE_URL` had `/rest/v1/` incorrectly appended in both `.env.local` and Vercel's Production environment, causing every dashboard page to fail/hang
   - Fixed in both places; production redeployed and verified working

---

## Known issue — NOT resolved, informational only, not a code bug

**Sandbox stalls (3 occurrences today):** Claude Code's own background shell environment has repeatedly hung for extended periods (7–20+ minutes, near-zero CPU) when trying to run `npm run dev`, `npm run build`, `tsc --noEmit`, or even plain `git status`. Diagnosed as sandbox/environment flakiness, not a code problem — confirmed by the fact that identical commands run cleanly in the user's own Terminal.

**Established working pattern going forward:**
- Claude Code should NOT run builds/dev servers itself for verification — user runs them in their own Terminal, always
- If a build/command hangs with zero new output for 5+ minutes, treat as stalled — `Ctrl+C`, retry
- If it stalls a 4th time even in a fresh Terminal window, next step is a full Mac restart, not just closing Terminal

**Separately, one genuine one-off:** a single 401 auth error + ~450s hang on `/dashboard/knowledge` mid-session, traced to a Clerk token-fetch stall (network-level, not code/database). Occurred once in the entire session; requests immediately before and after succeeded normally. Confirmed via Supabase edge logs — not treated as a recurring bug, logged as a "watch for it" item, not actioned further today.

---

## Established workflow patterns (carry these into the new chat)

- **Terminal used throughout: macOS Terminal app** (not VS Code's terminal, not Claude Code's own execution)
- Working folder: `cd ~/Desktop/torvionyx-v2` — always confirm with `pwd` first
- Start Claude Code with `claude` from within that folder
- **After every change:** `npm run build` (user's own terminal, not Claude Code's) → if clean → `git add .` → `git commit -m "..."` → `git push`
- Production deploy: `vercel --prod --cwd ~/Desktop/torvionyx-v2`
- Verify every page by actually clicking through it in the browser after a clean build — compiling ≠ working
- When Claude Code proposes a multiple-choice decision (e.g. token naming, status colors), the user pastes it here for a recommendation before choosing
- Diagnose before fixing: when a bug appears, check the database directly (Supabase MCP) for real evidence before assuming cause — this pattern caught and correctly resolved two false alarms today

---

## Project context (for a fresh chat with no prior memory)

- **Product:** Torvionyx, pivoting from a freelancer proposal tool to a fee-proposal platform for UK RIBA-registered architecture practices (2–15 staff)
- **Simplified build plan in effect:** five core deliverables only — scope library, rate card + fee engine, saved projects, stage scope/fee table blocks, live client link. Multi-user/team accounts deliberately deferred to February 2027.
- **Target paid launch:** originally 18 January 2027; user has limited time (full-time job, evenings + occasional full days) so pace is realistic, not full-time-founder speed
- **Stack:** Next.js 14.2.35, Clerk auth, Supabase (Postgres, project `kjgrijqrbiikguovshtc`, eu-west-1), Vercel hosting, Anthropic API
- **Design system:** navy `#0C1A2E` sidebar (always, both light/dark), gold `#DCAA33`→`#F2C84E` gradient accents, Space Grotesk headings, Inter body, IBM Plex Mono labels — tokens now in `globals.css` as `--tv-*` variables (existing convention, extended today, not replaced)
- **Repo:** `torvionyx-cloud/torvionyx-beta` on GitHub

**Full context files exist from earlier sessions** (verticalisation strategy, 22-week build calendar, system map, Claude Code build spec, interview question set) — reference these if the new chat needs deeper background than this handoff provides.

---

## Next up after today's build is confirmed clean

**Knowledge → Scope Library** — the third tab. Different shape from the other two (a matrix/grid of RIBA stage × project type, not a card grid or simple table), so treat as its own build rather than assuming the same pattern applies directly.
