import { join } from 'node:path';

export function fixturePath(name: string): string {
  return join('test', 'fixtures', name);
}
