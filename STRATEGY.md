# Test strategy

## 1. What to automate, what to keep manual

**Automate** the path a customer actually walks - service, free slot, contacts,
confirmation - because it is the revenue path, it spans four screens and three backend
calls, so it breaks often. Alongside it: the form's validation rules, and read-only
contract checks on the widget's endpoints and on the documented Partner API. Contract
checks are the best value per second in the suite: under a second each, and they catch
the drift that silently breaks the widget.

**Keep manual** notifications, payments, and calendar integrations - each needs a real
device or a third-party sandbox, and a red test there usually means the third party was
slow, not that we broke something. Same for visual polish and Ukrainian copy: screenshot
diffing a live production calendar fails for reasons that are not defects.

The deciding question is not "can this be automated" but "will the failure be
diagnosable at 3am".

## 2. Making time-dependent tests deterministic

No test names a date. Three rules:

1. **Ask the product what is free.** The flow reads the datepicker's own state - past
   dates carry `myDpDisabled`, the visible month is tagged `myDpCurrMonth` - and takes
   the first genuinely bookable date, walking into the next month if this one is full.
2. **Pin the clock to the salon.** The browser runs with `timezoneId: Europe/Kyiv`, so
   "today" and the offered slots are identical on a laptop and on a UTC CI box. Nothing
   reads the machine's local date.
3. **Undo the write.** The happy path books for real, then cancels via
   `POST /appointments/{id}/cancel`, so repeat runs neither accumulate bookings nor
   consume the slot.

Concurrency is part of this: booking is a write, so two workers aiming at one slot means
one loses. Each worker offsets into the day's slot list by its `parallelIndex`, which
keeps parallel runs and `--repeat-each` green.

What is still missing is a _fixed_ fixture. For CI-grade determinism I would seed a
sandbox company with a known rota so availability is an input, and mock `book_times`
for the validation-only cases, which need no live calendar.

## 3. Bug reports

### BUG-1: Past times are offered as free, and booking one records a completed, paid visit

**Severity:** High - corrupts revenue reporting with no operator action.

**Steps:** (1) at 19:05 Kyiv, `GET /api/public/v1/book_times?book_date=<today>&branch_id=<id>`;
(2) `POST /api/public/v1/appointments` with `start_at` = today 11:00, no `payment_status`;
(3) `GET /api/public/v1/clients/{client_id}`.

**Expected:** past times are not offered; a past booking is rejected, or is at least
`created`/`unpaid` for an operator to resolve.

**Actual:** step 1 returns `10:30:00 … 17:00:00` with `"no_availability": null` - all
gone. Step 2 returns `200` with `"status":"completed"` and `"payment_status":"cash"`,
neither requested. Step 3 shows `total_sum_paid: 800` and `completed_appointments_sum: 1`.
The widget shows "Не знайдено вільного часу" for the same day and creates
`created`/`unpaid`, so the two paths disagree.

### BUG-2: The phone field validates length but not the operator code

**Severity:** Medium - unreachable contact details reach a confirmed booking.

**Steps:** open the booking page, pick a service and a slot, then on "Контакти для
запису" fill the name and type `9999999999` into the phone field.

**Expected:** submission stays disabled - a Ukrainian number is `+380` plus nine digits,
so operator code `999` cannot exist.

**Actual:** the field shows `+38 (999) 999-9999` and "Записатись" becomes enabled. Nine
digits _does_ leave it disabled, so the check exists but stops at counting. Pinned by an
expected-failure test that turns red once this is fixed.

### BUG-3: A taken slot fails with an internal error instead of the documented one

**Severity:** Medium - not actionable, and it leaks internals.

**Steps:** book a slot through the widget, keep it active, and book the same slot again
from a second session (`POST /api/v1/appointments/`).

**Expected:** the conflict the documented API returns -
`{"error_code":4031,"message":"Appointment time is already reserved"}`.

**Actual:** `400 {"detail":"AppointmentDB '' already exists"}` - an internal class name,
an empty identifier, no hint that a slot is taken. `POST /clients/` renders the same
template properly (`Client with phone_number '…' already exists`), so this looks like an
oversight rather than a design choice.
