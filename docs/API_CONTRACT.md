# I-ITSM API Contract

Living document, updated every backend phase. Last update: **Phase 0 (foundation)**.
Live, always-current docs: `http://localhost:8080/swagger-ui.html` (raw spec: `/v3/api-docs`).

## Conventions (apply to every endpoint)

**Base URL (dev):** `http://localhost:8080`. The React dev server runs on `http://localhost:5173` and is allowed by CORS.

**Auth (from Phase 1):** call the login endpoint, store the returned token, and send it on every request as
`Authorization: Bearer <token>`. Tokens expire after 8 hours; on a `401` response, redirect to login.

**JSON:** request and response bodies are `application/json`. Enum values are UPPERCASE strings (`"P1"`, `"IN_PROGRESS"`).

**Timestamps:** ISO-8601 in UTC, e.g. `"2026-11-05T09:30:00Z"`. Convert to local time in the UI
(`new Date(value).toLocaleString()`).

**IDs:** numeric (`Long`).

**Pagination:** list endpoints that can grow large take `?page=0&size=20&sort=createdAt,desc` and return:

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
  "path": "/api/incidents",
  "fieldErrors": { "title": "must not be blank" }
}
```

`fieldErrors` appears only for validation errors. Show `message` to the user; use `code` for logic.

| HTTP | code | Meaning / typical UI reaction |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Highlight the fields listed in `fieldErrors` |
| 400 | `MALFORMED_REQUEST` | Body is not valid JSON or has a wrong type / enum value (frontend bug) |
| 400 | `INVALID_PARAMETER`, `MISSING_PARAMETER`, `INVALID_REQUEST` | Bad query/path parameter or invalid combination |
| 401 | `AUTHENTICATION_FAILED` | Wrong login, or token missing/expired: go to login page |
| 403 | `ACCESS_DENIED` | Role not allowed for this endpoint |
| 403 | `UNAUTHORIZED_OPERATION` | Allowed role, but not on this object (e.g. someone else's incident) |
| 404 | `RESOURCE_NOT_FOUND` | Record with that id doesn't exist |
| 404 | `ENDPOINT_NOT_FOUND` | Wrong URL (frontend bug) |
| 405 | `METHOD_NOT_ALLOWED` | Wrong HTTP method (frontend bug) |
| 409 | `DUPLICATE_RESOURCE`, `DATA_CONFLICT` | Already exists |
| 409 | `CONCURRENT_MODIFICATION` | Someone else changed it: reload and retry |
| 422 | `BUSINESS_RULE_VIOLATION` and specific codes (added in later phases) | Action not allowed right now; show `message` |
| 503 | `DATABASE_UNAVAILABLE` | Show "service temporarily unavailable" |
| 500 | `INTERNAL_ERROR` | Generic error toast |

## Endpoints

### System

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/system/info` | Public | Backend health check |

`GET /api/system/info` returns `200`:

```json
{ "application": "itsm", "status": "UP", "serverTime": "2026-11-05T09:30:00Z" }
```

## Changelog

- **Phase 0:** conventions, error format, `/api/system/info`.
