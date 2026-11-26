# Kora Admin

Admin dashboard for Kora. Staff use it to manage offerings, bookings, members, payments, access control, and site administration.

## Tech stack

- Nuxt 4 (Vue 3), client-rendered SPA
- Nuxt UI 4
- Pinia
- Zod
- ESLint (Antfu config)

## Prerequisites

- Node.js 22.x
- npm

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set the API:

   ```env
   NUXT_PUBLIC_API_BASE_URL=http://localhost:8000
   NUXT_PUBLIC_API_TIMEOUT=10000
   ```

   | Variable                   | Description                         |
   | -------------------------- | ----------------------------------- |
   | `NUXT_PUBLIC_API_BASE_URL` | Backend API base URL                |
   | `NUXT_PUBLIC_API_TIMEOUT`  | API request timeout in milliseconds |

## Development

```bash
npm run dev
```

Uses `.env.local` and serves at `http://localhost:3000` (with `--host` for LAN access).

`npm run dev:prod` starts the dev server with `.env` instead.

## Scripts

| Command                      | Description                                     |
| ---------------------------- | ----------------------------------------------- |
| `npm run dev`                | Dev server with `.env.local`                    |
| `npm run dev:prod`           | Dev server with `.env`                          |
| `npm run build`              | Production build                                |
| `npm run generate`           | Static site into `.output/public` (uses `.env`) |
| `npm run preview`            | Preview the production build                    |
| `npm run lint`               | Run ESLint                                      |
| `npm run lint:fix`           | Run ESLint with auto-fix                        |
| `npm run typecheck`          | Typecheck the Nuxt app                          |
| `npm run knip`               | Find unused files and exports                   |
| `npm run test:booking-lines` | Run booking helper tests                        |

## Project structure

```
app/
├── components/     # UI, bookings, members, offerings, refunds, settings
├── composables/    # useApi, useStorage, permissions, pagination
├── config/         # API endpoints, icons, permissions
├── middleware/     # Auth
├── pages/          # Routes
├── stores/         # Pinia stores
├── types/
└── utils/
```

## Features

- **Auth:** Admin login, forgot password, protected routes
- **Dashboard:** Bookings, revenue, and member activity
- **Offerings:** Sessions, spa services, and Kora passes
- **Bookings:** List, create, and cancel bookings
- **Members:** Members and guests, membership plans, freezes
- **Financial:** Payments and refunds
- **Access control:** Access cards, door PINs, and access logs
- **Instructors, promo codes, and email**
- **Administration:** Roles, permissions, and admin accounts
- **Settings:** Profile and password

## Deployment

`npm run generate` writes a static SPA to `.output/public`. Set `NUXT_PUBLIC_API_BASE_URL` and `NUXT_PUBLIC_API_TIMEOUT` at build time so they are baked into the client bundle.

`public/.htaccess` is the Apache fallback for client-side routes. It is not used by hosts that already serve the SPA from `index.html`.

## License

Private
