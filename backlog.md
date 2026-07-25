# Backlog

*Ordered by priority AND order of operations — items within a phase are sequenced so earlier ones de-risk later ones. Driving goal: ship the premium tier (premium-gated quests, first 3 quests free, no scan limits).*

**Product decisions locked in:**
- Premium gates **quests only**. Scan count is NOT gated — `remainingFreeScans` is officially dead.
- First 3 quests free, the rest premium. Mechanism: the existing `Quest.isPremium` flag (already in schema, already fetched, already renders a badge in artQuest) — mark all but the 3 chosen free quests as premium in data. No "ordering" concept needed.
- Open decision: **which** 3 quests are free (pick beginner-friendly ones with high-traffic galleries).

---

## P0 — Foundations (do these first; they de-risk the premium build)

### 0.1 Minimal test harness + CI gate *(Gaps #1)* — ✅ DONE
jest-expo harness + GitHub Actions CI on PRs/pushes to `development`. Pure logic extracted to `src/utils/` (questProgress, rankUtils, scanAdapter) and unit-tested; hook signatures unchanged. Unit tests are the required CI gate; typecheck and lint run as **advisory** jobs because the pre-existing baseline fails (~29 tsc errors / 8 lint errors).

### 0.1b Fix the tsc + lint baseline, then make CI strict
Clean up the ~29 pre-existing `tsc --noEmit` errors (14 files — mostly `uri: string | null` vs `string | undefined` image props, implicit-any params in legacy hooks, GraphQL result narrowing) and the 8 lint errors, then remove `continue-on-error` from the typecheck/lint jobs in `.github/workflows/ci.yml`.

~~Rank wrap quirk~~ **resolved**: top rank is now explicitly open-ended in `getRankForXP` ("minXP or greater", never wraps to lowest), and profile.tsx's duplicated inline calc now uses the shared function. Live rank data verified (2026-07-13): bands 0-900 / 901-1800 / 1801-3000 / 3001-4699 / 4700-999999; max earnable XP is exactly 4700 (47 scannable artworks × 100, identical to the union of all 12 quests' artworks).

### 0.2 Fix the XP read-modify-write race *(Gaps #6)* — ✅ DONE
`awardXP` now uses a compare-and-swap loop (`src/utils/xpAward.ts`): conditional AppSync update on `xpPoints eq <read value>`, re-read + retry on conflict (max 3). New `UserXP` records use deterministic id `xp-<userId>` and new `Visited` records use `<userId>#<artworkId>`, so concurrent duplicate creates collide on the resolver's id-uniqueness condition instead of double-writing. `useScanSuccess` gates XP on the visit-create result (null = already visited → no award). Existing rows with random ids are unaffected (all reads go through userId filters/GSIs).

### 0.3 Quest `xpReward` — ✅ RESOLVED by decision (no completion bonus)
**Decision (owner, 2026-07-13): there is no quest-completion bonus — it was removed deliberately because it made XP tracking too hard.** XP is scan-only: 100 per first-visit artwork, max 4700 (= 47 scannable artworks = union of all 12 quests = Art Legend threshold). `xpReward` on a quest is *descriptive*: it equals 100 × artwork count, i.e. what you earn by scanning the quest's artworks. Do NOT wire a completion award — that would double-count. Optional cosmetic follow-up: make the quest XP badge copy read as "earn up to N XP" if users misread it as a bonus.

### 0.4 One batched schema change + `amplify push`
Batch all schema edits into a single push to avoid repeated regen churn:
- Remove `User.remainingFreeScans` (scan gating is dead by decision).
- Keep `User.isPremium` and `Quest.isPremium` (they become load-bearing).
- Optional while we're in there: add `@index` on `Artwork.isFeatured` *(Gaps #11)* — one line, removes the fragile bounded-scan.

---

## P1 — Premium tier (the epic)

### 1.1 Entitlement architecture decision
Recommendation: **RevenueCat** (`react-native-purchases`) over raw StoreKit — handles receipt validation, restore, sandbox, and entitlement state without us running a backend. Client SDK is the entitlement source of truth; mirror to `User.isPremium` in DynamoDB on app launch for display/analytics only (not enforcement). Note: there is deliberately no Lambda in the data path — do NOT build a webhook backend for v1; client-side gating is fine for content (this is a paywall, not a security boundary).

### 1.2 Mark quest data
Seed-script pass (`scripts/`): set `isPremium: true` on all quests except the 3 chosen free ones. Freshness propagates fast thanks to the `GetFreshQuests` cache-bypass — do not remove that workaround during this work (CLAUDE.md landmine #4).

### 1.3 Gating UI
- Extend the existing `AuthPromptModal` pattern into a `PaywallModal` (guest → auth prompt first; signed-in free user → paywall).
- Gate points: `startQuest` in questDetail (the enforcement point), quest cards in artQuest (lock affordance on premium quests), featured-quest card on home.
- Premium badge already renders — restyle to lock/unlock state.

### 1.4 Purchase flow
RevenueCat purchase + **Restore Purchases** (App Store review requirement — put it in profileSettings), loading/failure states, entitlement refresh on foreground. Mirror entitlement to `User.isPremium` post-purchase.

### 1.5 App Store Connect setup *(user task, can parallelize with 1.3–1.4)*
Subscription product(s), pricing, App Store agreements/tax/banking, sandbox testers.

### 1.6 Paywall analytics *(pull-forward from Gaps "observability")*
Ship WITH launch, not after: paywall views, purchase starts/completions/restores, quest-start blocked events. Minimum: Sentry breadcrumbs + RevenueCat's built-in charts. Without this we can't tune the free/premium split.

### 1.7 TestFlight QA pass
IAP sandbox testing; explicitly re-test the AR landmines (release-only regressions) since premium touches quest/home/detail screens.

---

## P2 — Operational deadlines (calendar-driven; schedule around premium launch)

### 2.1 Guest API key expiry — **hard deadline 2026-12-06** *(Gaps #3)*
Rotate the AppSync key, update `GUEST_API_KEY_EXPIRY` in `authMode.ts`, ship well before expiry (target: in the premium release or earlier — users need time to update). Consider a remote-config escape hatch so the next rotation doesn't require a forced app update.

### 2.2 Rotate + relocate the ReactVision API key *(Gaps #2)*
Move `rvApiKey` out of `app.json` into an EAS secret via `app.config.js`, then rotate the key. Do before the premium marketing push increases scrutiny.

### 2.3 Harden the Railway scan endpoint *(Gaps #4)*
Paying users will expect scan to work. Add fetch timeout + one retry + in-flight dedup on the shutter button; add a "warming up" state for Railway cold starts (or move off scale-to-zero). Type the Flask response contract while in there *(Gaps #15)*.

---

## P3 — Debt paydown (after premium ships)

1. **Dead-code deletion batch** *(Gaps dead-code table)*: Rekognition Lambda + `rekognitionApi`, commented scan block, `ARPrewarmManager`/`ARPermissionManager`, `useSceneModel`, `arImage`, apple/google login stubs, `phoneLogin` route, `aws-sdk` v2 app dep. One PR, pure deletions.
2. **README rewrite** *(Gaps #16)* — collapse into a short intro pointing at project.md.
3. **Finish or fence the react-query migration** *(Gaps #9)* — migrate artDetail/questDetail/collection, or document the boundary; kills the residual spinners.
4. **Server-side explore search** *(Gaps #10)* — GSI or search field; stops client-side full-table walks.
5. **Retire workarounds behind their TODOs** *(Gaps #12)* — 250ms auth delay → deterministic wait; understand the freezeOnBlur desync; document/solve the AppSync quest staleness. Low urgency; don't destabilize around launch.
6. **Sentry env split** *(Gaps #17)* + broader analytics beyond the paywall.
7. **Retroactive quest credit UX** *(Gaps #7)* — auto-complete-at-start should still celebrate + award (partially addressed by 0.3).

---

## Explicitly rejected / not doing
- **Scan-count gating** — `remainingFreeScans` removed (P0.4). Premium = quest access only.
- **Webhook/server-side entitlement enforcement for v1** — client-gated content is acceptable; revisit only if abuse appears.
