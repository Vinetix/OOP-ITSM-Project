# I-ITSM frontend

React app for I-ITSM (Intelligent IT Service Management). Employees report IT
problems, technicians work on them, and admins manage users.

- **Phase F1:** sign-in, the three role interfaces, user management and profiles.
- **Phase F2:** the catalog (IT services, incident categories, technician skills),
  SLA policies with service overrides, and technician skills.
- **Phase F3:** incidents for every role: report with a live priority estimate,
  role-specific lists, the detail page with the lifecycle stepper, actions, notes and
  live SLA countdowns, and incident counts on every home page.
- **Phase F4:** assignment: strategy and auto-assign settings, ranked recommendations
  with reasons in the assign dialog, auto-assign, and workload pages for admins and
  technicians.

## Run it

You need Node.js 20.19+ (or 22.12+) and the backend running on port 8080.

```powershell
cd frontend
npm install
Copy-Item .env.example .env   # first time only
npm run dev
```

Open http://localhost:5173. The dev server must stay on port 5173, because that is
the only origin the backend accepts (CORS).

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |

## Demo accounts

All use the password `Password@123`.

| Role | Email |
|---|---|
| Admin | `admin@itsm.com` |
| Technician (senior) | `ravi.kumar@itsm.com`, `fatima.khan@itsm.com` |
| Technician | `sneha.reddy@itsm.com`, `arjun.mehta@itsm.com` |
| Employee | `rahul.verma@itsm.com`, `divya.nair@itsm.com`, `kiran.patel@itsm.com` |

## How it's organised

```
src/
  api/         One Axios client plus a module per backend area (auth, users, system,
               catalog, sla)
  auth/        Session context and the three route guards
  config/      Roles, per-role navigation, and catalog value sets (criticality, priority)
  components/  Shared pieces: lamps, badges, form fields, dialogs, pagination, plus the
               F2 tags (criticality, priority), keyword and duration inputs
  components/ui/  shadcn/ui components (generated, then themed in index.css)
  hooks/       useAsync for loading data, useFormState for forms, usePageTitle
  layouts/     App shell (top bar + track sidebar) and the sign-in layout
  lib/         Date formatting, error helpers, validation rules
  pages/       One folder per role, plus pages every role shares
               (admin/catalog and admin/sla hold the F2 admin screens)
```

A few decisions worth knowing:

- **Role theming.** After sign-in, `<html data-role="ADMIN">` is set, and every
  accent colour in `index.css` follows it. One shell, three distinct interfaces.
- **Routes come from config.** `config/navigation.js` drives both the sidebar and
  the routes. A new page is one nav entry plus one line in `router.jsx`.
- **Errors in one shape.** The backend always returns `{ code, message, fieldErrors }`.
  `lib/errors.js` reads it, and forms put field errors under the right field.
- **Sessions.** The token lives in localStorage so a refresh keeps you signed in.
  Any 401 ends the session centrally in `api/axiosClient.js`.
- **One factory for the catalog.** Categories, services and skills share their
  endpoints, so `api/catalogApi.js` builds all three from one function.
- **Durations are minutes.** SLA times are stored in minutes; `DurationInput` lets
  people type 2 h or 1 d, and `formatMinutes` shows them back the same way.
- **The server decides the buttons.** An incident's `allowedActions` decides which
  actions appear; `pages/incidents/detail/actions.js` only describes each one (label,
  dialog, API call). Every action returns the updated incident, which replaces the page.
- **Shared pages stay fresh.** Incident pages refresh quietly when you return to the tab
  and every 30 seconds (`useAutoRefresh`), so several people can work on one incident.
- **Nothing in the catalog is deleted.** Items are deactivated, and edit dialogs keep
  a since-deactivated choice visible so saving never changes it silently.

The backend API is described in `docs/API_CONTRACT.md` and at
http://localhost:8080/swagger-ui.html.
