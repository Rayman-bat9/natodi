import { expect, test } from '@playwright/test';
import { BookingPage } from '../pages/booking.page';

test.describe('Natodi booking flow', () => {
  test('happy path reaches a valid contact form', async ({ page }) => {
    const bookingPage = new BookingPage(page);
    await bookingPage.openContactForm();

    await bookingPage.fillContactDetails('Тест', '+380501234567');

    await expect(bookingPage.submitButton).toBeEnabled();
  });

  test('shows name as required and keeps submission disabled', async ({ page }) => {
    const bookingPage = new BookingPage(page);
    await bookingPage.openContactForm();

    await expect(bookingPage.nameRequiredMarker).toBeVisible();
    await expect(bookingPage.submitButton).toBeDisabled();
  });

  test('accepts a digit-only phone without format validation', async ({ page }) => {
    const bookingPage = new BookingPage(page);
    await bookingPage.openContactForm();

    await bookingPage.fillContactDetails('Тест', '99999999999');
    await expect(bookingPage.submitButton).toBeEnabled();
  });
});
