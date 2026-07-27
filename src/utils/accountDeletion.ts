// Pure bookkeeping for account deletion (App Store guideline 5.1.1(v)).
//
// The critical rule lives here: the Cognito identity must only be deleted once
// EVERY owned DynamoDB row is gone. All user models are `@auth(allow: owner)`,
// so their rows are readable and deletable only by the owner sub. Delete the
// identity first (or while deletions are still failing) and the leftovers
// become permanently unreachable — nothing can ever read or delete them again.
// That is a privacy problem, not untidiness.

/** Models owned by a user, in the order they are deleted. */
export const OWNED_MODELS = [
  "Favorited",
  "Visited",
  "UserQuest",
  "UserXP",
  "User",
] as const;

export type OwnedModel = (typeof OWNED_MODELS)[number];

export interface DeletionOutcome {
  model: OwnedModel;
  /** Rows found for this user. */
  attempted: number;
  deleted: number;
  /** Rows whose delete call errored. */
  failed: number;
}

export interface DeletionSummary {
  totalAttempted: number;
  totalDeleted: number;
  totalFailed: number;
  failedModels: OwnedModel[];
  /** True only when nothing failed anywhere. */
  allDeleted: boolean;
}

export function summarizeDeletion(
  outcomes: DeletionOutcome[]
): DeletionSummary {
  const totalAttempted = outcomes.reduce((n, o) => n + o.attempted, 0);
  const totalDeleted = outcomes.reduce((n, o) => n + o.deleted, 0);
  const totalFailed = outcomes.reduce((n, o) => n + o.failed, 0);
  const failedModels = outcomes.filter((o) => o.failed > 0).map((o) => o.model);
  return {
    totalAttempted,
    totalDeleted,
    totalFailed,
    failedModels,
    allDeleted: totalFailed === 0,
  };
}

/**
 * Whether it is safe to delete the Cognito identity.
 *
 * Requires an outcome for every owned model — a missing model means that step
 * never ran, which is indistinguishable from it having failed. Fails closed.
 */
export function canDeleteIdentity(outcomes: DeletionOutcome[]): boolean {
  const covered = new Set(outcomes.map((o) => o.model));
  const allModelsCovered = OWNED_MODELS.every((m) => covered.has(m));
  return allModelsCovered && summarizeDeletion(outcomes).allDeleted;
}

