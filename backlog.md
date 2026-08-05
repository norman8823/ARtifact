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

## PT — Post-transfer follow-through

> **The transfer completed 2026-08-03.** ARtifact Museum (Apple ID `6749166223`) now belongs to Artifact Technologies LLC. The build-submission freeze is **lifted**, and P1A Sign in with Apple is **unblocked**. What's left below is cleanup the transfer did not do for us.

### PT.5 Re-issue signing credentials — ✅ **credentials done 2026-08-04; build still to run**
All three EAS-held credentials regenerated against **`S3UAQ48824` — Artifact Technologies LLC (Company/Organization)**, valid to 2027-08-04: distribution certificate, provisioning profile, and the **App Store Connect API Key**. That third one is easy to miss and is what `eas submit` authenticates with — leaving it on the old team means the build succeeds and the upload doesn't.

Two findings worth keeping: the old certificate and profile had **already expired on 2026-07-25**, so this build was going to fail regardless of the transfer; and the old team was `CNQY33V8YV (Raul Jiminian (Individual))` — an *Individual* team, so "Organization" in the summary is the quick confirmation that a regeneration actually landed on the right account. The old API key `BX25HH65QC` was left in place rather than deleted: it lives in the partner's account and we no longer have the access to revoke it. It is simply unused now.

**Build 1.0.50 uploaded 2026-08-04** and processing in App Store Connect. Signed clean on the new team. **1.0.51 is the build now on TestFlight and installed on a real device (2026-08-04) — launches and runs fine.**

**Upload warning 90076 — "Potential Loss of Keychain Access" — assessed and benign, do not re-panic.** Apple flags it because keychain access groups are Team-ID-prefixed, so `CNQY33V8YV.com.rauljiminian.ARtifact` → `S3UAQ48824.com.rauljiminian.ARtifact` means the new build cannot read keychain items the old one wrote. **This app never wrote any.** Nothing in `src/`, `app/` or `components/` imports `react-native-keychain` (a declared but unused dependency) or `SecureStore`; Cognito tokens go to **AsyncStorage** via `cognitoUserPoolsTokenProvider.setKeyValueStorage(AsyncStorage)` (`config.ts:135`), and the entitlement cache uses AsyncStorage too. AsyncStorage is app-container storage and is unaffected by the team prefix, so **no user is signed out by the transfer.** Had tokens been in the keychain, this warning would have meant a silent sign-out of every user on update.

**✅ Confirmed on device 2026-08-04 — this is no longer an assessment.** Build 1.0.51 (new team `S3UAQ48824`) was installed over an April build, 1.0.44, that had been signed on the old `CNQY33V8YV` team. **The session survived — no re-login.** That exercises the team-prefix change end to end against a real signed-in account, so 90076 can be dismissed on future uploads without re-litigating it.

*Note for later:* if Sign in with Apple (P1A) or anything else ever moves credentials into the keychain or SecureStore, this warning stops being benign.

**Free-tier submission queue:** `eas submit --auto-submit` sat **Queued in the Free Tier Queue for 40+ minutes**. Uploading the `.ipa` with Apple's **Transporter** app instead took ~1 minute. For anything time-sensitive, build without `--auto-submit` and upload manually — the queue is Expo's, not Apple's.

### PT.7 Scan backend ownership — **✅ RESOLVED 2026-08-05**
The Flask CNN service is now entirely LLC-owned: our Railway project, our private repo (`norman8823/ARtifact-server`), our domain `https://api.artifactar.com`, and the app ships pointing at it (`src/config/scanApi.ts`). Nothing in the serving path depends on the former partner — the whole "ask him for a custom domain / a repo transfer / the Railway project" workstream is obsolete, so **don't spend access to him on it.** Rationale and operational traps are recorded in CLAUDE.md § Scan backend; full history in `~/main/ARtifact-server-notes.md`.

**✅ EAS checked 2026-08-05 — no override exists.** The Expo project carries nine environment variables (the seven `EXPO_PUBLIC_*` AWS values, `RV_API_KEY`, `SENTRY_AUTH_TOKEN`) across all three environments, and `EXPO_PUBLIC_SCAN_API_URL` is **not** among them. So the compiled-in default in `src/config/scanApi.ts` is what production builds use — which is the intended design, not an oversight. **Do not add the var** unless a build genuinely needs a different host: it would duplicate the host into a second place that then has to be kept in sync.

*Endpoint hardening (timeout, retry, dedup, cold-start UI) is unaffected by any of this and stays in 2.3.*

**Two things carried over from the old PT.7, both still live:**
- *Observation, not a defect:* the server imports `efficientnet_v2.preprocess_input` while the weights file is named `mobilenet_…`. The architecture really is EfficientNetV2 and preprocessing matches it, so nothing is broken — but anyone who swaps in an actual MobileNet on the strength of that filename gets silently wrong predictions rather than an error. First place to look if scan accuracy is ever questioned *(relates to Gaps #15)*.
- **Longer term option, explicitly not now:** fold inference into the AWS account already being paid for (App Runner / ECS Fargate), giving one vendor and one bill. Real migration work; do not attempt it during the premium launch. **Now much cheaper than it was** — with `api.artifactar.com` in front, a migration is a DNS cutover that shipped builds follow, not a release.

### PT.6 Metadata and inherited settings
- **⚠️ The app is REMOVED FROM SALE** (observed in App Store Connect 2026-08-04 — a pre-transfer state, not something the transfer did). Approving a new version does **not** switch availability back on by itself: set it in **Pricing and Availability** or the release passes review and still never appears on the store. Put this on the release checklist, not the backlog tail.
- **Create the new version record early, not at submission time.** It is the prerequisite for editing both App Privacy and the Privacy Policy URL (see 0.6), and creating it submits nothing. **Next version must exceed 1.0.51** — note Apple compares components numerically, so `1.0.4` would be *rejected as lower* than `1.0.44`. Use **`1.1`** and sidestep the arithmetic.
- **App Privacy responses were inherited from the partner's account and kept** (clearing them would have blocked the next submission). They are known wrong — answers and open checks are in **0.6** — and **must be corrected before the first submission from this account.**
- ~~Privacy policy names the LLC as data controller~~ — **done 2026-08-04** (0.6). Website carries no partner name and the footer entity line is clean; **still to review: support/marketing URLs in App Store Connect metadata.** *(**App Review Contact Information** is private to Apple's review team — real name, phone and email are appropriate there and are never shown on the product page.)*
- Verify on arrival: listed under Artifact Technologies LLC, bundle id still `com.rauljiminian.ARtifact`, ratings and reviews carried over. Save the transfer agreement PDF.
- **The app is not available in the EU** (confirmed 2026-08-03) and there is no plan to change that. Adding EU territories is **a compliance workstream, not a checkbox** — treat it as its own project: DSA trader status (whose business name, address, phone and email Apple then **publicly displays** on the product page), GDPR controller obligations including a likely Article 27 EU representative, the European Accessibility Act (in force 2025-06-28, with a microenterprise carve-out worth real advice), and consumer withdrawal rights.

---

## P0 — App Store submission blockers (none of this is optional)

*Not gated on the transfer — all of this can proceed in parallel, and none of it requires the partner.*

### 0.6 Correct the App Privacy questionnaire
> **The policy half shipped 2026-08-04.** https://artifactar.com/privacy/ now discloses Sentry (diagnostics, device model/OS, IP, account identifier), replaces the "images … stored securely" over-claim with *transmitted for matching, not retained*, adds the one-time purchase and the `isPremium` entitlement flag, names **Artifact Technologies LLC** as data controller, and carries the Railway request-logging line. Source is `src/content/privacy-policy.md` in the **ARtifact-website** repo (commit `3afefc1`), rendered verbatim at `/privacy`. The stale duplicate at `assets/privacy-policy.md` was deleted in the same commit.

What's left is the **App Privacy questionnaire**, which still holds the partner's inherited answers. Declare exactly these six — all **Linked to the user = Yes**, **Used for tracking = No**, purpose **App Functionality** unless noted:

| Category | Data type |
|---|---|
| Contact Info | Email Address |
| Identifiers | User ID |
| Purchases | Purchase History |
| Usage Data | Product Interaction (favorites, visits, quest progress, XP) |
| Diagnostics | Crash Data — App Functionality **and** Analytics |
| Diagnostics | Other Diagnostic Data — covers the IP and device context Sentry receives |

Declare **nothing else**, and un-declare whatever the partner left checked. Specifically **not**: Phone Number (the dummy `+10000000000` constant at `useAuth.ts:99` is never a real number), Photos or Videos (not retained — the finding below), Location (permissions removed in 0.7), Payment Info (Apple processes payment), Advertising Data (no ads, no ad SDKs). Overall tracking question: **No**.

**Why photos are not declared** — Apple defines collection as transmitting off-device "in a way that allows you … to access it for a period longer than what is necessary to service the transmitted request in real time." **Re-verified first-hand 2026-08-04 against our own clone at HEAD `bf7e721`** (previously taken on the partner's word): `/predict` reads the upload straight into `io.BytesIO` and never touches `tempfile` or any disk path — the only `open()` calls are the startup read of `class_names.json` and `Image.open(io.BytesIO(...))`, which is in-memory. No database, S3 client or volume write; no outbound HTTP; logging is exception messages plus startup lines; bare gunicorn with no `--access-logfile`. **This finding still describes code the LLC does not control — see PT.7.**

*Worth knowing:* `boto3`, `s3transfer` and `zappa` are in `requirements.txt` as leftovers from an old Zappa deployment. Nothing in `app.py` imports them, so they change nothing today — but S3 writes are a two-line change away for anyone editing that service, which is the concrete shape of the PT.7 risk to this claim.

**Audit finding 2026-08-04 — the app was sending Sentry users' email addresses.** `useAuth.ts` called `Sentry.setUser({ email, username })` *before* `signIn`, so a third party received every user's real address and display name. The published policy says "an identifier for your account", which under-described it. **Fixed the same day:** `identifySentryUser()` now runs only after sign-in succeeds and sets `{ id: userId }` — the Cognito sub, nothing else. That makes the live policy wording accurate rather than requiring the policy to be widened. *Note the mismatch persists in already-shipped builds (≤1.0.51) until the next release; exposure is negligible because the app is removed from sale, so there are no new users, and email is already declared as collected.*

**One open check before saving:**
- **Does `sendDefaultPii: true` send a stable device identifier as well as an IP?** **Cannot be answered from source** — the JS layer sets no device ID, and any installation identifier lives in the native Cocoa layer. **Answer it empirically:** trigger an error from a device build, open the event in Sentry, and read what is actually attached. If a stable identifier is there, add **Identifiers → Device ID**. Over-declaring is a mismatch too, so check rather than guess in either direction.
- ~~Railway → Observability log retention~~ — **closed 2026-08-04, deliberately not pursued.** The published policy describes standard request logging generically, which holds for any hosted service, and infrastructure logs not linked to a user aren't declarable in App Privacy. Nothing downstream depends on the retention number. Only reopen if Railway logging ever becomes user-linked or feeds analytics.

**Procedural findings, 2026-08-04:** App Privacy would not open for editing while the app had no editable version record — create the new version first (PT.6) and it should unlock; if it still won't, check the account role under Users and Access. Questionnaire answers **publish immediately** once saved: no build, no review. The **Privacy Policy URL field** is the one exception — changing that string requires a new version, but the *content* served at the URL is ours to change freely, which is why the edits above are already live without a submission.

Full audit and draft wording: `privacy-updates.md`. **Delete that file once the questionnaire is saved.**

§5 (in-app deletion, no email required) is accurate as of the deletion flow shipping — but still unverified against a real account, which is 0.9.

### 0.7 The permissions pass did not actually reach the binary — **reopened 2026-08-04**
> **This was believed shipped and is not.** `app.json` is clean — `ios.infoPlist` declares only camera and motion. But `npx expo config --type prebuild` resolves to an Info.plist that *also* contains **`NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`, `NSMicrophoneUsageDescription`, `NSLocationWhenInUseUsageDescription` and `NSLocationAlwaysAndWhenInUseUsageDescription`**. The ReactVision plugin re-injects them at prebuild — exactly the failure mode CLAUDE.md warned about, except deleting them from `app.json` and the plugin block does not prevent it. **Shipped builds through 1.0.51 almost certainly carry all five.**

**Where they come from** — `node_modules/@reactvision/react-viro/dist/plugins/withViroIos.js`, in `withDefaultInfoPlist`:
- Camera, microphone and both photo-library strings are set **unconditionally** (`config.ios.infoPlist.X = config.ios.infoPlist.X || <default>`).
- The two location strings are set **only when** `geospatialAnchorProvider` is `"arcore"`/`"reactvision"` or `includeARCore === true` (`:228-233`). Our plugin block passes `"provider": "reactvision"`, and the location strings do appear in the resolved config — so that condition is being met.

**Why it matters:** the published policy says *"The App does not request or use your location"* and App Privacy will answer **Location = No**. Functionally that is still true — `expo-location` is gone and nothing calls a location API, so no prompt is ever shown — but a binary that declares the strings while the label says No is the precise policy/binary inconsistency 0.6 exists to eliminate, and it is reviewer-visible.

**Two fixes, both needing device AR verification before shipping:**
1. **Strip the keys in a post-mod** in the new `app.config.js` (runs after the Viro plugin). Deterministic, and the file already exists.
2. **Stop the plugin injecting them** by changing the props — likely the geospatial/`provider` setting. Cleaner, but the app uses image/plane hit-testing rather than geospatial anchors, so confirm `provider: "reactvision"` is not what licenses the SDK before touching it.

*Do not ship either blind* — this touches AR config, which is release-only-regression territory (CLAUDE.md landmines).

**Also wrong, lower stakes:** `app.json` `android.permissions` still lists `RECORD_AUDIO`, `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` — **and lists the whole set twice**. The app is iOS-only so nothing ships from it, but it should not stay in the file.

**Still open from before:** `PrivacyInfo.xcprivacy` lives only in the gitignored `/ios`, so it is regenerated and uncontrolled. If it ever needs curating, drive it from `app.json` `privacyManifests` — the same lesson as 1A.2.

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

### 1.5 App Store Connect setup — **fully unblocked; this is the next thing to do in App Store Connect**
> **Paid Apps agreement is Active and the bank account is linked (2026-08-04).** That was the last gate — `fetchProducts` will now return real products once one exists, so premium becomes testable for the first time. The transfer completed before any IAP product was created, which is exactly what we wanted: the product gets created once, in the LLC account, and revenue lands there from the first sale.

The product ID must match `src/iap/products.ts` **character for character** — a typo surfaces as an empty product list with no error, which is miserable to debug. Add **sandbox testers** (Users and Access → Sandbox) in the same sitting. The product will sit at *Ready to Submit*; non-consumables are reviewed alongside the first build that uses them.

Create the **non-consumable** product `com.rauljiminian.ARtifact.premium.lifetime` (the id in `src/iap/products.ts` must match exactly), set pricing, add sandbox testers. Not a subscription — no subscription group needed. **This is now the only thing standing between the built premium code and a real sandbox purchase** — everything else it depended on is done.

### 1.6 Paywall analytics — breadcrumbs shipped, funnel unreviewed
Sentry breadcrumbs are in place for paywall shown / purchase started / purchase error / restore result / quest-start blocked. **Correction 2026-08-04: there is no `isPremium` tag** — this file previously claimed one. A grep for `setTag` finds only per-event `component` tags (`EntitlementContext`, `useAccountDeletion`, `useProfileUpdate`, `useAuth`), so **the funnel cannot currently be sliced by entitlement status**, which was most of the point. Add a global tag alongside the breadcrumb verification. What's left is confirming the breadcrumbs actually arrive in Sentry from a real device and that the funnel is readable. Originally: paywall views, purchase starts/completions/restores, quest-start blocked events. Sentry breadcrumbs are now the whole story — there is no RevenueCat dashboard to fall back on, so anything not instrumented here is invisible. Without it we can't tune the free/premium split.

### 1.7 TestFlight QA pass
IAP sandbox testing; explicitly re-test the AR landmines (release-only regressions) since premium touches quest/home/detail screens. The Simulator now runs everything except the AR screen itself (`3cf0386`), so most of this pass can be done locally — but AR and StoreKit sandbox still need a device.

---

## P1A — Sign in with Apple (iOS-only)

> **✅ Unblocked 2026-08-03 by the transfer completing.** This was deliberately held until then: Apple scopes Sign in with Apple identifiers **per developer team**, so shipping it before the transfer would have forced generating a transfer identifier for every user and correlating them through Apple's user-migration endpoint across a 60-day dual-identifier window ([TN3159](https://developer.apple.com/documentation/technotes/tn3159-migrating-sign-in-with-apple-users-for-an-app-transfer)) — plus a migration for the email-based Cognito linking in 1A.4. Building it now on the LLC's team means none of that exists. Any *future* account transfer would reintroduce it, so don't plan one.

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

### 2.2 Rotate the ReactVision API key *(Gaps #2)* — **relocation done, rotation outstanding**
> ✅ **Relocated 2026-08-04.** `rvApiKey` is out of `app.json`; `app.config.js` injects it from **`RV_API_KEY`**, which is set as a *sensitive* EAS variable in **all three environments** (production, preview, development — it was in `app.json` before, so every build had it, and production-only would have silently broken AR in dev/preview builds) plus the local `.env` for prebuilds. Missing value → build throws on the production profile, warns locally.

**Rotation is the half that actually protects anything** — the old key is in git history *and* compiled into every shipped build.

**Do it now, not later.** The old key is embedded in 1.0.35 (store) and 1.0.51 (TestFlight), so revoking it can break AR in those builds with no server-side fix. Right now the app is removed from sale and TestFlight is effectively one user, so the blast radius is ~zero. After the premium launch, rotating means knowingly breaking AR for paying users on older builds.

**Create before revoking, never the reverse:**
1. ReactVision dashboard → the project matching `rvProjectId` `56b4872e-26e5-4a1a-be24-3dc603579d9c` → issue a **new** key, leaving the old one live. If self-serve rotation isn't offered, their support can do it.
2. `npx eas env:update` for all three environments + the `RV_API_KEY` line in local `.env`.
3. Build, install on device, and **confirm AR loads a model** — a bad license key fails at scene load, which is release-only-regression territory.
4. Only then revoke the old key.

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
