import { ConvexError, v } from 'convex/values';
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';

const MAX_RECORDS = 100;
const MAX_KEY_LENGTH = 100;
const MAX_VALUE_LENGTH = 2_000_000;

const requireOfficialAccount = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError('UNAUTHENTICATED');
};

const validateRecord = (key: string, value: string) => {
  if (!key || key.length > MAX_KEY_LENGTH) throw new ConvexError('INVALID_KEY');
  if (value.length > MAX_VALUE_LENGTH) throw new ConvexError('VALUE_TOO_LARGE');
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireOfficialAccount(ctx);
    const records = await ctx.db.query('storeRecords').collect();
    return records.map(({ key, value, updatedAt }) => ({ key, value, updatedAt }));
  },
});

export const applyBatch = mutation({
  args: {
    operations: v.array(v.object({
      id: v.string(),
      key: v.string(),
      value: v.union(v.string(), v.null()),
      queuedAt: v.number(),
    })),
  },
  handler: async (ctx, { operations }) => {
    if (operations.length > 50) throw new ConvexError('TOO_MANY_OPERATIONS');
    await requireOfficialAccount(ctx);
    for (const operation of operations) {
      if (operation.value !== null) validateRecord(operation.key, operation.value);
      const existing = await ctx.db.query('storeRecords')
        .withIndex('by_key', q => q.eq('key', operation.key)).unique();
      if (operation.value === null) {
        if (existing) await ctx.db.delete(existing._id);
      } else if (existing) {
        await ctx.db.patch(existing._id, { value: operation.value, updatedAt: operation.queuedAt });
      } else {
        await ctx.db.insert('storeRecords', {
          key: operation.key,
          value: operation.value,
          updatedAt: operation.queuedAt,
        });
      }
    }
    return { acknowledgedIds: operations.map(operation => operation.id) };
  },
});

export const importInitial = mutation({
  args: { records: v.array(v.object({ key: v.string(), value: v.string() })) },
  handler: async (ctx, { records }) => {
    if (records.length > MAX_RECORDS) throw new ConvexError('TOO_MANY_RECORDS');
    await requireOfficialAccount(ctx);
    const existing = await ctx.db.query('storeRecords').take(1);
    if (existing.length) return { imported: false };
    for (const { key, value } of records) {
      validateRecord(key, value);
      await ctx.db.insert('storeRecords', { key, value, updatedAt: Date.now() });
    }
    return { imported: true };
  },
});
