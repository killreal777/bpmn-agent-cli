export function normalizeName(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function arrayOf<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}
