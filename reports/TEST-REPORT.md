# GOAL 3 — Verification report

Verified locally on 2026-09-14. Project: `/home/sergio/Progetti/solari-market`.

## Final result

| Check | Actual result |
|---|---|
| Node tests (`npm test`) | **11 passed, 0 failed** |
| Browser tests (`npm run test:ui`) | **15 passed, 0 failed** |
| Full monthly game | All **60 next-month actions** exercised through the UI; final state month 60, gameOver true |
| Automated accessibility | **22 axe scans**, zero WCAG 2 A/AA or WCAG 2.1 AA violations in the tested surfaces |
| Responsive | 1280×720; widths 390 and 320 at 844px height; no tested horizontal document overflow |
| Keyboard | Navigation/category/detail/purchase, native dialogs, tab cycling, Escape, focus movement, reduced motion passed |
| Browser errors | Zero uncaught page errors / console errors in the continuous screenshot session; behavioral suites also assert attached page listeners |
| Screenshot requests | Zero failed requests in the screenshot session |
| Original economic modules | All four SHA-256 hashes match the pre-redesign baseline |
| Assets | 20 distinct property SVGs, five category SVGs, one local brand SVG; all catalog images load |
| Evidence | 7 original screenshots and 16 redesigned screenshots |
| Local server | HTTP 200 at `http://127.0.0.1:8763`; bound only to 127.0.0.1 |

Latest full browser run returned `15 passed (34.1s)`. Exact Node/browser output is retained in `reports/test-output.txt`. Machine-readable browser results are in `reports/browser-results.json`. Do not infer completeness from a single screenshot: the suite exercises all requested flows below.

## Reproduce

```bash
npm ci
npx playwright install chromium
npm run test:all
```

Playwright starts a loopback static server if none is running. When reusing port 8763, first verify it serves this project; never kill an unknown listener. Each test gets a fresh browser context and localStorage. Tests do not touch an ordinary browser profile or production service.

To capture the visual flow:

```bash
npm start
# in another terminal, same directory:
npm run screenshots
```

`reports/screenshot-console.json` lists exact screenshot paths and error/request arrays. The capture script attaches Playwright listeners to the page **before navigation**; they survive reloads. It does not rely on a `window.onerror` listener destroyed by navigation.

## Acceptance coverage

| Requested behavior | Reproducible coverage |
|---|---|
| Home / compact HUD | Cash/net worth/net monthly/month, active navigation, first-viewport opportunities |
| Complete catalog | 20 property cards; 20 loaded distinct local SVG paths |
| Search | Case-insensitive property-name query, one result, no-results state, reset |
| Filters / sorting | Category entries, dropdown category, risk filter, descending price, clearing filters |
| Category entry | Real category selection and four expected properties; keyboard activation |
| Detail | Named property, initial heading focus, art left/action right at desktop, exact price/net |
| Purchase | Correct cash deduction and net addition; accessible named receipt; go-owned; sold state disabled |
| Affordability | Insufficient funds blocks acquisition and shows exact missing amount |
| Owned estate | Empty-state action, exact five totals, one real owned row, inspectable property |
| Portfolio | TU vs CPU net worth/count/net; exact lead; initial-capital delta; low-cash guidance |
| CPU | Actual CPU holdings and statistics after monthly decisions; original reserve tests retained |
| Month / market | Cashflows, market value changes, deterministic real event, CPU purchases and month advancement |
| Events / news | Actual last event callout, three recent items, closed archive, numeric newest-month-first grouping |
| Storage / reload | Purchases/month persist, old saves without UI fields load correctly, dismissed onboarding stays dismissed |
| Storage denied | No uncaught initialization error; visible non-persistence notice; in-memory play and reset work |
| Onboarding | Short native modal, initial focus, Tab cycling, Escape dismissal and persistence |
| New game | Header confirmation cancel/Escape preserves progress; explicit confirm resets and persists |
| End / final | Full 60-action run, final comparison, disabled next month, restart cancel/confirm from final, inspect completed portfolio and reload final |
| Accessibility | axe scans at 1280/390/320; named controls/dialogs, keyboard-only purchase, reduced motion, touch-target heights, no tested overflow |
| Economics unchanged | Byte-integrity test for data.js, game.js, cpu.js, market.js plus all eight original tests |

Fixtures that seed old, low-cash or end-of-game states exist only inside tests and isolated localStorage. Main simulation tests use the real exported game functions. Monthly randomness is overridden only in the isolated browser test/capture page so events are reproducible. No seeded fixture or mock economic response is shipped in the app.

## Test-first implementation record

The following feature slices were added with a failing test, observed locally, then implemented and re-run:

1. **Opportunity ranking:** missing exported function assertion → affordable/unowned, yield-ranked results.
2. **Marketplace shell:** missing net-monthly HUD → compact HUD, image cards, category filtering and full catalog.
3. **Detail and receipt:** missing detail title → focused title, action composition and exact purchase dialog.
4. **Owned management:** legacy empty state failed expected management flow → five-metric summary and owned rows.
5. **Portfolio:** missing comparison lead → real TU/CPU totals, capital delta and reserve guidance.
6. **News and turns:** zero recent-news items → bounded recent list, sorted archive and event callout; this-month advice fixed.
7. **Onboarding/final/reset:** missing semantic dialogs → native dialogs and confirmed resets from both entry points.
8. **Dialog keyboard regression:** Tab left the sole onboarding control → explicit focus endpoint cycling.
9. **Accessibility:** axe flagged a prohibited aria-label on a decorative span and touch targets measured below 44px → both fixed; all width scans passed.
10. **Storage denial:** onboarding never appeared after a SecurityError → bootstrap/UI catches, honest non-persistence notice, in-memory play.
11. **Ended-game advice:** completed-game home still suggested a first purchase → explicit completed-game next step.

One initial test expectation incorrectly counted seven low-risk properties. It was corrected to the six present in the unchanged source data; data and rules were not altered to fit a test. Hash/asset verification tests deliberately assert existing invariants rather than inventing new economic behavior.

## Visual verification

Original screens were opened and captured before UI changes. The redesigned home, catalog, detail, receipt, owned estate, portfolio, CPU/activity, onboarding, reset confirmation and final state were opened in a real Chromium browser and their screenshots visually inspected. Narrow home/catalog/detail/owned/portfolio/final were also inspected. Full rationale and composition audit: `reports/DESIGN-AUDIT.md`.

The Browser Use screenshot command timed out during initial inspection. The alternative was a locally installed Playwright browser in a fresh isolated context; it successfully produced and preserved actual screenshots. This did not block verification and no screenshot or output was synthesized.

## Boundaries and remaining limitations

- Tested browser engine: Chromium. Firefox, Safari and actual mobile devices were not exercised.
- axe plus keyboard testing is not a claim of complete WCAG certification or manual screen-reader coverage.
- Local fonts depend on the host’s installed families; all app assets are local.
- The existing game retains only the last 30 log entries; the archive intentionally respects that rule.
- A denied browser storage permission prevents persistence by definition; the UI reports it rather than pretending to save.
- No git repository was present. No commits, remotes, publication or pushes were created.

No unresolved functional blocker was found in the specified flows. The temporary preview server was terminated after verification. A subsequent independent `npm run test:all` run passed all 11 Node tests and 15 browser tests (32.5s). Start a new local preview with `npm start` when needed.
