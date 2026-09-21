# Test strategy

## Automate

- Public widget smoke path: choose service, future date/time, contacts, and required customer data.
- Missing required values and the observed phone-input behavior.
- Read-only API contracts for branch metadata, categories, and services.

## Keep manual

- Final `Записатись` against production data: it creates a real appointment and needs an approved sandbox and cleanup process.
- Payment, notifications, calendar integrations, cancellation, and rescheduling without stable test accounts.
- Visual polish and translation review, better handled by exploratory or visual regression testing.

## Time-dependent determinism

The public calendar depends on current time, timezone, bookings, and backend availability. The helper tries the nearest future dates and selects the first rendered slot, rather than assuming a fixed appointment time. Tests use one worker to avoid competing requests against one live calendar. A seeded sandbox or mocked availability endpoint is required for fully deterministic CI.

## Candidate bug reports

### BUG-1: Empty availability on the current date

**Observed:** The selected current date can show `Не знайдено вільного часу` while future dates have slots.
**Impact:** A user may interpret the widget as unavailable.
**Recommendation:** Select the next available date automatically or provide a clear next-date CTA.

### BUG-2: Widget requests depend on generated resource IDs

**Observed:** After resolving the public slug, the widget requests categories/services with company, branch, employee, and category UUIDs.
**Impact:** Recreated resources can leave clients with stale IDs while the slug still works.
**Recommendation:** Keep slug discovery as the public contract and expose a stable versioned discovery response.

### BUG-3: Production booking cannot be safely smoke-tested

**Observed:** Final submit mutates appointment data and requires real contact details.
**Impact:** Confirmation and notifications remain outside a normal smoke run.
**Recommendation:** Provide sandbox mode with synthetic contacts and cleanup or idempotency support.

### BUG-4: Phone input accepts arbitrary digit length

**Observed:** The phone field accepts `99999999999` and enables submission when the required name is filled; letters are blocked by the input control.
**Impact:** Invalid phone numbers can reach the booking submission flow.
**Recommendation:** Validate the normalized phone value by country format before enabling submission.
