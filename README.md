# Natodi booking automation

Playwright + TypeScript checks for `https://book.natodi.com/ooo-oooo`.

## Covered

- UI happy path: service -> free date and time -> contacts -> confirmation. It books a
  real appointment and cancels it afterwards (see "API key" below).
- Negative UI cases: a missing required name, an incomplete phone number, and an
  expected-failure case pinned to BUG-2 in [STRATEGY.md](STRATEGY.md).
- Contract checks on the widget's endpoints: branch metadata, categories, services, a
  404 for an unknown slug, and an explicit response-schema assertion.
- Checks against the documented Partner API: identity, a 404, and the availability
  schema. These need an API key and are skipped without one.

## Run it in two commands

```powershell
npm install
npm test
```

`npm install` also fetches the Chromium build via a `postinstall` hook, so no separate
`playwright install` step is needed.

## Other commands

```powershell
npm run test:api     # API project only
npm run test:ui      # UI project only
npm run test:ui:headed
npm run report       # open the HTML report
npm run check        # typecheck + lint + format check
```

The suite is split into two Playwright projects: `api` (read-only HTTP checks, run in
parallel, no browser) and `ui` (serial, Desktop Chrome).

## API key

The happy path books a real appointment. To have it cancelled automatically, copy
[.env.example](.env.example) to `.env` and set `NATODI_API_KEY` to a Partner API key
from the admin panel. The key is admin-equivalent, so it stays out of the repository and
is never attached to a browser context.

Without a key the suite still runs in the same two commands: the Partner API specs skip,
and the appointment the happy path booked is reported in the HTML report as a
`manual cleanup` annotation with its id, to be cancelled in the admin panel.

`npm run check` is the local gate: `tsc --noEmit`, ESLint, and a Prettier format check.

## Latest run

The report produced by the last full run is committed at [playwright-report/index.html](playwright-report/index.html) - open that file in a browser, or run `npm run report`. Failure artifacts (trace, screenshot, video) are written to `test-results/`, which stays out of the repository.

The `ui` project runs serially because the public calendar is live and time-dependent. The browser is pinned to the salon timezone (`Europe/Kyiv`), so "today", the calendar layout, and the offered slots are identical on any machine. The UI helper probes the next bookable dates - across the current and the following month - for the first available slot within a fixed time budget.

See [STRUCTURE.md](STRUCTURE.md) for why the project is laid out this way,
[STRATEGY.md](STRATEGY.md) for the automation boundaries and bug reports, and
[AI.md](AI.md) for how AI was used.
