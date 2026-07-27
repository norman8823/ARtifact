# Premium Tier — Decision Doc (P1.1)

*Drafted 2026-07-13. Facts about third-party options verified against live sources on that date (see Sources).*

> **Status (2026-07-27): decided and implemented.** **D1 → one-time lifetime unlock**, not a subscription. **D2 → `expo-iap` 4.7.1.** Product `com.rauljiminian.ARtifact.premium.lifetime`, non-consumable, `$5.99` fallback price (`src/iap/products.ts`). The adapter, `EntitlementContext` and the pure gating rules are built; see [CLAUDE.md § Project state](CLAUDE.md). **D3 — which 3 quests are free — is the one decision still open** and blocks backlog 1.2. This doc is now historical rationale; it is not the source of truth for status.

## Goal

Gate quests behind a premium purchase. **First 3 quests free, remaining 9 premium.** Scan count is explicitly NOT gated (decided — see CLAUDE.md § Settled decisions).

## What already exists (verified in code)

Premium needs **no schema change and no `amplify push`**:

- `User.isPremium` and `Quest.isPremium` are already in [schema.graphql](amplify/backend/api/artifact/schema.graphql).
- `useQuests` already selects and maps `isPremium` ([useQuests.ts:121,173](src/hooks/useQuests.ts#L121)).
- [artQuest.tsx:179](app/(dashboard)/artQuest.tsx#L179) already renders a "Premium" badge when the flag is set.
- Nothing enforces anything yet — the flag is display-only.

**A load-bearing simplification:** guests are already blocked from the artQuest tab and all quest actions (`AuthPromptModal`). So **the paywall can only ever be shown to a signed-in user.** Every entitlement path can assume a Cognito identity exists. Keep that invariant — it removes the entire "guest bought premium, now what?" problem.

---

## D1 — Product model: one-time unlock or subscription? ⬅ decide this first

This is upstream of every technical choice, and it's the real answer to "do I really need RevenueCat."

| | One-time unlock (non-consumable) | Auto-renewing subscription |
|---|---|---|
| Fit for a museum app | **Strong** — visits are episodic; users come to the Met a few times, not monthly | Weak — hard to justify recurring value on a fixed set of 12 quests / 47 artworks |
| Lifecycle complexity | Trivial: bought or not, forever | Renewal, lapse, billing-retry, grace period, refund, upgrade/downgrade |
| Needs RevenueCat? | **No** — `expo-iap` is sufficient | **Yes, effectively** — this is exactly what it exists for |
| Revenue shape | One payment per user | Recurring, higher LTV *if* retention exists |

**Recommendation: one-time unlock.** The content is finite and the usage is episodic, so a subscription would be both a harder sell and dramatically more code. It also makes D2 nearly free. Revisit subscriptions only if the catalog grows into something continuously updated.

## D2 — Library: `expo-iap` or RevenueCat (`react-native-purchases`)?

Expo officially recommends exactly these two. (`react-native-iap` — which I'd otherwise have suggested — **was archived by its owner on 2026-04-26**; do not adopt it.)

| | `expo-iap` | RevenueCat (`react-native-purchases`) |
|---|---|---|
| What it is | Low-level StoreKit / Play Billing wrapper, OpenIAP-compliant, built on Expo Modules | Wrapper + hosted entitlement service, analytics, paywall tooling |
| Cost | Free | Free to **$2,500 monthly tracked revenue**, then **1% of tracked revenue** *(verify at signup — pricing pages disagree slightly on whether MTR is gross or net of Apple's cut)* |
| You must build | Entitlement state, restore wiring, local caching | Much less — SDK exposes entitlement state directly |
| Third-party dependency | None | Account + SDK + vendor in the purchase path |
| Best when | Single platform, one product, simple lifecycle | Subscriptions, cross-platform, or you want analytics/paywall A-B tooling free |

**Recommendation, conditional on D1:**
- **If one-time unlock (recommended): `expo-iap`.** No vendor, no fee, no account. The entitlement question collapses to "has this Apple ID bought the unlock," which StoreKit answers locally with Apple-signed verification. RevenueCat's core value (subscription lifecycle) would go unused.
- **If subscription: RevenueCat.** Do not hand-roll renewal/lapse/grace-period handling.

Either way this requires a native build — already true for this app (ReactVision), so no new constraint. **Both keep the zero-Lambda architecture**: entitlement is read client-side, so no webhook backend is needed for v1. (If server-side validation is ever wanted, the existing Railway Flask server is a place to put it — but it is not needed to ship.)

## D3 — Which 3 quests are free?

Product call. Suggest picking for onboarding quality, not size: quests in high-traffic, easy-to-find galleries so a first-time user can actually finish one and feel the loop. Current 12, by artwork count: Bronze Legacy (3), Euro Trip (3), Islamic Artistry (3), Sacred Animals (3), African Kingdoms (4), Art Essentials (4), Asian Altars (4), Marble Legends (4), Masked Traditions (4), Modern Icons (5), Musical Treasures (5), Renaissance Masterpieces (5).

**Suggestion:** "Art Essentials" (sounds like the intended starter) + "Renaissance Masterpieces" and "Modern Icons" (marquee names that sell the rest). Free tier = 13 of 47 artworks ≈ 1300 XP, which lands a completionist in the middle of Art Expert — enough progress to feel the rank system without reaching Art Legend.

---

## Architecture (once D1/D2 are set)

**Entitlement source of truth: StoreKit (via the chosen SDK), not our database.**
`User.isPremium` in DynamoDB is a **mirror for display and analytics only.** Never gate content on it alone — a failed mirror write must not revoke access, and a stale `true` must not grant it. Enforce on the StoreKit-derived value.

```
app launch / foreground
  └─ read entitlement from SDK  ──▶ EntitlementContext (in-memory)
       ├─ persist last-known value to AsyncStorage (offline fallback)
       └─ if signed in and value changed: mirror to User.isPremium (fire-and-forget)
```

**Gating points** (enforcement, not decoration):
1. `startQuest` in [questDetail.tsx](app/questDetail.tsx) — the real gate. A premium quest must not be startable.
2. Quest cards in [artQuest.tsx](app/(dashboard)/artQuest.tsx) — lock affordance on premium quests (badge already exists; restyle to locked/unlocked).
3. Featured-quest card on [home.tsx](app/(dashboard)/home.tsx) — either exclude premium quests from daily selection, or show it locked. Prefer showing it locked: it advertises the tier.

**PaywallModal** — mirror the existing `AuthPromptModal` pattern (same blur + modal shape) so it feels native to the app. Guests never reach it (see invariant above).

**Restore Purchases** is an App Store review requirement — put it in [profileSettings.tsx](app/profileSettings.tsx). Reviewers do check.

**Offline / indeterminate entitlement: fail to last-known-good**, not to locked. A paying user in a museum basement with no signal must keep access. Cache in AsyncStorage; treat "cannot determine" as "use cached value."

**react-query interaction:** entitlement must NOT live in the persisted react-query cache — that cache has a 24h `maxAge` and survives sign-out until `clear()`. Keep entitlement in its own context with its own AsyncStorage key, cleared on sign-out alongside `queryClient.clear()`.

**No test-mode bypass flag.** `AR_TEST_MODE` in [arViewer.tsx:11](app/arViewer.tsx#L11) is already a standing landmine (must stay `false` in commits). Do not create a `PREMIUM_TEST_MODE` twin — if a dev bypass is needed, gate it on `__DEV__` so it cannot ship enabled.

## Rollout order

1. Decide D1–D3.
2. App Store Connect: create the product, complete tax/banking agreements, add sandbox testers. **This gates testing and often takes longest — start it first.** *(user task)*
3. Mark quest data: set `isPremium: true` on the 9 non-free quests via a `scripts/` pass. The `useQuests` AppSync cache-bypass ([landmine #4](CLAUDE.md)) means this propagates fast — do not remove that workaround during this work.
4. `EntitlementContext` + SDK integration + AsyncStorage fallback.
5. Gating at the three points + `PaywallModal`.
6. Purchase + Restore flows.
7. Analytics on paywall view / purchase start / complete / restore / blocked-quest-start — **ship with launch**, not after; without it the free/premium split can't be tuned.
8. TestFlight: sandbox purchase, restore, offline, sign-out/sign-in. Re-test the AR landmines — premium touches home/artQuest/questDetail, and AR regressions are release-only.

## Risks

- **Entitlement drift between Apple ID and Cognito account.** Apple ID carries the purchase; our mirror is per-Cognito-user. Two Cognito accounts on one device share the Apple entitlement. Acceptable for content gating; do not treat the mirror as authoritative.
- **Refunds/chargebacks** silently revoke via StoreKit without notifying us (no webhook in v1). Content simply re-locks on next entitlement read. Acceptable.
- **App Store rejection** for missing Restore, unclear pricing copy, or gating content the metadata implies is free. Mitigate with explicit paywall copy and a working Restore.
- **This is a paywall, not a security boundary.** Client-side gating is defeatable. That is a deliberate accepted tradeoff for finite museum content; do not spend effort on server-side enforcement unless abuse actually appears.

## Sources

- [Expo — In-app purchases guide](https://docs.expo.dev/guides/in-app-purchases/) (official recommendation of `react-native-purchases` and `expo-iap`; native build required)
- [RevenueCat pricing](https://www.revenuecat.com/pricing/) (free to $2,500 MTR, then 1%)
- [react-native-iap — archived 2026-04-26](https://github.com/hyochan/react-native-iap)
- [expo-iap vs react-native-iap discussion](https://github.com/hyochan/react-native-iap/discussions/3105) (use `expo-iap` for Expo apps)
