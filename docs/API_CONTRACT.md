# I-ITSM API Contract

Living document, updated every backend phase. Last update: **Phase 5 (notifications and audit trail)**.
Live, always-current docs: `http://localhost:8080/swagger-ui.html` (raw spec: `/v3/api-docs`).

## Conventions (apply to every endpoint)

**Base URL (dev):** `http://localhost:8080`. The React dev server runs on `http://localhost:5173` and is allowed by CORS.

**Auth:** call `POST /api/auth/login` (or `/register`), store `accessToken`, and send it on every request as
`Authorization: Bearer <accessToken>`. Tokens expire after 8 hours (`expiresAt`). On any `401`, clear the token and
redirect to the login page. The token payload (decode with `jwt-decode`) contains `sub` (user id), `email`, `role`,
but the safest source of user info is `GET /api/users/me`.

**Roles:** `EMPLOYEE`, `TECHNICIAN`, `ADMIN`. Show different navigation per role.

**JSON:** request and response bodies are `application/json`. Enum values are UPPERCASE strings (`"P1"`, `"IN_PROGRESS"`).
Fields that don't apply are **omitted** from responses (e.g. `department` only appears for employees).

**Timestamps:** ISO-8601 in UTC, e.g. `"2026-11-05T09:30:00Z"`. Convert to local time in the UI
(`new Date(value).toLocaleString()`).

**IDs:** numeric (`Long`).

**Pagination:** list endpoints marked *(paged)* take `?page=0&size=20&sort=createdAt,desc` and return:

```json
{
  "content": [ ],
  "page": 0,
  "size": 20,
  "totalElements": 134,
  "totalPages": 7,
  "last": false
}
```

### Error format (every failing request)

```json
{
  "timestamp": "2026-11-05T09:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "code": "VALIDATION_FAILED",
  "message": "One or more fields are invalid",
  "path": "/api/auth/register",
  "fieldErrors": { "password": "must contain at least one letter and one digit" }
}
```

`fieldErrors` appears only for validation errors. Show `message` to the user; use `code` for logic.

| HTTP | code | Meaning / typical UI reaction |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Highlight the fields listed in `fieldErrors` |
| 400 | `MALFORMED_REQUEST` | Body is not valid JSON or has a wrong type / enum value (frontend bug) |
| 400 | `INVALID_PARAMETER`, `MISSING_PARAMETER`, `INVALID_REQUEST` | Bad query/path parameter or invalid combination (e.g. wrong current password) |
| 401 | `AUTHENTICATION_FAILED` | Login: wrong email or password |
| 401 | `ACCOUNT_DISABLED` | Login: account deactivated by admin |
| 401 | `AUTHENTICATION_REQUIRED` | Token missing, expired or invalid: go to login page (`message` says which) |
| 403 | `ACCESS_DENIED` | Role not allowed for this endpoint |
| 403 | `UNAUTHORIZED_OPERATION` | Allowed role, but not on this object (e.g. someone else's incident) |
| 404 | `RESOURCE_NOT_FOUND` | Record with that id doesn't exist |
| 404 | `ENDPOINT_NOT_FOUND` | Wrong URL (frontend bug) |
| 405 | `METHOD_NOT_ALLOWED` | Wrong HTTP method (frontend bug) |
| 409 | `DUPLICATE_RESOURCE`, `DATA_CONFLICT` | Already exists (e.g. email taken) |
| 409 | `CONCURRENT_MODIFICATION` | Someone else changed it: reload and retry |
| 422 | `BUSINESS_RULE_VIOLATION` | Action not allowed right now; show `message` |
| 422 | `SLA_CONFIGURATION_MISSING` | No SLA policy exists for a priority; admin must add one |
| 422 | `INVALID_STATE_TRANSITION` | Lifecycle action not allowed in the current status (message lists allowed actions) |
| 422 | `INCIDENT_NOT_EDITABLE` | Details/notes can't be changed in the current status |
| 422 | `TECHNICIAN_UNAVAILABLE` | Technician inactive or marked unavailable |
| 422 | `TECHNICIAN_WORKLOAD_EXCEEDED` | Technician already at their max active incidents |
| 422 | `NO_ELIGIBLE_TECHNICIAN` | Auto-assign found nobody who fits the active strategy; `message` says why. Offer manual assignment |
| 503 | `DATABASE_UNAVAILABLE` | Show "service temporarily unavailable" |
| 500 | `INTERNAL_ERROR` | Generic error toast |

## Shared objects

### UserResponse

```json
{
  "id": 2,
  "fullName": "Ravi Kumar",
  "email": "ravi.kumar@itsm.com",
  "role": "TECHNICIAN",
  "phone": "+91 98765 43210",
  "active": true,
  "createdAt": "2026-11-05T09:30:00Z",

  "department": "Finance",

  "available": true,
  "senior": true,
  "maxActiveIncidents": 6,
  "experienceYears": 9,
  "skills": [
    { "id": 4, "name": "VPN & Firewalls", "categoryCode": "NETWORK" }
  ]
}
```

`department` appears only for `EMPLOYEE`. `available`, `senior`, `maxActiveIncidents`, `experienceYears`, `skills`
(sorted by name, may be `[]`) appear only for `TECHNICIAN`. `phone` is omitted when not set. The password is never returned.

### AuthResponse

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresAt": "2026-11-05T17:30:00Z",
  "user": { "...": "UserResponse" }
}
```

## Endpoints

### System

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/system/info` | Public | Backend health check |

`GET /api/system/info` returns `200`:

```json
{ "application": "itsm", "status": "UP", "serverTime": "2026-11-05T09:30:00Z" }
```

### Authentication

| Method | Path | Roles | Body | Success |
|---|---|---|---|---|
| POST | `/api/auth/login` | Public | LoginRequest | `200` AuthResponse |
| POST | `/api/auth/register` | Public | RegisterRequest | `201` AuthResponse (always creates an EMPLOYEE) |

**LoginRequest**

```json
{ "email": "admin@itsm.com", "password": "Password@123" }
```

Errors: `400 VALIDATION_FAILED`, `401 AUTHENTICATION_FAILED`, `401 ACCOUNT_DISABLED`.

**RegisterRequest** (`phone` and `department` optional)

```json
{
  "fullName": "Neha Gupta",
  "email": "neha.gupta@itsm.com",
  "password": "Password@123",
  "phone": "+91 91234 56789",
  "department": "Marketing"
}
```

Rules (same for `POST /api/users`): email must look like `name@domain.tld` (no spaces, no leading/trailing/double
dots, domain labels can't start or end with `-`, TLD of 2+ letters; any domain is allowed), max 150 characters;
password 8–72 characters with at least one letter and one digit; phone 7–20 characters of digits, `+ - ( )` and
spaces. Invalid email gives `fieldErrors.email = "Enter a valid email address, like name@itsm.com"`. Errors: `400 VALIDATION_FAILED`, `409 DUPLICATE_RESOURCE` (email taken).

### Users: self-service (any logged-in user)

| Method | Path | Roles | Body | Success |
|---|---|---|---|---|
| GET | `/api/users/me` | Any | – | `200` UserResponse |
| PUT | `/api/users/me` | Any | `{ "fullName": "...", "phone": "..." }` | `200` UserResponse |
| PUT | `/api/users/me/password` | Any | `{ "currentPassword": "...", "newPassword": "..." }` | `204` (no body) |
| PATCH | `/api/users/me/availability` | TECHNICIAN | `{ "available": false }` | `200` UserResponse |

Password change errors: `400 INVALID_REQUEST` ("Current password is incorrect" / "must be different").

### Users: management (ADMIN)

| Method | Path | Roles | Body / params | Success |
|---|---|---|---|---|
| GET | `/api/users` *(paged)* | ADMIN | `?role=TECHNICIAN&active=true&search=ravi` (all optional) | `200` Page of UserResponse |
| GET | `/api/users/technicians` | ADMIN | `?availableOnly=true` (default false) | `200` UserResponse[] sorted by name |
| GET | `/api/users/{id}` | ADMIN | – | `200` UserResponse |
| POST | `/api/users` | ADMIN | CreateUserRequest | `201` UserResponse |
| PUT | `/api/users/{id}` | ADMIN | UpdateUserRequest | `200` UserResponse |
| PUT | `/api/users/{id}/skills` | ADMIN | `{ "skillIds": [3, 4, 6] }` (replaces all; `[]` clears) | `200` UserResponse |
| PATCH | `/api/users/{id}/activate` | ADMIN | – | `200` UserResponse |
| PATCH | `/api/users/{id}/deactivate` | ADMIN | – | `200` UserResponse |

`search` matches name or email (case-insensitive). Deactivating your own account returns `422 BUSINESS_RULE_VIOLATION`.
Skills: unknown id gives `404 RESOURCE_NOT_FOUND`; an inactive skill or a non-technician user gives `422 BUSINESS_RULE_VIOLATION`.

**CreateUserRequest** (role-specific fields optional; ignored for other roles)

```json
{
  "role": "TECHNICIAN",
  "fullName": "Meera Iyer",
  "email": "meera.iyer@itsm.com",
  "password": "Password@123",
  "phone": "+91 98765 43210",
  "department": null,
  "senior": false,
  "maxActiveIncidents": 5,
  "experienceYears": 3
}
```

Technician defaults: `senior=false`, `maxActiveIncidents=5` (1–50), `experienceYears=0` (0–60).

**UpdateUserRequest** (role and email cannot change). `phone` is always overwritten: `null` or `""` clears it.
`department`: `null` keeps the current value, `""` clears it. Technician fields: `null` keeps the current value.

```json
{
  "fullName": "Meera Iyer",
  "phone": "+91 98765 43210",
  "department": null,
  "available": true,
  "senior": true,
  "maxActiveIncidents": 6,
  "experienceYears": 4
}
```


### Catalog: shared rules

Categories, IT services and skills are **never deleted**, only deactivated (old incidents still reference them).
`GET` lists return **active items only**, sorted by name. ADMIN can add `?includeInactive=true` to also see
inactive ones (ignored for other roles). Names are unique (case-insensitive): a clash gives `409 DUPLICATE_RESOURCE`.
Unknown ids give `404 RESOURCE_NOT_FOUND`.

**CategorySummary** `{ "id": 8, "code": "APPLICATION", "name": "Application" }`
**ServiceSummary** `{ "id": 1, "name": "Payment Gateway", "criticality": "CRITICAL" }`
**SkillSummary** `{ "id": 9, "name": "Payment Systems", "categoryCode": "APPLICATION" }`

Enums:
- `criticality` (BusinessCriticality): `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` (weights 1–4, used for priority).
- `priority`: `P1` (Critical), `P2` (High), `P3` (Medium), `P4` (Low).

### Catalog: Categories

| Method | Path | Roles | Body | Success |
|---|---|---|---|---|
| GET | `/api/categories` | Any | `?includeInactive=true` (ADMIN only) | `200` CategoryResponse[] |
| GET | `/api/categories/{id}` | Any | – | `200` CategoryResponse |
| POST | `/api/categories` | ADMIN | CategoryRequest | `201` CategoryResponse |
| PUT | `/api/categories/{id}` | ADMIN | CategoryRequest (`code` ignored) | `200` CategoryResponse |
| PATCH | `/api/categories/{id}/activate` | ADMIN | – | `200` CategoryResponse |
| PATCH | `/api/categories/{id}/deactivate` | ADMIN | – | `200` CategoryResponse |

**CategoryRequest**

```json
{
  "code": "PRINTING",
  "name": "Printing",
  "description": "Office printers, scanners and print queues",
  "keywords": ["printer", "print", "scanner", "toner"]
}
```

`code`: 2–30 letters/digits/underscore starting with a letter, stored uppercase, **cannot change** after creation.
`keywords`: optional, max 30, each max 50 characters; stored lowercase without duplicates (used later for automatic
category suggestion).

**CategoryResponse**

```json
{
  "id": 8,
  "code": "APPLICATION",
  "name": "Application",
  "description": "Business applications and portals",
  "keywords": ["app", "application", "checkout", "payment"],
  "active": true
}
```

### Catalog: IT Services

| Method | Path | Roles | Body | Success |
|---|---|---|---|---|
| GET | `/api/services` | Any | `?includeInactive=true` (ADMIN only) | `200` ServiceResponse[] |
| GET | `/api/services/{id}` | Any | – | `200` ServiceResponse |
| POST | `/api/services` | ADMIN | ServiceRequest | `201` ServiceResponse |
| PUT | `/api/services/{id}` | ADMIN | ServiceRequest | `200` ServiceResponse |
| PATCH | `/api/services/{id}/activate` | ADMIN | – | `200` ServiceResponse |
| PATCH | `/api/services/{id}/deactivate` | ADMIN | – | `200` ServiceResponse |

**ServiceRequest** (`defaultCategoryId` optional; `null` removes it)

```json
{
  "name": "Video Conferencing",
  "description": "Company-wide video meetings",
  "criticality": "HIGH",
  "defaultCategoryId": 8
}
```

**ServiceResponse**

```json
{
  "id": 1,
  "name": "Payment Gateway",
  "description": "Online payment processing for customers",
  "criticality": "CRITICAL",
  "defaultCategory": { "id": 8, "code": "APPLICATION", "name": "Application" },
  "active": true
}
```

`defaultCategory` is `null` when not set. It is used to pre-select the category when reporting an incident
against this service.

### Catalog: Skills

| Method | Path | Roles | Body | Success |
|---|---|---|---|---|
| GET | `/api/skills` | Any | `?includeInactive=true` (ADMIN only) | `200` SkillResponse[] |
| GET | `/api/skills/{id}` | Any | – | `200` SkillResponse |
| POST | `/api/skills` | ADMIN | SkillRequest | `201` SkillResponse |
| PUT | `/api/skills/{id}` | ADMIN | SkillRequest | `200` SkillResponse |
| PATCH | `/api/skills/{id}/activate` | ADMIN | – | `200` SkillResponse |
| PATCH | `/api/skills/{id}/deactivate` | ADMIN | – | `200` SkillResponse |

**SkillRequest** `{ "name": "Kubernetes Operations", "description": "...", "categoryId": 5 }` (`categoryId` required)

**SkillResponse**

```json
{
  "id": 9,
  "name": "Payment Systems",
  "description": null,
  "category": { "id": 8, "code": "APPLICATION", "name": "Application" },
  "active": true
}
```

Assign skills to a technician with `PUT /api/users/{id}/skills`. Inactive skills stay on profiles but are ignored
by skill-based assignment.

### Catalog: SLA Policies (ADMIN only)

Two levels: a **DEFAULT** policy per priority (`service` = `null`), and optional **SERVICE** overrides. The
effective SLA for an incident is the service override if one exists, otherwise the default.

| Method | Path | Body / params | Success |
|---|---|---|---|
| GET | `/api/sla-policies` | optional `?serviceId=1` (only that service's overrides) | `200` SlaPolicyResponse[] (defaults first, then by service, then priority) |
| GET | `/api/sla-policies/effective` | `?priority=P1` (required) `&serviceId=1` (optional) | `200` EffectiveSla |
| POST | `/api/sla-policies` | SlaPolicyCreateRequest | `201` SlaPolicyResponse |
| PUT | `/api/sla-policies/{id}` | `{ "responseMinutes": 10, "resolutionMinutes": 60 }` | `200` SlaPolicyResponse |
| DELETE | `/api/sla-policies/{id}` | – | `204`; deleting a DEFAULT policy gives `422 BUSINESS_RULE_VIOLATION` |

**SlaPolicyCreateRequest** (`serviceId` null = DEFAULT policy)

```json
{ "serviceId": 4, "priority": "P1", "responseMinutes": 10, "resolutionMinutes": 60 }
```

Rules: `responseMinutes` 1–10080 (7 days), `resolutionMinutes` 1–43200 (30 days), and resolution must be at least
response (else `400 INVALID_REQUEST`). Only one policy per (service, priority): a second gives
`409 DUPLICATE_RESOURCE`.

**SlaPolicyResponse**

```json
{
  "id": 5,
  "scope": "SERVICE",
  "service": { "id": 1, "name": "Payment Gateway", "criticality": "CRITICAL" },
  "priority": "P1",
  "responseMinutes": 5,
  "resolutionMinutes": 20
}
```

`scope` is `"DEFAULT"` (then `service` is `null`) or `"SERVICE"`.

**EffectiveSla**

```json
{ "policyId": 5, "scope": "SERVICE", "priority": "P1", "responseMinutes": 5, "resolutionMinutes": 20 }
```

`404` if `serviceId` is unknown; `422 SLA_CONFIGURATION_MISSING` if not even a default exists.


### Incidents: lifecycle

```
NEW ─(system)→ CLASSIFIED ─assign→ ASSIGNED ─acknowledge→ ACKNOWLEDGED ─start→ IN_PROGRESS ─resolve→ RESOLVED ─verify→ VERIFIED ─close→ CLOSED
                                     ↑  (re-assign from ASSIGNED / ACKNOWLEDGED / IN_PROGRESS / AWAITING_INFO)   │
                                     │                          IN_PROGRESS ─request-info→ AWAITING_INFO ─provide-info→ IN_PROGRESS
                                     │                          RESOLVED ─reopen→ IN_PROGRESS
```

- On report, the system immediately classifies the incident (category, priority, SLA), so a new incident is
  returned already in `CLASSIFIED`. `NEW` is only transient.
- **Since Phase 4**, if auto-assign on report is on (the default) and a technician fits the active strategy, the
  incident is also assigned immediately and is returned in `ASSIGNED`. **Never assume the status after report: read
  it from the response.**
- Details (title, description, service, category, impact, urgency, affected users) can be edited in every status
  **before** `RESOLVED`. Notes can be added in every status except `CLOSED`.
- An action that isn't allowed in the current status gives `422 INVALID_STATE_TRANSITION`.
- An action by the wrong person (e.g. a technician acknowledging someone else's incident) gives
  `403 UNAUTHORIZED_OPERATION`.

**Use `allowedActions` from the detail response to decide which buttons to show.** The server combines the state
rules and the user's permissions.

| Action (`allowedActions` value) | Endpoint | Who |
|---|---|---|
| `ASSIGN` | `POST /api/incidents/{id}/assign` | ADMIN |
| `ACKNOWLEDGE` | `POST /api/incidents/{id}/acknowledge` | Assigned technician |
| `START` | `POST /api/incidents/{id}/start` | Assigned technician |
| `REQUEST_INFO` | `POST /api/incidents/{id}/request-info` | Assigned technician |
| `PROVIDE_INFO` | `POST /api/incidents/{id}/provide-info` | Reporter |
| `RESOLVE` | `POST /api/incidents/{id}/resolve` | Assigned technician |
| `VERIFY` | `POST /api/incidents/{id}/verify` | Reporter |
| `REOPEN` | `POST /api/incidents/{id}/reopen` | Reporter |
| `CLOSE` | `POST /api/incidents/{id}/close` | ADMIN or assigned technician |

`CLASSIFY` exists in the enum but is system-only and never appears in `allowedActions`.

### Incidents: enums

- `status`: `NEW`, `CLASSIFIED`, `ASSIGNED`, `ACKNOWLEDGED`, `IN_PROGRESS`, `AWAITING_INFO`, `RESOLVED`, `VERIFIED`, `CLOSED`.
- `impact`:
  - `LOW`: single user
  - `MEDIUM`: a team
  - `HIGH`: a department, site or many users
  - `CRITICAL`: whole organisation or customers
- `urgency`:
  - `LOW`: can wait / workaround exists
  - `MEDIUM`: work slowed down
  - `HIGH`: work blocked
  - `CRITICAL`: immediate business or financial loss
- `priority`: `P1`–`P4`.
- `slaStatus` / `sla.status`:
  - `ON_TRACK`
  - `AT_RISK`: 75%+ of the time used
  - `BREACHED`
  - `MET`: resolved in time
- Note `type`:
  - `COMMENT`: reporter or admin
  - `WORK_NOTE`: assigned technician
  - `INFO_REQUEST`, `INFO_RESPONSE`
  - `REOPEN`: the reporter's reason for reopening

**Priority rule** (`WEIGHTED_SCORE` strategy): score = impact weight × urgency weight × service criticality weight
(each 1–4), ×1.25 when 100+ users are affected, ×1.5 when 1000+.

| Score | Priority |
|---|---|
| ≥ 32 | `P1` |
| ≥ 16 | `P2` |
| ≥ 6 | `P3` |
| < 6 | `P4` |

The calculation is explained in `priorityReason`.

### Incidents: endpoints

| Method | Path | Roles | Body | Success |
|---|---|---|---|---|
| POST | `/api/incidents` | Any | CreateIncidentRequest | `201` IncidentResponse (status `ASSIGNED` if auto-assigned, otherwise `CLASSIFIED`) |
| GET | `/api/incidents` *(paged)* | Any | `?status=IN_PROGRESS` or several: `?status=ACKNOWLEDGED,IN_PROGRESS` (optional) | `200` Page of IncidentSummaryResponse |
| GET | `/api/incidents/{id}` | Reporter, assigned technician, ADMIN | – | `200` IncidentResponse |
| PATCH | `/api/incidents/{id}` | Reporter, ADMIN | UpdateIncidentRequest | `200` IncidentResponse |
| POST | `/api/incidents/{id}/notes` | Reporter, assigned technician, ADMIN | `{ "message": "..." }` | `200` IncidentResponse |
| POST | `/api/incidents/{id}/assign` | ADMIN | `{ "technicianId": 3 }` | `200` IncidentResponse |
| POST | `/api/incidents/{id}/auto-assign` | ADMIN | – | `200` IncidentResponse (see Assignment section) |
| GET | `/api/incidents/{id}/recommendations` | ADMIN | `?strategy=SKILL_BASED` (optional) | `200` RecommendationResponse |
| POST | `/api/incidents/{id}/acknowledge` | Assigned TECHNICIAN | – | `200` |
| POST | `/api/incidents/{id}/start` | Assigned TECHNICIAN | – | `200` |
| POST | `/api/incidents/{id}/request-info` | Assigned TECHNICIAN | `{ "message": "question" }` | `200` |
| POST | `/api/incidents/{id}/provide-info` | Reporter | `{ "message": "answer" }` | `200` |
| POST | `/api/incidents/{id}/resolve` | Assigned TECHNICIAN | `{ "resolutionSummary": "...", "rootCause": "..." }` | `200` |
| POST | `/api/incidents/{id}/verify` | Reporter | `{ "rating": 5, "feedback": "..." }` (body optional) | `200` |
| POST | `/api/incidents/{id}/reopen` | Reporter | `{ "message": "why it's not fixed" }` | `200` |
| POST | `/api/incidents/{id}/close` | ADMIN or assigned TECHNICIAN | `{ "closureNote": "..." }` (body optional) | `200` |

All lifecycle endpoints return the updated IncidentResponse.

**List visibility:** an EMPLOYEE sees incidents they reported; a TECHNICIAN sees incidents assigned to them; an
ADMIN sees all.

**Status filter:** one value or several, comma-separated (or as a repeated `status=` parameter). For example,
`?status=AWAITING_INFO,RESOLVED` returns incidents in either status.

**Sorting:** the default is `createdAt,desc`. Supported sort fields:

| Field | Note |
|---|---|
| `createdAt` | |
| `updatedAt` | |
| `priority` | `asc` puts P1 first |
| `status` | |
| `title` | |
| `sla.responseDueAt` | |
| `sla.resolutionDueAt` | `asc` puts the most urgent deadline first |

Example: `?sort=sla.resolutionDueAt,asc`. An unknown sort field gives `400`.

**CreateIncidentRequest** (`categoryId` optional: if omitted, the service's default category is used; if the service
has none, you get `422` asking for a category)

```json
{
  "title": "Payment application unavailable",
  "description": "Users are unable to complete transactions. The checkout page shows error 503.",
  "serviceId": 1,
  "categoryId": null,
  "impact": "CRITICAL",
  "urgency": "CRITICAL",
  "affectedUsers": 500
}
```

Rules:
- `title`: 5–150 characters.
- `description`: required, max 4000.
- `affectedUsers`: 1–1,000,000.
- The service and category must be active.

**UpdateIncidentRequest**: same fields, all optional (null = unchanged). Priority and SLA targets are recalculated
(deadlines still count from the original report time).

**Assign rules:**
- The technician must be active and available, else `422 TECHNICIAN_UNAVAILABLE`.
- They must be below their max active incidents (ASSIGNED / ACKNOWLEDGED / IN_PROGRESS / AWAITING_INFO count),
  else `422 TECHNICIAN_WORKLOAD_EXCEEDED`.
- Assigning to the same technician again gives `422 BUSINESS_RULE_VIOLATION`.
- The same rules apply to automatic assignment (on report and `auto-assign`).

**IncidentSummaryResponse** (list row)

```json
{
  "id": 1,
  "number": "INC00001",
  "title": "Payment page shows an error at checkout",
  "status": "IN_PROGRESS",
  "priority": "P1",
  "category": { "id": 8, "code": "APPLICATION", "name": "Application" },
  "service": { "id": 1, "name": "Payment Gateway", "criticality": "CRITICAL" },
  "reporter": { "id": 6, "fullName": "Rahul Verma", "role": "EMPLOYEE" },
  "assignedTechnician": { "id": 3, "fullName": "Fatima Khan", "role": "TECHNICIAN" },
  "createdAt": "2026-11-08T09:00:00Z",
  "responseDueAt": "2026-11-08T09:05:00Z",
  "resolutionDueAt": "2026-11-08T09:20:00Z",
  "slaStatus": "AT_RISK"
}
```

`assignedTechnician` is omitted when unassigned.

**IncidentResponse** (detail). Null fields are omitted.

```json
{
  "id": 1,
  "number": "INC00001",
  "title": "Payment page shows an error at checkout",
  "description": "Customers get 'Transaction failed' ...",
  "status": "IN_PROGRESS",
  "priority": "P1",
  "priorityScore": 45,
  "priorityReason": "Impact HIGH(3) x Urgency HIGH(3) x Criticality CRITICAL(4) = 36 x1.25 (250 users affected) -> score 45 -> P1",
  "impact": "HIGH",
  "urgency": "HIGH",
  "affectedUsers": 250,
  "category": { "id": 8, "code": "APPLICATION", "name": "Application" },
  "service": { "id": 1, "name": "Payment Gateway", "criticality": "CRITICAL" },
  "reporter": { "id": 6, "fullName": "Rahul Verma", "role": "EMPLOYEE" },
  "assignedTechnician": { "id": 3, "fullName": "Fatima Khan", "role": "TECHNICIAN" },
  "assignedAt": "2026-11-08T09:01:00Z",
  "sla": {
    "scope": "SERVICE",
    "responseTargetMinutes": 5,
    "resolutionTargetMinutes": 20,
    "startedAt": "2026-11-08T09:00:00Z",
    "responseDueAt": "2026-11-08T09:05:00Z",
    "resolutionDueAt": "2026-11-08T09:20:00Z",
    "respondedAt": "2026-11-08T09:02:00Z",
    "responseBreached": false,
    "resolutionBreached": false,
    "status": "ON_TRACK"
  },
  "resolutionSummary": null,
  "rootCause": null,
  "feedbackRating": null,
  "feedbackComment": null,
  "verifiedAt": null,
  "closedAt": null,
  "closureNote": null,
  "createdAt": "2026-11-08T09:00:00Z",
  "updatedAt": "2026-11-08T09:03:00Z",
  "notes": [
    {
      "id": 1,
      "type": "WORK_NOTE",
      "text": "Gateway logs show timeouts ...",
      "author": { "id": 3, "fullName": "Fatima Khan", "role": "TECHNICIAN" },
      "createdAt": "2026-11-08T09:03:00Z"
    }
  ],
  "allowedActions": ["REQUEST_INFO", "RESOLVE"],
  "canEdit": false,
  "canAddNote": true
}
```

(The null fields are shown here for completeness; they are actually omitted.)

- `canEdit`: this user may PATCH details now.
- `canAddNote`: this user may add a note now.
- `notes`: oldest first.
- SLA keeps running while `AWAITING_INFO` (known limitation).

### Assignment strategies, recommendations and workload (Phase 4)

**How assignment works.** A technician can take an incident only if they are active, available, below their
`maxActiveIncidents`, not already assigned to it and not its reporter. Among those, the **active strategy** ranks
candidates (best first, with a 0–100 score and reasons):

| Strategy | Who is considered | Ranking |
|---|---|---|
| `SKILL_BASED` | Only technicians with an active skill in the incident's category | Most free capacity (share of their limit unused), then more experience |
| `LEAST_LOADED` | Everyone eligible (skills ignored) | Most free capacity, then more experience |
| `SMART` (default) | Everyone eligible | Weighted score: skill in category 40, free capacity up to 25, earlier incidents resolved on the same service 5 each up to 15, experience 1/year up to 10, senior technician on a P1/P2 +10 |

- **On report:** when `autoAssignOnReport` is true, the top candidate is assigned by the **system** (no human
  actor). If nobody fits, the incident simply stays `CLASSIFIED` (no error).
- **Auto-assign button (admin):** `POST /api/incidents/{id}/auto-assign` assigns the top candidate. It excludes the
  current technician, so on an `ASSIGNED` incident it re-assigns to the next best. If nobody fits:
  `422 NO_ELIGIBLE_TECHNICIAN`.
- **Recommendations (admin):** `GET /api/incidents/{id}/recommendations` shows the full ranking **without assigning**.
  Pass `?strategy=` to preview another strategy than the active one.
- Auto-assign and recommendations are possible only when `ASSIGN` is allowed in the current status
  (`CLASSIFIED`, `ASSIGNED`, `ACKNOWLEDGED`, `IN_PROGRESS`, `AWAITING_INFO`); otherwise `422 INVALID_STATE_TRANSITION`.
  **UI rule:** show "Assign", "Auto-assign" and "Recommend" only when `allowedActions` contains `ASSIGN`.

| Method | Path | Roles | Body / params | Success |
|---|---|---|---|---|
| GET | `/api/assignment/settings` | ADMIN | – | `200` AssignmentSettingsResponse |
| PUT | `/api/assignment/settings` | ADMIN | UpdateAssignmentSettingsRequest | `200` AssignmentSettingsResponse |
| POST | `/api/incidents/{id}/auto-assign` | ADMIN | – | `200` IncidentResponse |
| GET | `/api/incidents/{id}/recommendations` | ADMIN | `?strategy=SMART` (optional, case-insensitive) | `200` RecommendationResponse |
| GET | `/api/workload` | ADMIN | – | `200` WorkloadResponse[] (all technicians, by name) |
| GET | `/api/workload/me` | TECHNICIAN | – | `200` WorkloadResponse |

**AssignmentSettingsResponse**

```json
{
  "activeStrategy": "SMART",
  "autoAssignOnReport": true,
  "updatedAt": "2026-11-13T10:00:00Z",
  "strategies": [
    { "name": "SKILL_BASED", "description": "Only technicians with an active skill in the incident's category; ...", "active": false },
    { "name": "LEAST_LOADED", "description": "Ignores skills; the technician with the most free capacity ...", "active": false },
    { "name": "SMART", "description": "Weighted score out of 100: skill match 40, ...", "active": true }
  ]
}
```

**UpdateAssignmentSettingsRequest** (both optional, null = unchanged; at least one required)

```json
{ "strategy": "SKILL_BASED", "autoAssignOnReport": true }
```

Errors: unknown strategy gives `400 INVALID_REQUEST` ("Unknown assignment strategy 'X'. Available: ..."); an empty
body `{}` gives `400 INVALID_REQUEST`.

**RecommendationResponse** (`message` appears only when `candidates` is empty)

```json
{
  "incidentId": 8,
  "incidentNumber": "INC00008",
  "priority": "P1",
  "categoryCode": "DATABASE",
  "serviceName": "Customer Database",
  "strategy": "SMART",
  "activeStrategy": true,
  "candidates": [
    {
      "technicianId": 3,
      "fullName": "Fatima Khan",
      "score": 81,
      "reasons": [
        "Skill in DATABASE (+40)",
        "1 of 6 slots in use (83% free) (+21)",
        "No earlier incidents on Customer Database (+0)",
        "11 years' experience (+10)",
        "Senior technician for a P1 incident (+10)"
      ]
    }
  ],
  "unavailable": [
    { "technicianId": 4, "fullName": "Sneha Reddy", "reason": "marked unavailable" }
  ]
}
```

`unavailable` reasons: `already assigned to this incident`, `reported this incident`, `account deactivated`,
`marked unavailable`, `at workload limit (6/6)`. When `candidates` is empty, show `message`, e.g. "none of the 4
available technicians has an active skill in CLOUD".

**WorkloadResponse**

```json
{
  "technicianId": 3,
  "fullName": "Fatima Khan",
  "active": true,
  "available": true,
  "senior": true,
  "activeIncidents": 1,
  "maxActiveIncidents": 6,
  "loadPercent": 17,
  "acceptingWork": true,
  "byStatus": { "ASSIGNED": 0, "ACKNOWLEDGED": 0, "IN_PROGRESS": 1, "AWAITING_INFO": 0 }
}
```

- `activeIncidents` counts `ASSIGNED`, `ACKNOWLEDGED`, `IN_PROGRESS` and `AWAITING_INFO`.
- `acceptingWork` = active, available and below the limit.
- `byStatus` always contains these four keys.
- To list a technician's own active incidents, use
  `GET /api/incidents?status=ASSIGNED,ACKNOWLEDGED,IN_PROGRESS,AWAITING_INFO`.

**Audit text.** Every assignment publishes a status change whose details say how it happened, for example
"Assigned to Ravi Kumar" (manual) or "Assigned to Fatima Khan by SMART strategy (score 81/100)" (automatic). An
automatic assignment on report has no actor (system).

### Notifications (Phase 5)

The system notifies people when something happens to an incident they're involved in. Every notification
appears in the recipient's **in-app inbox**. **Important** ones (they need someone to act, or concern a P1/P2
incident) are **also emailed**. Email is simulated in the backend console unless SMTP is configured (see below).
Nobody is notified about their own action.

| Event | Recipients | Type | Important (emailed) |
|---|---|---|---|
| Incident reported | Reporter | `INCIDENT_REPORTED` | no |
| Still unassigned after classification | All admins | `INCIDENT_UNASSIGNED` | P1/P2 only |
| Assigned | New technician | `INCIDENT_ASSIGNED` | P1/P2 only |
| Assigned | Reporter | `INCIDENT_ASSIGNED` | no |
| Re-assigned | Previous technician | `INCIDENT_REASSIGNED` | no |
| Acknowledged / work started | Reporter | `INCIDENT_ACKNOWLEDGED` / `WORK_STARTED` | no |
| Information requested | Reporter | `INFO_REQUESTED` | yes |
| Information provided | Technician | `INFO_PROVIDED` | no |
| Resolved | Reporter | `INCIDENT_RESOLVED` | yes |
| Verified | Technician | `RESOLUTION_VERIFIED` | no |
| Reopened | Technician | `INCIDENT_REOPENED` | yes |
| Closed | Reporter | `INCIDENT_CLOSED` | no |
| Priority changed | Reporter and technician | `PRIORITY_CHANGED` | when it becomes P1 |
| Reporter adds a comment | Technician | `COMMENT_ADDED` | no |
| Details edited | Technician | `DETAILS_UPDATED` | no |

When an incident is assigned, any unread `INCIDENT_UNASSIGNED` alerts for it are marked read automatically.

| Method | Path | Roles | Params | Success |
|---|---|---|---|---|
| GET | `/api/notifications` | Any | `unreadOnly` (default false), `page`, `size` (default 20), `sort` (default `createdAt,desc`) | `200` Page of NotificationResponse |
| GET | `/api/notifications/unread-count` | Any | – | `200` `{ "unread": 3 }` |
| POST | `/api/notifications/{id}/read` | Any (own only) | – | `200` NotificationResponse |
| POST | `/api/notifications/read-all` | Any | – | `200` `{ "updated": 5 }` |

Someone else's notification id gives `404 RESOURCE_NOT_FOUND`. Marking an already read notification read again
is harmless; it keeps the first `readAt`.

**NotificationResponse** (`readAt`, `incidentId` and `incidentNumber` may be absent)

```json
{
  "id": 12,
  "type": "INCIDENT_RESOLVED",
  "title": "INC00005 resolved: please confirm",
  "body": "Resolved: Folder was moved by a sync rule; restored it from last night's backup. Please confirm the fix, or reopen the incident if the problem remains.",
  "incidentId": 5,
  "incidentNumber": "INC00005",
  "important": true,
  "read": false,
  "createdAt": "2026-11-14T09:00:00Z"
}
```

Use `incidentId` to link to the incident detail page.

**Real email (optional).** Add to your own `application-local.properties`, e.g. a free Mailtrap sandbox:

```properties
spring.mail.host=sandbox.smtp.mailtrap.io
spring.mail.port=2525
spring.mail.username=<mailtrap username>
spring.mail.password=<mailtrap password>
app.mail.from=I-ITSM Service Desk <no-reply@itsm.local>
```

The startup log says `Email notifications: SMTP` or `Email notifications: SIMULATED`. Emails are sent in the
background, and a failed email never affects the incident or the in-app notification.

### Audit trail (Phase 5)

Every incident event is recorded, in the same transaction as the change, as a write-once audit entry. The actor
is a user, or **System** for automatic steps (classification, automatic assignment).

| `action` | Recorded when | from/to status |
|---|---|---|
| `REPORTED` | Incident created | to `NEW` |
| `CLASSIFY`, `ASSIGN`, `ACKNOWLEDGE`, `START`, `REQUEST_INFO`, `PROVIDE_INFO`, `RESOLVE`, `VERIFY`, `REOPEN`, `CLOSE` | Each lifecycle step (`details` is the step's text, e.g. "Assigned to Fatima Khan by SMART strategy (score 81/100)") | yes |
| `PRIORITY_CHANGED` | Priority recalculated after an edit | – |
| `DETAILS_UPDATED` | Details edited (lists the fields) | – |
| `NOTE_ADDED` | Comment or work note added (questions, answers and reopen reasons appear under their lifecycle step) | – |

| Method | Path | Roles | Params | Success |
|---|---|---|---|---|
| GET | `/api/incidents/{id}/history` | Reporter, assigned technician, ADMIN (same as viewing the incident) | – | `200` AuditEntryResponse[] (oldest first) |
| GET | `/api/audit` | ADMIN | `incidentNumber` (exact, any case), `actorId`, `systemOnly=true`, `action`, `from`, `to` (YYYY-MM-DD, UTC, `to` inclusive), `page`, `size` (default 20), `sort` (default `occurredAt,desc`) | `200` Page of AuditEntryResponse |

Errors:
- an unknown `action` or a malformed date gives `400 INVALID_PARAMETER`;
- `to` before `from` gives `400 INVALID_REQUEST`;
- history of an incident you can't view gives `403` / `404`, as for the incident.

**AuditEntryResponse** (`actorId`, `actorRole`, `fromStatus`, `toStatus`, `details` may be absent)

```json
{
  "id": 3,
  "occurredAt": "2026-11-14T09:00:01Z",
  "incidentId": 1,
  "incidentNumber": "INC00001",
  "actorId": 1,
  "actorName": "Anita Rao",
  "actorRole": "ADMIN",
  "system": false,
  "action": "ASSIGN",
  "fromStatus": "CLASSIFIED",
  "toStatus": "ASSIGNED",
  "details": "Assigned to Fatima Khan"
}
```

For system entries: `"actorName": "System"`, `"system": true`, no `actorId` / `actorRole`. Names are stored as they
were at the time, so renaming a user later doesn't rewrite history.

## Demo data

Seeded on first start when the tables are empty.

**Catalog**
- Categories: HARDWARE, SOFTWARE, NETWORK, DATABASE, CLOUD, SECURITY, AUTHENTICATION, APPLICATION, STORAGE.
- Services (criticality → default category):
  - Payment Gateway (CRITICAL → APPLICATION)
  - Customer Database (CRITICAL → DATABASE)
  - Single Sign-On (SSO) (CRITICAL → AUTHENTICATION)
  - Corporate Email (HIGH → APPLICATION)
  - VPN (HIGH → NETWORK)
  - Office Network & Wi-Fi (MEDIUM → NETWORK)
  - Cloud File Storage (MEDIUM → STORAGE)
  - HR Portal (LOW → APPLICATION)
  - Employee Laptops & Desktops (LOW → HARDWARE)
- Default SLAs (response / resolution): P1 5 min / 30 min, P2 15 min / 2 h, P3 1 h / 8 h, P4 4 h / 24 h.
- Payment Gateway overrides: P1 5 min / 20 min, P2 10 min / 60 min.

**Assignment settings:** `SMART`, auto-assign on report **on** (created on first start). The seeder switches
auto-assign off while it runs and restores it, so the 8 incidents below always end in the same states.

**History and inboxes:** seeding goes through the real services, so every demo incident has a full audit history
(#1 has 6 entries: reported, classified by System, assigned by Anita Rao, acknowledged, started, work note) and the
demo users already have notifications (Rahul 11, Divya 10, Kiran 9, Anita 8 of which 2 unread for #4 and #8,
Sneha 3, Ravi 3, Fatima 1, Arjun 1).

**Demo incidents (8)**, all created through the real lifecycle:

| # | Status | Priority | Title | Reporter | Technician | Notes |
|---|---|---|---|---|---|---|
| 1 | IN_PROGRESS | P1 | Payment page error | Rahul | Fatima | |
| 2 | AWAITING_INFO | P4 | HR portal login | Divya | Sneha | |
| 3 | ASSIGNED | P2 | VPN disconnects | Kiran | Ravi | Not acknowledged |
| 4 | CLASSIFIED | P4 | Laptop battery | Rahul | – | |
| 5 | RESOLVED | P3 | Shared drive folder | Divya | Arjun | |
| 6 | CLOSED | P3 | Email sync | Kiran | Sneha | Rating 5 |
| 7 | CLOSED | P3 | 3rd floor Wi-Fi | Rahul | Ravi | Rating 4 |
| 8 | CLASSIFIED | P1 | Customer DB timeouts | Kiran | – | Unassigned |

**Technician skills**
- Ravi: Routing, Switching & Wi-Fi; VPN & Firewalls; AWS Cloud Operations
- Fatima: Payment Systems; Web Application Support; PostgreSQL Administration
- Sneha: SSO & Active Directory; Security Incident Response; Web Application Support
- Arjun: Desktop & Laptop Support; OS & Software Installation; Cloud Storage & Backup

### Demo accounts (seeded on first start, password `Password@123` for all)

| Role | Email |
|---|---|
| ADMIN | `admin@itsm.com` |
| TECHNICIAN (senior) | `ravi.kumar@itsm.com`, `fatima.khan@itsm.com` |
| TECHNICIAN | `sneha.reddy@itsm.com`, `arjun.mehta@itsm.com` |
| EMPLOYEE | `rahul.verma@itsm.com` (Finance), `divya.nair@itsm.com` (HR), `kiran.patel@itsm.com` (Sales) |

## Changelog

- **Phase 5:** notifications (in-app + email, simulated by default) with `/api/notifications` endpoints; audit
  trail with `GET /api/incidents/{id}/history` and admin `GET /api/audit`. No changes to existing endpoints.

- **Phase 4:** assignment strategies (`SKILL_BASED`, `LEAST_LOADED`, `SMART`), admin settings
  (`/api/assignment/settings`), auto-assign on report (report may now return `ASSIGNED`),
  `POST /api/incidents/{id}/auto-assign`, `GET /api/incidents/{id}/recommendations`, workload endpoints
  (`/api/workload`, `/api/workload/me`), error code `NO_ELIGIBLE_TECHNICIAN`.

- **Phase 3.1:** `GET /api/incidents` accepts multiple statuses; supported sort fields documented.
- **Phase 3:** incidents (report, list, detail, edit, notes, 9 lifecycle actions), `allowedActions`, SLA tracking,
  new 422 codes (`INVALID_STATE_TRANSITION`, `INCIDENT_NOT_EDITABLE`, `TECHNICIAN_UNAVAILABLE`,
  `TECHNICIAN_WORKLOAD_EXCEEDED`), demo incidents.
- **Phase 2:** catalog endpoints (categories, services, skills, SLA policies), `skills` on technician
  UserResponse, `PUT /api/users/{id}/skills`, error code `SLA_CONFIGURATION_MISSING`.
- **Phase 1.1:** stricter email validation on register/create user (matches frontend rule); clarified update rules
  for `phone` / `department`.
- **Phase 1:** login/register (JWT), users self-service and admin management, new 401 codes
  (`AUTHENTICATION_FAILED`, `ACCOUNT_DISABLED`, `AUTHENTICATION_REQUIRED`), all non-public endpoints now require a token.
- **Phase 0:** conventions, error format, `/api/system/info`.
