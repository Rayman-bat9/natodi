import type { APIResponse } from '@playwright/test';
import type { z } from 'zod';

/**
 * Outcome of a single API call. `json` always holds the decoded body, so error
 * responses stay assertable; `data` is the schema-validated payload and is only
 * present when the request succeeded. Clients never throw on a non-2xx status -
 * judging the status is the test's job.
 */
export interface ApiResult<T> {
  status: number;
  ok: boolean;
  json: unknown;
  data?: T;
}

/** Unwraps a result that a test expects to be successful. */
export function expectSuccess<T>(result: ApiResult<T>): T {
  if (!result.ok || result.data === undefined) {
    throw new Error(
      `Expected a successful Natodi API response, got ${result.status}: ${JSON.stringify(result.json)}`,
    );
  }
  return result.data;
}

async function readJson(response: APIResponse): Promise<unknown> {
  const body = await response.text();
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

/** Wraps a response into an `ApiResult`, validating the body only when it is a success. */
export async function toResult<S extends z.ZodType>(
  response: APIResponse,
  schema: S,
): Promise<ApiResult<z.infer<S>>> {
  const json = await readJson(response);
  return {
    status: response.status(),
    ok: response.ok(),
    json,
    data: response.ok() ? schema.parse(json) : undefined,
  };
}
