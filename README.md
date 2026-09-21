# Natodi booking automation

Playwright + TypeScript checks for `https://book.natodi.com/ooo-oooo`.

## Covered

- UI happy path: service -> future date/time -> contact form, without creating a real appointment.
- Negative UI cases for missing required data and invalid phone input.
- API checks for branch metadata, active categories, and active services.

## Commands

```powershell
npm install
npx playwright install chromium
npm test
npm run report
```

The HTML report is generated in `playwright-report/`; failure artifacts are kept in `test-results/`.

The suite uses one worker because the public calendar is live and time-dependent. The UI helper searches nearby future dates for the first available slot.

See [STRUCTURE.md](STRUCTURE.md), [STRATEGY.md](STRATEGY.md), and [RUN_REPORT.md](RUN_REPORT.md).
