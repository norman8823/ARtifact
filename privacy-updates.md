# Privacy updates — working doc for backlog 0.6

*Draft for owner review, not legal advice. Delete this file once the policy is published and the App Privacy answers are saved.*

**Two artifacts must agree**, and reviewers compare them against each other *and* against the binary:
1. The **privacy policy** at https://artifactar.com/privacy/ — a webpage the owner edits.
2. The **App Privacy questionnaire** in App Store Connect → the app → App Privacy — the "nutrition label" on the listing. Currently holds responses **inherited from the previous owner's account** and known to be wrong.

---

## Part 1 — What the app actually collects

Audited from the code 2026-08-04. Both artifacts below derive from this table.

| Data | Where it goes | Linked to identity | Notes | 
|---|---|---|---|
| Email address | Cognito + `User.email` | Yes | Sign-up and sign-in |
| Username / display name | `User.username` | Yes | User-chosen |
| User ID (Cognito sub) | Every owner-scoped record | Yes | The join key for all user state |
| Favorites, visited artworks, quest progress, XP | DynamoDB (`Favorited`, `Visited`, `UserQuest`, `UserXP`) | Yes | Core app state |
| Purchase status | `User.isPremium` | Yes | An entitlement flag only — Apple processes payment, **no card data ever reaches us** |
| Crash / error reports, **IP address, device identifiers** | Sentry, via `sendDefaultPii: true` (`app/_layout.tsx:26`) | Effectively yes | Session replay is **off** |
| Scan photographs | POSTed to the Railway CNN, **not retained** | — | See below |

**Two things that look like collection and aren't:**
- **Scan photos are not "collected."** Apple defines collection as transmitting data off-device "in a way that allows you … to access it for a period longer than what is necessary to service the transmitted request in real time." Verified against the service's source: the upload is read into `io.BytesIO` and never written to disk, no database/S3/volume, no logging of the body, no third-party forwarding, no retraining store. So photos are **not** declared.
- **Phone number is not collected.** The Cognito pool requires a `phone_number` attribute, and sign-up writes a dummy constant (`+10000000000`, `useAuth.ts:99`). No real phone number is ever requested or stored. Do **not** declare Phone Number.
- `User.profileImage` holds an avatar *seed* string (e.g. `"Felix"`), not a photograph.

---

## Part 2 — Privacy policy edits

### Edit A — disclose Sentry (§4, which currently lists only AWS and Railway)

> **Error and crash reporting.** We use Sentry (Functional Software, Inc.) to receive automatic reports when the app crashes or encounters an error. These reports include diagnostic information about the failure, the device model and operating system version, your IP address, and an identifier for your account so we can tell whether a problem affects one user or many. We use this only to find and fix defects. We do not use it for advertising or profiling, and the app does not record your screen.

### Edit B — replace the images claim

Remove any wording along the lines of *"images … are processed and stored securely."* It over-claims: it describes storage that does not happen.

> **Photographs you take to identify artwork.** When you scan an artwork, the photograph is sent to our recognition service, matched against our catalogue, and discarded. It is not saved to disk, not stored in any database, not used to train our models, and not shared with anyone. Nothing about the photograph remains after the match is returned.

### Edit C — add purchases

> **Purchases.** ARtifact Premium is a one-time purchase processed entirely by Apple. We never receive or store your payment card details. We record only whether your account has the premium unlock, so the app knows which content to make available to you.

### Leave alone
§5 (in-app deletion, no email required) is accurate — the deletion flow shipped. It remains unverified against a real account, which is backlog 0.9.

---

## Part 3 — App Privacy questionnaire answers

App Store Connect → the app → **App Privacy** → Edit. For every item below: **Linked to the user = Yes**, **Used for tracking = No**, **Purpose = App Functionality** unless noted.

| Category | Data type | Declare? |
|---|---|---|
| Contact Info | Email Address | **Yes** |
| Identifiers | User ID | **Yes** |
| Purchases | Purchase History | **Yes** |
| Usage Data | Product Interaction | **Yes** — favorites, visits, quest progress, XP |
| Diagnostics | Crash Data | **Yes** — purpose: App Functionality *and* Analytics |
| Diagnostics | Other Diagnostic Data | **Yes** — covers the IP and device context Sentry receives |
| Contact Info | Phone Number | **No** — dummy constant, never real |
| User Content | Photos or Videos | **No** — not retained, see Part 1 |
| Location | any | **No** — permissions were removed entirely |
| Financial Info | Payment Info | **No** — Apple processes payment |
| — | Advertising Data | **No** — no ads, no ad SDKs |

**Tracking question: No.** Nothing is shared with data brokers or used to track users across apps or websites owned by other companies.

**Verify while you're in there:** whether Sentry's `sendDefaultPii` sends a stable device identifier as well as an IP. If it does, add **Identifiers → Device ID**. Better to check than to guess in either direction — over-declaring is a mismatch too.

---

## Part 4 — Keep these true

- **If Sentry session replay is ever re-enabled**, the policy and the App Privacy label must be updated *first*. It previously recorded 10% of all sessions and 100% of error sessions.
- **Railway platform-level logging** (source IP, path, status) and its retention are a dashboard setting, not visible in the service's repo. Check Railway → Observability. Standard infrastructure logging generally isn't declarable in App Privacy when not linked to a user, but it belongs in the policy sentence added by Edit A.
- **The policy should name Artifact Technologies LLC as the data controller** now that the app has transferred (backlog PT.6).
- Any new SDK, analytics tool or backend changes this document. Re-audit before adding one.
