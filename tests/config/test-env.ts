import dotenv from 'dotenv';

// `quiet` keeps dotenv's banner out of the test output and the HTML report.
dotenv.config({ quiet: true });

export const WEB_BASE_URL = 'https://book.natodi.com';
export const API_BASE_URL = 'https://api.natodi.com/api/v1';
export const PUBLIC_API_BASE_URL = 'https://api.natodi.com/api/public/v1';
export const BRANCH_SLUG = 'ooo-oooo';

/**
 * The widget resolves availability in the salon's own timezone. Pinning the browser
 * to it keeps "today", the calendar layout, and the rendered slots identical on any
 * machine; a runner in UTC would otherwise see a different day and different slots.
 */
export const SALON_TIMEZONE = 'Europe/Kyiv';
export const SALON_LOCALE = 'uk-UA';

/**
 * Partner API key for the documented public API, read from `.env` (see `.env.example`).
 *
 * The key is admin-equivalent and cannot be narrowed to read-only, so it is kept out
 * of the repository and is only ever attached to a standalone `APIRequestContext` -
 * never to a browser context, where it would be recorded into traces and reports.
 *
 * It is optional: without it the suite still runs end to end, but an appointment the
 * happy path books is not cancelled automatically and the public API specs are skipped.
 */
const apiKeyFromEnv = process.env.NATODI_API_KEY?.trim() ?? '';
export const publicApiKey = apiKeyFromEnv.length > 0 ? apiKeyFromEnv : undefined;
