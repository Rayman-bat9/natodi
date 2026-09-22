import { expectSuccess } from './client/api-result';
import { BRANCH_SLUG } from '../config/test-env';
import { expect, test } from '../fixtures/booking.fixtures';
import { requireFirst } from '../utils/assertions';
import { branchMetadataSchema } from './schemas/natodi.schemas';

test.describe('Natodi widget API', () => {
  test('returns branch metadata for the public slug', async ({ api }) => {
    const result = await api.getBranchMetadata();

    expect(result.status).toBe(200);
    const branch = expectSuccess(result).data;
    expect(branch.slug).toBe(BRANCH_SLUG);
    expect(branch.id).toBeTruthy();
    expect(branch.employees.length).toBeGreaterThan(0);
  });

  test('branch metadata matches the response schema', async ({ api }) => {
    const result = await api.getBranchMetadata();

    // The client already validates every payload it returns; asserting here makes the
    // contract check the subject of a test and names the offending field on drift.
    const parsed = branchMetadataSchema.safeParse(result.json);
    expect(parsed.success, parsed.error?.message).toBe(true);
  });

  test('rejects an unknown branch slug', async ({ api }) => {
    const result = await api.getBranchMetadata('no-such-branch-for-tests');

    expect(result.status).toBe(404);
    expect(result.ok).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.json).toMatchObject({ detail: expect.stringContaining('not found') });
  });

  test('returns active service categories', async ({ api }) => {
    const result = await api.getActiveCategories();

    expect(result.status).toBe(200);
    const categories = expectSuccess(result);
    expect(categories.data.length).toBeGreaterThan(0);
    expect(categories.pagination.total).toBeGreaterThanOrEqual(categories.data.length);
    // Category titles are live salon content, so assert the contract, not the wording.
    for (const category of categories.data) {
      expect.soft(category.title.trim(), `category ${category.id} title`).not.toBe('');
    }
  });

  test('returns only active services of the requested category', async ({ api }) => {
    const category = requireFirst(
      expectSuccess(await api.getActiveCategories()).data,
      'active category',
    );

    const result = await api.getActiveServices(category.id);

    expect(result.status).toBe(200);
    const services = expectSuccess(result);
    expect(services.data.length).toBeGreaterThan(0);
    expect(services.pagination.offset).toBe(0);
    for (const service of services.data) {
      expect
        .soft(service, `service ${service.id}`)
        .toMatchObject({ active: true, category_id: category.id });
    }
  });
});
