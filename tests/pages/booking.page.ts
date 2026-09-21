import { expect, type Locator, type Page } from '@playwright/test';

export class BookingPage {
  private readonly page: Page;
  private readonly servicePicker: Locator;
  private readonly category: Locator;
  private readonly serviceCard: Locator;
  private readonly dateTimePicker: Locator;
  private readonly continueButton: Locator;
  readonly nameInput: Locator;
  readonly nameRequiredMarker: Locator;
  readonly phoneInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.servicePicker = page.locator('app-services-data-card .content');
    this.category = page.locator('.category-tabs .label.filter').first();
    this.serviceCard = page.locator('.list-container .short-card').first();
    this.dateTimePicker = page.locator('.continue-block-btn-group__item');
    this.continueButton = page.locator('app-loader-button button[type="submit"]');
    this.nameInput = page.locator('app-input[formcontrolname="first_name"] input');
    this.nameRequiredMarker = page
      .locator('app-input[formcontrolname="first_name"] label .ng-star-inserted')
      .filter({ hasText: '*' });
    this.phoneInput = page.locator('input[type="tel"]');
    this.submitButton = page.locator('app-loader-button button[type="submit"]');
  }

  async open(): Promise<void> {
    await this.page.goto('/ooo-oooo');
  }

  async openContactForm(): Promise<void> {
    await this.open();
    await this.servicePicker.click();
    await this.category.click();
    await this.serviceCard.locator('button.counter-btn--add').click();
    await this.dateTimePicker.click();
    await this.selectFirstAvailableSlot();
    await this.page.getByText('Продовжити', { exact: true }).click();
    await this.continueButton.click();
    await expect(this.page.getByText('Контакти для запису', { exact: true })).toBeVisible();
  }

  async fillContactDetails(name: string, phone: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.phoneInput.fill(phone);
  }

  private async selectFirstAvailableSlot(): Promise<void> {
    const currentDay = new Date().getDate();
    const dateParts = new Intl.DateTimeFormat('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(new Date());
    const currentMonth = dateParts.find(({ type }) => type === 'month')?.value;
    const currentYear = dateParts.find(({ type }) => type === 'year')?.value;
    if (!currentMonth || !currentYear)
      throw new Error('Could not determine current calendar month');

    const currentMonthCells = this.page.locator('td.myDpDaycell:not(.myDpDisabled)');
    const slotRenderTimeout = 10_000;
    await expect(currentMonthCells.first()).toBeVisible({ timeout: slotRenderTimeout });

    for (const dayCell of await currentMonthCells.all()) {
      const day = Number((await dayCell.textContent())?.trim());
      if (!day || day < currentDay) continue;

      const availabilityResponse = this.page
        .waitForResponse((response) => response.url().includes('/book_dates/times'), {
          timeout: 10_000,
        })
        .catch(() => undefined);
      await dayCell.click();
      await availabilityResponse;

      const slots = this.page.locator('.time-picker-container .time-cell');
      try {
        await expect(slots.first()).toBeVisible({ timeout: slotRenderTimeout });
        await slots.first().click();
        return;
      } catch {
        // This date has no available slot; continue with the next current-month date.
      }
    }

    throw new Error(`No available time slot found in ${currentMonth} ${currentYear}`);
  }
}
