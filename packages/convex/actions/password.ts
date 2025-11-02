'use node';
import { action } from '../_generated/server';
import { v } from 'convex/values';
import { randomBytes, scryptSync } from 'crypto';

export const hashPasswordAction = action({
  args: { password: v.string() },
  handler: async (_ctx, args) => {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(args.password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  },
}); 