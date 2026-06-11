# Auth Refactor Master Plan — Authentication, Google OAuth & Family Invitations

Date: 2026-06-11
Source of truth: `database/supabase/database-schema.md` (READ-ONLY), `AUTH_REVIEW_REPORT.md`
Status: **Planning document — no code changed yet.**

---

# Current State Analysis

## System overview

- **Backend**: Express + `pg` (PostgreSQL/Supabase, accessed via `DATABASE_URL`, raw SQL — not via supabase-js/RLS).
- **Frontends**: `frontend-user` and `frontend-admin`, both Vite + React + TS + Zustand.
- **Auth model**: custom JWT (access ~15m + refresh ~7d stored in `refresh_tokens`, revocable), bcrypt password hashing.
- **Family system**: `family_groups` / `group_members` / `family_invitations` already exist and are largely implemented end-to-end (backend model+routes+frontend `FamilyPage`).
- **Supabase**: `@supabase/supabase-js` is already installed and configured (`VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`) in **both** frontends, but currently **unused for auth** — it's leftover scaffolding (the broken `App.tsx` "Todos Connection Test" in frontend-admin is a symptom of this). The actual app DB is the same Supabase Postgres instance, but reached via the backend's own `pg` Pool, not via the supabase-js client.

## What already works (verified in AUTH_REVIEW_REPORT.md)

| Flow | Status |
|---|---|
| `POST /auth/register` | ✅ Works |
| `POST /auth/login` | ✅ Works (but doesn't check `is_locked`) |
| `POST /auth/refresh` | ✅ Works |
| `POST /auth/logout` | ✅ Works |
| `GET /auth/me` | ✅ Works |
| Family create/join/leave/transfer-admin | ✅ Works (`familyRoutes.js` + `FamilyModel.js`) |
| **Family invitations (user-to-user)** | ✅ Already implemented — `family_invitations` table + `createInvitation` / `listSentInvitations` / `listReceivedInvitations` / `acceptInvitation` / `rejectInvitation`, surfaced in `FamilyPage.tsx` |

## The key gap for "Invite by Gmail"

The existing `family_invitations.invited_user_id` is `NOT NULL` (FK → `users.id`). This means **today you can only invite someone who already has an account** in the system. The entire "enter a Gmail address, send an email, they click a link, register/login, auto-join" flow requires the invitation to exist **before** the invitee has a `users` row — this is the central schema/feature gap to close (see *Family Invitation Design* and *Schema Impact Analysis*).

## OAuth gap

No OAuth/Google/social-login code exists anywhere in backend or either frontend. `users` table has no columns to represent an external identity (no `google_id`, `avatar_url`, `auth_provider`). `password_hash` is `NOT NULL`, which blocks "Google-only" accounts unless relaxed or given a placeholder.

---

# AUTH_REVIEW_REPORT Findings (recap)

| # | Finding | Severity | Must fix before OAuth/Invitations? |
|---|---|---|---|
| 1 | `frontend-admin/src/App.tsx` renders a Supabase "Todos" stub instead of `AdminRouter` (uncommitted regression; `App.original.tsx` has the correct content) | 🔴 Critical | **Yes** — admin UI is unreachable, so no admin-side invitation/auth UI work is testable until fixed |
| 2 | `middleware/auth.js`'s `resolveMockUser` grants `role: 'ADMIN'` to **any** `mock-token-*` bearer token → full bypass of `/api/admin/*` | 🔴 Critical | **Yes** — must not ship new OAuth-issued tokens into a system with a standing full-bypass |
| 3 | `useAdminAuthStore.login` is a pure localStorage mock (hardcoded `Admin@123`/`User@123`), never calls real `/auth/login` | 🔴 Critical | **Yes** — admin login must be real before we add Google login next to it |
| 4 | "Quên mật khẩu" (forgot password) not implemented anywhere (placeholder toasts only) | 🟠 High | Should precede/accompany OAuth (Phase 1) — shares new `password_reset_tokens` infra & email service with invitations |
| 5 | "Đổi mật khẩu" (change password) — full UI exists, but `authApi.changePassword`/`updateProfile` are stubs that always `throw`; no backend route | 🟠 High | Recommended in Phase 1 (low effort, high value, needed for OAuth-linked accounts to set a password later) |
| 6 | `is_locked` / `failed_login_attempts` never checked in `authService.login` | 🟡 Medium | Recommended in Phase 1 (cheap, closes a real gap before exposing more login paths) |
| 7 | 3-4 divergent auth middlewares (`middleware/auth.js`, `middlewares/authMiddleware.js`, inline in `fridgeRoutes.js`, `familyRoutes.js`'s `authenticateFamilyRequest`) with different mock-token handling & JWT secret fallbacks | 🟡 Medium | Partial fix in Phase 1 (just #2's bypass), full consolidation deferred to Phase 4/5 to limit blast radius |
| 8 | `backend/src/models/UserModel.js` dead code | 🟢 Low | Phase 5 cleanup |
| 9 | `frontend-user/src/App.js`, `src/views/LoginPage.js` dead code | 🟢 Low | Phase 5 cleanup |

## Prioritized roadmap (high level)

1. **Phase 1 — Critical Auth Fixes**: items #1–#6 above, plus minimal `password_reset_tokens` infra for forgot/change password.
2. **Phase 2 — Google OAuth**: schema additions to `users`, Supabase Google provider, new `/auth/oauth/google` backend endpoint, Google buttons on both frontends.
3. **Phase 3 — Family Email Invitations**: extend `family_invitations`, email service, `AcceptInvitationPage`, invite/resend/cancel UI.
4. **Phase 4 — Security Hardening**: rate limiting, middleware consolidation, token hashing, CORS/redirect allowlists.
5. **Phase 5 — Cleanup & Standardization**: remove dead code, update `.env.example`s, document new schema additions.

(Full detail in *Migration Roadmap* and *Recommended Implementation Order* below.)

---

# Authentication Architecture

## Principle: the custom backend remains the single session authority

Supabase Auth's own `auth.users` table is **not** used as the session source of truth — our app already has a complete, working JWT session system (`access_token` / `refresh_token` via `refresh_tokens` table, `authTokenService`). Re-platforming onto Supabase Auth sessions would touch every protected route and middleware, which conflicts with "minimal disruption" and "maintain backward compatibility."

Instead: **Supabase Auth (or Google directly) is used only as an *identity verifier* for the OAuth handshake.** Once we have a verified Google identity (email + sub + profile), the backend upserts `public.users` and issues **our own** JWT pair exactly as `POST /auth/login` does today. Every existing middleware, route guard, and frontend token-handling code keeps working unchanged for OAuth-originated sessions.

## Target login methods → unified token issuance

```
┌──────────────────┐   ┌──────────────────────┐
│ Email + Password  │   │ Google OAuth          │
│ POST /auth/login  │   │ POST /auth/oauth/google│
└─────────┬─────────┘   └──────────┬────────────┘
          │                         │
          ▼                         ▼
   authService.login()      oauthService.loginWithGoogle()
          │                         │
          └──────────┬──────────────┘
                      ▼
        authTokenService.issueTokenPair(user)
                      │
                      ▼
        { accessToken, refreshToken, user }
                      │
                      ▼
   (unchanged) requireAuth middleware on all
   /api/* routes — works identically regardless
   of how the session was created
```

## Consolidated middleware (target shape, Phase 4/5)

One `requireAuth` middleware replacing the 4 current variants:

- Verifies our own JWT (`JWT_SECRET_ACCESS`, no silent fallback to `'dev-secret*'` in production).
- Resolves `req.user = { id, user_id, email, full_name, role, family_id, family_role }` consistently for every route (today this shape differs per middleware).
- `mock-token-*` dev convenience is preserved **only** behind `NODE_ENV !== 'production'` and resolves to the *actual* role of the referenced user (fixes #2), not a hardcoded `ADMIN`.
- `adminRequired` and a new `familyAdminRequired` (checks `group_members.role === 'admin'` for the target family) compose on top of `requireAuth`.

## `users` table role in the new architecture

- `password_hash` becomes **nullable** — `NULL` means "this account can only sign in via OAuth."
- New nullable columns capture the linked Google identity (`google_id`, `avatar_url`, `auth_provider`).
- `authService.login` gains: (a) `is_locked` check, (b) a friendly error if `password_hash IS NULL` ("This account uses Google Sign-In").
- Roles (`role` column / `roles` table) are untouched — Google-authenticated users default to `role='user'`, identical to password registration.

---

# Google OAuth Design

## Approach comparison

| Approach | Description | Verdict |
|---|---|---|
| **A. Supabase Auth (Google provider) + backend token exchange** | Frontend uses `supabase.auth.signInWithOAuth({provider:'google'})`; Supabase handles the entire OAuth dance/redirects. Frontend then hands the resulting Supabase session to a new backend endpoint, which verifies it and issues our own JWTs. | ✅ **Recommended** — reuses the Supabase project + keys that are *already configured* in both frontends; zero new OAuth redirect-URI plumbing to write ourselves. |
| B. Google Identity Services (GIS) directly + `google-auth-library` in backend | Frontend renders Google's "Sign in with Google" button via GIS script, gets a Google ID token, sends it to backend which verifies it against Google's JWKS. | Viable fallback if Supabase's Google provider can't be enabled (e.g., no access to the Supabase project dashboard). More moving parts (new Google Cloud OAuth client, new dependency). |
| C. Passport.js `passport-google-oauth20` (server-side redirect flow) | Classic server-driven OAuth redirect/callback. | Not recommended — adds a new auth library/pattern (sessions/cookies) that's foreign to this SPA + bearer-token architecture. |

**Recommendation: Approach A**, with Approach B documented as the fallback if Supabase project admin access is unavailable.

## Architecture (Approach A)

```
Frontend (user or admin app)
  1. User clicks "Sign in with Google"
  2. supabase.auth.signInWithOAuth({ provider: 'google',
       options: { redirectTo: `${origin}/oauth/callback` } })
  3. Google consent → redirect back → supabase-js parses
     session from URL (access_token, refresh_token, user)
  4. Frontend POSTs session.access_token to:
       POST /auth/oauth/google  { supabase_access_token }

Backend (new oauthService.js)
  5. Verify token by calling Supabase Admin API:
       supabaseAdmin.auth.getUser(supabase_access_token)
     (uses SUPABASE_SERVICE_ROLE_KEY — server-side only)
     → returns verified { id (sub), email, email_confirmed_at,
        user_metadata: { full_name, avatar_url, ... },
        app_metadata: { provider: 'google' } }
  6. Upsert public.users:
       a. find by google_id = sub
       b. else find by email (case-insensitive)
            - if found and email_confirmed_at != null:
                link google_id, avatar_url, keep existing role/password
            - if found and email NOT confirmed: reject (anti-takeover)
       c. else create new user:
            email, full_name, password_hash = NULL, role = 'user',
            google_id = sub, avatar_url, auth_provider = 'google'
  7. Issue our own access+refresh JWT pair (authTokenService),
     store refresh token in refresh_tokens (unchanged flow)
  8. Respond identically to POST /auth/login:
       { accessToken, refreshToken, user }

Frontend
  9. Store tokens exactly as with password login (same Zustand
     authStore actions). Optionally supabase.auth.signOut() to
     drop the now-unneeded Supabase session.
  10. New users (no family yet) → /onboarding, same as today,
      UNLESS a pending family invitation matches their email
      (see Family Invitation Design — onboarding short-circuit).
```

## Why "verify via `supabaseAdmin.auth.getUser()`" instead of manual JWT verification

Manually verifying Supabase's access-token JWT requires knowing whether the project signs with the legacy shared `SUPABASE_JWT_SECRET` (HS256) or newer asymmetric "JWT Signing Keys" (ES256/RS256 + JWKS) — this can change per-project and silently break verification on key rotation. Calling `supabaseAdmin.auth.getUser(token)` delegates verification to Supabase itself via its `/auth/v1/user` endpoint — one extra network round-trip on login only, but robust to signing-key configuration/rotation. This requires adding `@supabase/supabase-js` + `SUPABASE_SERVICE_ROLE_KEY` to the **backend** (currently backend has zero Supabase dependencies — it's pure `pg`).

## New environment variables

| Var | Where | Notes |
|---|---|---|
| `SUPABASE_URL` | backend | Same project URL already used by frontends (`VITE_SUPABASE_URL`) |
| `SUPABASE_SERVICE_ROLE_KEY` | backend only | **Secret** — never expose to frontend. From Supabase dashboard → Settings → API |
| `VITE_GOOGLE_REDIRECT_PATH` (optional) | both frontends | e.g. `/oauth/callback`, used for `redirectTo` |

## Supabase dashboard configuration (manual, one-time, outside codebase)

- Enable **Google** provider under Authentication → Providers (requires a Google Cloud OAuth Client ID/secret — created in Google Cloud Console, separate one-time setup).
- Add redirect URLs for both frontends (dev + prod) under Authentication → URL Configuration.

## Account linking & re-auth edge cases

- **Existing password user signs in with Google using the same email**: linked automatically (step 6b) provided Google reports the email as confirmed (always true for Google accounts). User can subsequently log in via either method.
- **Google user later wants a password** (e.g., to use mobile/offline): handled by the *change password* flow from Phase 1 — `password_hash` starts `NULL`, "set password" reuses the same `reset-password` mutation (no separate "set password" endpoint needed).
- **Admin frontend Google login**: same `/auth/oauth/google` endpoint and component; `AdminProtectedRoute` already checks `role === 'ADMIN'` — a Google-authenticated `role='user'` account is correctly denied, no special-casing needed.

---

# Family Invitation Design

## Build on what already exists

`FamilyModel.js` already has a working invitation lifecycle (`createInvitation`, `listSentInvitations`, `listReceivedInvitations`, `acceptInvitation`, `rejectInvitation`) and `FamilyPage.tsx` already has UI for sending/viewing invitations by email. **We extend this, we do not replace it.** The only structural gap is that `invited_user_id` is mandatory, so an invite can't exist for someone without an account yet.

## Target flow

```
Family Admin (group_members.role = 'admin')
  │
  │ 1. Opens "Invite Member" modal in FamilyPage, enters Gmail address
  ▼
POST /api/family/invitations   { email }
  │
  │ 2. Backend checks:
  │    - is `email` already a member of THIS family?      → 409 "Already a member"
  │    - is there already a PENDING invite to `email`
  │      for THIS family?                                  → 409 "Already invited" (offer resend)
  │    - look up users by email (case-insensitive)
  ▼
  3a. User EXISTS              │  3b. User does NOT exist
      → invited_user_id = u.id │      → invited_user_id = NULL
      → invited_email = email  │      → invited_email = email
      → generate token_hash, expires_at = now()+7d, status='pending'
  │
  │ 4. emailService.sendFamilyInvitation(email, { familyName, inviterName, link })
  │    link = `${FRONTEND_USER_URL}/invitations/accept?token=<raw token>`
  ▼
User receives email, clicks link
  │
  ▼
GET /invitations/accept?token=...   (frontend-user, public route)
  │
  │ 5. Frontend calls GET /api/family/invitations/by-token/:token (public)
  │    → { familyName, inviterName, invitedEmail, status, expiresAt }
  │    - if expired/invalid/already-used → friendly error page
  ▼
  6a. Not logged in                │ 6b. Logged in
      → show Login/Register,       │     → if session.user.email !==
        pre-filled with             │       invitedEmail → warn/mismatch
        invitedEmail                │     → else proceed
  │                                  │
  ▼                                  ▼
POST /api/family/invitations/accept-by-token   { token }   (auth required)
  │
  │ 7. Backend re-validates: status='pending', not expired,
  │    req.user.email == invitation.invited_email (case-insensitive)
  │ 8. If invited_user_id was NULL → set it to req.user.id (link)
  │ 9. If req.user already belongs to a different family →
  │    confirm + switchUserToFamily() (existing fn); else attachMemberToFamily()
  │ 10. status='accepted', responded_at=now()
  ▼
Redirect to /dashboard (skips /onboarding's create/join choice)
```

## Onboarding short-circuit

`OnboardingPage.tsx` (and the post-login family check in `AppRouter.tsx`) gains one extra check: before showing "Create family / Join family", call `GET /api/family/invitations/received` (already exists — extend it to also match rows where `invited_user_id IS NULL AND lower(invited_email) = lower(current user's email)`, auto-linking `invited_user_id` at that point). If a pending invitation exists, show "You've been invited to join *<Family Name>* by *<Inviter>*" with Accept/Decline, **before** the create/join choice.

## Resend / Cancel (admin UI in `FamilyPage.tsx`)

- `POST /api/family/invitations/:id/resend` (family-admin only) — regenerates `token_hash` + `expires_at`, re-sends the email. Reuses the existing "sent invitations" list, adding `expiresAt`/`status` columns and Resend/Cancel buttons.
- `POST /api/family/invitations/:id/cancel` (family-admin only) — sets `status='cancelled'`. Distinct from `rejectInvitation` (which is the *invitee's* action).

## Email infrastructure (new dependency)

No email-sending capability exists in the backend today. New `emailService.js` wrapping a transactional provider:

- **Recommended**: a transactional API provider (Resend, SendGrid, AWS SES) over raw SMTP — better deliverability, simpler retry semantics, no SMTP credentials to manage.
- New env vars: `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `MAIL_FROM`, `FRONTEND_USER_URL` (for building accept-invitation links and password-reset links — shared with Phase 1's forgot-password feature).
- Single `emailService.send({ to, template, data })` used by both forgot-password (Phase 1) and family invitations (Phase 3) — one piece of new infra serves both features.

---

# Security Review

| Concern | Design decision |
|---|---|
| **Token generation** | `crypto.randomBytes(32).toString('hex')` (256-bit). The **raw token** is sent only in the email link; the DB stores `sha256(token)` as `token_hash`. Mirrors best practice for password-reset tokens (Phase 1 reuses the same pattern). |
| **Expiration** | Family invites: 7 days (`expires_at`). Password reset tokens: 30–60 minutes. Checked at read-time (`status='pending' AND expires_at > now()`) — no cron job needed; an expired-but-still-`pending` row is treated as expired on access and can be lazily flipped to `status='expired'`. |
| **Replay attack prevention** | Tokens are single-use: any successful accept/reset immediately flips `status` (`accepted`) or sets `used_at`, after which `accept-by-token`/`reset-password` reject the token regardless of validity window. |
| **Duplicate invitation handling** | Partial unique index `UNIQUE (group_id, lower(invited_email)) WHERE status = 'pending'` — a second invite attempt to the same email/family while one is pending is rejected (or routed to "resend" in the UI) instead of creating a duplicate row. |
| **Existing-member checks** | Before creating an invitation, check `group_members` joined to `users` by email for the target family — block with "already a member". |
| **Unauthorized join prevention** | `accept-by-token` requires `req.user.email` (case-insensitive) to equal `invitation.invited_email`. Possessing the token alone is insufficient if logged in as a different account — prevents a forwarded-email link being used by an unrelated account. |
| **Account-takeover via OAuth email** | Linking Google identity to an existing password account only happens if Google reports `email_confirmed_at` / `email_verified = true` (always true for Google). |
| **Rate limiting** | New `express-rate-limit` middleware on: `/auth/login`, `/auth/forgot-password`, `/auth/oauth/google`, `POST /api/family/invitations` (anti email-bombing/spam-invite). |
| **Secrets handling** | `SUPABASE_SERVICE_ROLE_KEY` and `EMAIL_API_KEY` are backend-only secrets — never placed in any `VITE_*` env var. |
| **Mock-token bypass (#2)** | Must be fixed (Phase 1) regardless of OAuth — otherwise any new login path is moot since `mock-token-*` already grants full admin access. |

---

# Schema Impact Analysis

All proposed changes are **additive or constraint-relaxing only** — no renames, no drops, no data migration of existing rows required. `database-schema.md` itself is not edited by application code; these would ship as new SQL migration files under `database/supabase/migrations/`, with `database-schema.md` updated manually afterward to document the new columns/tables (flagged as a Phase 5 doc-sync task).

| Table | Change | Type | Reason | Backward compatible? |
|---|---|---|---|---|
| `users` | `ADD COLUMN google_id VARCHAR UNIQUE NULL` | additive | link to verified Google identity (`sub`) | ✅ |
| `users` | `ADD COLUMN avatar_url VARCHAR NULL` | additive | profile picture synced from Google | ✅ |
| `users` | `ADD COLUMN auth_provider VARCHAR NOT NULL DEFAULT 'local'` | additive w/ default | records signup method (`'local'` \| `'google'`) | ✅ existing rows default to `'local'` |
| `users` | `ALTER COLUMN password_hash DROP NOT NULL` | relax constraint | allow Google-only accounts (`password_hash IS NULL`) | ✅ existing rows already have values |
| `family_invitations` | `ALTER COLUMN invited_user_id DROP NOT NULL` | relax constraint | allow inviting an email with no account yet | ✅ |
| `family_invitations` | `ADD COLUMN invited_email VARCHAR(255) NULL` | additive | invitee's email, always populated (even once linked) | ✅ |
| `family_invitations` | `ADD COLUMN token_hash VARCHAR(64) UNIQUE NULL` | additive | SHA-256 of the invite link token, for accept-by-token | ✅ |
| `family_invitations` | `ADD COLUMN expires_at TIMESTAMP NULL` | additive | invite expiration (7 days) | ✅ |
| `family_invitations` | widen `status` check/enum to include `'expired'`, `'cancelled'` (in addition to existing `pending`/`accepted`/`rejected`) | constraint widen | lifecycle tracking for resend/cancel/expire | ✅ existing values still valid |
| `family_invitations` | `ADD UNIQUE INDEX ... (group_id, lower(invited_email)) WHERE status='pending'` (partial index) | new index | duplicate-pending-invite prevention (works for both linked and unlinked invites) | ✅ |
| **NEW** `password_reset_tokens` | `id, user_id FK→users.id, token_hash VARCHAR(64) UNIQUE, expires_at TIMESTAMP, used_at TIMESTAMP NULL, created_at TIMESTAMP DEFAULT now()` | new table | forgot-password flow (Phase 1); same hashed-token pattern reused for invitations | ✅ purely additive |

## Alternative considered: dedicated `oauth_identities` table

For requirement #10 ("future extensibility for social login providers"), a normalized `oauth_identities (id, user_id FK, provider, provider_user_id, email, raw_profile JSONB, created_at, UNIQUE(provider, provider_user_id))` table is the more extensible long-term shape (adding Facebook/Apple later needs zero `users` schema changes).

**Recommendation**: ship the flat `google_id`/`avatar_url`/`auth_provider` columns now (simpler joins, less migration work for a single-provider MVP). If/when a second provider is needed, introduce `oauth_identities` alongside the existing columns — existing `google_id` data can be backfilled into it without breaking anything, since both can coexist. Document this as a deferred/optional Phase 2+ item rather than building it speculatively now (per "avoid unnecessary tables").

## `roles` table

No changes needed — Google-authenticated users get `role='user'` exactly like password registration; the existing `roles` reference table and `role` column on `users` are untouched.

---

# Frontend Changes

## frontend-admin

| File | Change | Phase |
|---|---|---|
| `src/App.tsx` | **Restore from `App.original.tsx`** (render `<AdminRouter /><Toaster .../>` instead of the Supabase Todos stub) — blocking, 1-line | 1 |
| `src/store/authStore.ts` | Replace localStorage-mock `login`/`changePassword`/`updateProfile` with real calls to `/auth/login`, `/auth/change-password`, `/auth/update-profile`; keep `role==='ADMIN'` gate but check it against the **real** user returned by the backend | 1 |
| `src/pages/LoginPage.tsx` | Wire "forgot password" link to `/forgot-password` (shared page, see below) instead of the toast; add "Sign in with Google" button | 1 (link) / 2 (Google) |
| New: `src/pages/ForgotPasswordPage.tsx`, `src/pages/ResetPasswordPage.tsx` | Could be shared/reused from frontend-user via a small shared package, or duplicated (both apps are independent Vite projects) — duplicate for now, low effort | 1 |
| New: `src/pages/oauth/OAuthCallbackPage.tsx` | Route `/oauth/callback` — reads Supabase session via `supabase.auth.getSession()`, posts `access_token` to `/auth/oauth/google`, stores returned tokens, redirects to `/dashboard` | 2 |
| `src/pages/families/FamilyListPage.tsx` | Optional, low-priority: read-only "pending invitations" count/column per family for support visibility (uses existing `adminFamilyApi`, extend with `GET /api/admin/families/:id/invitations`) | 3 (optional) |

## frontend-user

| File | Change | Phase |
|---|---|---|
| `src/modules/auth/api/authApi.ts` | Implement real `changePassword`/`updateProfile` (call new backend endpoints); add `forgotPassword`, `resetPassword`, `loginWithGoogle` | 1 / 2 |
| `src/modules/auth/store/authStore.ts` | Wire new actions above; `bootstrap()` also handles returning from `/oauth/callback` | 1 / 2 |
| `src/modules/auth/pages/LoginPage.tsx` | Replace "Quên mật khẩu" toast with link to `/forgot-password`; add "Sign in with Google" button | 1 / 2 |
| New: `src/modules/auth/pages/ForgotPasswordPage.tsx` | Email input → `POST /auth/forgot-password`, generic "check your email" message regardless of whether the email exists | 1 |
| New: `src/modules/auth/pages/ResetPasswordPage.tsx` | Route `/reset-password?token=...` → new password + confirm, `POST /auth/reset-password` | 1 |
| `src/modules/auth/pages/ChangePasswordPage.tsx`, `ProfilePage.tsx` | No UI changes needed — already correct; just stop calling stubs once `authApi` is implemented (Phase 1) | 1 |
| New: `src/pages/oauth/OAuthCallbackPage.tsx` + route `/oauth/callback` | Same as admin variant | 2 |
| New: `src/pages/InvitationAcceptPage.tsx` + route `/invitations/accept` | Public route: fetch `GET /api/family/invitations/by-token/:token`, show family/inviter info, route to login/register (pre-filled email) if logged out, else `POST .../accept-by-token` | 3 |
| `src/pages/OnboardingPage.tsx` | Add "pending invitation" check before create/join choice (see *Family Invitation Design*) | 3 |
| `src/modules/family/pages/FamilyPage.tsx` | Extend existing invite-by-email modal: handle "already a member"/"already invited" responses; extend sent-invitations list with status (`pending`/`accepted`/`rejected`/`expired`/`cancelled`), `expiresAt`, and **Resend**/**Cancel** buttons | 3 |
| `src/modules/family/api/familyApi.ts` | Add `inviteByEmail`, `resendInvitation`, `cancelInvitation`, `getInvitationByToken`, `acceptInvitationByToken` | 3 |
| Both `.env.example` | Document `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` (already present in frontend-user, missing values in frontend-admin `.env.example`) and any new `VITE_*` vars | 5 |

---

# Backend Changes

## New files

| File | Purpose | Phase |
|---|---|---|
| `src/services/emailService.js` | Thin wrapper around chosen transactional email provider; `send({ to, template, data })` | 1 (used by forgot-password), reused in 3 |
| `src/services/passwordResetService.js` | Generate/hash/verify password-reset tokens against `password_reset_tokens` | 1 |
| `src/services/oauthService.js` | `loginWithGoogle(supabaseAccessToken)` — calls Supabase Admin API, upserts `users`, issues token pair | 2 |
| `database/supabase/migrations/00X_password_reset_tokens.sql` | New table (Schema Impact #7) | 1 |
| `database/supabase/migrations/00Y_oauth_columns.sql` | `users` additive columns + relax `password_hash` (Schema Impact #1-4) | 2 |
| `database/supabase/migrations/00Z_family_invitations_email.sql` | `family_invitations` additive columns/index (Schema Impact #5-9) | 3 |

## Modified files

| File | Change | Phase |
|---|---|---|
| `src/middleware/auth.js` | Fix `resolveMockUser` to no longer hardcode `role: 'ADMIN'` — resolve the *actual* role of the referenced user (or restrict mock-tokens to non-production entirely) | 1 |
| `src/services/authService.js` | Add `is_locked`/`failed_login_attempts` check in `login`; add `changePassword`, `updateProfile`, `forgotPassword`, `resetPassword`; reject password login with friendly message when `password_hash IS NULL` | 1 |
| `src/controllers/AuthController.js` | New handlers: `changePassword`, `updateProfile`, `forgotPassword`, `resetPassword`, `oauthGoogle` | 1 / 2 |
| `src/routes/authRoutes.js` | New routes (see *API Changes*) | 1 / 2 |
| `src/models/FamilyModel.js` | Extend invitation functions: `createEmailInvitation`, `findInvitationByToken`, `acceptInvitationByToken`, `resendInvitation`, `cancelInvitation`; extend `listReceivedInvitations` to match unlinked `invited_email` | 3 |
| `src/controllers/FamilyController.js` | New handlers wrapping the above | 3 |
| `src/routes/familyRoutes.js` | New routes (see *API Changes*); add public (no-auth) route for `by-token` lookup | 3 |
| `src/middleware/adminRequired.js` | Unchanged logic, but now reliably reflects real roles once #2 is fixed | 1 |
| `src/models/UserModel.js` | Delete (dead code) | 5 |
| `frontend-admin/src/App.original.tsx`, `frontend-user/src/App.js`, `frontend-user/src/views/LoginPage.js` | Delete (dead code, after confirming no references) | 5 |

## Consolidated middleware (Phase 4/5, separate from Phase 1's targeted fix)

Phase 1 only patches the `role: 'ADMIN'` hardcoding bug *in place* in `middleware/auth.js` (smallest possible diff to close the security hole fast). The full consolidation into a single `requireAuth` middleware (replacing `middlewares/authMiddleware.js`, the inline middleware in `fridgeRoutes.js`, and `familyRoutes.js`'s `authenticateFamilyRequest`) is scoped to Phase 4/5 — it touches every route file and warrants its own focused pass + regression testing, separate from the urgent security fix.

---

# API Changes

## New/changed `auth` endpoints (`backend/src/routes/authRoutes.js`)

| Method & Path | Auth | Body | Response | Phase |
|---|---|---|---|---|
| `POST /auth/forgot-password` | none | `{ email }` | `{ success: true, message: "..." }` (always generic, regardless of whether email exists) | 1 |
| `POST /auth/reset-password` | none | `{ token, new_password }` | `{ success: true, message: "..." }`; on success, revokes all `refresh_tokens` for that user | 1 |
| `POST /auth/change-password` | `requireAuth` | `{ old_password, new_password }` | `{ success: true }`; if `password_hash IS NULL` (Google-only account), `old_password` is optional/ignored and this acts as "set password" | 1 |
| `POST /auth/update-profile` | `requireAuth` | `{ full_name?, email?, phone? }` | `{ success: true, user }` | 1 |
| `POST /auth/oauth/google` | none | `{ supabase_access_token }` | Same shape as `POST /auth/login`: `{ accessToken, refreshToken, user }` | 2 |

`POST /auth/login`, `/register`, `/refresh`, `/logout`, `GET /auth/me` — **unchanged** request/response shapes; `login` gains an internal `is_locked`/`password_hash IS NULL` check (Phase 1) but the API contract is the same on success.

## New/changed `family` endpoints (`backend/src/routes/familyRoutes.js`)

| Method & Path | Auth | Body / Params | Response | Phase |
|---|---|---|---|---|
| `POST /api/family/invitations` | `requireAuth` + family-admin | `{ email }` | `{ success, data: invitation, message }`; `409` if already-member or already-invited | 3 |
| `GET /api/family/invitations/by-token/:token` | none (public) | — | `{ success, data: { familyName, inviterName, invitedEmail, status, expiresAt } }` or `404` | 3 |
| `POST /api/family/invitations/accept-by-token` | `requireAuth` | `{ token }` | `{ success, data: family }`; `403` if email mismatch, `410` if expired/used | 3 |
| `POST /api/family/invitations/:id/resend` | `requireAuth` + family-admin | — | `{ success, data: invitation }` (new `expires_at`) | 3 |
| `POST /api/family/invitations/:id/cancel` | `requireAuth` + family-admin | — | `{ success }` (`status='cancelled'`) | 3 |

`GET /api/family/invitations/sent` and `GET /api/family/invitations/received`, `POST /api/family/invitations/:id/accept`, `POST /api/family/invitations/:id/reject` — **existing endpoints kept**; `received` extended to also surface unlinked invitations matching the caller's email (Phase 3).

`POST /api/family/members` (existing email-invite endpoint) — **superseded by** `POST /api/family/invitations` for the new flow but left in place during Phase 3 for backward compatibility, removed in Phase 5 once the frontend is fully migrated.

## Optional admin-side endpoint

| Method & Path | Auth | Notes | Phase |
|---|---|---|---|
| `GET /api/admin/families/:id/invitations` | `requireAuth` + `adminRequired` | Read-only, for support visibility in `FamilyListPage` | 3 (optional) |

---

# Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Email deliverability is brand-new infrastructure (no SMTP/provider configured today) | Invitation/reset emails land in spam or fail silently, blocking Phases 1 & 3 | Use a reputable transactional provider (Resend/SendGrid/SES) with a verified sending domain; add a dev-mode fallback that logs the email content/link to console so flows are testable without real delivery |
| `SUPABASE_SERVICE_ROLE_KEY` is a highly privileged secret | If leaked, full DB access via Supabase API (bypasses RLS) | Backend-only env var, never logged, never sent to frontend; rotate if ever exposed |
| Schema migrations on a live Supabase DB | Downtime or lock contention if run carelessly | All changes are `ADD COLUMN`/`DROP NOT NULL`/`CREATE INDEX` — fast, non-locking on Postgres for nullable columns with no default (except `auth_provider DEFAULT 'local'`, a metadata-only rewrite in PG11+); run during low-traffic window regardless |
| Mock-token bypass (#2) fix could break dev workflows relying on "mock-token-* = admin" | Developers using mock tokens for admin testing lose that shortcut | Resolve mock-token to the *real* role of the referenced dev user, and ensure at least one seeded dev user has `role='ADMIN'` for local testing |
| Large in-progress uncommitted "FULL_ADMIN_FE+BE" work (per `git status`) | New auth changes could conflict with in-flight admin feature work | Coordinate timing — recommend the user commits/stabilizes current WIP (especially `App.tsx`) before Phase 1 begins |
| Account linking by email (Google ↔ existing password account) | Theoretical account-takeover if an email provider doesn't verify ownership | Restrict linking to `email_confirmed_at != null` from Supabase/Google (always true for Google) |
| `family_invitations.invited_user_id` becoming nullable | Any existing code that assumes it's always set could break | Audit all reads of `invited_user_id` in `FamilyModel.js`/`FamilyController.js` during Phase 3 implementation; `normalizeInvitation()` should null-check it |
| New `/oauth/callback` routes are public | Could be probed/abused if not careful | Endpoint only *exchanges* a Supabase-verified token for app tokens — no user-supplied data is trusted without the `getUser()` verification round-trip |

---

# Migration Roadmap

## Phase 1 — Critical Auth Fixes
*Goal: make the existing auth system correct and complete before adding new login methods.*

- Restore `frontend-admin/src/App.tsx` from `App.original.tsx` (AUTH_REVIEW_REPORT #1).
- Fix `middleware/auth.js` mock-token bypass — stop hardcoding `role: 'ADMIN'` (#2).
- Replace `useAdminAuthStore.login`/`changePassword`/`updateProfile` mock with real `/auth/*` calls (#3).
- Add `is_locked`/`failed_login_attempts` check to `authService.login` (#6).
- New migration: `password_reset_tokens` table.
- New `emailService.js` (with dev-mode console fallback).
- Implement `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password`, `/auth/update-profile` (#4, #5); wire frontend-user's existing `ChangePasswordPage`/`ProfilePage` to real `authApi`; add `ForgotPasswordPage`/`ResetPasswordPage` to both frontends.

**Exit criteria**: admin app loads real `AdminRouter`; admin login uses real backend; `mock-token-*` no longer grants ADMIN by default; locked accounts can't log in; forgot/change password work end-to-end in both frontends.

## Phase 2 — Google OAuth

- Migration: `users` gains `google_id`, `avatar_url`, `auth_provider`; relax `password_hash` to nullable.
- Enable Google provider in Supabase Auth dashboard (manual, one-time); configure redirect URLs.
- Add `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` to backend env.
- New `oauthService.js` + `POST /auth/oauth/google`.
- Add "Sign in with Google" button + `/oauth/callback` page to both frontends.
- `authService.login` rejects password-login attempts on `password_hash IS NULL` accounts with a clear message.

**Exit criteria**: new users can register via Google; existing password users can link Google by signing in with the same (verified) email; admin role checks work identically for Google-authenticated admins.

## Phase 3 — Family Email Invitations

- Migration: `family_invitations` gains `invited_email`, `token_hash`, `expires_at`, relaxed `invited_user_id`, widened `status`, partial unique index.
- Extend `FamilyModel.js`/`FamilyController.js`/`familyRoutes.js` with the new invitation endpoints.
- Reuse `emailService.js` for invitation emails.
- New `InvitationAcceptPage` (frontend-user) + `/invitations/accept` route.
- `OnboardingPage` pending-invitation short-circuit.
- `FamilyPage.tsx` invite modal + sent-invitations list gain Resend/Cancel and status display.

**Exit criteria**: family admin can invite a Gmail address that has no account yet; invitee receives email, registers/logs in (incl. via Google), and is auto-joined to the family; duplicate/expired/cancelled invites are handled correctly.

## Phase 4 — Security Hardening

- `express-rate-limit` on `/auth/login`, `/auth/forgot-password`, `/auth/oauth/google`, `POST /api/family/invitations`.
- Consolidate the 3-4 auth middlewares into one `requireAuth` (+ `adminRequired` + `familyAdminRequired`).
- Audit logging for admin actions (ties into the broader admin activity log work already in progress per `git status`).
- CORS / Supabase redirect URL allowlist review for prod.

## Phase 5 — Cleanup & Standardization

- Delete dead code: `backend/src/models/UserModel.js`, `frontend-admin/src/App.original.tsx`, `frontend-user/src/App.js`, `frontend-user/src/views/LoginPage.js`.
- Remove the superseded `POST /api/family/members` email-invite path once frontend fully migrated.
- Update `database/supabase/database-schema.md` to document all new columns/tables/indexes from Phases 1–3.
- Update `.env.example` for backend (new `SUPABASE_*`, `EMAIL_*`, `FRONTEND_USER_URL` vars) and both frontends.

---

# Recommended Implementation Order

A fine-grained, sequential checklist (each item is independently shippable/testable):

1. Restore `frontend-admin/src/App.tsx` from `App.original.tsx` (1-line fix).
2. Fix `middleware/auth.js`'s `resolveMockUser` role-hardcoding bug.
3. Wire `frontend-admin`'s `authStore.login` to real `POST /auth/login` + role check.
4. Add `is_locked`/`failed_login_attempts` check in `authService.login`.
5. Migration: create `password_reset_tokens` table.
6. Build `emailService.js` (provider + dev-console fallback).
7. Implement `POST /auth/forgot-password` + `POST /auth/reset-password`; add `ForgotPasswordPage`/`ResetPasswordPage` to both frontends.
8. Implement `POST /auth/change-password` + `POST /auth/update-profile`; connect frontend-user's existing `ChangePasswordPage`/`ProfilePage`; replicate "forgot password" link + change-password wiring in frontend-admin.
9. Migration: `users` — add `google_id`, `avatar_url`, `auth_provider`; relax `password_hash` to nullable.
10. Enable Google provider in Supabase dashboard; add `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` to backend env.
11. Implement `POST /auth/oauth/google` (`oauthService.js`); add "Sign in with Google" + `/oauth/callback` to both frontends.
12. Migration: `family_invitations` — add `invited_email`, `token_hash`, `expires_at`, relax `invited_user_id`, widen `status`, add partial unique index.
13. Implement `POST /api/family/invitations`, `GET .../by-token/:token`, `POST .../accept-by-token`, resend/cancel endpoints; reuse `emailService.js`.
14. Build `InvitationAcceptPage` + `/invitations/accept` route; add onboarding pending-invitation short-circuit.
15. Extend `FamilyPage.tsx` invite modal + sent-invitations list (status, expiry, resend, cancel).
16. Security hardening pass: rate limiting + middleware consolidation.
17. Cleanup: delete dead code, remove superseded endpoints, update `database-schema.md` and `.env.example` files.

---

*End of plan. No code has been changed as part of producing this document — implementation should proceed item-by-item from the Recommended Implementation Order, starting with Phase 1 (items 1–8), which are independent of and prerequisite to the OAuth/invitation work.*
