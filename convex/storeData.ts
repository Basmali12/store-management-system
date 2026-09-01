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

const parseRecord = <T>(value: string | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizedPhone = (value: string) => value.replace(/\D/g, '');

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireOfficialAccount(ctx);
    const records = await ctx.db.query('storeRecords').collect();
    return records.map(({ key, value, updatedAt }) => ({ key, value, updatedAt }));
  },
});

// The customer portal is intentionally phone-only. It returns only the matched
// customer's own record and transactions, never the complete store dataset.
export const customerPortalByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    const requestedPhone = normalizedPhone(phone);
    if (requestedPhone.length < 10 || requestedPhone.length > 15) return null;

    const records = await ctx.db.query('storeRecords').collect();
    const values = new Map(records.map(record => [record.key, record.value]));
    const customers = parseRecord<Array<{
      id: string;
      name: string;
      phone: string;
      balance: number;
      lastActivity: string;
      totalTaken: number;
      totalPaid: number;
      status: string;
    }>>(values.get('merchant_customers'), []);
    const customer = customers.find(item => normalizedPhone(String(item.phone || '')) === requestedPhone);
    if (!customer) return null;

    const debts = parseRecord<Record<string, unknown[]>>(values.get('merchant_debts'), {});
    const payments = parseRecord<Record<string, unknown[]>>(values.get('merchant_payments'), {});
    return {
      customer,
      debts: debts[customer.id] || [],
      payments: payments[customer.id] || [],
    };
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
