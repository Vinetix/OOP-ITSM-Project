# I-ITSM frontend

React app for I-ITSM (Intelligent IT Service Management). Employees report IT
problems, technicians work on them, and admins manage users. Phase F1 covers
sign-in, the three role interfaces, user management and profiles.

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
  api/         One Axios client plus a module per backend area (auth, users, system)
  auth/        Session context and the three route guards
  config/      Roles and per-role navigation: the data the shell is built from
  components/  Shared pieces: lamps, badges, form fields, dialogs, pagination
  components/ui/  shadcn/ui components (generated, then themed in index.css)
  hooks/       useAsync for loading data, usePageTitle for the tab title
  layouts/     App shell (top bar + track sidebar) and the sign-in layout
  lib/         Date formatting, error helpers, validation rules
  pages/       One folder per role, plus pages every role shares
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

The backend API is described in `docs/API_CONTRACT.md` and at
http://localhost:8080/swagger-ui.html.
