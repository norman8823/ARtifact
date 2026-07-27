# CLAUDE.md

ARtifact — iOS museum companion app for the Met (browse artworks, camera-scan to identify them, gamified quests/XP/ranks, native AR viewing). Expo SDK 54 / RN 0.81.5 / React 19 / TypeScript / expo-router v6, new architecture enabled.

**⚠️ The README is stale** — it describes Expo 53, 8th Wall WebView AR, and a Lambda/Rekognition scan backend. All replaced. Trust this file and `project.md` (full architecture) / `Gaps.md` (known debt), not the README.

## Commands

- **Run:** `npx expo run:ios` (requires `npx expo prebuild` after native config changes). **Expo Go does NOT work** — ReactVision needs native builds. Pass `--device "<name>"` if the default target isn't in Xcode's destination list.
- **The Simulator works for everything except AR** (fixed 2026-07-27). ViroKit is a **device-only** framework (`LC_BUILD_VERSION platform IOS`, no simulator slice), and importing `@reactvision/react-viro` touches native modules at module scope — so a static import used to crash the app on launch, since expo-router eagerly loads every route including `arViewer`. Fixed by loading Viro lazily via `components/ar-scenes/ARSceneNavigator.tsx`, required at render time inside `arViewer.tsx`. **Don't reintroduce a module-scope Viro import in `app/` — it breaks the whole app on the Simulator, not just AR.** Opening the AR screen itself still needs a real device.
- If `pod install` fails with `Unicode Normalization not appropriate for ASCII-8BIT`, the shell has no UTF-8 locale — prefix with `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`.
- **Lint:** `npm run lint`. **Tests:** `npm test` (jest-expo; pure-logic units in `src/utils/__tests__/`). CI (`.github/workflows/ci.yml`) requires tests to pass; typecheck/lint are advisory until the pre-existing baseline is fixed (backlog P0.1b).
- **Builds:** EAS (`eas.json`): development (simulator) / preview / production. Sentry source maps via `sentry.properties` (auth token from `SENTRY_AUTH_TOKEN` env).
- **Backend:** `amplify push` from repo root regenerates `src/API.ts` + `src/graphql/*` after schema changes.
- **Secrets:** AWS config from `EXPO_PUBLIC_*` env vars in `.env` (gitignored). Sentry DSN and ReactVision API key are committed (known issue, Gaps.md #2).

## Git workflow

**PRs target `development`, NOT `main`** — main is ~227 commits behind. Branch naming: `perf/…`, `fix/…`. Conventional-commit style messages (`perf(cache):`, `fix(ar):`).

## Architecture in 60 seconds

- **Data path:** AppSync GraphQL → DynamoDB direct (`@model` resolvers only, **zero Lambda** in the data path — "Lambda cold start" is never the cause of slow screens). Schema: `amplify/backend/api/artifact/schema.graphql`, 13 models. Catalog models are public-read (API key); user models are owner-only with GSIs (`byUser`, `byUserVisited`, `byUserQuest`, `byUserXP`).
- **Scan path:** `app/scan.tsx` → multipart POST to **Railway Flask CNN** `https://artifact-server-production.up.railway.app/predict` → response adapted to the legacy Rekognition shape (`labels[{Name: artworkId, Confidence}]`) → `useScanSuccess` awards 100 XP on first visit + updates quest progress. Railway scales to zero → the only real server cold start in the app, scan-only. The Rekognition Lambda in `amplify/backend/function/analyzeImage` is **dead code**, kept intentionally.
- **Auth:** dual-mode. Signed-in = Cognito userPool; guest = AppSync API key (read-only, expires **2026-12-06**, hardcoded in `src/aws/authMode.ts:13`). `authMode.ts` is a module singleton — **only AuthContext calls `setAuthMode()`**; hooks read `getAuthMode()` synchronously. Never add `fetchAuthSession()` calls to data hooks (that redundancy was a major perf bug, deliberately removed).
- **Caching:** react-query v5 + AsyncStorage persistence (`src/providers/QueryProvider.tsx`, buster "v1", 24h). Wrappers in `src/hooks/queries.ts` reuse the legacy imperative hooks as queryFns. **staleTime is set at call sites**: catalog 5min, user-state 0 (SWR). `queryClient.clear()` on sign-out. Cache hydrates from disk *before* auth resolves — cached screens paint pre-auth by design.
- **AR:** ReactVision/Viro. `artDetail` → `/arViewer?sceneId=…` → `ViroARSceneNavigator` → `components/ar-scenes/ArtworkARScene.tsx`. Assets come from the ReactVision SDK `rvGetSceneAssets(sceneId)` (not `useSceneModel` — that's a dead stub).
- **Navigation:** 4 dashboard tabs (home/explore/artQuest/profile); scan, artDetail, questDetail, arViewer etc. are pushed stack routes. Guests are blocked from artQuest/profile tabs and quest/AR/scan/favorite actions via `AuthPromptModal`.

## Landmines — do not "clean up" these without understanding them

1. **AR ordering invariants** (three release-only regressions live here):
   - `Viro3DObject` mounts **only after tap-to-place** (mounting early = invisible model in release builds, fix `9feea4f`).
   - Scene-asset fetch gates on `isARReady` (fetching early = broken tap-to-place, fix `15b6d3e`).
   - The tap overlay in `arViewer.tsx` unmounts after placement so drag/pinch reach Viro.
   - AR bugs often reproduce **only in release/TestFlight builds**, not dev.
2. **`freezeOnBlur: true`** on the dashboard in `app/_layout.tsx` — prevents cold-launch cache-hydration re-renders from desyncing react-native-screens (symptom: first back press dropped). Don't remove.
3. **250ms cold-start delay** in `AuthContext.tsx` — guards a Cognito token-hydration race. Gated to cold start only. Has a TODO; replace only with a deterministic wait, never just delete.
4. **`useQuests` AppSync cache-bypass** (custom timestamped `GetFreshQuests` query) — deliberate, guards quest-definition freshness. Has a TODO. Do not revert to the standard query without solving the staleness it works around.
5. **Screens gate on `data === undefined`, not `isLoading`** (favorites, artworksVisited) — `isLoading` is false pre-auth and caused empty-state flashes. Keep this pattern when touching migrated screens.
6. **The two-paradigm data layer is intentional**: react-query wrappers (home/profile/artQuest/favorites/artworksVisited) over untouched legacy hooks (artDetail/questDetail/collection/explore). Rollback strategy = delete `queries.ts` + revert screens. Don't refactor the legacy hooks' signatures casually — they're the queryFns.
7. **`AR_TEST_MODE`** in `arViewer.tsx:11` must stay `false` in commits — `true` hardwires a test scene.

## Known-stale / dead things (don't be misled)

- Dead: `analyzeImage` Lambda, `rekognitionApi` API Gateway, commented Rekognition block in scan.tsx, `ARPrewarmManager.tsx` + `ARPermissionManager.ts` (8th Wall remnants), `useSceneModel.ts`, `arImage` field (replaced by `sceneId`), `appleLogin`/`googleLogin` stubs, `phoneLogin` route (no file), `aws-sdk` v2 app dependency.
- Permanently unimplemented by decision: `remainingFreeScans`, quest `xpReward` as a completion bonus (see Settled decisions). `User.isPremium` is now written, but as a mirror only — **never read it to gate anything**; gate on `EntitlementContext`.
- `Artwork.isFeatured` has **no GSI** — featured fetch is a bounded scan (5 pages max). Adding featured artworks deep in the table silently breaks it.

## Project state — *this section is the tracker; keep it current*

**`backlog.md` is a to-do list, not a status board.** What is *done* lives here. What is *left* lives there. What is *broken* lives in `Gaps.md`.

*Last updated 2026-07-27.*

**Shipped (on `development`, not yet released):**
- **Perf** — "first screen of the day = 3–5s spinner" fixed: auth-mode singleton, react-query SWR layer, cache-paint before auth, bounded featured fetch, parallelized detail fetches (PR #3). *TestFlight before/after measurement still never ran.*
- **Test harness + CI** — jest-expo, pure logic in `src/utils/` (`questProgress`, `rankUtils`, `scanAdapter`, `xpAward`, `premiumAccess`, `featuredQuest`), GitHub Actions on PRs to `development`. Tests gate; typecheck/lint advisory (backlog 0.1b).
- **XP concurrency fix** — `awardXP` is a CAS loop with deterministic record ids (`src/utils/xpAward.ts`).
- **Simulator unblocked** (`3cf0386`) — Viro loads lazily, so the app runs on the Simulator; only the AR screen needs a device.

**P1 premium tier — code complete, unverified against a real purchase.**
Model: **one-time non-consumable $5.99 lifetime unlock** (not a subscription — finite content, episodic museum usage; see `premium-tier.md`). Library: `expo-iap` 4.7.1 (note `request.apple`, not the deprecated `request.ios`). Free quests: **Art Essentials, Bronze Legacy, Sacred Animals** (10 of 47 artworks).
- *Built:* `src/iap/{products,storeKit}.ts` (the only importers of expo-iap), `src/contexts/EntitlementContext.tsx` (provider in `app/_layout.tsx`), pure rules + 30 tests in `src/utils/premiumAccess.ts`, `components/PaywallModal.tsx`, the gate in `questDetail.tsx`, lock badges on `artQuest`/`home`, Purchases + Restore in `profileSettings.tsx`, Sentry paywall breadcrumbs, and `scripts/markPremiumQuests.js`.
- *Blocked on the user:* (1) **App Store Connect** — create the non-consumable `com.rauljiminian.ARtifact.premium.lifetime` and finish the Paid Apps agreement + tax/banking, or `fetchProducts` returns an empty array; (2) add `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_REGION` to `.env` so `markPremiumQuests.js` can run (dry-run first); (3) **TestFlight/device QA** of purchase, restore and refund — IAP does not work in the Simulator, and the paywall needs a signed-in account.
- *Apply the quest flags late:* already-shipped builds render a "Premium" badge with no gate, so marking early shows a badge on quests users can still start free. Bump the react-query `buster` in `QueryProvider.tsx` to `"v2"` in the release that ships the gate.

**Account deletion — shipped (guideline 5.1.1(v) unblocked).** `src/hooks/useAccountDeletion.ts` + `src/utils/accountDeletion.ts`. **Ordering is load-bearing:** every owned row (`Favorited`, `Visited`, `UserQuest`, `UserXP`, `User`) is deleted BEFORE the Cognito identity, and `canDeleteIdentity()` aborts the whole thing if any row failed — all user models are `@auth(allow: owner)`, so killing the identity with rows left behind makes them permanently unreadable and undeletable. Identity deletion uses Amplify v6's client-side `deleteUser()` — no admin IAM, no Lambda. UI is a single red-button warning modal (a typed-DELETE step was built then removed as redundant). Still owed: device QA against a throwaway account, and Apple token revocation once Sign in with Apple ships (backlog 1A.6).

**Planned, not started:** P1A Sign in with Apple (native sheet + Cognito CUSTOM_AUTH triggers). Fully designed in `backlog.md`; do 1A.1 first — the Amplify auth config diverges from the live pool and the next `amplify update auth` can roll back the stack.

## Settled decisions — don't relitigate these

- **XP is scan-only.** 100 per first-visit artwork, max 4700 (= 47 scannable artworks = top rank threshold). Quest `xpReward` is *descriptive* (100 × artwork count), never awarded on completion — doing so would double-count.
- **`User.remainingFreeScans` stays in the schema permanently.** Shipped builds request it in their generated selection sets; AppSync fails the *whole operation* on an unknown field, so removing it breaks sign-in for anyone who hasn't updated. Client-side usage is already gone — that's the end state.
- **Premium is a one-time non-consumable lifetime unlock**, not a subscription. StoreKit is the source of truth; `User.isPremium` in DynamoDB is a display/analytics mirror and must never be used as a gate. No webhook backend (preserves zero-Lambda).
- **`Artwork.isFeatured` cannot take a GSI directly** — DynamoDB key attributes must be String/Number/Binary, and it's a Boolean. Needs a sparse String field instead (Gaps #11).

## Conventions

- Match conventional-commit prefixes and keep commits scoped (see git log).
- Colors from `constants/Colors.ts` (`metRed` #E4012A is the brand color); shared shadows from `constants/Shadow.ts`.
- Artwork IDs are MET Object IDs (strings). Quest progress = string-set intersection over artwork IDs.
- Query keys: catalog `["artworks","featured"]`, `["departments"]`, `["didYouKnow"]`, `["quests","all"]`; user `[type, userId]`. New user-keyed queries must include `userId` in the key (cache-clear on sign-out depends on it).
