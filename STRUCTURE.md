# Why the project looks like this

## Two Playwright projects, not one suite

`api` and `ui` have different costs and different safety rules, so they are separate
projects in `playwright.config.ts`. The `api` project needs no browser and its checks
are read-only, so it runs fully parallel and finishes in about a second. The `ui`
project drives a live production calendar and performs a real write, so it stays
serial. One global `workers: 1` would have punished the API checks for the UI's
constraint; two projects let each have the setting it actually needs, and
`--project=api` becomes a useful command rather than a path filter.

## Page Object holds the flow, specs hold the intent

A spec should read like a claim about the product. Everything about _how_ the widget is
driven - eight clicks, a calendar search, a masked input - lives in `BookingPage`, so a
spec is three lines and survives a redesign of the widget. The Page Object exposes
locators and actions plus the one piece of state a caller needs to assert against
(`selectedSlot`), and it deliberately does not assert on behalf of the test.

## Fixtures, so no test repeats setup

`tests/fixtures/booking.fixtures.ts` provides `contactForm` (the widget already driven
to the contact form), a worker-scoped `api` client, and `bookedAppointments`, which
cancels whatever a test booked when it ends. The cleanup lives in a fixture rather than
in the test because teardown must run even when an assertion fails.

## Locators by accessible name, with one deliberate exception

Inputs are addressed through `getByLabel`, buttons through `getByRole` with their
visible name. The widget ships no `data-testid` at all (zero on the page), so where
nothing user-facing exists - the datepicker grid, the service card - the selectors are
scoped to Angular components. What was removed on purpose: `.ng-star-inserted`, an
Angular internal marker, and two identical `app-loader-button button[type=submit]`
locators that pointed at two different steps.

## Zod at the boundary, types derived from it

Every API response is validated at runtime and the TypeScript types are `z.infer` of
the same schemas, so validation and types cannot drift. There is no hand-written model
layer duplicating them. Clients return `{ status, ok, json, data? }` and never throw on
a non-2xx response - that is what makes negative cases testable at all.

## The API key is optional, and never touches the browser

Cleanup and the Partner API specs need a key, which is admin-equivalent and cannot be
narrowed to read-only. It is read from `.env`, is never committed, and is attached only
to a standalone `APIRequestContext` - never to a browser context, where it would be
recorded into traces and into the committed HTML report. Without a key the suite still
runs end to end: the Partner specs skip, and an appointment left behind is reported as
a `manual cleanup` annotation instead of failing silently.

## Layout

- `playwright.config.ts` - projects, timeouts, reporting, timezone pinning.
- `tests/config/test-env.ts` - base URLs, branch slug, timezone, locale, API key.
- `tests/fixtures/booking.fixtures.ts` - shared setup and appointment cleanup.
- `tests/pages/booking.page.ts` - the booking flow and its locators.
- `tests/ui/booking.spec.ts` - happy path and form validation cases.
- `tests/api/booking.api.spec.ts` - contract checks on the widget's endpoints.
- `tests/api/public-api.spec.ts` - checks on the documented Partner API (need a key).
- `tests/api/client/` - API clients and the shared `ApiResult` transport.
- `tests/api/schemas/` - Zod schemas and the types inferred from them.
- `tests/utils/assertions.ts` - guards that fail with a domain message.
- `eslint.config.mjs` - type-checked rules plus `eslint-plugin-playwright`.
