# CLAUDE.md

ARtifact — iOS museum companion app for the Met (browse artworks, camera-scan to identify them, gamified quests/XP/ranks, native AR viewing). Expo SDK 54 / RN 0.81.5 / React 19 / TypeScript / expo-router v6, new architecture enabled.

**⚠️ The README is stale** — it describes Expo 53, 8th Wall WebView AR, and a Lambda/Rekognition scan backend. All replaced. Trust this file and `project.md` (full architecture) / `Gaps.md` (known debt), not the README.

## Commands

- **Run:** `npx expo run:ios` (requires `npx expo prebuild` after native config changes). **Expo Go does NOT work** — ReactVision needs native builds.
- **Lint:** `npm run lint`. **Tests: none exist** (no jest config — don't look for them).
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
- Unimplemented-by-design: `User.isPremium`, `remainingFreeScans`, quest `xpReward` (displayed, never awarded).
- `Artwork.isFeatured` has **no GSI** — featured fetch is a bounded scan (5 pages max). Adding featured artworks deep in the table silently breaks it.

## Current workstream (July 2026)

Branch `perf/screen-load-caching` → PR #3 into `development`. Fixed "first screen of the day = 3–5s spinner": auth-mode singleton, react-query SWR layer, cache-paint before auth, bounded featured fetch, parallelized detail fetches, plus AR/nav regression fixes. **Pending:** TestFlight before/after measurement (user runs it). Skipped deliberately: `primaryImageSmall` image swap (needs live-table verification that the field is populated).

## Conventions

- Match conventional-commit prefixes and keep commits scoped (see git log).
- Colors from `constants/Colors.ts` (`metRed` #E4012A is the brand color); shared shadows from `constants/Shadow.ts`.
- Artwork IDs are MET Object IDs (strings). Quest progress = string-set intersection over artwork IDs.
- Query keys: catalog `["artworks","featured"]`, `["departments"]`, `["didYouKnow"]`, `["quests","all"]`; user `[type, userId]`. New user-keyed queries must include `userId` in the key (cache-clear on sign-out depends on it).
