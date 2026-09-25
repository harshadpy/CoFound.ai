# CoFound.ai — UI Modernization Specification

**Audience:** AI coding assistant implementing changes directly in `harshadpy/cofound`, `frontend/` (React 19 + Vite 7 + Tailwind v3 + Zustand + Framer Motion + lucide-react).

**Purpose:** This is the single source of truth for modernizing CoFound.ai's UI. It is based on a direct audit of the current codebase (`Home.jsx`, `ActiveAnalysis.jsx`, `Report.jsx`, `Sidebar.jsx`, `Header.jsx`, `Layout.jsx`, `useStore.js`, `tailwind.config.js`, `index.css`) — not assumptions. Follow it as the implementation reference. Where a rule doesn't specify a value, prefer consistency with the rest of this document over inventing something new.

**Reference standard:** "Modern" here means the calm, information-dense, high-craft register of analyst/terminal tools (PitchBook, Linear, Raycast, Notion) — not a marketing-site aesthetic. CoFound.ai is a diligence tool people will use daily to read dense data; the UI should get out of the way of that.

---

## 0. Ground Truth: What's Actually in the Codebase Today

Read this section first — it's the diagnostic basis for every rule below.

| Area | Current State | File(s) |
|---|---|---|
| Styling approach | Tailwind utility classes almost everywhere, **except** `Report.jsx` which is ~1000 lines of inline `style={{...}}` objects with hardcoded hex colors | `Report.jsx` vs. everywhere else |
| Dark mode | Implemented via `dark:` classes + a `.dark` class + CSS custom properties in `index.css`, toggled in `Sidebar.jsx`. **`Report.jsx` has zero dark-mode support** — hardcoded `white`, `#0f172a`, `#64748b` etc. | `index.css`, `Sidebar.jsx`, `Report.jsx` |
| Layout shell | Sidebar is `w-64 fixed`, main content is `ml-64`, both **hardcoded with no responsive breakpoints at all** — confirmed zero `sm:`/`md:`/`lg:` classes in `Layout.jsx`, `Sidebar.jsx`, `Header.jsx` | `Layout.jsx`, `Sidebar.jsx` |
| Color tokens | Two parallel systems coexist: (1) shadcn-style HSL CSS vars (`--primary`, `--border`, etc.) wired into Tailwind config, barely used; (2) raw Tailwind palette classes (`blue-600`, `slate-900`, `emerald-500`) used almost everywhere in practice | `tailwind.config.js`, `index.css` |
| Buttons | No shared `Button` component. Every page hand-rolls its own button classes (gradient CTA in `Home.jsx`, plain icon buttons in `Header.jsx`, badge-pills in `Sidebar.jsx`) | `Home.jsx`, `Header.jsx`, `Sidebar.jsx` |
| Cards | No shared `Card` component. Card styling (radius, border, shadow, padding) is redeclared slightly differently on every page | `Home.jsx`, `ActiveAnalysis.jsx`, `SavedInsights.jsx`, `Report.jsx` |
| Decorative effects | Heavy use of gradient backgrounds, `blur`-based glow effects, `backdrop-blur`, `animate-ping`, `hover:-translate-y-1`, glassmorphism footers | `Home.jsx`, `ActiveAnalysis.jsx`, `Report.jsx` |
| Dead code | `App.css` still contains the default Vite/React template boilerplate (`.logo`, `logo-spin` keyframes, `.read-the-docs`) — appears unused | `App.css` |
| Typography | Uses `Inter` via Tailwind config; hierarchy is mostly consistent (`text-6xl font-extrabold` hero, `text-xl`/`text-2xl font-bold` headers) but weight/size choices are decided ad hoc per page rather than from a shared scale | All pages |
| Empty/loading/error states | Loading exists only for the analysis-in-progress screen (`ActiveAnalysis.jsx`, agent-by-agent grid with spinners). No dedicated empty state for "no saved insights yet" beyond likely a plain message; no consistent error-state pattern; failed analysis shows one red banner | `ActiveAnalysis.jsx`, `SavedInsights.jsx` |
| Icons | `lucide-react` used consistently — this is a strength, keep it | All pages |
| Accessibility | No visible `aria-label`s on icon-only buttons (bell, help, dark-mode toggle, tag-remove buttons); breadcrumb "last" link uses `pointer-events-none` rather than proper `aria-current`; no obvious focus-visible styling beyond Tailwind's default ring on inputs | `Header.jsx`, `Sidebar.jsx`, `Home.jsx` |

**What's already good — do not change these:**
- The Zustand store as single source of truth for session/tags/SSE polling — purely a UI-layer modernization, not a data/logic rewrite.
- `lucide-react` as the icon library.
- The overall information architecture: Autonomous Analysis as the primary flow, Research Tools as secondary manual tools, Library for saved work. Sidebar grouping logic is sound.
- The GO / PIVOT / KILL semantic color mapping (green / amber / red) — this is a correct, well-established convention for decision UIs. Keep the mapping; only clean up its implementation (see §3).
- Route structure in `App.jsx`.

---

## 1. Design Direction & Principles

1. **Calm density over decoration.** This is a data-diligence tool, not a landing page. Every gradient, glow, or animation must justify its presence by improving comprehension of state (e.g., "this agent is running") — not by looking impressive. Default to removing an effect unless it communicates something.
2. **One design system, not one-per-page.** Every button, card, badge, input, and empty state must come from a small set of shared, reusable patterns (ideally shared components — see §12). No page should invent its own card radius or shadow.
3. **Inline styles are a code smell here.** `Report.jsx`'s ~1000 lines of `style={{}}` are the single biggest inconsistency in the app (different color values, no dark mode, no hover-via-Tailwind, harder to theme). Migrate it to Tailwind utility classes using the same tokens as the rest of the app.
4. **Dark mode is not optional on any screen.** If a component ships without a `dark:` variant, it's incomplete. `Report.jsx` is currently the one screen that breaks dark mode entirely — this is the top-priority visual bug to fix.
5. **Responsive is not optional either.** The fixed `w-64`/`ml-64` shell must collapse into a usable mobile layout. Right now the app is desktop-only.
6. **Reduce animation to purposeful motion, with one deliberate exception for depth.** Remove animation used purely for entrance flourish (hover-lift transforms on static cards, glow-blur pulsing behind the hero input) — except for the constrained set of 3D/parallax accents specified in §6a, which are an intentional, scoped exception to give the product a sense of depth without adding visual noise to data-dense screens.
7. **Consolidate the two color-token systems into one.** Pick the CSS-variable/HSL system (already wired into `tailwind.config.js` as `bg-primary`, `border-border`, etc.) as the single source of truth, and stop using raw palette classes (`bg-blue-600`, `border-slate-200`) for anything that represents a *semantic* role (primary action, border, muted text). Raw palette classes are fine only for the fixed semantic decision colors (GO/PIVOT/KILL) that aren't meant to theme with light/dark mode swaps beyond what's specified in §3.

---

## 2. Visual Hierarchy

- **Page title → section header → card header → body → meta/caption** is the hierarchy already implied by the current type scale; formalize it (see §4) and apply it uniformly. Today, hierarchy is right *within* a page but the actual sizes/weights used to achieve it differ slightly page to page.
- On dense screens (`Report.jsx`), the most important thing on the page is the **decision verdict** (GO/PIVOT/KILL) — it should stay the single largest, highest-contrast element on the page, pinned near the top, exactly as it conceptually is today. Preserve the sticky verdict/tab-nav bar pattern found in the current print-portal section (`position: sticky` header/footer) — that idea is good, it just needs to be rebuilt in Tailwind with dark-mode support instead of inline styles.
- Avoid more than 2 competing focal points per screen. `Home.jsx` currently has three: the hero headline, the glowing input card, and (once scrolled) "Recent Explorations." That's acceptable because they're vertically sequential, not simultaneous — preserve that sequencing, don't compress them side-by-side.

---

## 3. Color System

**Action: consolidate onto CSS variables already defined in `index.css`, drop redundant raw-palette usage for semantic roles.**

### 3.1 Core semantic tokens (already defined in `index.css` — reuse, don't reinvent)
Use the existing HSL custom properties for anything structural:
- `background` / `foreground` — page canvas / default text
- `card` / `card-foreground` — any card surface
- `border` / `input` — border and input border color
- `primary` / `primary-foreground` — the brand action color (currently mapped to blue — keep)
- `muted` / `muted-foreground` — secondary/tertiary text and subtle backgrounds
- `destructive` / `destructive-foreground` — error/kill states

These already flip correctly between light and dark via the `.dark` class — this is the mechanism that should drive *all* theming, replacing ad hoc `dark:bg-slate-800` / `dark:text-slate-100` pairs sprinkled through every component. Practically: rather than writing `bg-white dark:bg-slate-800`, use `bg-card`. Rather than `text-slate-900 dark:text-slate-100`, use `text-foreground`. This is a mechanical but high-value cleanup pass across every file.

### 3.2 Brand accent
Keep the existing electric blue → indigo gradient (`#2563eb → #4f46e5`) as the single brand accent, used for:
- Primary CTA buttons
- Active nav state in the sidebar
- Focus rings on inputs
- The "Autonomous Analysis" nav entry treatment

**Change:** stop using the gradient as a *background fill* on large surfaces (e.g., full-page `bg-gradient-to-br` on `ActiveAnalysis.jsx`, blurred glow behind the Home input card). Reserve gradients for small, deliberate accents (buttons, active nav pill, thin top borders). Large gradient page backgrounds read as dated "AI product" styling and reduce text contrast/legibility for a data-heavy tool. Replace full-page gradients with the flat `background` token plus, if you want to preserve *some* liveliness, a single subtle radial highlight capped at low opacity behind the hero only — not tiled across every screen.

### 3.3 Decision/status colors (GO / PIVOT / KILL)
Keep exactly this semantic mapping — it's correct and it's what the report exists to communicate:
- **GO — Emerald** `#10b981` / `#059669`
- **PIVOT — Amber** `#f59e0b` / `#d97706`
- **KILL — Rose/Red** `#ef4444` / `#dc2626`
- **Synthesis/Intelligence accent — Violet** `#8b5cf6` (used sparingly for "aggregated insight" callouts)

**Change:** today these are implemented as raw hex strings inside inline `style` objects in `Report.jsx`, with no dark-mode-aware variants (e.g., a light emerald background that's unreadable in dark mode). Re-implement as Tailwind utility pairs with explicit dark variants, e.g.:
```
GO:    bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800
PIVOT: bg-amber-50   dark:bg-amber-950/40   text-amber-700   dark:text-amber-300   border-amber-200   dark:border-amber-800
KILL:  bg-rose-50    dark:bg-rose-950/40    text-rose-700    dark:text-rose-300    border-rose-200    dark:border-rose-800
```
Define these three combinations once (as a small `verdictStyles` map or three reusable badge/banner components — see §12) and reuse everywhere a verdict is shown (sidebar badge if ever added, report banner, history list verdict chips, saved-insights cards).

### 3.4 What NOT to change
Don't introduce a new brand color. Don't change the emerald/amber/rose decision mapping — it's a widely-understood convention (traffic-light semantics) and changing it would only cost user trust for no visual gain.

---

## 4. Typography System

Formalize the scale that's already mostly-followed, and apply it with zero exceptions.

| Role | Class | Used for |
|---|---|---|
| Display / Hero | `text-5xl md:text-6xl font-extrabold tracking-tight` | Home hero headline only — one per app |
| Page title | `text-2xl md:text-3xl font-bold tracking-tight` | Top of each page (Report title, "Generating Intelligence Report", etc.) |
| Section header | `text-lg md:text-xl font-semibold` | Card/section headers within a page |
| Card title | `text-base font-semibold` | Individual card headers (competitor name, agent name) |
| Body | `text-sm md:text-base leading-relaxed text-foreground` | Paragraph copy |
| Secondary body | `text-sm text-muted-foreground leading-relaxed` | Descriptions, subtext |
| Meta / caption | `text-xs font-medium text-muted-foreground` | Timestamps, counts, helper text |
| Eyebrow / badge label | `text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground` | Section eyebrows, sidebar group labels |

**Rules:**
- Never hardcode a font size in an inline `style` (this is currently happening throughout `Report.jsx`, e.g. `fontSize: 28, fontWeight: 900`). Replace every instance with the matching class from the table above.
- Limit heading weight to `font-bold`/`font-extrabold` and body weight to `font-normal`/`font-medium`/`font-semibold` — drop the `font-black` (900) weight used in a few spots in `Report.jsx`; it's heavier than the rest of the app's voice and reads inconsistent.
- Keep `Inter` as the typeface — no change needed.

---

## 5. Spacing & Sizing

Standardize on Tailwind's default 4px scale, expressed as a small set of reusable "rhythms" rather than arbitrary numbers:

- **Page padding:** `px-6 py-10 md:px-8 md:py-12` (currently varies: `py-16 px-6` on Home, `py-12 px-6` on ActiveAnalysis — pick one and use it on every top-level page container).
- **Card padding:** `p-5` for compact cards (agent status cards, competitor cards), `p-6` to `p-8` for primary content cards (the main input card on Home). Don't mix `p-4`/`p-5`/`p-6`/`p-8` arbitrarily across similar card types the way `Report.jsx` currently does with pixel values (`padding: '20px 22px'`, `'18px 20px'`, `'16px 18px'` for what are conceptually the same "stat/insight card").
- **Gap between cards in a grid:** `gap-4` for dense grids (agent grid), `gap-6` for showcase grids (recent explorations).
- **Border radius:** standardize on two sizes only — `rounded-lg` (8px) for inputs, small buttons, badges; `rounded-xl` (12px) for cards. Retire `rounded-2xl`/`rounded-3xl` except for the single largest hero surface (the main input card on Home can keep `rounded-2xl` as a one-off "hero" treatment) — right now radius values are inconsistent (`rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full` pills, and inline `borderRadius: 14/16` in Report.jsx all coexist for conceptually similar containers).

---

## 6. Layout & Grid Rules

- **Max content width:** keep `max-w-6xl` for standard pages, `max-w-4xl` for focused single-task screens (the Home input flow already does this correctly — keep it).
- **Grid breakpoints:** use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` as the standard responsive card-grid pattern (already used correctly in `Home.jsx`'s "Recent Explorations" and `ActiveAnalysis.jsx`'s agent grid) — apply this same pattern anywhere a new grid is introduced, instead of inventing a new breakpoint combination.
- **App shell must become responsive** (see §13 for full behavior spec) — this is the single most important structural change, since the current shell has zero responsive logic.

---

## 6a. 3D & Parallax Accents

The person building this wants the product to have a light 3D/parallax feel — a sense of depth rather than a flat form-and-list app. This is compatible with the "calm density" principle in §1 **only if scoped tightly**: depth effects belong on marketing/entry surfaces (Home hero, empty states, onboarding), not on dense data screens (Report, agent grid, tables), where they'd fight legibility and scanning speed.

`framer-motion` is already a project dependency — use it for all of the below rather than adding a new animation library.

### Where to add depth (do this)
1. **Hero mouse-parallax on Home.** The hero headline, the sparkle/eyebrow badge, and the main input card can each drift a few pixels in response to cursor position, at different rates, to create a layered parallax feel:
   - Background/ambient layer (e.g., the blurred gradient glow behind the input card): moves least, ~4–8px max offset.
   - Mid layer (hero headline + eyebrow): ~6–10px max offset.
   - Foreground layer (the input card itself): the most "real," ~10–14px max offset, plus a subtle `rotateX`/`rotateY` tilt (max ±3–4deg) so it reads as a floating card rather than a flat sticker.
   - Implement with `framer-motion`'s `useMotionValue` + `useSpring` tracking `mousemove` on the hero container, mapped to `translateX/Y` (and `rotateX/Y` for the card only). Spring config should feel damped/heavy, not springy/bouncy — e.g. `stiffness: 150, damping: 20` — since a diligence tool should feel solid, not playful.
   - Cap the effect to pointer-capable devices (`@media (hover: hover) and (pointer: fine)` or an equivalent JS check) — don't attempt drag-based parallax on touch.
2. **Card tilt-on-hover for showcase-style cards only** ("Recent Explorations" cards on Home, and any future template/gallery-style cards): a small `rotateX`/`rotateY` tilt following cursor position within the card bounds (max ±5deg), plus a subtle `translateZ`-style lift via increased `box-shadow` blur/spread and `scale(1.015)`. Do **not** apply this to agent-status cards, competitor/stat cards, or anything inside `Report.jsx` — those are scanned quickly in sequence and a tilt effect there adds distraction cost with no benefit.
3. **Scroll parallax for the Home page's background layer only.** As the user scrolls past the hero into "Recent Explorations," let the ambient background gradient/blur layer move at ~50–70% of scroll speed (a classic two-layer parallax), giving a sense of depth as the page moves. Keep foreground content (text, cards) scrolling at normal 1:1 speed — never parallax primary readable content itself.
4. **Layered elevation via shadow, not just tilt.** Establish 3 shadow "altitudes" and assign consistently:
   - Resting (cards, inputs): `shadow-sm`
   - Raised (hover state on interactive cards, open dropdowns): `shadow-md`
   - Floating (the hero input card at rest, modals): `shadow-lg` / `shadow-xl`
   Depth should read primarily through this shadow scale first, with the tilt/parallax motion in points 1–3 as a secondary, optional enhancement layered on top — so the design still reads as "has depth" even for reduced-motion users who get none of the motion.

### Where NOT to add depth (don't do this)
- No tilt/parallax on `Report.jsx` — verdict banner, stat cards, competitor cards, tables. These need to be scanned fast and compared against each other; any motion on hover here slows comprehension.
- No tilt/parallax on the agent-progress grid in `ActiveAnalysis.jsx` — status changes are already the "motion" that matters there (spinner → checkmark); adding tilt on top competes with that signal.
- No parallax on the sidebar or header — chrome should stay perfectly still; anything else feels like a bug, not a feature.
- Don't combine mouse-parallax with `hover:-translate-y-1` or the colored-glow-shadow hover from the old CTA button styling (§8) on the same element — pick one depth cue per element, not several stacked at once.

### Accessibility & performance
- Every effect in this section must be wrapped to respect `prefers-reduced-motion: reduce` — fall back to the static shadow-based elevation (point 4) with zero movement. This is not optional; treat it the same as the `prefers-reduced-motion` requirement already stated in §17.
- Use `transform`/`opacity` only for all of the above (never animate `top`/`left`/`width`/`height`) so effects stay GPU-accelerated and don't cause layout thrash — this matters more here than elsewhere in the app because parallax effects fire on every `mousemove`/`scroll` event.
- Throttle scroll-linked parallax updates via `requestAnimationFrame` (or `framer-motion`'s `useScroll`, which already does this internally) — never bind directly to raw scroll events with unthrottled state updates.

---

## 7. Navigation

Keep the current three-tier grouping in the sidebar (Autonomous → Research Tools → Library) — it's a sound mental model and shouldn't change.

**Changes:**
- The "Autonomous Analysis" nav item currently gets a heavier gradient treatment than every other nav item to signal it's the primary flow — keep that *intent*, but simplify the execution: a single solid `bg-primary text-primary-foreground` (active) / `bg-primary/10 text-primary` (inactive-but-featured) treatment communicates the same priority without needing a two-color gradient + colored shadow (`shadow-blue-200`). Gradients on tiny UI elements like nav pills read as visual noise at that scale.
- Breadcrumbs in `Header.jsx`: replace `pointer-events-none` (used to fake "current page, not clickable") with `aria-current="page"` plus the same faded styling — `pointer-events-none` removes a semantic signal for no visual reason and provides zero accessibility benefit.
- Icon-only header buttons (bell, help) need `aria-label` (`aria-label="Notifications"`, `aria-label="Help"`).
- The unread-notification red dot on the bell icon needs an accessible equivalent — either an `aria-label` update ("Notifications (unread)") or a visually-hidden text node, since color alone shouldn't carry that meaning per WCAG.

---

## 8. Buttons & Controls

Define exactly four button variants and use them everywhere — no page should hand-roll a fifth:

| Variant | Use | Style |
|---|---|---|
| **Primary** | Main CTA per screen (Generate Report, Save, Confirm) | `bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 font-semibold transition-colors` |
| **Secondary** | Supporting actions | `bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg px-4 py-2 font-medium transition-colors` |
| **Ghost/Icon** | Header icons, table row actions | `text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-2 transition-colors` |
| **Destructive** | Delete analysis, remove tag (final confirm step only) | `bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg px-4 py-2 font-medium` |

**Specific changes:**
- Retire `hover:-translate-y-1` on the primary CTA (`Home.jsx`) — a lift-on-hover works for marketing buttons, but on a tool used repeatedly all day this kind of motion adds friction/distraction without adding information. Keep a simple `hover:bg-primary/90` color shift instead.
- Retire the colored glow shadow on hover (`hover:shadow-indigo-200`) for the same reason — replace with a standard `shadow-sm` at rest, no shadow change on hover.
- All buttons must define `:disabled` state explicitly (`disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none`) — this exists today on the Home CTA; apply the same pattern to every future button.
- All interactive controls must have a visible `focus-visible` ring (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`) for keyboard users — currently only text inputs show a focus ring; buttons don't.

---

## 9. Forms & Inputs

- Standardize all text inputs on: `bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors placeholder:text-muted-foreground`. This matches what `Home.jsx`'s context-tag inputs already do — good, just needs to become the *only* input style used anywhere (main textarea, tag inputs, any future search/filter inputs) rather than being redefined per field.
- Textarea (main idea-input on Home): keep large, borderless-within-its-card treatment — it's a strong, appropriately "hero" pattern for the primary task. Don't add a border here even under the new standardization; a bordered textarea inside an already-bordered card is visual over-framing.
- Tag/pill inputs: keep the current "type + Enter to commit" interaction — it's fast and matches power-user tool conventions (e.g., Linear's label picker). Add a visible `+`/`Add` affordance for discoverability on first use (currently only signposted by a static plus icon that isn't a real button) — make the `Plus` icon a real, focusable, labeled button (`aria-label="Add {label}"`) rather than a purely decorative icon floating in the input.
- Every input needs a real, associated `<label>` (using `htmlFor`/`id`) — currently labels are visually present (`Industry`, `Geography`, `User Segment`) but not confirmed programmatically associated; verify and fix if missing.

---

## 10. Cards & Containers

Introduce one shared `Card` pattern with two density variants, and use it for every card-like surface in the app (agent status cards, competitor cards, stat cards, saved-insight cards, recent-exploration cards):

```
Base:    bg-card text-card-foreground border border-border rounded-xl
Compact: + p-4 md:p-5
Roomy:   + p-6 md:p-8
Interactive (clickable) add: hover:border-primary/30 hover:shadow-sm transition-colors cursor-pointer
```

- Drop the individual `hover:-translate-y` / custom `boxShadow` mouse-enter/mouse-leave JS handlers currently used for hover effects on `Report.jsx`'s `StatCard`/`CompetitorCard`/`TrendCard` (imperative `onMouseEnter`/`onMouseLeave` inline style mutation). Replace with plain Tailwind `hover:` classes — same visual result, far less code, and it correctly resets on unmount/re-render, which manual style mutation doesn't always do cleanly.
- Status-dependent card variants (e.g., the agent card during "running" vs "completed" vs "pending" in `ActiveAnalysis.jsx`) are a good pattern — keep the *concept* (ring/border/background changes with status) but drive the color values from the token system in §3, and make sure a `dark:` variant exists for each status (currently `bg-emerald-50/50`, `ring-blue-100` etc. have no dark equivalents defined).

---

## 11. Tables / Lists

There's no true data table in the current codebase yet (competitor comparisons are rendered as a card grid, not a `<table>`), but the app overview names an "interactive competitor comparison table" as a current/near-term component. Spec for it:

- Use a real semantic `<table>` (not divs faking rows) for any tabular competitor/data comparison, for accessibility and copy/paste behavior.
- Row hover: `hover:bg-muted/50`, not a shadow or scale effect — tables should feel calm and scannable, not "clickable card"-like.
- Sticky header row (`sticky top-0 bg-card z-10`) for any table that can scroll vertically.
- Numeric columns right-aligned; text columns left-aligned; a single sort indicator style (small chevron) reused for any sortable column.
- Zebra striping is optional and should only be used if row height is small/dense; prefer relying on hover state + borders (`divide-y divide-border`) for a cleaner look consistent with the rest of the app.

---

## 12. Modals / Dialogs

No modal exists yet in the audited code. Spec for the first one introduced (e.g., a delete-confirmation dialog for saved insights, or a settings dialog):

- Overlay: `bg-black/40 backdrop-blur-sm` (this is the one place backdrop-blur earns its keep — separating layers, not decorating a background).
- Panel: `bg-card border border-border rounded-xl shadow-lg p-6 max-w-md w-full`.
- Always trap focus inside the dialog while open, return focus to the triggering element on close, and close on `Escape`.
- Destructive confirmation dialogs must use the Destructive button variant (§8) for the confirm action, and the confirm action's label must state the action, not "OK" (e.g., "Delete Analysis", not "Confirm").

---

## 13. Empty / Loading / Error / Success States

These are currently the least developed part of the UI — most pages appear to render nothing meaningful in these states beyond the analysis-progress screen. Define one consistent pattern per state, usable via a small shared component (see §14):

- **Empty state:** icon (muted, 32–40px) + one-line title (`text-base font-semibold`) + one-line supporting text (`text-sm text-muted-foreground`) + optional primary action button. Use this for "No saved insights yet," "No past analyses yet," empty competitor lists, etc. — right now these cases likely fall back to blank space or an unstyled message.
- **Loading state:** keep the existing agent-by-agent progress pattern in `ActiveAnalysis.jsx` for the big long-running operation — it's a genuine strength of the current UI (transparent, specific, reduces perceived wait). For *shorter* loads elsewhere (e.g., fetching a saved insight, a manual-tool query), add a lightweight skeleton (`animate-pulse bg-muted rounded`) matching the shape of the content that will appear, rather than a generic spinner — this reduces layout shift and feels faster.
- **Error state:** standardize on one inline banner style used everywhere an operation fails: `bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 flex items-center gap-2` with an icon + message + (if retryable) a small "Retry" secondary button. Currently `ActiveAnalysis.jsx`'s failed-analysis banner is close to this but hardcoded with raw `red-*` classes instead of the `destructive` token, and there's no retry affordance.
- **Success state:** a matching pattern using the `emerald`/success equivalent, used for things like "Saved," "Report exported," "Link copied" — implement as a lightweight toast (appears bottom-right or top-right, auto-dismisses after ~3s) rather than inline banners, since success confirmations are transient and shouldn't take up permanent layout space.

---

## 14. Icons

- Keep `lucide-react` exclusively — don't introduce a second icon set.
- Standard sizes: `w-4 h-4` inline with text, `w-5 h-5` for header/toolbar icons, `w-6 h-6` for feature/empty-state icons. Audit and fix inconsistent one-off sizes (e.g., `w-3 h-3` badges vs `w-3.5 h-3.5` used interchangeably in a couple of spots).
- Every icon-only interactive element must carry `aria-label`; every purely decorative icon (next to text that already says the same thing) should carry `aria-hidden="true"`.

---

## 15. Hover / Focus / Active / Disabled / Transition States

Apply uniformly across every interactive element, replacing today's per-component ad hoc choices:

- **Transition:** `transition-colors duration-150` as the default for color/background changes. Reserve `duration-300`+ for the layout-shifting transitions that already exist and make sense (agent-card status changes, progress bar fill).
- **Hover:** background/text color shift only for buttons and nav items (no transform, no shadow-color changes) — see §8 rationale.
- **Focus:** every focusable element needs a visible `focus-visible` ring using the `ring` token (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`). This is currently missing on most buttons and nav links.
- **Active/pressed:** optional subtle `active:scale-[0.98]` on primary buttons only, if any "pressed" feedback is wanted — keep it minimal, don't add it to cards or nav items.
- **Disabled:** `disabled:opacity-50 disabled:cursor-not-allowed` everywhere a control can be disabled — already correct on the Home CTA, needs to become the universal rule.

---

## 16. Responsive / Mobile Behavior

This is the **highest-priority structural fix**. Today `Layout.jsx`/`Sidebar.jsx`/`Header.jsx` have no responsive logic at all — the fixed 256px sidebar and `ml-64` main content will overflow or crush content on any viewport under ~1024px.

**Required behavior:**
- **≥1024px (`lg:`):** current fixed sidebar + main content layout, unchanged.
- **768–1023px (`md:`):** sidebar collapses to icon-only rail (labels hidden, tooltips on hover) to reclaim width, main content adjusts its left margin to match the narrower rail.
- **<768px:** sidebar becomes an off-canvas drawer, hidden by default, opened via a hamburger button that must be added to `Header.jsx`; main content takes full width with no left margin. Drawer overlays content with a dismiss-on-outside-click scrim, matching the modal overlay treatment in §12 for consistency.
- All grids that currently start at `md:grid-cols-2`/`lg:grid-cols-3` (agent grid, recent-explorations grid) already degrade to a single column below `md:` — keep this, it's correct.
- The Home page's three-column context-tag row (`grid-cols-1 md:grid-cols-3`) already stacks correctly on mobile — keep as-is.
- Report page: the horizontal tabbed section navigation must become horizontally scrollable with visible overflow affordance (fade edge or scroll shadow) on narrow viewports rather than wrapping or shrinking illegibly.
- Verify touch target size ≥40x40px for all icon-only buttons on mobile (several currently use `p-2` around a `w-4 h-4` icon = 32px total, slightly under the recommended 44px touch target — bump to `p-2.5`/`p-3` on mobile specifically if a consistent global bump feels too large on desktop).

---

## 17. Accessibility Requirements

Concrete, testable requirements (WCAG 2.1 AA baseline):

- Color contrast: verify all text/background pairs meet 4.5:1 (body text) / 3:1 (large text ≥24px or ≥19px bold). Pay specific attention to `text-slate-400`/`text-slate-300` on light backgrounds and the various `#94a3b8`/`#64748b` inline colors in `Report.jsx` — several of these are likely borderline or failing at small sizes and should be re-checked once migrated to token-based classes.
- Every icon-only button gets `aria-label` (see §7, §14).
- Every image/avatar-with-initials needs `aria-label` or accompanying visually-hidden text stating what it represents (e.g., competitor name).
- All interactive elements reachable and operable via keyboard alone, in a logical tab order matching visual order.
- Focus-visible rings present on every focusable element (see §15) — do not remove the browser default without replacing it, which is not currently a problem here but must not become one during redesign.
- Status conveyed by color (GO/PIVOT/KILL, agent running/completed/pending) must also be conveyed by icon and/or text label — already true today (icons accompany color), preserve this pattern, don't regress to color-only indicators anywhere new.
- Respect `prefers-reduced-motion`: wrap any decorative animation (pulse dots, spin, ping) in a media query fallback to a static equivalent. The old Vite boilerplate in `App.css` already does this correctly for the logo spin (`@media (prefers-reduced-motion: no-preference)`) — apply the same discipline to the new pulse/spin/ping usages in `Home.jsx` and `ActiveAnalysis.jsx`.

---

## 18. Component Consistency Rules

To prevent regression back into per-page one-off styling:

1. Any style decision made more than once (button, card, badge, input, empty state, error banner) **must** become a shared component in `src/components/ui/` (e.g., `Button.jsx`, `Card.jsx`, `Badge.jsx`, `EmptyState.jsx`, `ErrorBanner.jsx`) — not a copy-pasted className string.
2. No new inline `style={{}}` objects for anything expressible in Tailwind. Inline styles are acceptable only for genuinely dynamic values Tailwind can't express statically (e.g., a computed percentage width for a progress bar, or a per-item dynamic color from a data-driven palette like the competitor `Avatar` component's color-per-name logic) — not for static colors, sizes, or spacing.
3. Every new/migrated component must include both light and dark styling before being considered done — no follow-up "add dark mode later" pass.
4. Every new/migrated interactive component must include hover, focus-visible, and disabled states (where applicable) before being considered done.
5. When in doubt about spacing/radius/color, match the nearest existing instance in this spec rather than introducing a new value.

---

## 19. UX Improvements (Behavioral, Not Just Visual)

- **Home page CTA readiness indicator:** currently "Agents ready to launch" / "Waiting for input..." is derived from a raw character-count threshold (`analysisInput.length > 20`) with no visible progress toward that threshold. Consider making the button's disabled→enabled transition itself sufficient signal, and simplify or remove the separate text status if it doesn't add information beyond what the button state already shows.
- **Failed analysis:** currently only shows a static banner ("Analysis failed. Please try again.") with no retry button and no way to see *why* it failed. Add a "Retry" action and, if the backend returns an error reason, surface it.
- **Report navigation:** preserve the existing sticky section tabs (good pattern for a long document) but ensure the active tab has a clear, high-contrast indicator (underline or filled pill) — verify this after migrating off inline styles, since the current implementation's active-state styling wasn't fully visible in the audited excerpt and should be explicitly re-specified during migration, not lost.
- **Saved Insights / History:** ensure there's a real empty state (per §13) rather than a blank page for new users who haven't saved anything yet — this is a common first-impression gap.

---

## 20. What Should NOT Change

- Information architecture / sidebar grouping (Autonomous / Research Tools / Library).
- The 11-agent live progress concept and per-agent card metaphor on `ActiveAnalysis.jsx` — this is a genuine differentiator and communicates the product's core value ("transparent, non-chatbot AI") well. Only its *implementation details* (token usage, dark mode, removing the full-page gradient background) should change.
- The GO/PIVOT/KILL color semantics.
- `lucide-react` as icon library, `Inter` as typeface, Zustand for state, SSE for live progress.
- The route structure in `App.jsx`.
- The tag-based context input pattern on Home (Industry/Geography/User Segment chips) — the interaction model is good, only the underlying input styling needs to be standardized (§9).

---

## 21. Prioritized Implementation Plan

Ordered by (impact × how much it currently breaks the experience), not by ease:

### Phase 1 — Foundation (do first, unblocks everything else)
1. Consolidate color usage onto the existing CSS-variable token system (§3.1); stop introducing new raw palette classes for structural/semantic roles.
2. Build shared `Button`, `Card`, `Badge`, `Input`, `EmptyState`, `ErrorBanner` components in `src/components/ui/` (§18) using the tokens above.
3. Fix the app shell responsiveness (§16) — collapsible/off-canvas sidebar, hamburger trigger in `Header.jsx`. This is the single highest-impact fix since the app is currently unusable below ~1024px.

### Phase 2 — Highest-inconsistency screen
4. Migrate `Report.jsx` off inline `style={{}}` objects onto the new shared components and token classes. Add full dark-mode support (currently entirely absent on this page). Rebuild the sticky section-nav and verdict banner using Tailwind, preserving their current sticky/tabbed behavior.

### Phase 3 — Polish pass across all pages
5. Remove large-surface gradients (full-page backgrounds, blurred glow effects) per §3.2; keep gradients only as small accent treatments.
6. Remove hover transform/colored-shadow effects on buttons and cards (§8, §10); replace with plain color-transition hovers.
7. Add focus-visible rings to every interactive element app-wide (§15, §17).
8. Add `aria-label`s to all icon-only controls; fix the breadcrumb `pointer-events-none` → `aria-current` swap (§7).
9. Implement the scoped 3D/parallax accents (§6a): hero mouse-parallax + card tilt on Home, scroll parallax on the Home background layer, and the 3-tier shadow-elevation system app-wide. Gate all motion behind `prefers-reduced-motion`.

### Phase 4 — Fill gaps
9. Implement consistent empty/error/success state patterns (§13) on `SavedInsights.jsx`, `AnalysisHistory`-equivalent views, and anywhere else operations can fail or return nothing.
10. Add retry affordance to the failed-analysis state (§19).
11. Convert any div-based "table" of competitor data into a real semantic `<table>` (§11) if/when that roadmap item is built.

### Phase 5 — Cleanup
12. Delete unused Vite boilerplate in `App.css` (`.logo`, `logo-spin`, `.read-the-docs`) if confirmed unreferenced.
13. Sweep for `prefers-reduced-motion` handling on all decorative animations (§17).