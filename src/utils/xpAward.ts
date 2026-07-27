// Concurrency-safe XP award primitives shared by useUserXP / useVisited /
// useScanSuccess. XP lives in a single per-user UserXP record that used to
// be updated with an unguarded read-modify-write; these helpers replace
// that with a conditional-update CAS loop plus deterministic record ids so
// concurrent scans can neither drop XP nor double-award it.

/** Deterministic Visited id — makes duplicate visit creates collide. */
export function visitedRecordId(userId: string, artworkId: string): string {
  return `${userId}#${artworkId}`;
}

/** Deterministic UserXP id — makes duplicate first-award creates collide. */
export function userXpRecordId(userId: string): string {
  return `xp-${userId}`;
}

/**
 * True when an error (thrown by aws-amplify graphql or built from a
 * GraphQL errors array) is a DynamoDB conditional-check failure, i.e. we
 * lost a write race and should re-read and retry (or treat a create as
 * "already exists").
 */
export function isConditionalCheckFailed(err: unknown): boolean {
  const texts: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === "string") texts.push(value);
  };
  if (err && typeof err === "object") {
    const anyErr = err as {
      message?: unknown;
      name?: unknown;
      errorType?: unknown;
      errors?: unknown;
    };
    push(anyErr.message);
    push(anyErr.name);
    push(anyErr.errorType);
    if (Array.isArray(anyErr.errors)) {
      for (const e of anyErr.errors) {
        push(e?.message);
        push(e?.errorType);
      }
    }
  } else {
    push(err);
  }
  return texts.some(
    (text) =>
      text.includes("ConditionalCheckFailed") ||
      /conditional request failed/i.test(text)
  );
}

export interface XpSnapshot {
  /** null = no XP record exists yet for this user. */
  id: string | null;
  xpPoints: number;
}

export interface XpRecordLike {
  id: string;
  /**
   * Optional, not just nullable: the generated GraphQL types declare
   * `xpPoints?: number | null`, so a raw AppSync item can omit the key
   * entirely. `pickLatestXpRecord` normalises it to a number on the way out.
   */
  xpPoints?: number | null;
  timestamp?: string | null;
  createdAt?: string | null;
}

/**
 * Latest XP record from a list query (newest timestamp wins, createdAt as
 * fallback), as a snapshot. Shared by getUserXP and the CAS read.
 */
export function pickLatestXpRecord<T extends XpRecordLike>(
  items: (T | null)[]
): (T & { xpPoints: number }) | null {
  const latest = items
    .filter((item): item is T => item !== null)
    .sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt || 0);
      const dateB = new Date(b.timestamp || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    })[0];
  if (!latest) {
    return null;
  }
  return { ...latest, xpPoints: latest.xpPoints || 0 };
}

export interface XpAwardOps {
  /** Fetch the current XP snapshot. Must throw on failure, not return null. */
  read: () => Promise<XpSnapshot>;
  /** Create the first XP record with `points`. Must throw on conflict. */
  create: (points: number) => Promise<unknown>;
  /**
   * Update record `id` to expectedXp + points, conditioned on xpPoints
   * still being expectedXp. Must throw a conditional-check error on
   * conflict.
   */
  conditionalUpdate: (
    id: string,
    expectedXp: number,
    points: number
  ) => Promise<unknown>;
}

/**
 * Award XP via compare-and-swap: read the current total, write conditioned
 * on it being unchanged, and retry from a fresh read when a concurrent
 * writer wins the race. A lost create race retries as an update against
 * the record the winner created.
 */
export async function awardXpWithRetry(
  ops: XpAwardOps,
  points: number,
  maxAttempts = 3
): Promise<unknown> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const current = await ops.read();
    try {
      if (current.id === null) {
        return await ops.create(points);
      }
      return await ops.conditionalUpdate(current.id, current.xpPoints, points);
    } catch (err) {
      if (!isConditionalCheckFailed(err) || attempt === maxAttempts) {
        throw err;
      }
      // Lost a write race — loop back to a fresh read.
    }
  }
  // Unreachable: the loop either returns or throws on the final attempt.
  throw new Error("XP award retry loop exited unexpectedly");
}
