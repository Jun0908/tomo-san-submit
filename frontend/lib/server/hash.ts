import { createHash } from 'crypto';

export function sha256Json(input: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex');
}
