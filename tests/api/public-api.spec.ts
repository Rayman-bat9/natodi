import { expectSuccess } from './client/api-result';
import { publicApiKey } from '../config/test-env';
import { expect, test } from '../fixtures/booking.fixtures';
import { requireDefined, requireFirst } from '../utils/assertions';
import { bookTimesSchema } from './schemas/natodi.public.schemas';

/**
 * Checks against the documented Partner API. They need a key, so they are skipped
 * rather than failed when one is not configured - the rest of the suite stays
 * runnable for anyone who clones the repository.
 */
test.describe('Natodi Partner API', () => {
  test.skip(publicApiKey === undefined, 'NATODI_API_KEY is not set');

  test('binds the key to a single company', async ({ publicApi }) => {
    const result = await requireDefined(publicApi, 'partner API client').getIdentity();

    expect(result.status).toBe(200);
    const identity = expectSuccess(result).data;
    expect(identity.company_id).toBeTruthy();
    expect(identity.company_title.trim()).not.toBe('');
    // The response echoes only a prefix, never the key itself.
    expect(identity.key_prefix.length).toBeLessThan(32);
  });

  test('rejects an unknown appointment id', async ({ publicApi }) => {
    const result = await requireDefined(publicApi, 'partner API client').getAppointment(
      '00000000-0000-4000-8000-000000000000',
    );

    expect(result.status).toBe(404);
    expect(result.data).toBeUndefined();
    expect(result.json).toMatchObject({ detail: expect.stringContaining('not found') });
  });

  test('availability for a day matches the documented schema', async ({ publicApi }) => {
    const client = requireDefined(publicApi, 'partner API client');
    const branch = requireFirst(expectSuccess(await client.getBranches()).data, 'branch');

    const result = await client.getBookTimes({
      branchId: branch.id,
      bookDate: '2026-12-25',
    });

    expect(result.status).toBe(200);
    const parsed = bookTimesSchema.safeParse(result.json);
    expect(parsed.success, parsed.error?.message).toBe(true);
    // Either there are times, or the API says which of the documented causes applies.
    const availability = expectSuccess(result);
    expect(
      availability.data.length > 0 || availability.no_availability !== null,
      'an empty day must carry a machine-readable reason',
    ).toBe(true);
  });
});
