# CLAUDE.md — ContextGrade Web App (Staff Dashboard)

# What This App Is

This is the staff-facing web dashboard for **ContextGrade**, a Decision Intelligence Platform.

The backend (`contextgrade` API, Hono + Prisma + Postgres, prefixed `/api/v1`) is the source of truth.
This app is a thin client over it — no business logic should be duplicated here that the API already owns
(role checks excepted — see the Server-side role check column in the Full Endpoint Reference below;
as of 2026-06-21 some role checks are enforced server-side and some are deliberately UI-only — don't
assume either way without checking that column).

**Implementation status (2026-06-21):** all 5 Required Screens below are implemented in this repo with
real API wiring — `src/lib/api.ts` is the typed client, no mock/dummy data remains. The "Known Backend
Gaps" section further down has been mostly resolved; it's kept as dated history so the next gap (if any)
doesn't get rediscovered the hard way.

## Product Vision (inherited from backend)

Most software stores *what happened* (Salesforce: deal state, Jira: ticket state, Figma: design state).
ContextGrade stores *why it happened*. That reasoning normally lives in Slack threads, meetings, DMs, and
human memory, and gets lost. ContextGrade captures it as durable organizational memory.

This dashboard is where that memory becomes visible and useful to the humans who created it.

We are **not** building CRM, project management, ticketing, or employee-monitoring software. Every screen
in this app should serve one of: decision memory, decision lineage, decision traceability, organizational
precedent, or the context graph. Avoid building anything that looks like activity/productivity tracking —
that's an explicit anti-goal of the product (see "What We Avoid" below).

---

# How Decisions Get Into the System (read this before building any "create/log" UI)

This web app **does not** capture decisions itself. There is no "log a decision" form to build here —
that already exists. Decisions arrive from two capture surfaces:

## 1. Chrome Extension (primary surface)

A browser extension that runs on any web tool (Figma, Jira, HubSpot, Salesforce, etc.) and lets a staff
member record a decision and its rationale *at the moment it's made*, without leaving the page they're
working in. It sends one request to `POST /decisions`:

```json
{
  "subject_company": { "name": "Welcome to FigJam", "domain": "figma.com" },
  "decision_type": "CUSTOM",
  "summary": "Change the base color to navy",
  "note": {
    "content": "Change the base color to navy.\n\nWhy: Because navy is the project theme color.\n\nContext: Agreed during design review.",
    "source_app": "figma",
    "source_url": "https://www.figma.com/file/..."
  }
}
Extension form field → API field:

Extension field	API field
Source (e.g. Figma)	note.source_app
Source URL	note.source_url
Subject (page/entity name)	subject_company.name
Domain	subject_company.domain
Decision Type	decision_type
Decision (what was decided)	summary
Why	note.content
Additional context	appended to note.content
subject_company is the entity the decision is about (a deal, a ticket, a Figma file) — not the source
app itself. The extension identifies the subject via external_id → domain → slugified name, in that
fallback order, since B2B/CRM identifiers usually aren't available from a browser context.

The extension may also fire POST /events for raw pre-decision signal (e.g. "user opened a discount form
in HubSpot") before a formal decision exists. These are ObservedEvent rows, not decisions — they're the
ambient signal stream, and some may later be promoted into a Decision via converted_to_decision_id.

2. REST API / Webhooks (B2B surface)
Direct server-to-server integration (CRM sync, webhooks) authenticated via X-API-Key. Same POST /decisions shape, but external_id should always be supplied explicitly (e.g. a CRM deal ID) rather than
relying on the domain/name fallback.

Implication for this app: decisions you render were not created here, but as of 2026-06-21 every
decision now carries `logged_by`/`logged_by_user` (who created it) alongside the existing
`decided_by_user` (who reviewed it) — so "decisions logged by me" is a real `?mine=true` filter on
`GET /decisions`, not something this app has to approximate.

Personas & Roles
Membership to a client account carries a per-client role (UserRole enum): OWNER, ADMIN, APPROVER,
VIEWER. The product ask maps onto these as:

Product term	Backend role(s)	Dashboard view
Staff	VIEWER, APPROVER	Scoped — their own decisions only
Lead / Admin	ADMIN, OWNER	Wholistic — every decision across the team
A user's role is per client, not global — a person can be ADMIN at one client and VIEWER at another
if they somehow hold two memberships (rare, but the data model allows it). Always read role from the
membership object for the currently selected client, not a cached global value.

Membership lifecycle: the first user to create a company gets ADMIN + ACTIVE immediately. Everyone who
joins after that gets VIEWER + PENDING until an existing ADMIN/OWNER approves them (or domain-match
auto-approval kicks in, if configured). A PENDING membership should not be treated as logged in for
client-scoped data — they have a User row but no usable clientId yet.

Auth Model
Two header strategies, but this app only ever uses the first:

Authorization: Bearer <supabase-jwt> — for this dashboard (and the extension).
X-API-Key: <key> — B2B server integrations only. Never use this in browser code.
X-Client-Id: <id> — required whenever the signed-in user has more than one ACTIVE membership.
If omitted and the user has exactly one active membership, the backend auto-selects it. If omitted and the
user has multiple, clientId is never set server-side and most endpoints will return:
400 { error: "Bad Request", message: "Client context required..." }.
This app needs a persisted "current organization" selector (e.g. in local storage / a top-nav switcher)
that sends X-Client-Id on every authenticated request once a user belongs to >1 org.

Bootstrapping a session
/users and /users/me use a different, lighter middleware (sessionAuth) than every other route
(authenticate) — they only verify the Supabase JWT, they do not resolve clientId/membershipRole. This
matters operationally:

User signs in via Supabase → you have a Supabase JWT.
Call GET /users/me. If 404, the local User row doesn't exist yet — show a "complete your profile / join or create an organization" step, then POST /users with { client: { client_id | client_name }, email, ... }.
Only after a User row + at least one membership exists will the authenticate middleware (used by /decisions, /ai-reports, /events, etc.) successfully resolve userId/clientId/membershipRole.
GET /memberships/me returns all memberships (any status) for the picker UI — each includes role, status, and embedded client (name, slug, logo, plan, active).
Required Screens
1. Decision Feed (role-scoped) — ✅ implemented: `src/components/decisions/DecisionFeed.tsx`
GET /decisions?page=&limit=&status=&decision_type=&mine=&logged_by=&decided_by= returns
`{ data: DecisionSummary[], total, page, limit }` — note `total`/`page`/`limit` are siblings of
`data`, not nested inside it (a real frontend bug we hit and fixed — see `asPaginated()` in
`src/lib/api.ts`). `mine=true` resolves server-side to the caller's own userId (400 if called via
an API key — no session to resolve "mine" from). Each `DecisionSummary` also carries
`logged_by?: number` and `logged_by_user?: {id, name}`. Build:

Lead/Admin (ADMIN/OWNER): render the list as-is, no `mine` param — this matches "wholistic view of
all decisions made by all staff." Each row shows `logged_by_user.name` so admins can see who logged
what without it being a productivity-tracking feature (it's lineage, not monitoring).
Staff (VIEWER/APPROVER): call with `mine=true` — this is a real server-side filter now, not an
approximation.
Each row: summary, decision_type, status (PROPOSED/PENDING_REVIEW/APPROVED/REJECTED/
OVERRIDDEN/EXPIRED/ESCALATED), urgency, subject_company.name/domain, created_at, decided_at.
Support filtering by status and decision_type (use GET /decisions/types to populate the type filter
with the client's actual reserved + custom types, not a hardcoded enum — the enum was removed from the schema).

2. Decision Detail ("see all context on the decision") — ✅ implemented: `src/components/decisions/DecisionDetail.tsx`
GET /decisions/:id returns: core fields, decided_by_user, subject_company (with industry/country),
overrides[], links[], notes[] (oldest-first, `author{id,name,email}` embedded — added 2026-06-21,
see history at the bottom of "Known Backend Gaps"), and an optional context block (signals, policies,
agent_rationale, agent_model) which is the DecisionContextSnapshot — this is optional and will be
absent on most decisions, since snapshots are no longer auto-created and are only written by future
retroactive-analysis tooling. Design the context panel as an empty state by default, not a guaranteed
section.

Confirmed field names — these differ from the generic names used elsewhere in this doc, so use the
exact ones below, not `action`/`reason`/`link_type`:
- `overrides[]`: `{ user_id, override_action, override_reason?, created_at, user?: {id, name?, email, title?} }`
- `links[]`: `{ id, relationship_type, target_decision_id, confidence?, related_decision?: {id, status, summary?, decision_type?, created_at} }`.
  Canonical `relationship_type` values: `PRECEDENT`, `SIMILAR_CASE`, `POLICY_EXCEPTION`,
  `CONTRADICTS`, `SUPPORTS`, `FOLLOW_UP` — uppercase/underscore, not kebab-case.
- `notes[]`: `{ id, decision_id, author_id?, author?: {id,name,email}, content, source_app?, source_url?, created_at }`

3. Settings — Decision Types & Context Categories
Two near-identical CRUD screens, both client-scoped:

GET /decisions/types / GET /decisions/context-categories — list reserved + custom.
POST /decisions/types { decision_type, label? } / POST .../context-categories { category, label? } — creates a custom (is_reserved: false) entry. The backend uppercases and underscores whatever string you send ("My Type" → MY_TYPE), so don't pre-format aggressively client-side, just preview the result.
PUT .../types/:typeId / PUT .../context-categories/:categoryId — { decision_type?, label?, active? }. Returns 403 if is_reserved.
DELETE .../types/:typeId / DELETE .../context-categories/:categoryId — 403 if is_reserved.
UI requirement directly from the product spec: reserved rows (is_reserved: true) must render as
read-only — no edit/delete affordance at all, regardless of the 403 the API would return anyway. The 8
reserved decision types (DISCOUNT, ONBOARDING, PAYMENT_TERMS, CREDIT_EXTENSION, PARTNERSHIP,
RENEWAL, ESCALATION, CUSTOM) and 9 reserved context categories (PAYMENT, ONBOARDING, HIRING,
COMPLIANCE, ENGINEERING, SALES, PARTNERSHIP, SECURITY, CUSTOM) are seeded automatically per
client via a DB trigger — never assume a hardcoded list, always render from the API response.

These settings screens are gated to ADMIN/OWNER in the UI (`src/app/settings/page.tsx`) — ✅ implemented.
As of 2026-06-21 this is also enforced server-side via `requireRole(...)` middleware on all four
endpoints (403 for VIEWER/APPROVER). Keep the client-side gating anyway — it's UX (avoids a pointless
round trip), not the only line of defense anymore.

4. AI Decision Reports — "download/view their context.md" — ✅ implemented: `src/app/reports/page.tsx`
GET /ai-reports?category_id=&status= — list, filterable by category and PENDING|GENERATING|COMPLETED| FAILED.
POST /ai-reports/generate { category_id } — triggers compilation synchronously (the request blocks until the markdown is built — there's no polling needed today, the 201 response already contains the full report). Show a loading state for the duration of the call, not a "check back later" pattern, unless this changes to a background job later.
GET /ai-reports/:id — full report including content (the compiled Markdown). Render it, and offer a "Download .md" button that does a client-side blob download of content as <title-or-slug>.md. No separate download endpoint exists — the file is just the content string. There is no `slug` field, and `title` is `null` until `status: "COMPLETED"` — fall back to `${category_id}-${id}` for the filename while it's null.
This is manually triggered only, per category, never automatic on decision creation. The report compiles
every decision under that context category into a single Markdown doc (summary stats + per-decision sections
with notes/overrides/outcomes), optionally appended with an AI Insights section if the backend has
OPENAI_API_KEY configured (agent_model will be "gpt-4o-mini" when that happened, absent otherwise —
use this to show/hide an "AI Insights" badge rather than assuming it's always present).

context_id wiring fixed 2026-06-21: `processDecisionCreation` now resolves `context_key` →
`DecisionContext` → sets `contextId` on the created decision (400 `Context '<key>' not found for this
client` if it doesn't resolve). Remaining caveat — a product call, not a bug: the Chrome extension's
documented `POST /decisions` payload (top of this doc) never actually sends `context_key` today, so
decisions captured via the extension still won't auto-populate a category until that's addressed
upstream in the extension. If reports keep showing zero decisions, check that before assuming this
screen is broken.

5. Team management (implied by "lead/admin wholistic view") — ✅ implemented: `src/app/team/page.tsx`
Not explicitly requested but required for an admin to get a wholistic team, and exposed already:

GET /memberships/client/:clientId?status= — roster, with per-member role/status. Each row:
`{ id, user_id, client_id, role, status, created_at, updated_at, user?: {id, email, name, image_url} }`
— `user` is optional, no `title` field (that's only on decision-override `user` embeds).
PATCH /memberships/:id/approve / /reject — clear the PENDING queue. ADMIN/OWNER only, enforced server-side (assertCallerIsAdmin). As of 2026-06-21, decision review and decision-type/context-category mutations are also enforced server-side this way — see "Known Backend Gaps" history below.
PATCH /memberships/:id/role { role } — blocked if it would demote the last ADMIN/OWNER.
DELETE /memberships/:id — self-removal allowed for anyone; removing someone else requires admin.
GET /notifications, PATCH /notifications/:id/read, PATCH /notifications/read-all — membership request/approval/rejection notifications feed the admin's inbox. Response: `{ data: Notification[], unread_count }` where each item is `{ id, user_id, type, title, message, metadata, read, created_at, updated_at }` (fixed 2026-06-21 — `data` used to be an object, not an array; see history below).
Full Endpoint Reference
All under /api/v1. ✅ = role enforced server-side. ⚠️ = any ACTIVE member can call regardless of role
(gate in UI only).

Method	Path	Purpose	Server-side role check
GET	/users/me	Current user + memberships	n/a (own data)
POST	/users	Create profile / join-or-create client	n/a
GET	/users/:id	Fetch a user	n/a
PATCH	/users/:id	Update own profile	✅ self-only
GET	/memberships/me	Own memberships (any status)	n/a
GET	/memberships/client/:clientId	Roster for a client	none explicit
PATCH	/memberships/:id/approve	Approve pending member	✅ admin/owner
PATCH	/memberships/:id/reject	Reject pending member	✅ admin/owner
PATCH	/memberships/:id/role	Change a member's role	✅ admin/owner
DELETE	/memberships/:id	Remove a membership	✅ self or admin/owner
GET	/decisions	List decisions (client-wide, paginated; ?mine=/?logged_by=/?decided_by= as of 2026-06-21)	⚠️ any ACTIVE member
POST	/decisions	Log a decision (extension/API use only)	⚠️
GET	/decisions/:id	Full decision detail (incl. notes[] as of 2026-06-21)	⚠️
POST	/decisions/:id/review	approve/reject/override/escalate	✅ owner/admin/approver (2026-06-21)
POST	/decisions/:id/notes	Append a note	⚠️ intentional — any role incl. VIEWER may add a note
GET	/decisions/contexts	List decision contexts (key/name/category)	n/a
GET	/decisions/types	List reserved + custom decision types	n/a
POST	/decisions/types	Create custom type	✅ admin/owner (2026-06-21)
PUT	/decisions/types/:typeId	Edit custom type (403 if reserved)	✅ admin/owner (2026-06-21)
DELETE	/decisions/types/:typeId	Delete custom type (403 if reserved)	✅ admin/owner (2026-06-21)
GET	/decisions/context-categories	List reserved + custom categories	n/a
POST	/decisions/context-categories	Create custom category	✅ admin/owner (2026-06-21)
PUT	/decisions/context-categories/:categoryId	Edit (403 if reserved)	✅ admin/owner (2026-06-21)
DELETE	/decisions/context-categories/:categoryId	Delete (403 if reserved)	✅ admin/owner (2026-06-21)
GET	/ai-reports	List reports (?category_id=&status=)	n/a
POST	/ai-reports/generate	Compile + return a report (synchronous)	⚠️
GET	/ai-reports/:id	Full report incl. content markdown	n/a
POST	/events	Log a raw observed event (extension pre-decision)	n/a
GET	/notifications	List own notifications	n/a
PATCH	/notifications/:id/read	Mark one read	n/a
PATCH	/notifications/read-all	Mark all read	n/a
GET	/clients/search	Search clients by name (onboarding flow)	n/a
Known Backend Gaps — RESOLVED 2026-06-21 (kept as dated history, not a current to-do list)
All five gaps originally listed here were fixed by the backend team and verified end-to-end
(tsc --noEmit clean, build clean, a live create→note→fetch round-trip confirming logged_by,
context_key→contextId, and notes[] all work). The frontend was updated to match in the same session.
If you're reading this looking for "what's still broken," check the Full Endpoint Reference table
above instead — it's kept current. This section stays so nobody re-discovers the same gaps from a
production crash.

1. ~~No "who logged this decision" field.~~ Fixed: `Decision.loggedBy` (FK → users.id, nullable,
   SetNull on delete) added via migration `20260621231403_add_decision_logged_by`.
   `createDecisionHandler` now threads the creating user's `userId` through
   `processDecisionCreation`, setting `loggedBy` on the row and `authorId` on the inline
   creation-time note (previously always null for extension-logged decisions). `GET /decisions`
   gained `?mine=true` (resolves to the caller's own userId; 400 for API-key callers with no
   session) plus direct `?logged_by=`/`?decided_by=` filters — see `src/lib/api.ts` `listDecisions`.

2. ~~context_key accepted but never wired up.~~ Fixed: `processDecisionCreation` resolves
   `context_key` → `DecisionContext` (via a new `findDecisionContextByKey(clientId, key)` lookup) →
   sets `contextId` on the created decision (400 `Context '<key>' not found for this client` if it
   doesn't resolve, mirroring the existing decision_type error convention). Caveat that's now a
   product call, not a backend bug: the Chrome extension's documented payload (top of this doc)
   never sends `context_key`, so extension-captured decisions still won't auto-populate a category
   until that's addressed upstream in the extension.

3. ~~GET /decisions/:id omits notes.~~ Fixed: `findDecisionById` now includes `notes[]`
   (oldest-first, `author{id,name,email}` embedded). Decision Detail renders real note history now
   instead of being POST-only/session-local.

4. ~~No decision_type/category "mine" or "team" filter, no decided_by filter.~~ Fixed alongside #1.

5. ~~Role not enforced server-side on decision review, decision creation/notes, or
   decision-type/context-category CRUD.~~ Partially fixed via a new `requireRole(...)` middleware
   (backend repo: `src/middleware/role.middleware.ts`). `POST /decisions/:id/review` →
   OWNER/ADMIN/APPROVER only (VIEWER gets 403 now). `/decisions/types*` and
   `/decisions/context-categories*` mutations → OWNER/ADMIN only. `POST /decisions/:id/notes` was
   deliberately left ungated — the product spec says "users may... leave rationale" with no role
   qualifier, and gating it would block ordinary staff from adding follow-up context to their own
   decisions. API-key/master-key callers (no membershipRole) bypass `requireRole` unconditionally —
   they're trusted server-to-server. Don't message this to users as "VIEWERs can never act on
   decisions" — they still can add notes by design, just not review/override/escalate.

Notifications bug (found during frontend integration, not in the original gap list): GET
/notifications originally returned `{ data: { notifications: [...], unread_count } }` — `data` was an
object, breaking the flat-array convention every other list endpoint follows (decisions, ai-reports,
types, categories all return `data` as a flat array). Fixed to `{ data: [...], unread_count }`. If you
add a new list endpoint, follow the flat-array convention or the frontend's defensive unwrapping in
`src/lib/api.ts` (`asArray`/`apiFetchArray`) will silently return an empty list instead of crashing —
which is safer than a crash, but still wrong data.

Confirmed response shapes that turned out to differ from this doc's earlier prose (the frontend types
in `src/lib/api.ts` are now correct — use these, not the generic field names used in earlier drafts of
this doc):
- `GET /decisions` envelope: `{ data: DecisionSummary[], total, page, limit }` — `total`/`page`/`limit`
  are siblings of `data`, not nested inside it.
- `overrides[]`: `override_action`/`override_reason` (not `action`/`reason`/`note`).
- `links[]`: `relationship_type`/`target_decision_id` (not `link_type`/`related_decision_id`);
  canonical values are uppercase/underscore (`SIMILAR_CASE`, `POLICY_EXCEPTION`, etc.), not kebab-case.
- `GET /memberships/client/:clientId` rows: `user` is optional, includes `image_url`, no `title`.
- `GET /ai-reports`: no `slug` field; `title` is `null` until `status: "COMPLETED"`.

Architectural Principles to Carry Into the UI
Inherited from the backend's product philosophy — keep these in mind for any UI/UX decision, not just data:

Event sourcing mindset — decisions are immutable once finalized; reviews/overrides are new records layered on top, not edits. Don't design any UI that edits a decision's core fields after creation.
Explainability over automation — anywhere a recommendation or AI insight is shown, also show why (rationale, signals, precedent). Never render a bare score or verdict with no supporting context.
Auditability — every screen showing a decision should make it trivial to answer "what happened, and why," without needing another tool.
Context graph first — decision links (precedent, similar case, policy exception, follow-up, contradicts, supports) are the moat. If/when link-browsing UI gets built, treat it as a graph, not a flat list — that's the differentiator from a plain audit log.
What We Avoid
No employee surveillance, productivity scoring, activity monitoring, or keystroke tracking — even the
admin's "wholistic view" is a view of decisions, not of staff activity. Don't build leaderboards, time-spent
metrics, or anything that frames this as monitoring people rather than preserving organizational reasoning.
