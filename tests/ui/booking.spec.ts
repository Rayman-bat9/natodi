import { expect, test } from '../fixtures/booking.fixtures';
import { requireDefined } from '../utils/assertions';

/**
 * The phone field is masked as `+38 (0XX) XXX-XXXX` and keeps only the first ten
 * digits it receives, so test data is the national form without a country prefix.
 * Passing `+380501234567` here is silently stored as `+38 (380) 501-2345`, which
 * is why every case asserts the masked value instead of trusting the input.
 */
const customer = {
  name: 'QA Autotest',
  phone: '0501234567',
  maskedPhone: '+38 (050) 123-4567',
} as const;

/** Nine digits: one short of what the mask needs. */
const tooShortPhone = '050123456';
/** Ten digits whose operator code does not start with 0, which no Ukrainian number does. */
const invalidOperatorPhone = '9999999999';

test.describe('Natodi booking flow', () => {
  test('books a service and shows the confirmation', async ({
    contactForm,
    page,
    bookedAppointments,
  }) => {
    await contactForm.fillContactDetails(customer.name, customer.phone);
    await expect(contactForm.phoneInput).toHaveValue(customer.maskedPhone);

    const appointmentId = await contactForm.submitBooking();
    // Registered before the assertions, so a later failure still cleans up.
    bookedAppointments.push(appointmentId);

    await expect(contactForm.confirmationHeading).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/success/${appointmentId}`));
    const slot = requireDefined(contactForm.selectedSlot, 'the slot the flow selected');
    await expect(page.getByText(slot.time).first()).toBeVisible();
  });

  test('shows name as required and keeps submission disabled', async ({ contactForm }) => {
    await expect(contactForm.nameFieldLabel).toContainText('*');
    await expect(contactForm.submitButton).toBeDisabled();
  });

  test('keeps submission disabled for an incomplete phone number', async ({ contactForm }) => {
    await contactForm.fillContactDetails(customer.name, tooShortPhone);

    await expect(contactForm.phoneInput).toHaveValue('+38 (050) 123-456');
    await expect(contactForm.submitButton).toBeDisabled();
  });

  test('rejects a phone number with an impossible operator code', async ({ contactForm }) => {
    test.info().annotations.push({
      type: 'issue',
      description:
        'BUG (STRATEGY.md): the widget checks the phone length but not the operator code',
    });
    // Expected to fail while the bug is open. Once the widget validates the operator
    // code, this test starts passing and Playwright reports it as unexpected, which
    // is the signal to drop `test.fail` instead of rewriting the assertion.
    test.fail();

    await contactForm.fillContactDetails(customer.name, invalidOperatorPhone);

    await expect(contactForm.phoneInput).toHaveValue('+38 (999) 999-9999');
    await expect(contactForm.submitButton).toBeDisabled({ timeout: 2_000 });
  });
});
