# Torvionyx — Resume Note (15 August 2026)

_Production: **https://torvionyx.vercel.app/**_
_Active working folder: **~/Desktop/torvionyx-v2**_
_Deploy command: `vercel --prod --cwd ~/Desktop/torvionyx-v2`_
_GitHub: `https://github.com/torvionyx-cloud/torvionyx-beta`_

---

## 🔴 CRITICAL CONTEXT — Folder History

The project has gone through several folder iterations due to file corruption events caused by force-killing Claude Code mid-process:

- `torvionyx-beta` — original, scrapped (corrupted node_modules)
- `torvionyx-fresh` — rebuilt, then suffered catastrophic null-byte corruption to nearly all src/ files
- `torvionyx-v2` — **current active folder**, fresh clone from GitHub, rebuilt systematically

**Rules that must never be broken (hard-won lessons):**
- Never force-kill Claude Code mid-process — always wait or "Move to background"
- Always stop the dev server before building (they compete for file locks)
- Build after every single change, not batched
- Push to GitHub after every clean build

---

## ✅ Security — All Critical Items Closed

| Item | Status |
|------|--------|
| AUTH-01 — RLS at DB level | ✅ Fixed, proven with real second-account test |
| AUTH-02 — Public proposal anon leak | ✅ Fixed |
| AUTH-03 — Clerk lockout policy | ✅ Set to 5 attempts / 15 min in Clerk Dashboard → Protect → Rules |
| SEC-01 — Rate limiting fail-closed | ✅ Production fails closed if Upstash unavailable |
| SEC-02 — Trusted IP source | ✅ Uses x-real-ip over x-forwarded-for |
| SEC-03 — unsafe-eval in CSP | ✅ Removed |
| SEC-04 — IP hashing HMAC-SHA256 | ✅ Uses IP_HASH_SECRET env var |
| SEC-05 — /api/proposals/generate/dev | ✅ Route deleted entirely |
| AI-02 — Output sanitisation | ✅ .strict() on all block schemas |
| REL-01 — AI retry/fallback logic | ✅ 3 retries, 55s timeout, 503 on exhaustion |

**New env vars added to Vercel (Production + Preview only):**
- `IP_HASH_SECRET` — random 32-byte hex, HMAC key for IP hashing
- `CRON_SECRET` — random 32-byte hex, authenticates the retention cron job

---

## ✅ Features & Pages Built

| Page/Feature | Status |
|---|---|
| `/welcome` — full marketing landing page | ✅ Live |
| `/pricing` — four-tier pricing page | ✅ Live |
| `/dashboard/settings` — full account settings | ✅ Live |
| `/dashboard/new` — proposal creation with template selector | ✅ Live |
| `/sitemap.xml` + `/robots.txt` | ✅ Live |
| Retention job (`/api/cron/retention`) | ✅ Scheduled daily 03:00 UTC |
| 6 proposal template themes | ✅ In codebase via `src/lib/themes.ts` |
| Template selector on new proposal form | ✅ Live — 7 cards (custom + 6 named styles) |
| Public proposal page — fully theme-aware | ✅ Live |
| Test suite (Vitest) | ✅ 9 tests passing |

---

## 🟡 Welcome Page — Current State (Important)

The `/welcome` page has been significantly rebuilt to match Claude Design mockups. Current section order:

1. **Hero** — "Send a proposal before the lead goes cold." Left-aligned, two-column layout with ~2 min vs 2–3 hrs comparison card. Gold lightning bolt animation background + mouse-following dust trail.
2. **Research stats** — "Why a faster, sharper proposal wins." 6 stat cards (cream background). Colours: 23% navy, 41% gold, 75%+ bright gold, 204 hrs gold, 1 in 3 navy, 84% bright gold.
3. **Template intro + previews** — "Not templates in different colours. Completely different proposals." Dark navy intro band → cream band with 6 full proposal renders (Monochrome Editorial, Warm Studio, Midnight Premium, Corporate Confident, Gradient Creative, Developer Technical) displayed as a horizontal overlapping fan/deck.
4. **Proposal trap** — "The proposal trap / You've just had a great call."
5. **Four screens** — "Four screens. The whole business." (New proposal, Proposals, Analytics, Branding) — real UI mockup cards.
6. **After you hit send** — four status steps (Draft, Sent, Viewed, Accepted).
7. **Why freelancers win** — four feature cards on cream background.
8. **FAQ** — accordion
9. **Final CTA** — "Your next proposal could be out before the kettle boils."
10. **Footer**

**Remaining welcome page issues to fix next session:**
- Template deck (horizontal fan) — needs to cover 90% of section width, cards need to be larger vertically, no rotation (straight horizontal), more of each design visible. Prompt was written for this, Claude Code was mid-execution when this resume note was created.

---

## 🟡 What Was In Progress When This Note Was Created

Claude Code was executing a prompt to fix the template stack layout:

```
Update the template stack layout in src/app/welcome/page.tsx and welcome.css:
- Remove all rotation (rotate:0deg on all cards)
- Section container height: 600px
- Card width: 280px, height: 560px
- Spread 6 cards: left 0%, 14%, 28%, 42%, 56%, 70%
- z-index 1–6, rightmost on top
- Clip height: 520px
- .tv-template-stack: width 100%, max-width none
- Hover: translateY(-12px), z-index 10
- Outer section: min-height 680px, padding 48px 5%
```

**Check if this was committed and pushed before starting anything else:**
```bash
cd ~/Desktop/torvionyx-v2 && git log --oneline -5
```

If the commit "fix: template stack full-width horizontal layout, no rotation, taller cards" is there, it's done. If not, the change may be uncommitted in working tree — run `git status` and build/commit if needed.

---

## 🟡 Pre-Launch Checklist — Remaining Items

### External setup (no code needed)
1. **Buy custom domain** — check `torvionyx.app` or `.com` availability at porkbun.com (~£10–15/year)
2. **Configure domain on Vercel** — Settings → Domains
3. **Clerk Production migration** — needs domain first. Create Production instance, swap env vars, re-configure lockout policy (5 attempts / 15 min)
4. **Resend email setup** — sign up, verify domain, configure SPF/DKIM/DMARC, wire into notification code
5. **Virtual office address** — defer to October (~£15/mo, Hoxton Mix or UK Postbox)
6. **Privacy Policy publish** — needs: virtual address, working `privacy@torvionyx.app` email, solicitor review

### Code tasks remaining
7. **Test suite** — currently 9 passing tests (Vitest). Need: User B cannot read User A's data integration test with real credentials (currently skipped), broader coverage before public launch
8. **Stripe payment portal** — gates Rise/Strike/Reign plan tiers. Currently "Coming soon" in settings billing section

### Post-launch / tech debt
- Remove `@ts-nocheck` from files, enable strict TypeScript incrementally
- Rename `pitchwright` → `torvionyx` in `package.json` and rate-limit Redis key prefixes
- Delete `package-lock 2.json` duplicate (still in repo)
- Bundle analysis — `three.js` and GSAP both loaded, worth consolidating
- Implement the 6 proposal style templates as user-selectable options (UI exists in `/dashboard/new`, DB column exists, themes.ts exists — the actual generation prompt doesn't yet vary by template)

---

## 🧠 Technical Facts for Next Session

### Stack
- **Framework:** Next.js 14.2.35, App Router, `src/app/`
- **Auth:** Clerk v5 — uses `auth().protect()` (NOT v6 `await auth.protect()`)
- **DB:** Supabase — project `kjgrijqrbiikguovshtc` — uses `createServerClient()` for user routes, `createAdminClient()` only for webhook/cron routes
- **AI:** Anthropic SDK, model `claude-sonnet-4-6`
- **Rate limiting:** Upstash Redis — `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel (Production only)
- **Animation:** GSAP (welcome page), Three.js (homepage)
- **Test framework:** Vitest (`npm test`)

### Design system
- Navy: `#0A1322` (page bg), `#0C1A2E` (sidebar, always navy), `#0F1F3D` (panels), `#132543` (borders)
- Gold: `#DCAA33` (primary), `#F2C84E` (bright/hover)
- Off-white: `#FAF2E8`
- Status: `#5FD08A` (success), `#F2A93B` (warning), `#F2635C` (error), `#3DB9C9` (info)
- Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (labels/mono)
- All files start with `// @ts-nocheck`

### Key files
| File | Purpose |
|---|---|
| `src/lib/themes.ts` | 7 proposal theme definitions (custom, monochrome, warm_studio, midnight, corporate, gradient, developer) |
| `src/lib/validation.ts` | Zod schemas for all proposal block types — all .strict() |
| `src/lib/rate-limit.ts` | Rate limiting — x-real-ip preferred, fail-closed in production |
| `src/lib/hash.ts` | HMAC-SHA256 IP hashing using IP_HASH_SECRET |
| `src/app/api/proposals/generate/service.ts` | AI generation — 3 retries, 55s timeout |
| `src/app/welcome/page.tsx` | Main marketing landing page — 821+ lines |
| `src/app/welcome/welcome.css` | Welcome page animations and layout |
| `src/app/pricing/page.tsx` | Four-tier pricing page |
| `src/app/dashboard/settings/page.tsx` | Full account settings (Clerk-backed) |
| `src/app/sitemap.ts` | Auto-generated sitemap |
| `src/app/robots.ts` | Robots.txt — blocks dashboard/api/sign-in |
| `src/__tests__/` | Vitest test suite |
| `supabase/migrations/` | DB migrations — 0006_add_proposal_template.sql adds proposals.template + brand_settings.default_template |

### Business context
- **Goal:** Replace £2,140/month take-home income by December 2026
- **Target:** ~220–250 paying users at the current price mix
- **Plans:** Free (£0, 3 proposals, watermarked) / Rise (£12, 30 proposals) / Strike (£16, 45 proposals — most popular) / Reign (£20, 60 proposals, unlimited scores)
- **API cost per proposal:** ~2.3p (generation) + ~1.5p per coaching score
- **ICP:** UK freelancers and micro-teams who pitch on proposals

### Pricing economics (validated)
At 500 users (50% Rise / 35% Strike / 15% Reign):
- Monthly revenue: ~£7,300
- API costs: ~£418/month worst case
- Gross margin: ~82–87%
- Users needed to replace income (after tax): ~220–250

---

## Claude Design Setup

Brand brief has been created and loaded into Claude Design. Design system covers:
- Full colour palette (navy tonal scale, gold, off-white, status colours)
- Typography (Space Grotesk, Inter, JetBrains Mono)
- Logo (diamond gem SVG, navy body, gold bolt)
- UI component style (cards, buttons, inputs, nav)
- 6 proposal template styles with full design specs
- Social media asset format guidance (1080×1080, 1080×1920, 1200×627, 1200×675)

Claude Design is connected to Claude Code (local agent) for handoff of new designs.

---

## Entrepreneur Advisory Document

Created: `Torvionyx_Entrepreneur_Advisory_Questions.docx` — 6 sections, 33 questions with answer boxes covering: ownership/legal/structure, funding/finance, outreach/marketing, product/positioning, growth/scaling, mindset/mistakes. Available as a download from this conversation.

