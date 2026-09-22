/**
 * Returns the first element of a collection the caller requires to be non-empty,
 * failing with a domain message instead of a downstream `TypeError`.
 */
export function requireFirst<T>(items: readonly T[], what: string): T {
  const [first] = items;
  if (first === undefined) {
    throw new Error(`Expected at least one ${what}, got none`);
  }
  return first;
}

/** Narrows an optional value the caller requires to be configured. */
export function requireDefined<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new Error(`Expected ${what} to be available, got undefined`);
  }
  return value;
}
