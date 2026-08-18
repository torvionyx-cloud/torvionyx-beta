# Torvionyx Design System

Torvionyx is an AI-powered proposal-generation platform for UK freelancers and consultants ("Pitchwright" internally). It turns a rough brief into a branded, send-ready proposal in under two minutes, tracks whether the client opens and accepts it, and rolls that into revenue-you-can-see-coming for people who run their whole business solo.

**Core product:** a Next.js (App Router) web app — marketing/sign-up page → dashboard (proposals, analytics, brand settings) → AI generation → public client-facing proposal link → accept flow. Auth via Clerk, data in Supabase, generation via Anthropic Claude server-side.

**Sources used to build this system:**
- Local codebase `torvionyx-fresh/` (Next.js app — components, CSS, copy docs). Not guaranteed to be attached for future readers; re-mount it via Import to go deeper.
- GitHub repo [`torvionyx-cloud/torvionyx-beta`](https://github.com/torvionyx-cloud/torvionyx-beta) (branch `main`) — mirror of the same app, useful if the local mount isn't available. See `github.md` for sync details.
- Uploaded brand mark: `uploads/logo.png`.
- A written brand colour brief (navy/gold system, reproduced in `tokens/colors.css`).

Explore both sources further for anything this system doesn't cover — API routes, Supabase schema, the AI prompt/scoring logic in `src/lib/`, etc.

## Components
Grouped by concern under `components/`:
- **Core** — `Button`, `Badge`, `Card`, `StatCard`, `Logo`
- **Forms** — `Input`, `Textarea`, `Toggle`, `ColorSwatch`
- **Navigation** — `NavLink`
- **Feedback** — `ProgressBar`, `Avatar`

These were extracted from the app's real, repeated inline-style patterns (the codebase has no separate component library — every screen hand-rolls its own `style={{...}}` objects) rather than invented from a generic UI-kit checklist. No dialogs, toasts, tabs, or tooltips exist in the product, so none are included here.

**Intentional additions:** none beyond what's listed — every component above has a direct counterpart in the shipped app.

## UI Kit
`ui_kits/torvionyx-app/` — an interactive click-through of the dashboard shell (Proposals home, Analytics, Branding, New-proposal intake, toggle light/dark), plus the marketing sign-up split-screen (`Landing.html`) and the client-facing public proposal page with its accept flow (`PublicProposal.html`).

## Index
- `styles.css` — import entrypoint (tokens + fonts)
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `fonts.css`
- `components/` — see above
- `ui_kits/torvionyx-app/` — dashboard, landing, public proposal
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand groups in the Design System tab)
- `assets/` — logo files
- `SKILL.md` — portable skill file for Claude Code

---

## Content fundamentals

**Voice:** direct, second-person, momentum-focused. Torvionyx talks to "you" — the freelancer — never "our users." Sentences are short and concrete rather than abstract ("You've just had a great call... now you face 2–4 hours of proposal writing"). No corporate hedging.

**Tone:** confident, a little brisk, practical. Copy names the pain plainly (the docs literally call it "The Proposal Trap") and then moves straight to the mechanism ("Step 1: Paste your brief. Step 2: Hit Generate."). Numbers do a lot of the persuading: "60 seconds," "under 2 minutes," "2–4 hours."

**Casing:** sentence case throughout for headings and buttons ("Start free," not "Start Free" — though the landing copy doc itself sometimes title-cases CTAs; the shipped UI uses sentence case). Section eyebrows are uppercase mono with wide letter-spacing ("PROPOSAL OS FOR FREELANCERS").

**Emoji:** used sparingly as small inline flourishes in bulleted benefit lists in the *marketing copy doc* (⚡ 🎨 💪 📊 🔐 💰) — but the actual shipped UI (dashboard, forms, proposal renderer) uses no emoji at all, only line-icon SVGs. Prefer no emoji in interface copy; emoji are a marketing-copy-only accent, not a UI pattern.

**FAQ voice:** conversational and honest rather than sales-y — "Good enough that most proposals need only light editing," "No. It's a proposal. For binding contracts, use a qualified e-signature tool." The product is upfront about its own limits.

**Numbers/currency:** GBP-first (£), `en-GB` date formatting (`23 April` not `April 23`), VAT-aware. Reflects the UK-freelancer target audience explicitly.

## Visual foundations

**Palette:** dark navy + warm gold, described by the brand as "confident and premium, not corporate-cold or startup-bright." Four-step navy scale (`#0A1322` → `#0C1A2E` → `#0F1F3D` → `#132543`) darkest-to-lightest; the sidebar is *always* `#0C1A2E` regardless of light/dark mode — the one fixed anchor across both themes. Gold (`#DCAA33` primary action colour, `#F2C84E` bright/hover) is an accent only — never a large fill. Off-white `#FAF2E8` (not pure white) is the warm neutral for text-on-navy and the light-mode page background. Status colours (`#5FD08A` success, `#F2A93B` warning, `#F2635C` error, `#3DB9C9` info) are strictly functional — reserved for proposal lifecycle states (sent/viewed/accepted/declined), never used decoratively elsewhere.

**Type:** three-font system. **Space Grotesk** (display) for headings, big figures, and button labels — confident, geometric, slightly technical. **Inter** (body) for all UI copy, form labels, and paragraph text. **JetBrains Mono** for eyebrows, section labels, KPI captions and stat deltas — always uppercase with wide tracking (`.14–.24em`) when used as a label. Separately, the *proposal renderer* lets each freelancer pick their own proposal-facing display font from six options (Space Grotesk, Inter, DM Sans, Playfair Display, Libre Baskerville, Bricolage Grotesque) — this is a brand-customization feature for the end client's proposals, not the app's own UI type system.

**Backgrounds:** flat navy gradients on the marketing hero (`radial-gradient` from a lighter navy centre to the darkest corner) with a faint 64px grid-line texture overlay (2.5% opacity) — the only "texture" in the system. No photography, no hand-drawn illustration, no repeating pattern beyond that grid. The hero also has a live, slowly-rotating 3D icosahedron (three.js) in brand navy/gold as an ambient background element — the system's one piece of generative/3D visual interest.

**Animation:** subtle and functional, never bouncy. CSS transitions are short (`.18s–.35s`) on color/background/transform; buttons lift `translateY(-2px)` on hover, never scale/shrink. Numbers count up on the landing page (GSAP, `power2.out`, ~1.4–1.6s) and chart lines draw in via stroke-dashoffset. Respects `prefers-reduced-motion` throughout (motion is fully disabled, not just shortened). No page-transition choreography — screens are server-rendered and swap directly.

**Hover / press states:** hover = lighter background wash or a 2px lift + stronger shadow (never a color-invert). Press states aren't heavily styled — mostly the browser default plus disabled/loading opacity (~0.5–0.6) during async actions (saving, generating, submitting).

**Borders & dividers:** hairline, low-opacity (`rgba(text,.08–.16)`), never a heavy or colored rule. No colored left-border accent cards anywhere in the product.

**Shadows:** one soft, wide, low-opacity panel shadow used everywhere elevation is needed — `0 24px 50px -28px rgba(0,0,0,.12)` in light mode, `rgba(0,0,0,.7)` in dark. No hard drop shadows, no colored glows except the gold CTA button's soft gold shadow.

**Corner radii:** small on inputs/buttons (10–12px), larger on cards/panels (14–16px), full pill on status badges and toggles. Consistent scale, no sharp corners anywhere in the UI.

**Transparency & blur:** used for panel surfaces in dark mode (`rgba` navy panels at ~45% opacity) and the marketing hero's cards (`backdrop-filter: blur(14px)` over the 3D scene) — blur is reserved for surfaces that sit over the animated hero background, not used generally.

**Layout:** sidebar is fixed-width (220px), always navy, always present on desktop; collapses to a slide-in drawer on mobile. Topbar is sticky. Content areas use CSS grid with explicit gaps, never manual margin-spacing between siblings.

**Imagery:** the product has no photography or illustration in its own UI — imagery only ever appears as a user-uploaded logo in the proposal header. No stock photo aesthetic to speak of.

## Iconography

Every icon in the shipped app is a **hand-drawn inline SVG**, `stroke="currentColor"`, `strokeWidth="1.8–2.2"`, `strokeLinecap="round"`, in the Feather/Lucide style family (thin-line, rounded joints, 24×24 viewBox, no fill) — but authored directly in each component rather than pulled from an icon package. No icon font, no PNG icon set, no emoji-as-icon anywhere in the product UI. This design system substitutes the closest CDN match — **Lucide** (same stroke weight and style) — for any *new* icons a consumer needs beyond the ones already copied from source; note this substitution when it happens. Copied source icons (proposals/analytics/brand/settings nav glyphs, theme sun/moon, hamburger/close, checkmark, etc.) are preserved as-is in the UI kit files rather than re-drawn.

## Caveats & next steps

- **Fonts are loaded from Google Fonts CDN** (matching how the source app itself loads them — no self-hosted font files exist in the source, so none were substituted). If you'd like these self-hosted instead, share the `.woff2` files and I'll wire up local `@font-face` rules.
- The component set reflects real, repeated UI patterns in the app rather than a pre-existing component library (the source has none) — if there's a formal internal Figma library I don't have access to, share it and I can reconcile names/props against it.
- I built one UI kit covering the dashboard shell, marketing sign-up, and public proposal page. I did not build the full proposal editor (`ProposalEditorClient`) or the scoring coach panel (`ProposalScorePanel`) as standalone screens — flag if you'd like those added next.
- `logo-teal-navy.svg` in the source repo appears to be an old/unused mark (teal gradient, different shape) — I used the current navy/gold diamond mark from `uploads/logo.png` and the app's own `TorvionyxLogo.tsx` instead, since that's what's actually rendered in the product today. Let me know if that old file should be resurrected for a specific reason.

**I'd love your help iterating this to perfection** — tell me if the component inventory misses something real, if any hex values or spacing drifted from the actual app, or if there's a screen you want added to the UI kit next.
