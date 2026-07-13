# Gaps.md — Weaknesses, Tech Debt, Missing Tests, Fragile Edges

*Audit of the codebase, July 2026. Ordered roughly by severity.*

## Critical

### 1. Zero tests, zero CI
There is not a single `*.test.*` file, no jest/vitest config, no `.github/workflows`. Every regression so far (invisible AR model in release, dropped back press, wrong featured-quest filter) was caught manually in TestFlight. Highest-leverage additions, in order:
- Unit tests for pure logic: `useScanSuccess` orchestration, quest-completion set math ([useUserQuests.ts](src/hooks/useUserQuests.ts)), rank-from-XP lookup, the Flask→Rekognition response adapter ([scan.tsx:164-254](app/scan.tsx#L164)).
- A CI lint + `tsc --noEmit` gate — currently even type errors only surface at build time.

### 2. Live ReactVision API key committed in `app.json`
`rvApiKey: "rv_live_8fd77..."` sits in [app.json](app.json) plugin config (with `rvProjectId`). It ships in the binary anyway, but being in git history means it can't be rotated by config alone. Move to an EAS secret / env-substituted config (`app.config.js`) and rotate the key.

### 3. Guest API key hard-expires 2026-12-06
[authMode.ts:13](src/aws/authMode.ts#L13) hardcodes `GUEST_API_KEY_EXPIRY = 2026-12-06`. When the AppSync API key is rotated, the app needs a client update or guest mode dies. ~5 months away as of this audit. There is no server-driven config to extend it remotely.

### 4. Single point of failure: Railway scan endpoint
[scan.tsx:185](app/scan.tsx#L185) hardcodes `https://artifact-server-production.up.railway.app/predict`. No timeout, no retry, no failover, no request deduplication (rapid shutter taps fire concurrent requests). Railway free-tier scales to zero → first scan of the day eats a server cold start with no user-facing "warming up" state.

## Data / business-logic bugs

### 5. Quest `xpReward` is never awarded
`Quest.xpReward` is stored, displayed, and never consumed — completing a quest awards nothing. Only scanning awards XP (flat 100 in [useScanSuccess.ts](src/hooks/useScanSuccess.ts)). Either wire quest-completion XP or stop displaying the reward.

### 6. XP award has no idempotency or concurrency safety
`awardXP` reads latest `UserXP` then writes `current + points` ([useUserXP.ts:126](src/hooks/useUserXP.ts#L126)) — a read-modify-write race. Interrupted scan flows can double-award; concurrent updates can drop XP. The `byUserXP` GSI (timestamp SK) suggests an append-only history design that was abandoned mid-flight — one record is updated in place instead.

### 7. Retroactive quest credit is inconsistent
`startQuest` seeds progress from already-visited artworks (retroactive credit at start time), but artworks visited *between* quest creation and later scans only count via `updateQuestProgress`. If a user visits artwork X, then starts a quest containing X, they get credit; the model works — but a quest can silently auto-complete at start, awarding the completion state with no celebration/XP moment.

### 8. `remainingFreeScans` / `isPremium` are dead schema
`User.remainingFreeScans`, `User.isPremium`, `Quest.isPremium` exist in [schema.graphql](amplify/backend/api/artifact/schema.graphql) but no code enforces scan limits or premium gating. Premium was designed, never built.

## Architecture debt

### 9. Two coexisting data-fetch paradigms
The react-query layer ([queries.ts](src/hooks/queries.ts)) covers home/profile/artQuest/favorites/artworksVisited. artDetail, questDetail, collection, and explore still use legacy imperative hooks with local `useState` — no cache, refetch on every mount. This is a deliberate incremental strategy, but the boundary is invisible to a new contributor; finishing the migration (or documenting the split) is owed. Residual UX from the split: artworksVisited still spins on its uncached `getArtworksByIds` detail fetch; profile/artQuest have a ~300ms user-state spinner pre-auth (userId-keyed cache can't hydrate until auth resolves).

### 10. Explore search/filter is client-side over the whole table
[useInfiniteArtworks.ts](src/hooks/useInfiniteArtworks.ts) paginates 60 at a time but search + scannable/AR filters run client-side, with an auto-fetch loop that keeps pulling pages until ≥15 filtered results. Worst case (rare filter match) walks the entire ~6k-row table from the phone. Needs a `searchField` GSI or server-side filter.

### 11. `Artwork.isFeatured` has no GSI
Featured artworks = filtered DynamoDB *scan*, bounded to 5 pages/500 items ([useArtworks.ts](src/hooks/useArtworks.ts)). Works today because featured items are seeded early in the table; silently breaks if a featured artwork lands beyond the scan bound. A one-line `@index` fix plus data backfill.

### 12. Workarounds papering over unexplained races (each has a TODO)
- **250ms cold-start auth delay** ([AuthContext.tsx:52](src/contexts/AuthContext.tsx#L52)) — guards a Cognito token-hydration race nobody has pinned down; it's a guessed constant on the critical launch path.
- **`freezeOnBlur` on the dashboard** ([_layout.tsx:172](app/_layout.tsx#L172)) — masks a react-native-screens desync triggered by cache-hydration re-renders mid-transition. Correct fix is understanding the re-render storm.
- **AppSync cache-bypass in `useQuests`** ([useQuests.ts:89](src/hooks/useQuests.ts#L89)) — custom timestamped `GetFreshQuests` query defeats AppSync caching for quest definitions. Deliberate, but undocumented why the cache was serving stale quests in the first place.

## Dead code inventory (should be deleted)

| What | Where | Why dead |
|---|---|---|
| Rekognition Lambda | `amplify/backend/function/analyzeImage/` | Superseded by Railway CNN |
| API Gateway | `amplify/backend/api/rekognitionApi/` | Only served the dead Lambda |
| S3/Rekognition scan path | [scan.tsx:256+](app/scan.tsx#L256) (commented block) | Replaced by `analyzeWithFlask` |
| `aws-sdk` v2 in **app** deps | [package.json:27](package.json#L27) | Only the dead Lambda needed it; it's bloating the app dependency tree |
| 8th Wall prewarm | `src/components/ARPrewarmManager.tsx`, `src/utils/ARPermissionManager.ts` | 8th Wall is gone; nothing imports ARPrewarmManager |
| `useSceneModel` | [src/hooks/useSceneModel.ts](src/hooks/useSceneModel.ts) | Stub with empty hardcoded map; ArtworkARScene uses `rvGetSceneAssets` instead |
| `arImage` field/param | schema + [artDetail.tsx](app/artDetail.tsx) logging | Replaced by `sceneId` |
| Apple/Google login screens | `app/appleLogin.tsx`, `app/googleLogin.tsx` | Non-functional UI stubs, unreachable in normal flow |
| `phoneLogin` route | [_layout.tsx:157](app/_layout.tsx#L157) | Screen registered; file doesn't exist |

## Fragile edges

### 13. AR scene ordering invariants are load-bearing and undocumented in code
Three release-build regressions came from reordering: (a) `Viro3DObject` must mount only after tap-to-place (`9feea4f` — invisible model), (b) asset fetch must gate on `isARReady` (`15b6d3e` — broken tap-to-place), (c) the tap overlay must unmount after placement or gestures never reach Viro. Also: the hit-test includes `FeaturePoint` ([ArtworkARScene.tsx:137](components/ar-scenes/ArtworkARScene.tsx#L137)) while MIGRATION_NOTES.md claims it's excluded to prevent mid-air floating — code and doc disagree.

### 14. `AR_TEST_MODE` is a compile-time flag
[arViewer.tsx:11-12](app/arViewer.tsx#L11) — hardcoded boolean + hardcoded test sceneId. Flipping it to `true` and shipping would silently route every AR view to the test scene.

### 15. Scan flow is `any`-typed end to end
`analysisResult`, `rekognitionData`, the Flask adapter — all `any` ([scan.tsx:54,80](app/scan.tsx#L54)). The Flask contract (`{success, prediction, confidence}`) exists only implicitly; a server-side response change would fail at runtime with no type error.

### 16. Stale README
README still documents Expo SDK 53, 8th Wall WebView AR, Lambda/Rekognition/API Gateway as the live architecture, and a 5-tab layout including Scan. Every one of those is wrong today. Misleads any new contributor (and any AI agent reading it cold — see CLAUDE.md).

### 17. Sentry DSN hardcoded
[_layout.tsx:21](app/_layout.tsx#L21). Acceptable for a client DSN, but combined with no environment split, dev sessions pollute production Sentry.

## Missing observability
No analytics events (scan success rate, quest completion, AR placement success), no Sentry breadcrumbs around the two flakiest flows (scan network call, AR asset fetch). The Railway server's health is invisible to the client team.
