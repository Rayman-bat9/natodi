import { expect, test } from '@playwright/test';
import { NatodiApi } from './client/natodi.api';

test.describe('Natodi API', () => {
  test('returns branch metadata for the public slug', async ({ request }) => {
    const api = new NatodiApi(request);
    const response = await api.getBranchMetadata();

    expect(response.data.slug).toBe('ooo-oooo');
    expect(response.data.id).toBeTruthy();
  });

  test('returns active service categories', async ({ request }) => {
    const api = new NatodiApi(request);
    const response = await api.getActiveCategories();

    expect(response.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Макіяж та догляд' })]),
    );
  });

  test('returns active services in the makeup category', async ({ request }) => {
    const api = new NatodiApi(request);
    const response = await api.getActiveServices();

    expect(response.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Макіяж' }),
        expect.objectContaining({ title: 'Стрижка' }),
      ]),
    );
  });
});
