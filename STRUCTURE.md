# Project structure

- `playwright.config.ts` - browser project, reporting, and deterministic worker settings.
- `tests/ui/booking.spec.ts` - UI booking scenarios.
- `tests/api/booking.api.spec.ts` - read-only API contract tests.
- `tests/api/client/natodi.api.ts` - typed API client and request parameters.
- `tests/api/models/natodi.models.ts` - TypeScript interfaces for API responses.
- `tests/api/schemas/natodi.schemas.ts` - Zod runtime schemas for JSON responses.
- `tests/pages/booking.page.ts` - BookingPage object with widget locators and booking workflow actions.
- `package.json` - install and test commands.
- `tsconfig.json` - strict TypeScript configuration.
- `STRATEGY.md` - automation boundaries, time-dependent test policy, and bug reports.
- `RUN_REPORT.md` - latest execution result and environment notes.

UI and API tests are separated by execution layer, while the UI layer reuses the Page Object in `tests/pages`.
