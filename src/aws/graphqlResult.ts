import type { GraphQLResult } from "@aws-amplify/api-graphql";

/**
 * Narrows the union that `client.graphql()` returns.
 *
 * Amplify types `graphql()` as `GraphQLResult<T> | GraphqlSubscriptionResult<T>`
 * because the same method also serves subscriptions — the latter is an
 * `Observable` with no `data` property. For a query or mutation document only
 * the former can ever occur, but TypeScript can't infer that from a document
 * string, so `result.data` failed to type-check at nine call sites across the
 * legacy hooks.
 *
 * This narrows once, by an actual runtime check rather than a cast, so a
 * genuinely unexpected shape throws instead of silently becoming `undefined`.
 *
 * Note the sites that need this all already check `"errors" in result` — that
 * check does NOT narrow the union, because `errors` is optional on
 * `GraphQLResult`, so `in` cannot discriminate on it.
 */
export function asQueryResult<T>(
  result: GraphQLResult<T> | { subscribe: unknown }
): GraphQLResult<T> {
  if (!("data" in result)) {
    throw new Error(
      "Expected a GraphQL query/mutation result but received a subscription"
    );
  }
  return result;
}
