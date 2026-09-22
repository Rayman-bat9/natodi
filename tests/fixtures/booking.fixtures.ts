import { test as base } from '@playwright/test';
import { NatodiApi } from '../api/client/natodi.api';
import { NatodiPublicApi } from '../api/client/natodi.public.api';
import { publicApiKey } from '../config/test-env';
import { BookingPage } from '../pages/booking.page';

interface TestFixtures {
  bookingPage: BookingPage;
  contactForm: BookingPage;
  /** Ids of appointments a test created; cancelled for it once it ends. */
  bookedAppointments: string[];
}

interface WorkerFixtures {
  api: NatodiApi;
  /** Undefined when no API key is configured, which keeps the suite runnable without one. */
  publicApi: NatodiPublicApi | undefined;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  bookingPage: async ({ page }, use) => {
    await use(new BookingPage(page));
  },

  /**
   * The widget driven up to the contact form, which every UI case starts from.
   *
   * Each worker aims at a different free slot, so two tests booking at the same
   * moment cannot collide over one time.
   */
  contactForm: async ({ bookingPage }, use, testInfo) => {
    await bookingPage.openContactForm({ slotIndex: testInfo.parallelIndex });
    await use(bookingPage);
  },

  /**
   * One client per worker, so the branch metadata that every catalogue request
   * depends on is resolved once per worker instead of once per test.
   */
  api: [
    async ({ playwright }, use) => {
      const context = await playwright.request.newContext();
      await use(new NatodiApi(context));
      await context.dispose();
    },
    { scope: 'worker' },
  ],

  publicApi: [
    async ({ playwright }, use) => {
      if (publicApiKey === undefined) {
        await use(undefined);
        return;
      }

      // A standalone request context, deliberately not the browser's: the key is
      // admin-equivalent, and travelling with page requests it would be recorded
      // into traces and into the committed HTML report.
      const context = await playwright.request.newContext({
        extraHTTPHeaders: { 'X-API-Key': publicApiKey },
      });
      await use(new NatodiPublicApi(context));
      await context.dispose();
    },
    { scope: 'worker' },
  ],

  bookedAppointments: async ({ publicApi }, use, testInfo) => {
    const appointmentIds: string[] = [];

    await use(appointmentIds);

    if (appointmentIds.length === 0) return;

    // Cleanup never fails the test it belongs to: a booking that survived is
    // reported as an annotation, so the result still reflects the assertions.
    if (publicApi === undefined) {
      testInfo.annotations.push({
        type: 'manual cleanup',
        description: `NATODI_API_KEY is not set, so these appointments stay in the calendar and need cancelling by hand: ${appointmentIds.join(', ')}`,
      });
      return;
    }

    for (const appointmentId of appointmentIds) {
      const result = await publicApi.cancelAppointment(appointmentId);
      if (!result.ok) {
        testInfo.annotations.push({
          type: 'manual cleanup',
          description: `Cancelling appointment ${appointmentId} failed with status ${result.status}; cancel it by hand`,
        });
      }
    }
  },
});

export { expect } from '@playwright/test';
