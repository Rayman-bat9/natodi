# Run report

## Latest run

**Date:** 2026-09-20
**Command:** `npm test`
**Browser:** Chromium 153
**Target:** `https://book.natodi.com/ooo-oooo`
**Result:** 6 passed in 11.9 seconds.

The run covered three UI tests and three API tests. The UI flow stops before the final production mutation and searches nearby future dates for an available slot.

## Notes

The public calendar is time-dependent and may have no slot on a particular day. The suite serializes tests and tries nearby future days, but a sandbox calendar is recommended for CI-grade determinism. The HTML report is written to `playwright-report/`; failure artifacts go to `test-results/`.
