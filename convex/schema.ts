import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// This application belongs to one official store owner. There is one shared
// store dataset and no tenant, merchant, or account partitioning in Convex.
export default defineSchema({
  storeRecords: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
  }).index('by_key', ['key']),
});
