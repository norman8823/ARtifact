# Backlog

*Ordered by priority AND order of operations — items within a phase are sequenced so earlier ones de-risk later ones. Driving goal: ship the premium tier (premium-gated quests, first 3 quests free, no scan limits).*

**Product decisions locked in:**
- Premium gates **quests only**. Scan count is NOT gated — `remainingFreeScans` is officially dead.
- First 3 quests free, the rest premium. Mechanism: the existing `Quest.isPremium` flag (already in schema, already fetched, already renders a badge in artQuest) — mark all but the 3 chosen free quests as premium in data. No "ordering" concept needed.
- Open decision: **which** 3 quests are free (pick beginner-friendly ones with high-traffic galleries).

---

## P0 — Foundations (do these first; they de-risk the premium build)

### 0.1 Minimal test harness + CI gate *(Gaps #1)*
Jest + `tsc --noEmit` + lint in a GitHub Action on PRs to `development`. Unit-test only the pure logic we're about to touch for premium: quest-completion set math (`useUserQuests`), rank-from-XP lookup, the Flask→Rekognition scan adapter. No component/E2E tests yet — just enough that entitlement logic lands with tests instead of TestFlight roulette.

### 0.2 Fix the XP read-modify-write race *(Gaps #6)*
`awardXP` does read-then-write on a single `UserXP` record. Premium makes quests the headline feature; quest XP correctness matters more. Fix before adding quest-completion XP (0.3) so new XP paths are built on a safe primitive.

### 0.3 Award quest `xpReward` on completion *(Gaps #5)*
Currently displayed but never granted. Premium quests must actually pay out their advertised XP — this is the value prop being sold. Wire it in `updateQuestProgress` where `isCompleted` flips true (and decide the auto-complete-at-start case: recommend awarding there too, with the celebration UI). Depends on 0.2.

### 0.4 One batched schema change + `amplify push`
Batch all schema edits into a single push to avoid repeated regen churn:
- Remove `User.remainingFreeScans` (scan gating is dead by decision).
- Keep `User.isPremium` and `Quest.isPremium` (they become load-bearing).
- Optional while we're in there: add `@index` on `Artwork.isFeatured` *(Gaps #11)* — one line, removes the fragile bounded-scan.

### 0.5 Real in-app account deletion *(Gaps #18)* — **blocks any App Store submission**
`profileSettings.tsx:372-392` renders a "Delete Account" button whose handler is an alert: *"This feature is not yet implemented. Please contact support to delete your account."* App Store guideline 5.1.1(v) requires in-app deletion for any app that supports account creation, and explicitly does not accept "contact support" as a substitute. A shipped button that promises deletion and doesn't deliver is the version reviewers catch fastest. This gates the premium release independently of everything else in this backlog — it is **not** a P1A dependency; P1A only adds a step to it.
- Destructive-confirmation UX (irreversible; type-to-confirm or two-step).
- Delete the Cognito user. Try Amplify v6's client-side `deleteUser()` first — it self-deletes the signed-in user with no backend. Fall back to an `AdminDeleteUser` Lambda only if the client path can't work.
- **Cascade-delete the DynamoDB rows**: `User`, `Favorited`, `Visited`, `UserQuest`, `UserXP`. Orphaned rows after the Cognito identity is gone are a privacy problem, not just untidiness — once the owner sub is unrecoverable nothing can ever read or delete them again. Delete the data *before* the Cognito user, or the owner-auth resolvers lock you out mid-flight.
- Sign out and clear the react-query cache on success (`queryClient.clear()` already runs in `AuthContext.signOut`).
- Once P1A ships, this flow gains the Apple token-revocation step — see 1A.6.

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

## P1A — Sign in with Apple (iOS-only)

*Rationale: email + password + a 6-digit code is the highest-friction path to a paying user, and the paywall lands right behind it. Apple only — the app is iOS-only, so Google is out of scope (and adding it later would pull in App Store guideline 4.8, which does not apply today). Can be pulled ahead of P1 if signup friction turns out to be the bigger conversion problem.*

**Design decisions locked in:**
- **Native Apple sheet** via `expo-apple-authentication` — not the Cognito Hosted UI web sheet.
- **Keep the existing Cognito user pool.** The dummy `phone_number` hack (`useAuth.ts:99`) stays. Recreating the pool buys nothing for a native-sheet flow and would orphan every owner-scoped row.
- **Cognito user pools cannot exchange a native Apple token for user-pool tokens** (federation is Hosted-UI-only; Identity Pool federation gives IAM creds, incompatible with `@auth(allow: owner)`). So: a **CUSTOM_AUTH challenge flow** backed by Cognito Lambda triggers. Note this is an auth trigger, not a data-path Lambda — the "zero Lambda in the data path" rule is unaffected.
- **One Lambda, four triggers, no HTTP endpoint, no admin IAM, no new `EXPO_PUBLIC_*` var.** New env vars are a TestFlight brick risk (`config.ts` throws on missing vars).
- **Linking is done at Cognito, not in DynamoDB** — a different `sub` can never read the old `User` row through the owner resolver, so same-user CUSTOM_AUTH is the only thing that preserves XP/favorites/quests.

### 1A.1 Reconcile Amplify auth state — **do this first, nothing else is safe until it's green**
`cli-inputs.json` declares `"usernameAttributes": ["email, phone_number"]` (one malformed string) while `backend-config.json` says `["EMAIL","PHONE_NUMBER"]`, and neither is likely to match the live pool — if phone were a real username attribute, the second tester to sign up with the shared dummy `+10000000000` would have hit `UsernameExistsException`. There is **no CloudFormation checked in** under `amplify/backend/auth/ARtifactAuth/`, so the Gen 1 CLI regenerates the entire auth template from `cli-inputs.json` on every push. Enabling custom auth triggers that regeneration, and CFN will either reject the malformed value or attempt to modify `UsernameAttributes` (immutable) and roll the stack back — and the AppSync API `dependsOn` auth, so the rollback can cascade.
- Run `aws cognito-idp describe-user-pool` + `describe-user-pool-client` against the live `dev` pool (note: `aws` CLI is not currently installed on the dev machine — install it or pull the config from the Cognito console).
- Correct `cli-inputs.json` and `backend-config.json` to match reality byte-for-byte.
- Run `amplify push` and confirm **zero** resource changes. If CFN wants to modify `UsernameAttributes` or `Schema`, stop and re-reconcile rather than pushing through.

### 1A.2 Native capability only — no auth logic *(ship this to TestFlight on its own)*
`/ios` is gitignored, so anything set by hand in Xcode or in `ARtifact.entitlements` is discarded when EAS regenerates the native project. The entitlement must come from config.
- Add `expo-apple-authentication`; add it to `app.json` `plugins` **and** set `ios.usesAppleSignIn: true`.
- `npx expo prebuild`, then an EAS dev-client build; verify "Sign In with Apple" appears in the capability-sync log and the entitlement exists in the **EAS-generated** project, not just locally.
- Render `AppleAuthentication.AppleAuthenticationButton` on `app/index.tsx` wired to nothing but a log of the credential. Reuse the orphaned `divider`/`dividerLine`/`dividerText`/`socialButton` styles left at `index.tsx:229-253` — they were built for exactly this. Gate on `AppleAuthentication.isAvailableAsync()`; use the HIG button component, do not hand-roll it, and match `borderRadius: 12` from the neighbouring buttons.
- **Expo Go cannot test this** (Apple returns `aud: host.exp.Exponent`); a dev-client build is required for every subsequent chunk. Ship this chunk to TestFlight before writing auth logic — this is where release-only failures (stale provisioning profile → `ASAuthorizationError 1000`) surface, and finding them here means finding them with nothing else in flight.

### 1A.3 Auth triggers — verify-only, existing users *(the link case)*
One Lambda (`amplify/backend/function/artifactAppleAuth/`) switching on `event.triggerSource`; `amplify update auth` to enable custom auth. Use `aws-jwt-verify` or `jose` — do **not** hand-roll RS256 verification. Cache Apple's JWKS in module scope.
- `DefineAuthChallenge` — **fail closed**: `issueTokens` only when `session.length === 1`, the one entry is a `CUSTOM_CHALLENGE` with `challengeResult === true`, and `!request.userNotFound`. Everything else → `failAuthentication`. Cap at one attempt.
- `CreateAuthChallenge` — no-op; emit empty `publicChallengeParameters`/`privateChallengeParameters` (they are returned to an unauthenticated caller — never leak user attributes there).
- `VerifyAuthChallengeResponse` — set `answerCorrect = false` first, then verify the Apple JWT: RS256 against Apple's JWKS, `iss === https://appleid.apple.com`, `aud === com.rauljiminian.ARtifact`, `exp` unexpired and `iat` within ~300s.
- Client: `signIn({username: email, options: {authFlowType: 'CUSTOM_WITHOUT_SRP'}})` → `confirmSignIn({challengeResponse: identityToken})`. Read the email from the **JWT**, not from `credential.email` (which is null after the user's first-ever authorization).
- Test against an **existing** email/password tester: same `sub`, so XP/favorites/quests are preserved with no data migration. Do not enable new-user creation yet.
- **Security note — this is the highest-severity surface in the app.** Enabling `ALLOW_CUSTOM_AUTH` opens a password-free auth path against *every* user in the pool. A sloppy `VerifyAuthChallengeResponse` is universal account takeover. Treat "verification threw" and "verification returned false" identically. Never let the identity token reach a Sentry breadcrumb or a `console.log` — it is a live bearer credential.

### 1A.4 New-user creation + linking rules
Adds the `PreSignUp` branch and the client's create-on-failure fallback. No `AdminCreateUser` and no admin IAM: the client calls `signUp({username: email, password: <random, discarded>, options: { userAttributes: {email, phone_number: "+10000000000"}, clientMetadata: {appleIdentityToken}}})` when `signIn` reports no such user, then retries the CUSTOM_AUTH sign-in. All later sign-ins skip signup entirely, so the throwaway password is never needed again (do **not** stash it in the keychain — that breaks on reinstall and on a second device).
- `PreSignUp` must **branch on `clientMetadata.appleIdentityToken`**: absent → return `event` untouched so the existing email flow keeps its verification-code step; present → verify the token, assert its `email` claim matches the submitted attribute, then `autoConfirmUser` + `autoVerifyEmail`. An unconditional auto-confirm would let anyone create a confirmed account on any email.
- **Linking rules** (all must hold, in `VerifyAuthChallengeResponse`): JWT fully verified; `email` claim present; Apple's `email_verified` true — normalize with `String(claim) === 'true'`, Apple returns both string and boolean; case-insensitive match against the Cognito user's `email`; the Cognito user's own `email_verified` is true; **and the Cognito user is `CONFIRMED`**. That last one matters: an attacker can `signUp()` a victim's email today, creating an UNCONFIRMED user with a password they chose — linking to it would hand them the account.
- **Hide My Email: never link a private relay address to anything.** Treat as private if `String(is_private_email) === 'true'` **or** the email ends with `@privaterelay.appleid.com` — the domain fallback is required, not paranoia, since the claim has been observed missing from ID tokens. A relay address is unique and stable per (app, Apple user), so it works fine as its own sign-in identifier. Consequence: a tester who signed up with a real address and then picks Hide My Email gets a **second account** — that is correct, there is no safe way to link them, but tell testers to pick "Share My Email" during the pilot or expect "my XP disappeared" reports.
- Client sequence must mirror `emailLogin.tsx:143-147` exactly: `signIn` → `ensureUserInDB(...)` → `await refreshAuth()` → `router.replace("/home")`. Navigating before `refreshAuth()` resolves leaves `getAuthMode()` on `"apiKey"` and every owner-scoped query on home is denied — an empty-state bug that only reproduces under release timing. Also carry over the `UserAlreadyAuthenticatedException` catch-and-retry from `useAuth.ts:157`.
- Store the Apple `fullName` (first authorization only) as the DynamoDB `username`; default to a generic display name when absent.

### 1A.5 Cleanup
Delete `app/appleLogin.tsx` and `app/googleLogin.tsx` and drop the dead `phoneLogin` route registration (`app/_layout.tsx:155-157`) — this **supersedes those entries in P3.1**. While in `useUserData.ts`, strip the debug `listUsers` limit-100 scan at lines 54-64 that logs every user's PII to the console on every sign-in. Remove the token-bearing `console.log`s from the auth path. Update the navigation line in `project.md` that still calls out the stubs.

### 1A.6 Apple token revocation on account deletion *(extends 0.5)*
The account-deletion flow itself is **0.5** — it ships whether or not P1A does. This item is only the Apple-specific addendum: once the app offers Sign in with Apple, Apple additionally requires revoking the user's tokens at `POST https://appleid.apple.com/auth/revoke` when they delete their account. That means capturing the Apple refresh token at sign-in (exchange `credential.authorizationCode` at `/auth/token`) and storing it server-side, plus signing a client-secret JWT with the Apple private key — so it needs a backend piece that 0.5 on its own may not. Order: revoke at Apple → delete DynamoDB rows → delete the Cognito user. Skip revocation and the account is deleted on our side while Apple still lists the app under the user's Apple ID.

### 1A.7 TestFlight QA pass
Matrix: brand-new Apple user · Hide My Email user · existing email/password tester linking via Apple (verify XP, favorites and quest progress all survive) · sign out → sign in with Apple in the same session · guest → `AuthPromptModal` → Apple → returns to the gated action. Re-verify the AR landmines (release-only regressions) since the auth path touches app launch ordering.

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

1. **Dead-code deletion batch** *(Gaps dead-code table)*: Rekognition Lambda + `rekognitionApi`, commented scan block, `ARPrewarmManager`/`ARPermissionManager`, `useSceneModel`, `arImage`, `aws-sdk` v2 app dep. One PR, pure deletions. *(The apple/google login stubs and the `phoneLogin` route moved to 1A.5 — they get deleted as part of the real Apple sign-in work.)*
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
