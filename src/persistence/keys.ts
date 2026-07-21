/** Active En Obra storage envelope (schema v2). */
export const EN_OBRA_STORAGE_KEY = "en-obra-tracker-v2";

/** Untouched raw payload preserved before migration/repair. */
export const EN_OBRA_RECOVERY_KEY = "en-obra-tracker-recovery";

/**
 * Legacy Cuenta Obra / tracker v1 key.
 * Read for migration only; never write new user data here.
 */
export const LEGACY_TRACKER_V1_KEY = "cuenta-obra-tracker-v1";

/** Demo dataset lives in a separate namespace from user data. */
export const EN_OBRA_DEMO_STORAGE_KEY = "en-obra-tracker-demo-v2";
