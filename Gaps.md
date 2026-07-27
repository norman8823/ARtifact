# Gaps.md — Weaknesses, Tech Debt, Missing Tests, Fragile Edges

*Audit of the codebase, July 2026. Ordered roughly by severity.*

## Critical

### 1. Zero tests, zero CI — ✅ **mostly resolved** (backlog 0.1)
~~There is not a single `*.test.*` file, no jest/vitest config, no `.github/workflows`.~~ A jest-expo harness and [ci.yml](.github/workflows/ci.yml) now run on PRs/pushes to `development`, with pure logic extracted to `src/utils/` (`questProgress`, `rankUtils`, `scanAdapter`, `xpAward`) and unit-tested.

**Still open:** the tsc + lint jobs are `continue-on-error` because the pre-existing baseline fails (~29 `tsc --noEmit` errors across 14 files, 8 lint errors). Until that's cleaned up, type errors still only surface at build time — CI is a test gate, not a type gate. Tracked as backlog 0.1b. Coverage is also still unit-only: no component or E2E tests, so the release-only AR regressions remain uncaught by CI.

### 2. Live ReactVision API key committed in `app.json`
`rvApiKey: "rv_live_8fd77..."` sits in [app.json](app.json) plugin config (with `rvProjectId`). It ships in the binary anyway, but being in git history means it can't be rotated by config alone. Move to an EAS secret / env-substituted config (`app.config.js`) and rotate the key.

### 3. Guest API key hard-expires 2026-12-06
[authMode.ts:13](src/aws/authMode.ts#L13) hardcodes `GUEST_API_KEY_EXPIRY = 2026-12-06`. When the AppSync API key is rotated, the app needs a client update or guest mode dies. ~5 months away as of this audit. There is no server-driven config to extend it remotely.

### 4. Single point of failure: Railway scan endpoint
[scan.tsx:185](app/scan.tsx#L185) hardcodes `https://artifact-server-production.up.railway.app/predict`. No timeout, no retry, no failover, no request deduplication (rapid shutter taps fire concurrent requests). Railway free-tier scales to zero → first scan of the day eats a server cold start with no user-facing "warming up" state.

## Data / business-logic bugs

### 5. Quest `xpReward` is never awarded — ✅ NOT A BUG (by design)
Resolved 2026-07-13: the completion bonus was deliberately removed (it made XP tracking too hard). `xpReward` is descriptive — it equals 100 × the quest's artwork count, i.e. the scan XP you earn completing it. XP is scan-only (flat 100 in [useScanSuccess.ts](src/hooks/useScanSuccess.ts)); max earnable is 4700 = Art Legend threshold. Never wire a completion award — it would double-count.

### 6. XP award has no idempotency or concurrency safety — ✅ FIXED (backlog 0.2)
Resolved 2026-07-13: `awardXP` now does a conditional-update CAS loop with retry (`src/utils/xpAward.ts`), and new `UserXP`/`Visited` records use deterministic ids so duplicate creates collide instead of double-writing; `useScanSuccess` gates XP on the visit-create result. Residual note: the `byUserXP` GSI (timestamp SK) still hints at an abandoned append-only design — single-record-updated-in-place is now the settled pattern.

### 7. Retroactive quest credit is inconsistent
`startQuest` seeds progress from already-visited artworks (retroactive credit at start time), but artworks visited *between* quest creation and later scans only count via `updateQuestProgress`. If a user visits artwork X, then starts a quest containing X, they get credit; the model works — but a quest can silently auto-complete at start, flipping to the completion state with no celebration moment. **Celebration only** — per #5 there is no completion XP to award, and the scan XP was already granted at visit time.

### 8. `remainingFreeScans` / `isPremium` are dead schema
`User.remainingFreeScans`, `User.isPremium`, `Quest.isPremium` exist in [schema.graphql](amplify/backend/api/artifact/schema.graphql) but no code enforces scan limits or premium gating. Premium was designed, never built.

## Architecture debt

### 9. Two coexisting data-fetch paradigms
The react-query layer ([queries.ts](src/hooks/queries.ts)) covers home/profile/artQuest/favorites/artworksVisited. artDetail, questDetail, collection, and explore still use legacy imperative hooks with local `useState` — no cache, refetch on every mount. This is a deliberate incremental strategy, but the boundary is invisible to a new contributor; finishing the migration (or documenting the split) is owed. Residual UX from the split: artworksVisited still spins on its uncached `getArtworksByIds` detail fetch; profile/artQuest have a ~300ms user-state spinner pre-auth (userId-keyed cache can't hydrate until auth resolves).

### 10. Explore search/filter is client-side over the whole table
[useInfiniteArtworks.ts](src/hooks/useInfiniteArtworks.ts) paginates 60 at a time but search + scannable/AR filters run client-side, with an auto-fetch loop that keeps pulling pages until ≥15 filtered results. Worst case (rare filter match) walks the entire ~6k-row table from the phone. Needs a `searchField` GSI or server-side filter.

### 11. `Artwork.isFeatured` has no GSI — and cannot have one directly
Featured artworks = filtered DynamoDB *scan*, bounded to 5 pages/500 items ([useArtworks.ts](src/hooks/useArtworks.ts)). Works today because featured items are seeded early in the table; silently breaks if a featured artwork lands beyond the scan bound.

**Correction (2026-07-13): this is not a one-line `@index` fix.** DynamoDB key attributes must be String, Number, or Binary — **Boolean is not a valid key type**, so `@index` on `isFeatured: Boolean` cannot be deployed. (Consistent with the schema: all six existing `@index` directives are on `ID!` fields.) The real fix is a **sparse GSI on a String field**: add e.g. `featuredStatus: String @index(name: "byFeatured", sortKeyFields: ["id"])`, populate it with a constant like `"FEATURED"` **only** for featured artworks and leave it null elsewhere (items missing the key attribute are absent from the index, so the query reads only featured rows), backfill via `scripts/`, then switch `getFeaturedArtworks` to the generated index query. Estimate: schema + push + backfill script + query swap, not a one-liner.

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
| Apple/Google login screens | `app/appleLogin.tsx`, `app/googleLogin.tsx` | Non-functional UI stubs, unreachable in normal flow. Both are deleted as part of backlog 1A.5 — `appleLogin` is superseded by the real native Sign in with Apple flow, `googleLogin` is out of scope (iOS-only app) |
| `phoneLogin` route | [_layout.tsx:157](app/_layout.tsx#L157) | Screen registered; file doesn't exist |

## Fragile edges

### 12b. The iOS Simulator cannot run this app at all *(verified 2026-07-27)*
ReactVision ships `ViroKit.framework` as a single **device-only** arm64 slice (`LC_BUILD_VERSION platform IOS`; no simulator slice, no `.xcframework`). The app compiles (0 errors) and the binary launches, but the JS bundle dies at module load — `ArtworkARScene.tsx:3` → `arViewer.tsx:3`, `Cannot read property 'setJSAnimations' of null` — because the Viro native modules are null. Since expo-router eagerly loads the `arViewer` route, this fires on every launch regardless of navigation, and the red box is not dismissible.

**Impact:** there is no local UI feedback loop for *any* feature, not just AR. Every runtime check requires a physical device or TestFlight, which is a major tax on iteration and is why release-only regressions keep slipping through (#13). Two possible mitigations worth investigating: lazy-load the Viro imports inside `ArtworkARScene` so the module graph doesn't touch native at import time, or stub the Viro modules when `!Device.isDevice`. Either would unlock simulator development for the ~95% of the app that isn't AR.

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

## Added after the initial audit

*Numbering continues from above so existing `*(Gaps #N)*` references in [backlog.md](backlog.md) stay valid. Severity is noted per item rather than by section.*

### 18. **Critical** — "Delete Account" is a non-functional stub
[profileSettings.tsx:376-378](app/profileSettings.tsx#L376) answers the Delete Account button with an alert: *"This feature is not yet implemented. Please contact support."* App Store guideline 5.1.1(v) requires **in-app** account deletion for any app that supports account creation — a support email does not satisfy it. This is a standing rejection risk on the next submission, independent of any new feature. Scoped as backlog **0.5** — it gates any submission, so it sits in P0 rather than behind the Apple work. Adding Sign in with Apple later adds one step (revoking the user's tokens at `POST https://appleid.apple.com/auth/revoke`, backlog 1A.6), it does not gate the deletion flow itself.

### 19. **High** — Amplify auth config diverges from the live Cognito pool
[cli-inputs.json:44-46](amplify/backend/auth/ARtifactAuth/cli-inputs.json#L44) declares `"usernameAttributes": ["email, phone_number"]` — a single malformed string, not a legal `UsernameAttributes` value — while [backend-config.json:69](amplify/backend/backend-config.json#L69) says `["EMAIL","PHONE_NUMBER"]`. Neither is likely to match reality: if `phone_number` were genuinely a username attribute, the second tester to sign up with the shared dummy `+10000000000` ([useAuth.ts:99](src/hooks/useAuth.ts#L99)) would have hit `UsernameExistsException`. No CloudFormation is checked in under `amplify/backend/auth/ARtifactAuth/`, so the Gen 1 CLI regenerates the whole auth template from `cli-inputs.json` on every push — meaning the *next* `amplify update auth` (for any reason) will either fail CFN validation or attempt to modify the immutable `UsernameAttributes` and roll the auth stack back. The AppSync API `dependsOn` auth, so that rollback can cascade. Reconcile against `describe-user-pool` before touching auth infrastructure; scoped as backlog 1A.1.

## Missing observability
No analytics events (scan success rate, quest completion, AR placement success), no Sentry breadcrumbs around the two flakiest flows (scan network call, AR asset fetch). The Railway server's health is invisible to the client team.
