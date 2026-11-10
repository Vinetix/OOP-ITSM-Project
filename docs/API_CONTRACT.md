# I-ITSM API Contract

Living document, updated every backend phase. Last update: **Phase 1 (security & users)**.
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
| 422 | `BUSINESS_RULE_VIOLATION` and specific codes (added in later phases) | Action not allowed right now; show `message` |
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
  "experienceYears": 9
}
```

`department` appears only for `EMPLOYEE`. `available`, `senior`, `maxActiveIncidents`, `experienceYears` appear only
for `TECHNICIAN`. `phone` is omitted when not set. The password is never returned.

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

Rules: password 8–72 characters with at least one letter and one digit; phone 7–20 characters of digits, `+ - ( )`
and spaces. Errors: `400 VALIDATION_FAILED`, `409 DUPLICATE_RESOURCE` (email taken).

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
| PATCH | `/api/users/{id}/activate` | ADMIN | – | `200` UserResponse |
| PATCH | `/api/users/{id}/deactivate` | ADMIN | – | `200` UserResponse |

`search` matches name or email (case-insensitive). Deactivating your own account returns `422 BUSINESS_RULE_VIOLATION`.

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

**UpdateUserRequest** (role and email cannot change; null role-specific fields keep their current value)

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

## Demo accounts (seeded on first start, password `Password@123` for all)

| Role | Email |
|---|---|
| ADMIN | `admin@itsm.com` |
| TECHNICIAN (senior) | `ravi.kumar@itsm.com`, `fatima.khan@itsm.com` |
| TECHNICIAN | `sneha.reddy@itsm.com`, `arjun.mehta@itsm.com` |
| EMPLOYEE | `rahul.verma@itsm.com` (Finance), `divya.nair@itsm.com` (HR), `kiran.patel@itsm.com` (Sales) |

## Changelog

- **Phase 1:** login/register (JWT), users self-service and admin management, new 401 codes
  (`AUTHENTICATION_FAILED`, `ACCOUNT_DISABLED`, `AUTHENTICATION_REQUIRED`), all non-public endpoints now require a token.
- **Phase 0:** conventions, error format, `/api/system/info`.
