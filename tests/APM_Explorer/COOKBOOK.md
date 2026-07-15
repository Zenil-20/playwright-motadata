# APM Explorer — Playwright Cookbook

Notes on DOM quirks and locator patterns discovered while stabilizing
`Services/APM_Explorer_Services_Playwright.spec.js`. Read this before writing
new specs against the APM Explorer UI — most failures here come from
ambiguous text locators, not real bugs.

## Locator gotchas

- **Card/tile container**: use the CSS class `.vue-grid-item.cursor-pointer`.
  It works for both the Services card view and the Business Services card
  view. Don't hardcode a specific service's name as a stand-in for "any card"
  — it silently resolves to 0 elements when the view or data changes.

- **Sparklines**: each card renders 3 Highcharts sparklines (one per metric:
  Response Time/Avg Response Time, Throughput, Error Count), plus decorative
  icons (e.g. a Font Awesome `fa-web` type icon) that also match a generic
  `svg, canvas` selector. Scope to `svg.highcharts-root, canvas.highcharts-root`
  and expect **3**, not a raw `svg, canvas` count.

- **Severity/error indicator dot**: rendered as `.severity-dot-box` with a
  severity-level class (`major`, `warning`, `critical`, etc.), not a class or
  inline style containing the literal word "orange". The severity level
  itself reflects live APM data and can change between page loads — assert
  the dot's *presence*, not a specific severity/color.

- **Search input**: the wrapping `<span placeholder="Search" class="ant-input-affix-wrapper">`
  also carries a `placeholder` attribute, so `getByPlaceholder('Search')`
  can resolve to the wrapper instead of the real `<input>`. Scope to
  `input[placeholder="Search"]`.

- **Grid column headers vs. filter-builder chips**: the filter-builder pills
  above the grid (`span.chip-field`, e.g. "Event Source", "Type") use the
  exact same text as the grid's column headers. Don't use unscoped
  `page.getByText(...)` for either — scope chip clicks to `span.chip-field`
  and column-header checks to `page.getByRole('grid').getByText(...)`.

- **Filter dropdown values**: options in the field/value dropdowns (e.g. IP
  addresses, "java"/"cpp"/"ruby"/"php") render with `role="menuitem"`, and
  their plain text often collides with unrelated content already on the page
  (an IP also appears as a grid cell; "cpp" is a substring of a service name
  like "CPP_Sample_App_test"). Use `page.getByRole('menuitem', { name, exact: true })`.

- **Page-size control**: Kendo's page-size dropdown has `role="listbox"`,
  not `role="combobox"`. Scope with `.k-pager-sizes` to disambiguate from
  other listboxes on the page.

- **User avatar**: renders as text initials (e.g. "MQ") inside
  `span.user-avatar`, not an `<img alt="Avatar">`. There is no image element
  to target.

- **Card ↔ Grid toggle is asymmetric**: in card view the toggle button is
  named "Grid"; once switched to grid/table view, the *same toolbar slot*
  becomes a button named "Dashboard" (icon `widget-view`) that switches back
  to card view. There is no button named "Card" or "Tile".

## Flakiness / timing

- `.count()` has no auto-retry. If you're asserting a count changes after an
  action (e.g. clearing a search filter), use `expect.poll(() => locator.count())`
  instead of `expect(locator.count()).resolves...`, which can race the UI's
  re-render.
- The card list renders asynchronously after `waitForLoadState('networkidle')`
  resolves (it's a `vue-recycle-scroller`). Wait for
  `expect(loc.card(page).first()).toBeVisible()` before reading
  `allInnerTexts()` or similar bulk reads — otherwise you can read an empty
  list on a fast run.

## Live-data assertions

This environment is a live APM/monitoring instance — service counts,
business-service counts, and severity levels change over time as real data
streams in. **Don't hardcode totals** (e.g. "of 9 items", "total=3"). Instead:
- Read the actual total from the pager text and assert derived values against
  it (e.g. `Math.min(total, pageSize)` for row counts after changing page size).
- Or assert the shape of the value rather than its exact number
  (e.g. `/^\d+ - \d+ of \d+ items?$/`) when the exact count isn't the point
  of the test.
