# GOAL 3 — Design rationale and visual audit

## Scope and source inspection

This is a redesign of the existing vanilla ES-module application, not a new game or project. All original source files were read before the UI implementation. Browser inspection covered home, catalog, property detail, empty owned estate, portfolio, CPU, activity, onboarding and final result. Original screenshots are in `reports/before/`.

The game, market, economic data and CPU modules are unchanged byte-for-byte. `reports/economy-baseline.json` was captured before implementation; `tests/integrity.test.js` checks it. The only new selection logic is presentation-only ranking by existing net monthly income / purchase price, restricted to available and affordable properties. It does not influence the CPU, price, game state or outcome.

## Chosen composition

**Primary surface: Explore.** The first screen is a marketplace, not a lesson or marketing page. Secondary management surfaces use aligned, dense summaries. A compact shared HUD ties browsing, buying and managing to the monthly turn.

The old large educational hero and duplicate dashboard have been replaced with one short turn objective. Ranked properties become visible in the first 720px desktop viewport. Category scenes provide a visual entry to real catalog filters. All 20 properties remain in the complete catalog, including owned/CPU states: recommendations never replace or hide the catalog.

## Visual system

| Role | Choice | Reason |
|---|---|---|
| Primary | Deep teal `#123e3c` | Navigation, player identity, positive net, buying |
| Turn action | Solar `#edb653` | Distinguishes the consequential next-month action beside the month |
| Ground | Warm paper `#f5f3ed`, off-white `#fffefa` | Quiet marketplace canvas, not a field of white dashboard boxes |
| Ink / secondary | `#1a3432` / `#586864` | Readable hierarchy without washed-out body text |
| CPU | Clay `#78534b`, pale clay `#f1e6e0` | Clearly separate opponent identity, never confused with the player |
| Type | Georgia editorial headings; Trebuchet MS / Segoe UI / sans-serif controls | A civic/property-market character, with compact, legible UI and tabular numeric metrics |
| Shape | Restrained 6–12px control/card radii | Establish grouping without oversized rounded panels |
| Motion | Brief hover/press response | No looping decoration; reduced-motion media query removes transitions |

Fonts are local fallbacks; there are no font downloads or remote assets. Different installed font sets may produce minor metric differences.

## Original local artwork

`assets/solari-mark.svg` combines a rising sun with an architectural skyline. `scripts/generate-art.mjs` produces 20 distinct property SVGs and five category scenes, all local and deterministic. Land parcels, apartment balconies, shopfront awnings, glazed offices and villas have category-specific architectural construction. Sky, sun position, materials, height or building placement vary by property. These are deliberately stylized illustrations, not claims about real photographs or addresses.

Property imagery is the first visual layer on cards; category/name, price and net income follow; risk and ownership are subordinate but readable. No emoji artwork is rendered. The original unused legacy `propertyVisual()` metadata remains in `market.js` solely to preserve existing API/tests and the immutable economic module.

## Screen-level decisions

- **Header:** persistent brand/navigation and compact HUD; one instance of cash, net worth and monthly net. Current section has both an underline and `aria-current`. Month and solar next-month button are adjacent.
- **Home:** brief objective responds to purchases this month, low cash, subsequent turns and finished games. Opportunities are ranked transparently by net/price, not described as guaranteed or risk-adjusted recommendations. Risk remains visible. Category buttons reset conflicting filters and apply their actual category.
- **Catalog:** labeled search/category/risk/sort controls; result count; whole-card keyboard-operable detail links; clear empty-results recovery. No arbitrary disappearance of sold properties.
- **Detail:** large artwork left, name/price/net/risk/buy right at desktop. Description, income, cost, market value, owner and profile are secondary. Owned, CPU-owned, insufficient-funds and ended-game states cannot purchase.
- **Purchase:** modal receipt names the property and exact cash deduction, monthly net added and remaining cash. Primary action goes to the owned estate. Secondary action resumes browsing.
- **Owned estate:** five-metric management summary (count/value/income/cost/net) and inspectable visual rows. No duplicated catalog card grid. Empty estate has an immediate market action.
- **Portfolio:** TU and CPU compare net worth, count and monthly net immediately; cash and asset value explain the total. The lead sentence derives from the exact difference. Growth is current net worth minus initial capital, with no invented historical chart. Reserve guidance is explicitly prudential, not a new buying rule.
- **CPU/news:** clay identity and actual totals; most recent recorded event receives a warm callout with its original month. Three recent entries, older entries in a collapsible archive sorted by numeric month descending. Existing 30-entry retention is stated, not silently extended.
- **Onboarding/new/end:** short native onboarding modal; dismissal persists. New game is confirmed from both header and final dialog, with the non-destructive action initially focused. Completed games can be inspected without allowing further turns.

## Accessibility and responsive audit

- Semantic labels, headings, navigation, buttons, image alternatives, result status and save status.
- Native modal dialogs make the background inert. Focus is explicitly initialized, trapped for Tab/Shift+Tab, and restored or moved to the new screen. Escape dismisses onboarding/receipt or cancels reset without losing state.
- Focus-visible outlines distinguish keyboard focus from hover. Card focus is drawn around the whole card.
- Main navigation and turn/reset controls meet 44px mobile height. Buttons and categories are real interactive elements, not clickable divs.
- 1280×720 desktop and 390/320px narrow flows were exercised. Narrow property detail stacks; owned rows remain management rows; portfolio keeps TU/CPU side by side. No horizontal document overflow in tested views.
- Automated axe WCAG 2 A/AA and WCAG 2.1 AA scans cover onboarding, home, detail, receipt, owned, portfolio and confirmation at three widths, plus final at 320px. These do not replace manual screen-reader certification.

## Slop diagnostic: diagnose, then repair

**Before: 6/10.** The flagged tells were glossy blue gradient (1), instructional feature-tile grid dominating an Explore surface (3), decorative accent rail (4), unnecessary header blur (5), default Inter/system font stack without a product rationale (9), and the wrong hero-led surface composition (10).

**Repair:** changed the composition first: compact HUD/objective, property-first browse hierarchy, distinct management rows and an aligned financial comparison. Then replaced blue gradients/blur/emoji with restrained color, purposeful type, original property scenes and clear states. The event callout uses a full warm surface, not an accent rail.

**After: 0/10 on this specific heuristic (self-audit, not an objective quality score).** No tech gradient, default indigo, instructional feature tiles, accent rails, blur, decorative oversized stats, icon toppers, center-stacked main layout or misplaced marketing hero. Property grids are appropriate to Explore; financial figures are functional rather than ornamental.

## Iterative findings actually corrected

- Axe detected an invalid aria-label on a decorative span; the dot is now hidden from accessibility APIs.
- Mobile reset/month buttons initially measured below 44px; minimum heights were corrected and re-tested.
- Native dialog tab behavior could leave the sole onboarding control for browser chrome; explicit endpoint cycling now maintains dialog focus.
- Initial owned-state advice inherited a lifetime-ownership check; it now uses this-month purchase state.
- The ended-game home initially still advised a purchase; a failing regression test led to explicit completed-game advice.
- Storage denial previously stopped initialization; UI/bootstrap now report non-persistence and keep the in-memory game playable, without altering storage serialization or economic modules.

## Reusable verification workflow (project-local)

1. Read original source and capture all original screens before replacing the UI.
2. Snapshot untouched domain-module hashes; keep presentation selectors outside those modules.
3. Add a failing behavioral test for each UI slice, run it, implement the slice, then re-run the accumulated suite.
4. Capture screenshots in an isolated browser context and inspect actual images, not just DOM assertions.
5. Keep `pageerror` and console listeners attached to the Playwright page across reloads. Do not reset browser-side listeners by navigation.
6. Test 1280×720 and narrow widths; inspect dialog/focus/overflow, not only home.
7. Run the full 60-turn flow, reload old saves, deny storage, and exercise cancel/confirm from both restart entry points.
8. Store raw output, machine-readable results, screenshots and a precise changed-file manifest alongside the project.

No publication, remote configuration, git push or unknown-process termination was performed.
