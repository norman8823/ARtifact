# ARtifact — Project Overview

*Reconstructed from the codebase, July 2026. The README predates two major architecture changes (AR migration, scan backend swap) — this document reflects what the code actually does.*

## What it is

ARtifact is an iOS-first museum companion app for the Metropolitan Museum of Art. Visitors browse the collection, hunt artworks via gamified "Art Quests," identify pieces by pointing their camera at them (CNN image recognition), and view select works as 3D models in native AR. Artwork IDs are MET Object IDs; artwork data is enriched from the MET Museum API (~6,000+ records seeded into DynamoDB via `scripts/`).

Distribution: App Store (bundle `com.rauljiminian.ARtifact`, EAS build/submit, `ascAppId 6749166223`). iPad is intentionally unsupported. Expo Go is unsupported — ReactVision requires native builds (`npx expo prebuild && npx expo run:ios`).

## Tech stack

| Layer | Choice |
|---|---|
| App | React Native 0.81.5 / React 19.1 / Expo SDK 54, new architecture enabled, TypeScript |
| Navigation | expo-router v6 (file-based), stack + tabs |
| Server state | TanStack react-query v5 + AsyncStorage persistence (SWR pattern) |
| Backend | AWS Amplify: Cognito (auth), AppSync GraphQL (data), DynamoDB (storage), S3 (media) |
| Image recognition | Custom CNN on a Flask server, hosted on Railway (external to AWS) |
| AR | ReactVision / ViroReact (`@reactvision/react-viro`) native AR |
| Monitoring | Sentry (`artifact-ios` project, source maps via `sentry.properties`) |

## Architecture

### Navigation shape ([app/_layout.tsx](app/_layout.tsx))

Provider stack: `ThemeProvider → QueryProvider → AuthProvider → FavoritesProvider → Stack`.

- `index.tsx` — landing: email sign-in or "Browse as Guest" (guest goes straight to home)
- `(dashboard)/` — 4 tabs: **home**, **explore**, **artQuest**, **profile** (scan was removed from the tab bar; it's now a pushed route)
- Pushed stack routes: `artDetail`, `questDetail`, `collection`, `scan`, `arViewer`, `favorites`, `artworksVisited`, `questsCompleted`, `profileSettings`, `emailLogin` (+ non-functional `appleLogin`/`googleLogin` stubs)

### Data path: AppSync → DynamoDB, no Lambda

The main data path has **zero Lambda functions** — every model in [schema.graphql](amplify/backend/api/artifact/schema.graphql) is a pure `@model` with DynamoDB-direct resolvers. 13 models:

- **Catalog** (public read via API key, userPool write): `Artwork`, `Department`, `Quest`, `Rank`, `DidYouKnow`, `GalleryMap`, `ArtFact`, `AudioContent`
- **User state** (owner-only): `User`, `Favorited` (GSI `byUser`), `Visited` (GSI `byUserVisited`), `UserQuest` (GSI `byUserQuest`), `UserXP` (GSI `byUserXP`)

Notable modeling decision: `Quest.requiredArtworks` and `UserQuest.artworksVisited` are plain string-ID lists (no relations); quest progress is computed by set intersection in the client. `Artwork.isFeatured` has **no GSI**, so featured artworks require a filtered scan — bounded to ~500 items / 5 pages in [useArtworks.ts](src/hooks/useArtworks.ts) rather than the old `limit:1000` full fetch.

### Auth: dual-mode Cognito + guest API key

**Why:** the app must be browsable without an account (App Store friction), but favorites/quests/XP require identity.

- Signed-in users → Cognito User Pools (`authMode: "userPool"`); guests → AppSync API key (`authMode: "apiKey"`, read-only public data, key expires **2026-12-06**, checked client-side in [authMode.ts:13](src/aws/authMode.ts#L13)).
- [src/aws/authMode.ts](src/aws/authMode.ts) is a **module-level singleton**: AuthContext sets the mode once at startup/sign-in/sign-out; every hook reads it synchronously via `getAuthMode()`. This replaced per-hook `fetchAuthSession()` calls (9 hooks × every screen load) that were a major cold-start cost.
- [AuthContext.tsx](src/contexts/AuthContext.tsx) still carries a 250ms cold-start delay guarding a Cognito token-hydration race (gated to cold start only; TODO to find the deterministic wait).
- Guest gating UX: `AuthPromptModal` intercepts quest/AR/scan/favorite/profile actions; tab listeners in [(dashboard)/_layout.tsx](app/(dashboard)/_layout.tsx) block the artQuest/profile tabs for guests.

### Caching: react-query SWR layer over legacy hooks

**Why:** "first screen of the day" took 3–5s because there was no client cache, plus redundant auth fetches and unbounded scans. Root causes were client-side, not backend.

The design ([QueryProvider.tsx](src/providers/QueryProvider.tsx), [queries.ts](src/hooks/queries.ts)) is deliberately **incremental**:

- The pre-existing imperative hooks (`useArtworks`, `useQuests`, …) were kept intact and reused as `queryFn`s — rollback is "delete queries.ts, revert screens."
- Per-type staleness set **at call sites**: catalog 5min, user-state 0 (always revalidate, SWR).
- AsyncStorage persistence (24h, buster `"v1"`) hydrates the cache **before auth resolves**, so cached screens paint instantly on cold launch; user-keyed queries fill in when auth lands. Screens gate on `data === undefined` rather than `isLoading` (isLoading is false pre-auth).
- `queryClient.clear()` on sign-out prevents cross-account cache leakage.
- Migrated screens: home, profile, artQuest, favorites, artworksVisited. Still legacy: artDetail, questDetail, collection, explore (explore has its own `useInfiniteArtworks` pagination + client-side search/filter).

### Scan: camera → Railway Flask CNN → XP

**Why:** AWS Rekognition Custom Labels was replaced by a custom-trained CNN served from Flask on Railway (commit `bda74f0` "swap AWS Rekognition with custom built CNN model") — the Rekognition Lambda + API Gateway still exist in `amplify/backend/` but are dead code.

Flow ([app/scan.tsx](app/scan.tsx)):
1. `expo-camera` capture (quality 0.8) → multipart POST to `https://api.artifactar.com/predict` (host in `src/config/scanApi.ts`; LLC-owned domain in front of the LLC's Railway service since 2026-08-05, overridable via `EXPO_PUBLIC_SCAN_API_URL`)
2. Response `{success, prediction, confidence}` is **transformed into the old Rekognition shape** (`labels[{Name, Confidence}]`) so downstream code ([useScanSuccess.ts](src/hooks/useScanSuccess.ts)) didn't have to change — an adapter kept the swap low-risk.
3. Optional `expectedArtworkId` param (when launched from artDetail) validates you scanned the *right* artwork.
4. Success → `Visited` record + **100 XP** (first visit only) → `updateQuestProgress` marks the artwork in every active quest, completing quests whose sets are full → haptic + result modal → navigate to artDetail.

Note: Railway scales to zero on idle, so scan has the app's only true server cold start.

### AR: 8th Wall WebView → ReactVision native (see MIGRATION_NOTES.md)

**Why migrate:** the WebView approach was fragile — permission handshakes through a WebView, URL cache-busting hacks, retry logic to detect when 8th Wall was actually ready, and a hidden "prewarm" WebView. Native AR (ViroReact) got direct camera access and real 3D rendering, at the cost of dropping Expo Go.

Current pipeline:
- [artDetail.tsx](app/artDetail.tsx) → `/arViewer?sceneId=…` (gated on `artwork.hasAR`; `sceneId` replaced the old `arImage` param)
- [arViewer.tsx](app/arViewer.tsx) hosts `ViroARSceneNavigator` + a transparent tap overlay that captures screen taps *before* placement and is removed after (so drag/pinch/rotate reach Viro directly)
- [ArtworkARScene.tsx](components/ar-scenes/ArtworkARScene.tsx): waits for AR tracking (`isARReady`), fetches scene assets via the ReactVision SDK (`rvGetSceneAssets(sceneId)`), then **mounts the `Viro3DObject` only on tap-to-place** (hit-test at tap point, plane-priority). The ordering is deliberate and hard-won: mounting the model before placement caused invisible models in release builds, and fetching assets before tracking-ready broke tap-to-place (fixed in `9feea4f` and `15b6d3e`).

### Gamification model

- Scanning a new artwork = 100 XP, stored in a single per-user `UserXP` record updated in place.
- `Rank` tiers (seed data, `minXP`/`maxXP`) map XP → rank; profile shows progress to next rank.
- Quests: `startQuest` seeds `artworksVisited` with the intersection of already-visited artworks (retroactive credit); each scan updates all active quests; completion when the visited set covers `requiredArtworks`. (Quest `xpReward` is stored but never actually awarded — see Gaps.md.)
- Home features a **deterministic daily quest** (date-seeded selection) and a random-but-render-stable "Did You Know" fact.

## Why the big decisions (summary)

| Decision | Rationale (reconstructed) |
|---|---|
| Amplify `@model`-only API, no Lambda | Smallest possible backend for a small team; DynamoDB-direct resolvers mean no cold starts in the data path |
| Guest API-key mode | Zero-friction browsing; auth only where identity matters |
| CNN-on-Railway over Rekognition | Custom model accuracy/cost control; adapter layer preserved the Rekognition response contract so the app barely changed |
| ReactVision over 8th Wall WebView | Reliability + native UX; accepted losing Expo Go and taking on native build complexity |
| react-query bolted over legacy hooks | Fix perceived latency without a risky rewrite; explicit rollback path |
| Auth-mode singleton | Eliminate N× `fetchAuthSession()` per screen; one source of truth set by AuthContext |
| `freezeOnBlur` on dashboard | Cold-launch cache-hydration re-renders during push transitions desynced react-native-screens (dropped first back press); freezing the blurred subtree sidesteps it |

## Branch/workflow context

Active development happens on feature branches off **`development`** (not `main` — `main` is ~227 commits behind). Current workstream: `perf/screen-load-caching` (PR #3 → development).
