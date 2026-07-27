# Gaps.md — Weaknesses, Tech Debt, Missing Tests, Fragile Edges

*Audit of the codebase, July 2026. Ordered roughly by severity.*

> **How this file relates to the others.** Gaps.md is the **permanent defect register**: entries are never deleted, only marked `✅ FIXED` / `✅ RESOLVED` / `✅ NOT A BUG` with a pointer to what changed. That is deliberate — [backlog.md](backlog.md) *deletes* items when they ship, so if Gaps deleted them too there would be no record that a known weakness was ever addressed. Numbering is stable and cited from backlog.md and CLAUDE.md.
>
> So: **is it broken?** → here. **What's left to do about it?** → backlog.md (each open item below names its backlog id). **What was actually built?** → CLAUDE.md § Project state.
>
> **Two invariants to preserve:** (1) every **numbered** item here is either marked `✅` or names a live backlog id — an entry pointing at a deleted backlog item is a docs bug; (2) **every entry must be numbered.** An un-numbered trailing section can't be cited, and one (`Missing observability`, now #20) was silently missed when Gaps items were mapped to the backlog.

## Critical

### 1. Zero tests, zero CI — ✅ **RESOLVED** (see CLAUDE.md § Project state)
~~There is not a single `*.test.*` file, no jest/vitest config, no `.github/workflows`.~~ A jest-expo harness and [ci.yml](.github/workflows/ci.yml) run on PRs/pushes to `development`, with pure logic extracted to `src/utils/` and unit-tested (78 tests). As of 2026-07-27 **all three CI jobs are required** — tests, `tsc --noEmit`, and lint — after the pre-existing baseline (27 type errors, 8 lint errors) was cleared.

**Residual, not tracked as a defect:** coverage is unit-only. There are no component or E2E tests, so the release-only AR regressions (#13) still can't be caught by CI — only by a device build.

### 2. Live ReactVision API key committed in `app.json`
`rvApiKey: "rv_live_8fd77..."` sits in [app.json](app.json) plugin config (with `rvProjectId`). It ships in the binary anyway, but being in git history means it can't be rotated by config alone. Move to an EAS secret / env-substituted config (`app.config.js`) and rotate the key.

### 3. Guest API key hard-expires 2026-12-06
[authMode.ts:13](src/aws/authMode.ts#L13) hardcodes `GUEST_API_KEY_EXPIRY = 2026-12-06`. When the AppSync API key is rotated, the app needs a client update or guest mode dies. ~5 months away as of this audit. There is no server-driven config to extend it remotely.

### 4. Single point of failure: Railway scan endpoint
[scan.tsx:185](app/scan.tsx#L185) hardcodes `https://artifact-server-production.up.railway.app/predict`. No timeout, no retry, no failover, no request deduplication (rapid shutter taps fire concurrent requests). Railway free-tier scales to zero → first scan of the day eats a server cold start with no user-facing "warming up" state.

## Data / business-logic bugs

### 5. Quest `xpReward` is never awarded — ✅ NOT A BUG (by design)
Resolved 2026-07-13: the completion bonus was deliberately removed (it made XP tracking too hard). `xpReward` is descriptive — it equals 100 × the quest's artwork count, i.e. the scan XP you earn completing it. XP is scan-only (flat 100 in [useScanSuccess.ts](src/hooks/useScanSuccess.ts)); max earnable is 4700 = Art Legend threshold. Never wire a completion award — it would double-count.

### 6. XP award has no idempotency or concurrency safety — ✅ FIXED (see CLAUDE.md § Project state)
Resolved 2026-07-13: `awardXP` now does a conditional-update CAS loop with retry (`src/utils/xpAward.ts`), and new `UserXP`/`Visited` records use deterministic ids so duplicate creates collide instead of double-writing; `useScanSuccess` gates XP on the visit-create result. Residual note: the `byUserXP` GSI (timestamp SK) still hints at an abandoned append-only design — single-record-updated-in-place is now the settled pattern.

### 7. Retroactive quest credit is inconsistent
`startQuest` seeds progress from already-visited artworks (retroactive credit at start time), but artworks visited *between* quest creation and later scans only count via `updateQuestProgress`. If a user visits artwork X, then starts a quest containing X, they get credit; the model works — but a quest can silently auto-complete at start, flipping to the completion state with no celebration moment. **Celebration only** — per #5 there is no completion XP to award, and the scan XP was already granted at visit time.

### 8. `remainingFreeScans` / `isPremium` were dead schema — ✅ RESOLVED
`Quest.isPremium` is now enforced (gate in `questDetail`, rules in `src/utils/premiumAccess.ts`) and `User.isPremium` is written as a display/analytics mirror only — never read for gating. `User.remainingFreeScans` is permanently retained but unused client-side by decision (removing it breaks sign-in for already-shipped builds; see CLAUDE.md § Settled decisions).

## Architecture debt

### 9. Two coexisting data-fetch paradigms
The react-query layer ([queries.ts](src/hooks/queries.ts)) covers home/profile/artQuest/favorites/artworksVisited. artDetail, questDetail, collection, and explore still use legacy imperative hooks with local `useState` — no cache, refetch on every mount. This is a deliberate incremental strategy, but the boundary is invisible to a new contributor; finishing the migration (or documenting the split) is owed. Residual UX from the split: artworksVisited still spins on its uncached `getArtworksByIds` detail fetch; profile/artQuest have a ~300ms user-state spinner pre-auth (userId-keyed cache can't hydrate until auth resolves).

### 10. Explore search/filter is client-side over the whole table
[useInfiniteArtworks.ts](src/hooks/useInfiniteArtworks.ts) paginates 60 at a time but search + scannable/AR filters run client-side, with an auto-fetch loop that keeps pulling pages until ≥15 filtered results. Worst case (rare filter match) walks the entire ~6k-row table from the phone. Needs a `searchField` GSI or server-side filter.

### 11. `Artwork.isFeatured` has no GSI — and cannot have one directly
Featured artworks = filtered DynamoDB *scan*, bounded to 5 pages/500 items ([useArtworks.ts](src/hooks/useArtworks.ts)). Works today because featured items are seeded early in the table; silently breaks if a featured artwork lands beyond the scan bound.

*Tracked as backlog **P3.8**.* **Correction (2026-07-13): this is not a one-line `@index` fix.** DynamoDB key attributes must be String, Number, or Binary — **Boolean is not a valid key type**, so `@index` on `isFeatured: Boolean` cannot be deployed. (Consistent with the schema: all six existing `@index` directives are on `ID!` fields.) The real fix is a **sparse GSI on a String field**: add e.g. `featuredStatus: String @index(name: "byFeatured", sortKeyFields: ["id"])`, populate it with a constant like `"FEATURED"` **only** for featured artworks and leave it null elsewhere (items missing the key attribute are absent from the index, so the query reads only featured rows), backfill via `scripts/`, then switch `getFeaturedArtworks` to the generated index query. Estimate: schema + push + backfill script + query swap, not a one-liner.

### 11b. Hooks mapping fields that don't exist on the schema — ✅ **FIXED 2026-07-27**
Found while clearing the type baseline (backlog 0.1b), and only findable once `result.data` was properly narrowed — the untyped GraphQL result had been masking it:
- `src/hooks/useUserQuest.ts` (singular) mapped `visitedArtworks`, `totalArtworks`, `startedAt`, `completedAt` — **none** exist on `UserQuest` (the real fields are `artworksVisited`, `requiredArtworks`, `isCompleted`, `timestamp`). It also built `id` as `${userId}#${questId}` when real ids are AppSync UUIDs, so it could never have matched a record. Unused by any screen; **deleted**.
- `src/hooks/useInfiniteArtworks.ts` mapped **25 fields that don't exist** on `Artwork` (`period`, `dynasty`, `reign`, `objectBeginDate`, `accessionYear`, `isHighlight`, `creditLine`, `country`, `city`, …) — MET Museum API fields never added to the Amplify schema, so every one silently resolved to `undefined`. Verified nothing read them, then stripped from both the mapping and the local interface.

**Prevention:** this class of bug is exactly what the now-required typecheck job catches. Note `useDepartmentDetail` *deliberately* aliases `period: item.objectDate` — that one is intentional, not phantom.

### 12. Workarounds papering over unexplained races (each has a TODO)
- **250ms cold-start auth delay** ([AuthContext.tsx:52](src/contexts/AuthContext.tsx#L52)) — guards a Cognito token-hydration race nobody has pinned down; it's a guessed constant on the critical launch path.
- **`freezeOnBlur` on the dashboard** ([_layout.tsx:174](app/_layout.tsx#L174)) — masks a react-native-screens desync triggered by cache-hydration re-renders mid-transition. Correct fix is understanding the re-render storm. **Note (2026-07-27):** freezing doesn't remove the churn, it *defers* it — every held update flushes during the back transition, so the back press gets worse as re-render volume grows. Owner reports the dropped back press still happens intermittently from questDetail. One amplifier found and fixed: `EntitlementContext`'s value object was unmemoized, re-rendering all four consumers (incl. questDetail and two dashboard screens) on every provider state change. `AuthContext` and `FavoritesContext` have the same unmemoized-value pattern and are the next candidates. Not reproducible on demand in the Simulator.
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
| 4 unused Expo template components | ~~`Collapsible`, `ParallaxScrollView`, `HelloWave`, `ExternalLink`~~ | Deleted 2026-07-27 — zero importers, and they carried 4 of the type errors |
| `useUserQuest.ts` (singular) | ~~`src/hooks/useUserQuest.ts`~~ | Deleted 2026-07-27 — unused AND written against a schema that no longer exists (see #11b) |
| `phoneLogin` route | [_layout.tsx:157](app/_layout.tsx#L157) | Screen registered; file doesn't exist |

## Fragile edges

### 12b. The iOS Simulator couldn't run this app at all — ✅ **FIXED 2026-07-27**
ReactVision ships `ViroKit.framework` as a single **device-only** arm64 slice (`LC_BUILD_VERSION platform IOS`; no simulator slice, no `.xcframework`). The app compiled and the binary launched, but the JS bundle died at module load — `ArtworkARScene.tsx:3` → `arViewer.tsx:3`, `Cannot read property 'setJSAnimations' of null` — because importing `@reactvision/react-viro` touches native modules at module scope. Since expo-router eagerly requires every route module, this fired on **every** launch regardless of navigation, and the red box was not dismissible. There was no local feedback loop for *any* feature, which is a plausible contributor to the release-only regressions in #13.

**Fix:** the Viro imports moved into `components/ar-scenes/ARSceneNavigator.tsx`, which `app/arViewer.tsx` now `require()`s at render time instead of importing at module scope. A synchronous require, not `React.lazy`, so the navigator still mounts in the same commit as the tap overlay — device behavior and all three AR ordering invariants (#13) are unchanged, and `ArtworkARScene.tsx` is byte-identical. Verified on the Simulator: boots, navigates guest → home, loads live AppSync data.

**Standing constraint:** never add a module-scope Viro import anywhere under `app/`, or the whole app breaks on the Simulator again. Opening the AR screen itself still requires a physical device.

### 12c. Pushed routes have no auth guards, and the app registers a deep-link scheme *(backlog P3.9)*
`app.json` sets `"scheme": "artifact"`, and pushed routes don't check `isAuthenticated` — only `isAuthReady`. So `artifact://questDetail?id=X` and `artifact://profileSettings` both render for a guest (verified 2026-07-27). questDetail used to fail safe only because `startQuest` throws; the premium gate now checks auth explicitly *before* premium so a guest gets a sign-in prompt rather than a paywall. profileSettings still throws `UserUnAuthenticatedException` from `ensureUserInDB` on mount for a guest — harmless but noisy, and it means the screen half-renders. A shared auth guard on pushed routes would close the whole class.

### 13. AR scene ordering invariants are load-bearing and undocumented in code *(the FeaturePoint contradiction is backlog P3.10; the invariants themselves are CLAUDE.md landmine #1 — permanent, not a to-do)*
Three release-build regressions came from reordering: (a) `Viro3DObject` must mount only after tap-to-place (`9feea4f` — invisible model), (b) asset fetch must gate on `isARReady` (`15b6d3e` — broken tap-to-place), (c) the tap overlay must unmount after placement or gestures never reach Viro. Also: the hit-test includes `FeaturePoint` ([ArtworkARScene.tsx:137](components/ar-scenes/ArtworkARScene.tsx#L137)) while MIGRATION_NOTES.md claims it's excluded to prevent mid-air floating — code and doc disagree.

### 14. `AR_TEST_MODE` is a compile-time flag *(backlog P3.11)*
[arViewer.tsx:11-12](app/arViewer.tsx#L11) — hardcoded boolean + hardcoded test sceneId. Flipping it to `true` and shipping would silently route every AR view to the test scene.

### 15. Scan flow is `any`-typed end to end
`analysisResult`, `rekognitionData`, the Flask adapter — all `any` ([scan.tsx:54,80](app/scan.tsx#L54)). The Flask contract (`{success, prediction, confidence}`) exists only implicitly; a server-side response change would fail at runtime with no type error.

### 16. Stale README
README still documents Expo SDK 53, 8th Wall WebView AR, Lambda/Rekognition/API Gateway as the live architecture, and a 5-tab layout including Scan. Every one of those is wrong today. Misleads any new contributor (and any AI agent reading it cold — see CLAUDE.md).

### 17. Sentry DSN hardcoded
[_layout.tsx:21](app/_layout.tsx#L21). Acceptable for a client DSN, but combined with no environment split, dev sessions pollute production Sentry.

## Added after the initial audit

*Numbering continues from above so existing `*(Gaps #N)*` references in [backlog.md](backlog.md) stay valid. Severity is noted per item rather than by section.*

### 18. "Delete Account" was a non-functional stub — ✅ **FIXED 2026-07-27**
The button answered with *"contact support"*, which guideline 5.1.1(v) does not accept. Now real: `src/hooks/useAccountDeletion.ts` + `src/utils/accountDeletion.ts`. Owned rows are deleted before the Cognito identity and `canDeleteIdentity()` aborts if any row failed — see CLAUDE.md § Project state for why that ordering is load-bearing. **Still owed:** device QA against a throwaway account, and Apple token revocation once Sign in with Apple ships (backlog 1A.6).

### 19. **High** — Amplify auth config diverges from the live Cognito pool
[cli-inputs.json:44-46](amplify/backend/auth/ARtifactAuth/cli-inputs.json#L44) declares `"usernameAttributes": ["email, phone_number"]` — a single malformed string, not a legal `UsernameAttributes` value — while [backend-config.json:69](amplify/backend/backend-config.json#L69) says `["EMAIL","PHONE_NUMBER"]`. Neither is likely to match reality: if `phone_number` were genuinely a username attribute, the second tester to sign up with the shared dummy `+10000000000` ([useAuth.ts:99](src/hooks/useAuth.ts#L99)) would have hit `UsernameExistsException`. No CloudFormation is checked in under `amplify/backend/auth/ARtifactAuth/`, so the Gen 1 CLI regenerates the whole auth template from `cli-inputs.json` on every push — meaning the *next* `amplify update auth` (for any reason) will either fail CFN validation or attempt to modify the immutable `UsernameAttributes` and roll the auth stack back. The AppSync API `dependsOn` auth, so that rollback can cascade. Reconcile against `describe-user-pool` before touching auth infrastructure; scoped as backlog 1A.1.

### 21. Privacy policy and the binary disagree *(backlog 0.6)*
A policy is live at https://artifactar.com/privacy/, so the missing-URL blocker is closed. But it and the app disagree: **Sentry is not disclosed at all** despite receiving IP, identifiers and *screen recordings*; the policy says location is never requested while `app.json` still declares two location strings; and it claims images are "stored securely" when the app stores none (verified — the only S3 upload is in the commented-out dead Rekognition block at `scan.tsx:236`; the live path POSTs to Railway and retains nothing). The App Privacy questionnaire has also never been filled.

### 22. Declared-but-unused permissions, and Sentry records screens — ✅ **FIXED 2026-07-27** *(policy text still to publish: backlog 0.6)*
**Location resolved 2026-07-27** — both usage strings removed and `expo-location` uninstalled. ~~`app.json` declares two location usage strings and ships `expo-location`, but nothing imports it;~~ Remaining: `expo-web-browser` appears unused too. Apple rejects unused permission requests, and each one adds an App Privacy obligation. Separately, `mobileReplayIntegration()` is active at a 10% session / 100% error sample rate, so real user screens are being recorded — fine for a beta, but undisclosed and worth an explicit decision before taking payments. `PrivacyInfo.xcprivacy` exists only under the gitignored `/ios`, so it is regenerated and effectively uncontrolled.

### 20. Missing observability outside the paywall *(backlog P3.12)*
No analytics events for the core loop (scan success rate, quest completion, AR placement success), and no Sentry breadcrumbs around the two flakiest flows (scan network call, AR asset fetch). The Railway server's health is invisible to the client team. Paywall instrumentation now exists (backlog 1.6) — this is everything else. Numbered so it can be cited; it was previously an un-numbered trailing section and was therefore missed when Gaps items were mapped to the backlog.
