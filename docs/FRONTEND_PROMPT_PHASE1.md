# Frontend Prompt — Phase F1 (Auth, Role-Based Shell, Profile, Admin User Management)

> **How to use:** paste everything below the line into a new chat with your AI assistant.
> Also attach `docs/API_CONTRACT.md` from the repo; it is the source of truth if anything differs.

---

## 1. Who I am and how I want you to work

I'm the frontend developer in a team of 4 students at BITS Pilani, Hyderabad Campus. We are building an
**Intelligent IT Service Management & Incident Resolution System (I-ITSM)** for our Object-Oriented Programming
course project. Today is early November 2026; the hard deadline (report, 15–20 minute demo video, GitHub repo) is
**22 November 2026**.

I am a **beginner in React**. You will write most of the code, but I must understand it well enough to explain it
in a recorded demo, so explain key decisions briefly as you go.

Work rules:

1. **First**, confirm you've understood this brief, then give a short step-by-step build plan for this phase and
   **wait for my go-ahead**.
2. Build **one step at a time**. For every file, give the **full file path** (relative to `frontend/`) and the
   **complete file contents**. No fragments to merge, unless the change is one or two lines.
3. After each step, tell me exactly **how to run and verify it** and what I should see.
4. After each major step, give a **3–5 line plain-English explanation** I can use in the demo.
5. When I paste an error, diagnose it and give the fix. Don't rewrite unrelated files.
6. **Only use endpoints listed in Section 6.** Never invent endpoints, fields or mock data for things the backend
   doesn't provide. If a screen needs something the API lacks, list it under "Backend requests" so I can pass it on.
7. Ask before adding any library not listed in Section 3.
8. I work on **Windows** with **VS Code** and PowerShell. Give commands for that environment.
9. When I say **"handoff"**, write a compact summary of everything built (files, routes, components, decisions,
   what's left) that I can paste into a fresh chat.

## 2. The project in one paragraph

Employees report IT incidents (e.g. "payment app is down"). The system classifies and prioritizes them (P1–P4),
assigns a technician, tracks the SLA deadline, notifies people, logs every action in an audit trail, and gives
admins reports. There are three roles: **EMPLOYEE** (reports and tracks incidents), **TECHNICIAN** (works on
assigned incidents), **ADMIN** (IT manager: manages users, services, SLA policies, monitors everything). The
course brief requires that **the GUI differs per role** and that it is easy to navigate between options.

The **backend already exists** (Java 21, Spring Boot 4, PostgreSQL, JWT security) and runs on
`http://localhost:8080`, with live API docs at `http://localhost:8080/swagger-ui.html`. It is built in phases. So
far only **authentication and user management** exist; incidents, services, SLA, notifications and reports come
later, and I will give you a follow-up brief for each.

## 3. Tech stack (fixed — do not suggest alternatives)

- **React** (current stable) with **Vite**, written in **JavaScript (JSX)**, not TypeScript, to keep it simple for us.
- **React Router** (current stable, using `createBrowserRouter` / `RouterProvider`).
- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin.
- **shadcn/ui** components (follow the official shadcn **Vite** installation guide, configured for JavaScript:
  `"tsx": false` in `components.json`, path alias `@/` → `src/` via `jsconfig.json` and `vite.config.js`).
  Expected components: button, input, label, card, table, dialog, alert-dialog, select, switch, badge,
  dropdown-menu, sheet, separator, skeleton, sonner (toasts), tabs, avatar, tooltip, alert.
- **lucide-react** icons (comes with shadcn).
- **Axios** for HTTP.
- **Recharts** will be used later for dashboards; install it now but don't use it yet.
- State: React context + hooks only. **No** Redux, Zustand, React Query, or form libraries unless I approve.
- Node: current LTS.

## 4. Repository and environment

- One GitHub repo with `backend/` and `frontend/` folders. Create the Vite app **inside the existing repo** as
  `frontend/` (I'll run the commands from the repo root `D:\OOP-ITSM-Project`).
- The backend only allows CORS from `http://localhost:5173` and `http://127.0.0.1:5173`, so the dev server
  **must run on port 5173** (set `server.port: 5173` and `strictPort: true` in `vite.config.js`).
- API base URL comes from an env variable: `VITE_API_BASE_URL=http://localhost:8080`. Commit a `.env.example`;
  the real `.env` is git-ignored.
- `node_modules/` and `dist/` must be git-ignored.

## 5. Required folder structure (`frontend/src/`)

```
api/            axiosClient.js (instance + interceptors), authApi.js, usersApi.js, systemApi.js
auth/           AuthContext.jsx (user, token, login, register, logout, refreshMe), ProtectedRoute.jsx, RoleRoute.jsx
config/         navigation.js (nav items per role), roles.js (role → home path, label, accent color)
layouts/        AppShell.jsx (sidebar + top bar, driven by the role config), AuthLayout.jsx (login/register pages)
components/     shared pieces: PageHeader, RoleBadge, StatusBadge, EmptyState, ErrorAlert, LoadingState,
                ConfirmDialog, Pagination, BackendStatus
components/ui/  shadcn components (generated)
pages/auth/     LoginPage.jsx, RegisterPage.jsx
pages/common/   ProfilePage.jsx, NotFoundPage.jsx, ForbiddenPage.jsx, ComingSoonPage.jsx
pages/employee/ EmployeeHomePage.jsx
pages/technician/ TechnicianHomePage.jsx
pages/admin/    AdminHomePage.jsx, UsersPage.jsx, UserFormDialog.jsx, UserDetailsDialog.jsx
lib/            utils.js (shadcn cn helper), format.js (dates), errors.js (API error helpers)
router.jsx      all routes in one place
main.jsx, App.jsx, index.css
```

Rules: API calls live **only** in `src/api/*`. Components never build URLs or read `localStorage` directly. Adding
a future page should mean adding one route entry and one nav entry.

## 6. API contract for this phase

**Base URL:** `import.meta.env.VITE_API_BASE_URL`. All bodies are JSON. Timestamps are ISO-8601 UTC strings
(e.g. `"2026-11-05T09:30:00Z"`); display them in local time. IDs are numbers. Enums are UPPERCASE strings.
Fields that don't apply are **omitted** from responses.

**Auth header:** every request except login/register/system info must send
`Authorization: Bearer <accessToken>`.

### 6.1 Error format (every failed request)

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

`fieldErrors` only appears for validation errors; show each message under its form field. Otherwise show
`message`. Branch logic on `code`:

| HTTP | code | Frontend reaction |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Show `fieldErrors` under matching inputs |
| 400 | `INVALID_REQUEST`, `INVALID_PARAMETER`, `MISSING_PARAMETER`, `MALFORMED_REQUEST` | Show `message` |
| 401 | `AUTHENTICATION_FAILED` | Login form: "Invalid email or password" |
| 401 | `ACCOUNT_DISABLED` | Login form: show `message` |
| 401 | `AUTHENTICATION_REQUIRED` | Token missing/expired/invalid: log out, go to `/login`, show `message` as a toast |
| 403 | `ACCESS_DENIED`, `UNAUTHORIZED_OPERATION` | Toast with `message` (or navigate to `/forbidden` on page load) |
| 404 | `RESOURCE_NOT_FOUND` | Show `message` |
| 409 | `DUPLICATE_RESOURCE` | e.g. "email already exists": show under the email field |
| 409 | `CONCURRENT_MODIFICATION` | Toast "Changed by someone else — reloading", then refetch |
| 422 | `BUSINESS_RULE_VIOLATION` | Toast with `message` |
| 503 | `DATABASE_UNAVAILABLE` | Toast "Service temporarily unavailable" |
| 500 | `INTERNAL_ERROR` | Generic error toast |
| — | (no response at all) | Network error: "Cannot reach the server. Is the backend running?" |

### 6.2 Objects

**UserResponse**

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

- `department`: only for `EMPLOYEE` (may be absent if not set).
- `available`, `senior`, `maxActiveIncidents`, `experienceYears`: only for `TECHNICIAN`.
- `phone`: omitted when not set. The password is never returned.

**AuthResponse**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresAt": "2026-11-05T17:30:00Z",
  "user": { "...": "UserResponse" }
}
```

**Page wrapper** (for paged lists)

```json
{ "content": [], "page": 0, "size": 20, "totalElements": 134, "totalPages": 7, "last": false }
```

Paged endpoints accept `?page=0&size=20&sort=createdAt,desc` (`page` is 0-based).

### 6.3 Endpoints

**System (public)**

| Method | Path | Response |
|---|---|---|
| GET | `/api/system/info` | `200 { "application": "itsm", "status": "UP", "serverTime": "..." }` |

**Authentication (public)**

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/api/auth/login` | `{ "email", "password" }` | `200` AuthResponse |
| POST | `/api/auth/register` | `{ "fullName", "email", "password", "phone"?, "department"? }` | `201` AuthResponse; always creates an EMPLOYEE |

Validation rules (mirror them client-side, but always display server `fieldErrors` too):

- `fullName`: required, max 100.
- `email`: required, valid email, max 150.
- `password`: 8–72 characters, at least one letter and one digit.
- `phone` (optional): 7–20 characters of digits, spaces, `+ - ( )`.
- `department` (optional): max 100.

Login errors: `401 AUTHENTICATION_FAILED`, `401 ACCOUNT_DISABLED`, `400 VALIDATION_FAILED`.
Register errors: `400 VALIDATION_FAILED`, `409 DUPLICATE_RESOURCE`.

**Users — self-service (any logged-in role)**

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/api/users/me` | – | `200` UserResponse |
| PUT | `/api/users/me` | `{ "fullName", "phone" }` | `200` UserResponse |
| PUT | `/api/users/me/password` | `{ "currentPassword", "newPassword" }` | `204` no body |
| PATCH | `/api/users/me/availability` | `{ "available": true/false }` | `200` UserResponse — **TECHNICIAN only** |

Password change errors: `400 INVALID_REQUEST` ("Current password is incorrect" or "must be different"),
`400 VALIDATION_FAILED`.

**Users — management (ADMIN only)**

| Method | Path | Body / params | Success |
|---|---|---|---|
| GET | `/api/users` (paged) | optional `role` (`EMPLOYEE`/`TECHNICIAN`/`ADMIN`), `active` (`true`/`false`), `search` (name or email) | `200` Page of UserResponse |
| GET | `/api/users/technicians` | optional `availableOnly=true` | `200` UserResponse[] sorted by name |
| GET | `/api/users/{id}` | – | `200` UserResponse |
| POST | `/api/users` | CreateUserRequest | `201` UserResponse |
| PUT | `/api/users/{id}` | UpdateUserRequest | `200` UserResponse |
| PATCH | `/api/users/{id}/activate` | – | `200` UserResponse |
| PATCH | `/api/users/{id}/deactivate` | – | `200` UserResponse; `422 BUSINESS_RULE_VIOLATION` if deactivating yourself |

There is **no delete**; users are deactivated instead.

**CreateUserRequest** (role-specific fields are optional and ignored for other roles)

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

- EMPLOYEE uses `department`.
- TECHNICIAN uses `senior` (default false), `maxActiveIncidents` (1–50, default 5), `experienceYears` (0–60, default 0).
- ADMIN uses only the common fields.

**UpdateUserRequest** (role and email cannot change; omitted/null role-specific fields keep their value)

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

### 6.4 Demo accounts (password `Password@123` for all)

| Role | Email |
|---|---|
| ADMIN | `admin@itsm.com` (Anita Rao) |
| TECHNICIAN (senior) | `ravi.kumar@itsm.com`, `fatima.khan@itsm.com` |
| TECHNICIAN | `sneha.reddy@itsm.com`, `arjun.mehta@itsm.com` |
| EMPLOYEE | `rahul.verma@itsm.com`, `divya.nair@itsm.com`, `kiran.patel@itsm.com` |

## 7. Auth behaviour

- On login/register success: store `accessToken` (localStorage is acceptable for this course project; add a
  one-line comment noting the XSS trade-off) and the user, then redirect to the role's home.
- On app start: if a token exists, call `GET /api/users/me` to restore the user. Show a full-page loading state
  until this finishes, so protected pages never flash.
- Axios **request interceptor** adds the `Authorization` header.
- Axios **response interceptor**: on `401` from any endpoint **other than** `/api/auth/login` and
  `/api/auth/register`, clear the session, redirect to `/login`, and show the server `message` as a toast.
- Logout clears the session and goes to `/login` (no backend call needed; the API is stateless).
- Route guards:
  - Not logged in → `/login`, remembering the page they wanted, and return there after login.
  - Logged in but wrong role → `/forbidden`.
  - Logged-in user visiting `/login` or `/register` → their role home.

## 8. Routes

| Path | Who | Page |
|---|---|---|
| `/login`, `/register` | Public | Login / Register (AuthLayout) |
| `/` | Any | Redirect to role home (or `/login`) |
| `/employee` | EMPLOYEE | EmployeeHomePage |
| `/technician` | TECHNICIAN | TechnicianHomePage |
| `/admin` | ADMIN | AdminHomePage |
| `/admin/users` | ADMIN | UsersPage |
| `/{role}/profile` (e.g. `/employee/profile`) | That role | ProfilePage (shared component) |
| Future items (see Section 9) | Per role | ComingSoonPage |
| `/forbidden` | Any | ForbiddenPage |
| `*` | Any | NotFoundPage |

## 9. Role-specific GUI (the brief requires visibly different interfaces per role)

`AppShell` renders a sidebar (collapsible into a shadcn `Sheet` on mobile) and a top bar with the app name, a role
badge, the user's name, and a dropdown (Profile, Logout). It is driven by `config/roles.js` and
`config/navigation.js`, so each role gets its own **accent colour, home page and navigation**:

| Role | Accent | Navigation (✓ = build now; "Soon" = disabled item with a "Soon" badge, routed to ComingSoonPage) |
|---|---|---|
| EMPLOYEE | Blue | ✓ Home, Report Incident (Soon), My Incidents (Soon), Notifications (Soon), ✓ Profile |
| TECHNICIAN | Teal | ✓ Home, My Queue (Soon), Workload (Soon), Notifications (Soon), ✓ Profile |
| ADMIN | Indigo | ✓ Dashboard, All Incidents (Soon), ✓ Users, Services & Categories (Soon), SLA Policies (Soon), Assignment Settings (Soon), Reports (Soon), Audit Log (Soon), ✓ Profile |

## 10. Pages to build now

### LoginPage

- Email and password fields with client validation. Loading state on submit. Error area for the 401 messages.
- Link to Register.
- A **"Demo accounts"** section: one-click buttons that fill the form for Admin, Technician (Ravi) and Employee
  (Rahul). This helps a lot in the demo video.
- `BackendStatus` indicator calling `/api/system/info`: green "Server online" or red "Server offline".

### RegisterPage

- All register fields, client validation mirroring the rules, and server `fieldErrors` shown under fields.
- 409 → "An account with this email already exists" under the email field.
- On success, the user is logged in and lands on `/employee`.

### EmployeeHomePage

- Welcome card with name and department.
- Disabled "Report an incident" button (Soon).
- Placeholder "My recent incidents" card with an empty state.

### TechnicianHomePage

- Welcome card showing seniority, experience and max workload.
- **Availability card** with a Switch calling `PATCH /api/users/me/availability`. Update optimistically and roll
  back on error.
- Placeholder "My queue" card.

### AdminHomePage

- Four stat cards with **real data**: total Employees, Technicians, Admins (each from
  `GET /api/users?role=X&size=1` → `totalElements`), and Inactive users (`?active=false&size=1`).
- A "Technicians" card listing `GET /api/users/technicians`: name, senior badge, available/unavailable badge,
  and max workload.
- Quick links to Users and the disabled future sections.

### UsersPage (ADMIN)

- Filters:
  - Role select: All / Employee / Technician / Admin.
  - Status select: All / Active / Inactive.
  - Search input, debounced about 300 ms.
  - Changing any filter resets to page 0.
- Table columns: name, email, role badge, details, status badge, created date, and an actions menu.
  - Details: department for employees; "Senior · 9 yrs · max 6 · Available" for technicians.
- Pagination controls: previous/next, "Page X of Y", total count, page size 10/20/50.
- Loading skeleton rows, an empty state, and an error state with Retry.
- Row actions:
  - **View** opens UserDetailsDialog.
  - **Edit** opens UserFormDialog in edit mode.
  - **Activate / Deactivate** asks for confirmation in an AlertDialog, then shows a toast. A 422 when deactivating
    yourself shows its message.
- **"Add user"** button opens UserFormDialog in create mode:
  - The role select shows/hides role-specific fields: department for Employee; senior switch, max active incidents
    and experience years for Technician.
  - Includes a password field.
  - Validate client-side and map server `fieldErrors`.
  - On success, close the dialog, show a toast and refresh the list.
- Edit mode: email and role are read-only. Technicians also get an "available" switch.

### ProfilePage (all roles)

- Read-only info card: role-specific fields plus "member since".
- "Edit profile" form (name, phone).
- "Change password" form: current, new and confirm. "Confirm" must match, checked on the client only. Show a toast
  on 204 and the `message` on a 400 `INVALID_REQUEST`.
- After a successful profile update, refresh the user in AuthContext so the top bar name updates.

### ForbiddenPage, NotFoundPage, ComingSoonPage

Simple, friendly pages with a button back to the role home. ComingSoonPage shows the feature name.

## 11. Design and quality requirements

- Clean, professional enterprise-dashboard look: light theme, generous spacing, consistent card style, readable
  tables. Use shadcn components consistently. Dark mode is optional; do it only if time allows at the end.
- Responsive: usable on a laptop and on a phone-width screen.
- Accessibility: every input has a label, buttons have clear text, and focus states stay visible.
- Feedback everywhere: loading states on buttons and pages, toasts for success/failure, empty states.
- Format dates as e.g. `05 Nov 2026, 3:00 PM` in local time via one helper in `lib/format.js`.
- Code: small focused components, no duplicated API logic, meaningful names, brief comments only where they help
  me explain the design. Shared error handling through helpers in `lib/errors.js`:
  - `getErrorMessage(error)`
  - `getFieldErrors(error)`
  - `isNetworkError(error)`

## 12. Acceptance checklist (I will test these)

1. `npm run dev` starts on `http://localhost:5173` with no console errors.
2. Login works for all three roles and lands on the correct home with the correct accent and navigation.
3. Wrong password shows "Invalid email or password". A deactivated user sees the deactivated message.
4. Refreshing the browser keeps me logged in. Logout returns to login, and the Back button can't reach protected pages.
5. An employee typing `/admin/users` in the address bar gets the Forbidden page.
6. Registering with a weak password shows the field error. A duplicate email shows the email error. A valid
   registration logs in as an employee.
7. Admin: stat cards show real counts. The users list filters by role, status and search, and paginates.
8. Admin can create one user of each role (role-specific fields appear correctly), edit a technician's workload,
   and deactivate/activate a user. Deactivating yourself shows the 422 message.
9. Technician availability toggle persists after refresh.
10. Profile edit updates the name in the top bar. Password change works and rejects a wrong current password.
11. With the backend stopped, login shows "Server offline" and requests show the network-error message.
12. On a phone-width screen the sidebar becomes a slide-out menu.

## 13. Out of scope for now

Incidents, services, categories, SLA, notifications, audit log, reports and charts. Their navigation entries exist
only as disabled "Soon" items. Don't build mock versions; I'll send a new brief when the backend endpoints exist.

**Start by confirming you've understood, then give the step-by-step plan and wait for my go-ahead.**
