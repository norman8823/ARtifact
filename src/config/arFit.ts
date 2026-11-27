/**
 * AR auto-fit — grounds every placed artwork on the floor, keeps it within
 * living-room limits (src/utils/arModelFit.ts). Rotation always comes from Studio.
 *
 * TO TURN IT OFF: set AR_AUTO_FIT to false. Every artwork then renders with
 * its plain Studio size and height, exactly as before auto-fit
 * existed. It is JS-only, so in a debug build a reload is enough; a release
 * build needs a new binary.
 */
export const AR_AUTO_FIT = true;

export const AR_FIT_LIMITS = {
  /** Tallest a model may stand, in metres. Taller ones are scaled down. */
  maxHeight: 1.8,
  /** Longest side of the footprint, in metres. */
  maxWidth: 1.5,
  /** Shortest a model may stand; smaller ones are scaled up, within maxWidth. */
  minHeight: 0.3,
} as const;

export type ARFitLimits = { maxHeight: number; maxWidth: number; minHeight: number };
