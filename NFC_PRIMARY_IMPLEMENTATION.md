# CODERED 4.0 NFC-Primary Tracking and Networking

Status: implementation-ready MVP plan  
Target test: tomorrow  
Hosting: Next.js App Router on Vercel serverless, Supabase database  
Scale: approximately 500 participants

## 1. Decision summary

Use passive, rewritable NTAG213/NTAG215 NFC tags containing a single HTTPS URL. Do not use the Web NFC API for the event workflow. iPhone Safari cannot reliably expose NFC reads to JavaScript, but iPhone XS and newer can detect an NDEF URL tag in the background, show a system notification, and open the URL in Safari.

Each participant receives one tag containing:

```text
https://<production-domain>/nfc/t/<opaque-random-token>
```

The same URL supports both roles:

- A logged-in participant sees the tag owner's public player card and can connect.
- A logged-in volunteer sees the participant identity and the allowed operational actions: attendance, food, sleeping bag, seating, and similar resources.
- A logged-out visitor is sent through login and returned to the original NFC URL afterward.
- QR remains a backup and encodes the exact same URL, so NFC and QR use one backend workflow.

This is intentionally a URL-launch system, not phone-to-phone NFC data exchange. To connect mutually, Alice taps Bob's physical tag and Bob taps Alice's. The product can treat the first authenticated tap as an undirected connection, or require both taps for a “mutual” badge.

## 2. Safari and iPhone compatibility

### Supported tomorrow

- Passive NDEF tags with an `https://` URI as the first NDEF record.
- Background tag detection on iPhone XS and later when the display is on and the device has been unlocked since restart.
- A notification banner that the user taps to open the URL in Safari.
- Existing cookie authentication in Safari, including a redirect back to the NFC destination after login.
- Server-side recording through ordinary HTTPS requests.

### Not supported by the website

- Calling `NDEFReader.scan()` from Safari.
- Reading a raw NFC UID in browser JavaScript.
- Silently completing an action before the user taps the iOS notification.
- Direct phone-to-phone NFC exchange from this web application.
- Reliably distinguishing a copied/cloned tag from the original passive tag.

### iPhone conditions that can block a read

- iPhone older than XS for background reading.
- Screen off, airplane mode enabled, camera currently in use, Apple Pay/Wallet in use, or phone not unlocked once after reboot.
- Thick/metal phone cases, tag mounted directly on metal, damaged tags, or incorrect NDEF encoding.
- The tag URL is only `localhost`, HTTP, a Vercel preview requiring protection, or an expired deployment URL.

## 3. Product flows

### Participant networking

1. Alice signs into the participant portal once in Safari.
2. Alice holds the top of her iPhone close to Bob's badge tag.
3. iOS displays the URL notification; Alice taps it.
4. `/nfc/t/<token>` resolves Bob without exposing Bob's database ID.
5. The page shows Bob's avatar, name, team, bio, GitHub, LinkedIn, and portfolio.
6. Alice taps **Connect**. The server creates one idempotent connection.
7. Bob can tap Alice's tag. This marks the connection mutual instead of creating a duplicate.

Do not create a connection from a GET request. Browsers, link scanners, previews, and bots can prefetch GET URLs. The landing page may record a low-trust `opened` event, but connection creation must be an explicit POST with CSRF/origin checks.

### Volunteer operations

1. Volunteer signs in once on the event iPhone.
2. Volunteer taps a participant badge.
3. The landing page prominently shows participant name, team, track, photograph/avatar, and status.
4. Volunteer selects the operation, such as **Issue lunch**.
5. A confirmation screen shows the exact participant and resource.
6. POST creates an idempotent transaction and immediately shows success/already-issued/failure.

For high-value or identity-sensitive actions, the volunteer must visually compare the displayed identity with the badge/person. A passive NFC tag can be cloned and must not be treated as cryptographic proof of identity.

## 4. Recommended database migration

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE participant_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  public_token_hash text NOT NULL UNIQUE,
  token_hint text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('unassigned', 'active', 'lost', 'revoked', 'replaced')),
  assigned_by uuid,
  assigned_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_id, status)
);

CREATE INDEX participant_tags_participant_idx ON participant_tags(participant_id);

CREATE TABLE nfc_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id uuid REFERENCES participant_tags(id) ON DELETE SET NULL,
  actor_participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  actor_volunteer_id uuid REFERENCES volunteers(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN
    ('opened', 'profile_connected', 'attendance', 'resource_issued', 'resource_returned', 'rejected')),
  resource_id uuid REFERENCES resources(id) ON DELETE SET NULL,
  request_id uuid NOT NULL UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX nfc_events_tag_created_idx ON nfc_events(tag_id, created_at DESC);
CREATE INDEX nfc_events_actor_created_idx ON nfc_events(actor_participant_id, created_at DESC);

CREATE TABLE participant_connections (
  participant_low_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  participant_high_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  low_tapped_high_at timestamptz,
  high_tapped_low_at timestamptz,
  first_connected_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (participant_low_id, participant_high_id),
  CHECK (participant_low_id < participant_high_id)
);
```

Store only a SHA-256/HMAC hash of the public token in the database. Generate at least 128 random bits; do not use participant IDs, email addresses, team IDs, sequential numbers, or usernames as tag secrets. Keep a short non-secret `token_hint` for badge support.

The partial uniqueness requirement for one active tag should be implemented as:

```sql
CREATE UNIQUE INDEX participant_one_active_tag
  ON participant_tags(participant_id)
  WHERE status = 'active';
```

## 5. Next.js route design

```text
GET  /nfc/t/[token]                      NFC landing page; safe, no important mutation
POST /api/nfc/connect                    Authenticated participant connection
POST /api/nfc/volunteer/action           Authenticated volunteer operation
GET  /api/nfc/me/connections             Participant connection history
GET  /api/admin/nfc/tags                 Assignment and status dashboard
POST /api/admin/nfc/tags/issue           Generate/assign a tag token
POST /api/admin/nfc/tags/[id]/revoke     Revoke a lost tag
POST /api/admin/nfc/tags/[id]/replace    Replace and revoke atomically
```

The landing route should:

1. Validate token shape before querying.
2. Hash the token server-side and resolve only an active tag.
3. Set `Cache-Control: no-store` because role and identity affect output.
4. Never expose private participant data.
5. Preserve `returnTo=/nfc/t/...` through authentication.
6. Render a large identity panel before any volunteer mutation.
7. Use a POST for all actions and generate a UUID request ID client-side.

The action API should complete in one database transaction/RPC: validate role, resolve tag, check resource availability, insert transaction with a unique idempotency key, update resource count, and insert the audit event. Avoid read-then-write logic spread over multiple serverless requests.

## 6. Security and abuse controls

- Treat possession of the tag as a locator, not authentication.
- Hash opaque tag tokens and support immediate revocation/replacement.
- Require participant or volunteer authentication for mutations.
- Validate `Origin`/`Host`, use `SameSite=Lax`, `Secure`, `HttpOnly` cookies, and reject unsafe external return URLs.
- Apply role checks on the server; never trust a role sent by the client.
- Add database uniqueness for one resource distribution per participant/resource where appropriate.
- Make every mutation idempotent using `request_id` and return the prior result for retries.
- Rate-limit per actor and token. A practical initial rule is 20 landing opens/minute and 10 mutations/minute, with a higher controlled limit for volunteers.
- Log volunteer ID, participant/tag ID, resource, result, timestamp, and request ID.
- Show **LOST/REVOKED TAG** without revealing the previous owner.
- Do not include personal information in the NFC URL itself.
- Never make “GET opened tag” distribute food, mark attendance, or connect users.

## 7. Tag purchasing and encoding

Recommended pilot hardware:

- 10–20 NTAG213 adhesive tags or badge cards for tomorrow.
- 500–550 tags for the event, allowing roughly 10% spare/replacement inventory.
- Prefer genuine NFC Forum Type 2, NDEF-compatible tags from a supplier with consistent UID/quality.
- NTAG213 capacity is sufficient for a short HTTPS URL. Use a short custom domain/path to improve reliability and encoding size.
- Do not mount ordinary tags directly on metal. Buy on-metal tags if the badge holder has a metal backing.

Encoding procedure:

1. Deploy the production HTTPS domain first.
2. Generate a unique random URL for each tag.
3. Write a single NDEF URI record; it must be the first record.
4. Read it back on both iPhone and Android.
5. Assign it to the participant in the admin portal.
6. Lock the tag only after the pilot succeeds. Locking is usually permanent.
7. Print the same URL as a QR code on the badge as fallback.

Do not encode a Vercel preview URL, `localhost`, participant PII, or an action-specific URL such as `/issue-food`.

## 8. Tomorrow's MVP test plan

### Before testing

- Deploy to the stable production domain with HTTPS.
- Apply the tag/connection migration in a development or staging Supabase project.
- Create two participant accounts and one volunteer account.
- Program at least three tags: Participant A, Participant B, and a revoked/lost test tag.
- Keep QR versions of all three URLs.

### Device matrix

- iPhone XS or newer with current iOS/Safari.
- A second iPhone if available.
- One Android Chrome device.
- Test on college Wi-Fi and mobile data.
- Test while already logged in, logged out, and with an expired session.

### Acceptance checks

- Tag is detected within a few seconds with screen on.
- Notification opens the expected participant, not a generic home page.
- Login returns to the original tag destination.
- Self-tap cannot create a connection.
- A → B creates one connection; repeating it creates no duplicate.
- B → A marks the pair mutual.
- Volunteer tap shows identity before action.
- Repeated resource action returns “already issued” and does not decrement stock twice.
- Revoked tag produces a safe error.
- QR produces the same results as NFC.
- Back navigation and refresh do not replay a mutation.
- Airplane mode/offline state shows a useful retry message.
- Tag works through the final badge holder and expected phone cases.

## 9. Vercel Hobby suitability

The NFC tags generate ordinary web requests; NFC itself adds no server cost. Five hundred participants and a few thousand short reads/writes are technically modest for a stateless Next.js/Supabase design. Vercel currently documents up to one million included function invocations and one million edge requests on Hobby, so expected event volume is far below the numerical request allowance.

Important qualifications:

- Hobby is documented for personal, non-commercial use. Confirm that the college event qualifies; otherwise use Pro or another host.
- Hobby can pause after included usage is exhausted. Monitor usage before and during the event.
- Supabase, not Vercel, is likely the operational bottleneck. Verify database plan limits, connection behavior, region, backups, and availability separately.
- Keep functions short and database operations indexed. Do not use in-memory state because serverless instances are ephemeral.
- Store uploaded proof images directly in object storage, not through large Vercel function bodies.
- A stable custom domain is strongly preferred because tags become physical infrastructure and are difficult to rewrite at scale.

## 10. Rollout phases

### Phase 0 — tomorrow

- Two-participant connection flow.
- One volunteer resource action.
- Three physical tags plus QR fallback.
- Manual tag assignment and revocation.
- Real iPhone Safari test.

### Phase 1 — event pilot

- Admin batch token generation and CSV export for encoding.
- Tag assignment station with participant search.
- Connection history and mutual status.
- Volunteer action menu with audit trail.
- Operational dashboard showing failures and duplicate attempts.

### Phase 2 — production hardening

- Database RPC transactions and rate limiting.
- Replacement workflow and inventory tracking.
- Offline-tolerant volunteer UI with a visible queue; never claim success until server acknowledgement.
- Load test at expected peak concurrency.
- Incident runbook, database backup, spare tags, spare iPhones/power banks, and QR-only fallback switch.

## 11. Go/no-go criteria

NFC can become primary only after:

- At least 50 consecutive physical reads succeed across the intended iPhone models and badge holders.
- Duplicate resource issuance is prevented at the database level.
- Lost tags can be revoked and replaced in under two minutes.
- The login-return flow works in Safari private and normal browsing modes as expected.
- Volunteers can fall back to QR/manual participant search without changing the backend workflow.
- A real deployment survives a short concurrency test and Supabase remains healthy.

If any criterion fails, keep NFC enabled for networking but use QR/manual search as the operational primary until corrected.

## 12. Immediate task order

1. Buy/locate 10–20 NDEF-compatible NTAG213 tags.
2. Choose the permanent production domain.
3. Implement the migration and `/nfc/t/[token]` resolver.
4. Implement authenticated `POST /api/nfc/connect` with idempotency.
5. Add the volunteer identity/action landing state.
6. Add admin issue/revoke controls and QR rendering from the same URL.
7. Deploy and execute the tomorrow test matrix.
8. Only then batch-program the remaining tags.

## References

- Apple, “Adding Support for Background Tag Reading”: https://developer.apple.com/documentation/corenfc/adding-support-for-background-tag-reading
- Apple Human Interface Guidelines, “NFC”: https://developer.apple.com/design/human-interface-guidelines/nfc
- MDN, “Web NFC API”: https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API
- Vercel, “Hobby Plan”: https://vercel.com/docs/plans/hobby
- Vercel, “Functions Limits”: https://vercel.com/docs/functions/limitations
