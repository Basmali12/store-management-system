import { defineSchema } from 'convex/server';

// Business tables will be added only together with server-side authentication
// and tenant authorization. Keeping the initial schema empty avoids exposing
// customer records through client-supplied merchant identifiers.
export default defineSchema({});
