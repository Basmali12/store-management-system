export type DataMode = 'local' | 'convex';

const configuredMode = import.meta.env.VITE_DATA_MODE?.trim().toLowerCase();

// Trial builds are local-only by default. A paid deployment can restore the
// existing Convex integration by setting VITE_DATA_MODE=convex and providing
// the two Convex URLs already documented in .env.example.
export const DATA_MODE: DataMode = configuredMode === 'convex' ? 'convex' : 'local';
export const isConvexDataEnabled = DATA_MODE === 'convex';
