# Backlog

*A **to-do list** — open work only. When an item ships, **delete it here**; the record of it lives elsewhere.*

> **Where completed work is recorded.** Deleting a shipped item from this file is safe because nothing is lost: **[CLAUDE.md § Project state](CLAUDE.md)** says what was built, and **[Gaps.md](Gaps.md)** is a permanent register that keeps every defect entry forever and only marks it `✅ FIXED`. So a Gaps item never disappears when its backlog item does — to see which known weaknesses have been addressed, read Gaps.md, not this file. Item ids here are stable and cited from both other docs; gaps in the numbering mean that item shipped.*

*Ordered by priority AND order of operations — items within a phase are sequenced so earlier ones de-risk later ones.*

> **Driving goal changed 2026-08-03: transfer the app to Artifact Technologies LLC first, then ship premium from that account.** Premium revenue belongs to the LLC, the IAP product should be created once in its final home, and Sign in with Apple gets dramatically harder if shipped before the transfer (see P1A). **PT outranks everything below it.**

**Product decisions locked in:**
- Premium gates **quests only**. Scan count is NOT gated — `remainingFreeScans` is dead client-side (the schema field stays forever — see CLAUDE.md § Settled decisions).
- Premium is a **one-time lifetime unlock**, not a subscription. Bought via `expo-iap`; StoreKit is the source of truth. Rationale in [premium-tier.md](premium-tier.md).
- First 3 quests free, the rest premium. Mechanism: the existing `Quest.isPremium` flag (already in schema, already fetched, already renders a badge in artQuest) — mark all but the 3 chosen free quests as premium in data. No "ordering" concept needed.
- **Free quests: Art Essentials, Bronze Legacy, Sacred Animals** (10 of 47 artworks). All other 9 quests are premium.

---

## PT — App transfer to Artifact Technologies LLC ⟵ **today**

*Moving the app from the partner's developer account to the company account. Everything here is App Store Connect work, not code. Ordered so the partner-gated items come first (he is only available today) and the slowest item starts earliest.*

**Eligibility — already satisfied, verified against [Apple's criteria](https://developer.apple.com/help/app-store-connect/transfer-an-app/app-transfer-criteria/):**
- ✅ At least one version released to the App Store (v1.0.1 / build 1.0.37).
- ✅ No push notifications, Apple Pay, CloudKit, Game Center or Apple Arcade — none of the hard complications apply (verified: no such deps in `package.json`).
- ✅ No IAP products exist yet, so there can be no product-id collision in the receiving account.

**Two things that would break eligibility if done today — do neither until the transfer completes:**
- **Do not submit a build.** The app cannot transfer while in Processing for Distribution, Waiting for Review, In Review, Accepted, Pending Developer Release or Pending Apple Release. Submitting the premium build blocks the transfer until it clears.
- **Do not ship Sign in with Apple.** See P1A — it is now explicitly gated behind this section.

### PT.1 Verify eligibility in the partner's account — **needs the partner, do first**
Confirm in his App Store Connect: the app is in none of the blocking statuses above; it is not available for pre-order in any country; both accounts have accepted the latest paid *and* free agreements; neither account is in a pending or changing state. He must be the **Account Holder** — no other role can initiate a transfer.

**The identifiers flow toward him, not from him.** To initiate, he enters *our* **Apple Account email (the LLC's Account Holder)** and *our* **Team ID** — so PT.3 has to be far enough along for those to exist before PT.4 can run. His own Team ID is worth capturing anyway for PT.5 (EAS credentials), but it is not needed for the transfer itself.

### PT.2 Clear TestFlight and Xcode Cloud — **needs the partner**
Apple requires TestFlight beta testing turned off before initiating: remove **all builds and all testers**. Any Xcode Cloud data attached to the app must also be removed. Do this before PT.4, not during.

### PT.3 Finish the Artifact Technologies LLC account — **the long pole**
The receiving account must not be in a pending or changing state, and must have accepted the latest agreements.

**Done:** organization enrollment as Artifact Technologies LLC, Team ID issued, Developer Program License Agreement accepted 2026-07-28 (that's the *free* agreement — it does not cover paid apps), Account Holder role held. Paid Apps Agreement signed and W-9 filed.

**Remaining: banking.** The sequence is forced — sign Paid Apps → submit tax forms → *only then* can banking be entered. Agreement status runs **Pending User Info → Processing → Active**; it must reach **Active**, because Apple's transfer criteria require both accounts to have accepted their latest paid *and* free agreements and to not be in a pending or changing state.

**The bank account must be the LLC's, not personal.** Apple's field is for "the bank account number of the legal entity … enrolled in the Apple Developer Program", and the account-holder name must match the entity name exactly or payments are rejected. Independently of Apple: commingling revenue into a personal account undermines the corporate veil the LLC exists to provide, and mismatches whatever TIN the W-9 was filed under. **If no business checking account is open yet, that — not Apple — is the actual critical path** (banks typically want the EIN letter, articles of organization, and often an operating agreement).

### PT.3b Have the acceptance-form answers ready
Accepting the transfer requires filling in, on the spot: Support URL, Marketing URL, **Privacy policy URL** (`https://artifactar.com/privacy/`), App Review contact info, App Store contact info, and whether all team members or only Admin/Finance get access. The form also surfaces the **App Privacy disclosures inherited from the partner's account** — those are the ones 0.6 says are wrong (Sentry undisclosed, image-storage over-claim), so fix them there rather than carrying the error over. Expect up to 2 business days of "Processing App Transfer" after accepting.

### PT.4 Initiate and accept the transfer
Partner initiates from his account; accept from the LLC account. Freeze all build submissions from initiation until completion.

**The bundle ID does not change.** `com.rauljiminian.ARtifact` is permanent — it cannot be changed once a build has been uploaded, and a transfer preserves it. Getting a company-branded bundle id would require a brand-new App Store record, losing all ratings, reviews and existing users. Not worth it; the id is not user-visible. Decided — do not revisit.

### PT.5 Re-issue credentials after the transfer
The app moves, the signing identity does not. Expect to regenerate EAS credentials (distribution cert + provisioning profile) against the new team, and update the Apple team in the EAS submit config. `ascAppId` stays the same. Do a throwaway build immediately after the transfer to shake this out rather than discovering it at submission.

### PT.6 Update the seller-facing metadata
After transfer the App Store listing shows Artifact Technologies LLC as seller. Check the privacy policy at artifactar.com/privacy names the LLC as the data controller (folds into 0.6), and review the support/marketing URLs and copyright line for the partner's name.

---

## P0 — App Store submission blockers (none of this is optional)

*Not gated on the transfer — all of this can proceed in parallel, and none of it requires the partner.*

### 0.6 Reconcile the privacy policy with what the app actually does
The policy is **live at https://artifactar.com/privacy/**, which clears the "no policy URL" blocker. What's left is that it and the binary disagree in four places — reviewers compare them, and the App Privacy questionnaire must match reality:

1. **Sentry is still not disclosed** — §4 lists only AWS and Railway. Screen recording is now off, so the disclosure needed is much smaller: Sentry receives error reports plus IP and device identifiers via `sendDefaultPii: true`. Draft wording was supplied; **owner to publish.**
2. ~~Location contradiction~~ — **resolved**: the permissions are gone (0.7), so "does not request or use your location" is now true of the binary too. No policy edit needed for this line.
3. **"Images … are processed and stored securely" over-claims — owner confirmed no storage is wanted or needed.** Verified 2026-07-27: the app stores **no** images. The only S3 `uploadData` call sits inside the commented-out dead Rekognition block (`scan.tsx:236`); the live path (`analyzeWithFlask`) POSTs the photo to Railway `/predict` and retains nothing beyond expo-camera's transient cache file. Owner intent is no storage at all, so the policy should say images are transmitted for matching and not retained — **pending confirmation that the Railway Flask service doesn't persist them** (server-side, outside this repo; check and document).
4. **Purchases aren't mentioned.** Apple processes payment (no card data ever reaches us), but `User.isPremium` is stored. Worth one line.

§5 (in-app deletion, no email required) is now accurate as of the deletion flow shipping — but it is still unverified against a real account, which is 0.9.

### 0.7 Two loose ends from the permissions pass
The permission removals and the Sentry replay decision shipped — see CLAUDE.md § Project state. What's left is minor:
- `expo-web-browser` is a dependency with no importers found. Remove unless something pulls it in indirectly.
- `PrivacyInfo.xcprivacy` lives only in the gitignored `/ios`, so it is regenerated and uncontrolled. If it ever needs curating, drive it from `app.json` `privacyManifests` — the same lesson as 1A.2.

### 0.9 Device QA the account-deletion flow
The flow shipped (`useAccountDeletion`) but has **never run against a real account** — it can't be tested in the Simulator without signing in, and the ordering is unforgiving: if it deletes the Cognito identity while rows remain, those rows become permanently unreadable. Test on a throwaway account, confirm all five models are emptied, then confirm sign-out. Guideline 5.1.1(v) is checked by reviewers, and a deletion button that half-works is worse than the old stub.

## P1 — Premium tier (the epic)

> **No schema change or `amplify push` is required.** The entitlement plumbing (StoreKit adapter, `EntitlementContext`, pure rules in `src/utils/premiumAccess.ts`) is already built — see CLAUDE.md § Project state. What remains is the UI and the data.

### 1.2 Mark quest data — script written, not yet run
Free quests are decided: **Art Essentials, Bronze Legacy, Sacred Animals** (10 of 47 artworks); the other 9 are premium. `scripts/markPremiumQuests.js` does it, **dry-run by default** (`--apply` to write), and aborts unless all three titles match exactly.

Two prerequisites before running:
1. `.env` needs `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` (absent today) — run without `--apply` first.
2. **Timing:** apply only once the gating build is reaching users. Already-shipped builds render a "Premium" badge with no gate, so marking early shows a badge on quests users can still start free. Bump the react-query `buster` in `QueryProvider.tsx` from `"v1"` to `"v2"` in that release so no device paints pre-premium cached quest data.

Do not remove the `GetFreshQuests` cache-bypass while doing this (CLAUDE.md landmine #4).

### 1.5 App Store Connect setup — **do this in the LLC account, after PT**
> **Re-scoped 2026-08-03: do NOT create the IAP product in the partner's account.** Products do transfer with the app, but creating it in the new account instead means revenue lands in the LLC from the first sale, avoids a product in an ineligible status stalling the transfer, and skips duplicating the agreements. The Paid Apps agreement half of this is PT.3 and should be started **today**.

Once the transfer completes: create the **non-consumable** product `com.rauljiminian.ARtifact.premium.lifetime` (the id in `src/iap/products.ts` must match exactly), set pricing, add sandbox testers. Not a subscription — no subscription group needed. Nothing about premium can be tested for real until this is done: `fetchProducts` returns an empty array until the Paid Apps agreement is active.

### 1.6 Paywall analytics — breadcrumbs shipped, funnel unreviewed
Sentry breadcrumbs are in place for paywall shown / purchase started / purchase error / restore result / quest-start blocked, plus an `isPremium` tag. What's left is confirming they actually arrive in Sentry from a real device and that the funnel is readable. Originally: paywall views, purchase starts/completions/restores, quest-start blocked events. Sentry breadcrumbs are now the whole story — there is no RevenueCat dashboard to fall back on, so anything not instrumented here is invisible. Without it we can't tune the free/premium split.

### 1.7 TestFlight QA pass
IAP sandbox testing; explicitly re-test the AR landmines (release-only regressions) since premium touches quest/home/detail screens. The Simulator now runs everything except the AR screen itself (`3cf0386`), so most of this pass can be done locally — but AR and StoreKit sandbox still need a device.

---

## P1A — Sign in with Apple (iOS-only)

> ## ⛔ BLOCKED until PT completes — do not start this before the transfer
> Apple scopes Sign in with Apple user identifiers **per developer team**. Ship SIWA first and every user's `sub` changes at transfer: you would have to generate a **transfer identifier for every user in the database** before initiating, then correlate them through Apple's user-migration endpoint during a 60-day window where ID tokens carry both the old and new identifiers ([TN3159](https://developer.apple.com/documentation/technotes/tn3159-migrating-sign-in-with-apple-users-for-an-app-transfer)). On top of that, a Services ID transfers with the app unless explicitly disassociated, and grouped apps must be ungrouped first.
>
> The linking design below (1A.4) matches Cognito accounts by verified email — that layer would need its own migration pass on top of Apple's. **Doing the transfer first makes all of this not exist.** No exceptions: this is the single largest avoidable cost in the backlog.

*Rationale: email + password + a 6-digit code is the highest-friction path to a paying user, and the paywall lands right behind it. Apple only — the app is iOS-only, so Google is out of scope (and adding it later would pull in App Store guideline 4.8, which does not apply today).*

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
> **Partly done (2026-07-27): the button is wired visually.** `expo-apple-authentication` is installed and `AppleAuthenticationButton` renders on `app/index.tsx` above "Continue with email", gated on `isAvailableAsync()`, with an `onPress` that only logs. Verified rendering in the Simulator. The **"or" divider was dropped by product decision** — the orphaned `divider`/`dividerLine`/`dividerText`/`socialButton` styles were deleted rather than used. **`ios.usesAppleSignIn` was deliberately NOT set** — that adds the entitlement, which needs the Sign in with Apple capability on the App ID, which needs the org developer enrollment to complete. So what remains below is the entitlement + EAS verification, not the button itself.
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
7. **Retroactive quest credit UX** *(Gaps #7)* — a quest that auto-completes at start should still get a celebration moment. **Celebration only, no XP** — XP is scan-only and there is never a completion award (CLAUDE.md § Settled decisions), so the user has already been paid for those artworks; awarding again would double-count.
8. **Sparse GSI for `Artwork.isFeatured`** *(Gaps #11)* — the featured fetch is a bounded 5-page scan that silently breaks if a featured artwork lands past the bound. A direct `@index` is impossible (Boolean isn't a valid DynamoDB key type), so: add `featuredStatus: String @index(...)`, populate it with a constant **only** on featured rows so the index stays sparse, backfill via `scripts/`, then switch `getFeaturedArtworks` to the index query. Needs `amplify push`.
9. **Auth guard for pushed routes** *(Gaps #12c)* — `app.json` registers `scheme: "artifact"` and pushed routes check only `isAuthReady`, so `artifact://questDetail?id=X` and `artifact://profileSettings` render for a guest (the latter throws `UserUnAuthenticatedException` from `ensureUserInDB` on mount). The premium gate handles its own case explicitly, but a shared guard would close the class rather than patching each screen.
10. **Resolve the FeaturePoint contradiction** *(Gaps #13)* — `ArtworkARScene.tsx:137` includes `FeaturePoint` in the hit-test priority while `MIGRATION_NOTES.md:121` claims it's excluded so the model can't float in mid-air. One of them is wrong. Decide which behavior is intended, then fix the other. **Device-only to verify.**
11. **Make `AR_TEST_MODE` non-shippable** *(Gaps #14)* — it's a source constant someone must remember to flip back; `true` in a commit would route every AR view to a hardcoded test scene. Replace with the `__DEV__ && process.env.EXPO_PUBLIC_*` pattern already used for the premium dev bypass in `EntitlementContext`, so it cannot ship enabled.
12. **Observability for the core loop** *(Gaps #20)* — instrument scan success/failure rate, quest completion, and AR placement success, plus Sentry breadcrumbs around the scan network call and the AR asset fetch (the two flakiest flows). Paywall breadcrumbs already exist (1.6); this is everything else. Without it, a Railway outage or a drop in scan accuracy is invisible until users complain.

---

## Explicitly rejected / not doing
*The reasoning for each lives in [CLAUDE.md § Settled decisions](CLAUDE.md).*
- **Scan-count gating** — premium gates quests only. The `User.remainingFreeScans` *schema field* is kept permanently (removing it breaks sign-in on shipped builds); only client-side usage was removed.
- **Quest-completion XP bonus** — XP is scan-only. `xpReward` is descriptive; awarding it on completion would double-count.
- **Subscription pricing** — premium is a one-time non-consumable lifetime unlock.
- **Webhook/server-side entitlement enforcement for v1** — client-gated content is acceptable; revisit only if abuse appears.
- **A direct `@index` on `Artwork.isFeatured`** — Boolean isn't a valid DynamoDB key type. Needs a sparse String field instead (Gaps #11).
