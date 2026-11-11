# I-ITSM API Contract

Living document, updated every backend phase. Last update: **Phase 2 (catalog: services, categories, skills, SLA policies)**.
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

- **Phase 2:** catalog endpoints (categories, services, skills, SLA policies), `skills` on technician
  UserResponse, `PUT /api/users/{id}/skills`, error code `SLA_CONFIGURATION_MISSING`.
- **Phase 1.1:** stricter email validation on register/create user (matches frontend rule); clarified update rules
  for `phone` / `department`.
- **Phase 1:** login/register (JWT), users self-service and admin management, new 401 codes
  (`AUTHENTICATION_FAILED`, `ACCOUNT_DISABLED`, `AUTHENTICATION_REQUIRED`), all non-public endpoints now require a token.
- **Phase 0:** conventions, error format, `/api/system/info`.
