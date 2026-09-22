import { expect, type Locator, type Page } from '@playwright/test';
import { widgetAppointmentSchema } from '../api/schemas/natodi.schemas';
import { BRANCH_SLUG } from '../config/test-env';

/** Widget copy the flow keys off, kept in one place so a wording change is a one-line fix. */
const copy = {
  continueToSummary: 'Продовжити',
  submitBooking: 'Записатись',
  contactFormHeading: 'Контакти для запису',
  bookingConfirmed: 'Ви успішно записалися!',
  nameField: "Ім'я",
  phoneField: 'Телефон',
  nextMonth: 'Next Month',
} as const;

const slotRenderTimeout = 10_000;
/** Upper bound for probing dates, so a fully booked calendar fails fast and clearly. */
const slotSearchBudget = 45_000;
/** How many months past the current one to look through before giving up. */
const extraMonthsToSearch = 1;

/** The date and time the flow actually took, as the widget rendered them. */
export interface SelectedSlot {
  day: string;
  time: string;
}

export class BookingPage {
  private readonly page: Page;
  private readonly servicePicker: Locator;
  private readonly category: Locator;
  private readonly serviceCard: Locator;
  private readonly dateTimePicker: Locator;
  private readonly continueBar: Locator;
  private readonly continueButton: Locator;
  private readonly nextMonthButton: Locator;
  private readonly bookableDays: Locator;
  private readonly timeSlots: Locator;
  readonly nameInput: Locator;
  readonly nameFieldLabel: Locator;
  readonly phoneInput: Locator;
  readonly submitButton: Locator;
  readonly confirmationHeading: Locator;
  /** Set once a slot has been taken, so assertions can compare against it. */
  selectedSlot?: SelectedSlot;

  constructor(page: Page) {
    this.page = page;
    this.servicePicker = page.locator('app-services-data-card .content');
    this.category = page.locator('.category-tabs .label.filter').first();
    this.serviceCard = page.locator('.list-container .short-card').first();
    this.dateTimePicker = page.locator('.continue-block-btn-group__item');
    this.continueBar = page.getByText(copy.continueToSummary, { exact: true });
    this.continueButton = page.getByRole('button', {
      name: copy.continueToSummary,
      exact: true,
    });
    this.submitButton = page.getByRole('button', { name: copy.submitBooking, exact: true });
    this.nextMonthButton = page.getByRole('button', { name: copy.nextMonth });
    this.bookableDays = page.locator('td.myDpDaycell:not(.myDpDisabled):not(.myDpPrevMonth)');
    this.timeSlots = page.locator('.time-picker-container .time-cell');
    this.nameInput = page.getByLabel(copy.nameField);
    this.phoneInput = page.getByLabel(copy.phoneField);
    this.nameFieldLabel = page.locator('app-input[formcontrolname="first_name"] label');
    this.confirmationHeading = page.getByText(copy.bookingConfirmed, { exact: true });
  }

  async open(): Promise<void> {
    await this.page.goto(`/${BRANCH_SLUG}`);
  }

  async openContactForm({ slotIndex = 0 }: { slotIndex?: number } = {}): Promise<void> {
    await this.open();
    await this.servicePicker.click();
    await this.category.click();
    await this.serviceCard.locator('button.counter-btn--add').click();
    await this.dateTimePicker.click();
    await this.selectFirstAvailableSlot(slotIndex);
    await this.continueBar.click();
    await this.continueButton.click();
    await expect(this.page.getByText(copy.contactFormHeading, { exact: true })).toBeVisible();
  }

  async fillContactDetails(name: string, phone: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.phoneInput.fill(phone);
  }

  async submitBooking(): Promise<string> {
    const created = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/v1/appointments/',
    );

    await this.submitButton.click();

    const response = await created;
    if (!response.ok()) {
      throw new Error(
        `Booking the slot failed with status ${response.status()}: ${await response.text()}`,
      );
    }

    const appointment = widgetAppointmentSchema.parse(await response.json());
    return appointment.data.id;
  }

  private async selectFirstAvailableSlot(slotIndex: number): Promise<void> {
    const searchDeadline = Date.now() + slotSearchBudget;

    for (let monthOffset = 0; monthOffset <= extraMonthsToSearch; monthOffset += 1) {
      if (await this.pickSlotInVisibleMonth(searchDeadline, slotIndex)) return;
      if (monthOffset === extraMonthsToSearch || Date.now() >= searchDeadline) break;
      await this.nextMonthButton.click();
    }

    throw new Error(
      `No available time slot found across ${extraMonthsToSearch + 1} month(s) ` +
        `within ${slotSearchBudget} ms`,
    );
  }

  /** Takes a free slot of the month on screen; false when it has none. */
  private async pickSlotInVisibleMonth(
    searchDeadline: number,
    slotIndex: number,
  ): Promise<boolean> {
    // Wait for a bookable date rather than for the grid: the cells render before the
    // backend availability is applied, and counting too early sees an empty month.
    try {
      await expect(this.bookableDays.first()).toBeVisible({ timeout: slotRenderTimeout });
    } catch {
      return false;
    }
    const dayCount = await this.bookableDays.count();

    for (let index = 0; index < dayCount && Date.now() < searchDeadline; index += 1) {
      const dayCell = this.bookableDays.nth(index);
      const availabilityResponse = this.page
        .waitForResponse((response) => response.url().includes('/book_dates/times'), {
          timeout: slotRenderTimeout,
        })
        .catch(() => undefined);
      await dayCell.click();
      await availabilityResponse;

      try {
        await expect(this.timeSlots.first()).toBeVisible({ timeout: slotRenderTimeout });
        // Clamped, so a day with fewer slots than workers still yields one.
        const slotCount = await this.timeSlots.count();
        const slot = this.timeSlots.nth(Math.min(slotIndex, slotCount - 1));
        const time = (await slot.textContent())?.trim() ?? '';
        const day = (await dayCell.textContent())?.trim() ?? '';
        await slot.click();
        this.selectedSlot = { day, time };
        return true;
      } catch {
        // This date has no free time; continue with the next bookable one.
      }
    }

    return false;
  }
}
