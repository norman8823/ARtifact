import {
  deleteFavorited,
  deleteUser,
  deleteUserQuest,
  deleteUserXP,
  deleteVisited,
} from "@/src/graphql/mutations";
import {
  listFavoriteds,
  listUsers,
  listUserQuests,
  listUserXPS,
  listVisiteds,
} from "@/src/graphql/queries";
import * as Sentry from "@sentry/react-native";
import { deleteUser as deleteCognitoUser } from "aws-amplify/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APPLE_LINKED_KEY, revokeAppleToken } from "@/src/utils/appleRevocation";
import { generateClient } from "aws-amplify/api";
import { useCallback, useState } from "react";
import { useAuthContext } from "@/src/contexts/AuthContext";
import {
  canDeleteIdentity,
  type DeletionOutcome,
  type OwnedModel,
  summarizeDeletion,
} from "@/src/utils/accountDeletion";

const getClient = () => generateClient();

export type DeletionResult =
  | { ok: true; rowsDeleted: number }
  | { ok: false; reason: "data-incomplete" | "identity-failed"; message: string };

/**
 * Real in-app account deletion, required by App Store guideline 5.1.1(v)
 * (which explicitly does not accept "contact support").
 *
 * Ordering is load-bearing: every owned DynamoDB row is deleted FIRST, and the
 * Cognito identity only afterwards. All user models are `@auth(allow: owner)`,
 * so once the sub is gone nothing can read or delete the leftovers — ever.
 * If any row fails to delete we abort and keep the account, which is
 * recoverable; the reverse is not.
 *
 * Uses Amplify v6's client-side `deleteUser()`, which self-deletes the
 * signed-in user — no admin IAM and no Lambda, so the zero-Lambda data path is
 * preserved.
 */
export function useAccountDeletion() {
  const { user } = useAuthContext();
  const [isDeleting, setIsDeleting] = useState(false);

  /** Page through a list query, collecting ids for the current user. */
  const collectIds = useCallback(
    async (
      query: string,
      listKey: string,
      filterByUserId: boolean
    ): Promise<string[]> => {
      const ids: string[] = [];
      let nextToken: string | null = null;

      do {
        const variables: Record<string, unknown> = { limit: 1000, nextToken };
        if (filterByUserId) {
          variables.filter = { userId: { eq: user?.userId } };
        }
        const result: any = await getClient().graphql({
          query,
          variables,
          authMode: "userPool",
        });
        if ("errors" in result && result.errors) {
          throw new Error(
            result.errors.map((e: { message: string }) => e.message).join(", ")
          );
        }
        const page = result.data?.[listKey];
        (page?.items ?? [])
          .filter((item: unknown) => item !== null)
          .forEach((item: { id: string }) => ids.push(item.id));
        nextToken = page?.nextToken ?? null;
      } while (nextToken);

      return ids;
    },
    [user]
  );

  const deleteRows = useCallback(
    async (
      model: OwnedModel,
      mutation: string,
      ids: string[]
    ): Promise<DeletionOutcome> => {
      let deleted = 0;
      let failed = 0;
      for (const id of ids) {
        try {
          const result: any = await getClient().graphql({
            query: mutation,
            variables: { input: { id } },
            authMode: "userPool",
          });
          if ("errors" in result && result.errors) {
            throw new Error(
              result.errors.map((e: { message: string }) => e.message).join(", ")
            );
          }
          deleted += 1;
        } catch (error) {
          failed += 1;
          console.error(`Failed to delete ${model} ${id}:`, error);
        }
      }
      return { model, attempted: ids.length, deleted, failed };
    },
    []
  );

  const deleteAccount = useCallback(async (): Promise<DeletionResult> => {
    if (!user) {
      return {
        ok: false,
        reason: "data-incomplete",
        message: "You are not signed in.",
      };
    }

    setIsDeleting(true);
    Sentry.addBreadcrumb({
      category: "account",
      message: "account_deletion_started",
    });

    try {
      const outcomes: DeletionOutcome[] = [];

      // Owned rows are keyed on the Cognito sub...
      const [favoritedIds, visitedIds, questIds, xpIds] = await Promise.all([
        collectIds(listFavoriteds, "listFavoriteds", true),
        collectIds(listVisiteds, "listVisiteds", true),
        collectIds(listUserQuests, "listUserQuests", true),
        collectIds(listUserXPS, "listUserXPS", true),
      ]);

      // ...but the User row is NOT: createUserInDB never passes an id, so
      // AppSync generated a UUID. The owner-auth resolver already scopes
      // listUsers to this user's own row(s), so no filter is needed.
      const userRowIds = await collectIds(listUsers, "listUsers", false);

      outcomes.push(
        await deleteRows("Favorited", deleteFavorited, favoritedIds)
      );
      outcomes.push(await deleteRows("Visited", deleteVisited, visitedIds));
      outcomes.push(await deleteRows("UserQuest", deleteUserQuest, questIds));
      outcomes.push(await deleteRows("UserXP", deleteUserXP, xpIds));
      outcomes.push(await deleteRows("User", deleteUser, userRowIds));

      const summary = summarizeDeletion(outcomes);

      // Abort before touching the identity if anything is left behind.
      if (!canDeleteIdentity(outcomes)) {
        Sentry.captureMessage("Account deletion aborted: data incomplete", {
          level: "error",
          tags: { component: "useAccountDeletion" },
          extra: { outcomes },
        });
        return {
          ok: false,
          reason: "data-incomplete",
          message:
            "Some of your data couldn't be deleted, so your account was kept. Nothing was lost — please check your connection and try again.",
        };
      }

      // Apple requires the token to be revoked when the account is deleted
      // (pairs with 5.1.1(v)). Do it AFTER the abort check — so nothing is
      // revoked for an account we then keep — but BEFORE the identity is
      // destroyed, since revocation needs a signed-in session.
      //
      // Best effort by design: a user entitled to delete their account should
      // not be blocked because Apple's endpoint is unreachable. Failures are
      // reported rather than swallowed.
      if ((await AsyncStorage.getItem(APPLE_LINKED_KEY)) === "true") {
        const revoked = await revokeAppleToken();
        Sentry.addBreadcrumb({
          category: "account",
          message: "apple_token_revocation",
          data: { revoked },
        });
        if (!revoked) {
          Sentry.captureMessage("Apple token revocation failed", {
            level: "warning",
            tags: { component: "useAccountDeletion" },
          });
        }
        await AsyncStorage.removeItem(APPLE_LINKED_KEY);
      }

      // Point of no return.
      await deleteCognitoUser();

      Sentry.addBreadcrumb({
        category: "account",
        message: "account_deletion_completed",
        data: { rowsDeleted: summary.totalDeleted },
      });
      return { ok: true, rowsDeleted: summary.totalDeleted };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "useAccountDeletion", action: "delete_account" },
      });
      return {
        ok: false,
        reason: "identity-failed",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong deleting your account.",
      };
    } finally {
      setIsDeleting(false);
    }
  }, [user, collectIds, deleteRows]);

  return { deleteAccount, isDeleting };
}
