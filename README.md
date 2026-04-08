# Baha System Web

Admin dashboard for the Baha system — manage communities, transactions, subscriptions, inquiries, and configuration.

## Tech Stack

- **Framework:** Nuxt 4 (Vue 3)
- **UI:** Nuxt UI 4
- **State:** Pinia
- **Validation:** Zod
- **Linting:** ESLint (Antfu config)

## Prerequisites

- Node.js 22.x
- npm, pnpm, yarn, or bun

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Create `.env.local` for development:

   ```env
   NUXT_PUBLIC_API_BASE_URL=https://your-api-url
   NUXT_PUBLIC_API_TIMEOUT=10000
   ```

   | Variable                   | Description              |
   | -------------------------- | ------------------------ |
   | `NUXT_PUBLIC_API_BASE_URL` | Backend API base URL     |
   | `NUXT_PUBLIC_API_TIMEOUT`  | API request timeout (ms) |

## Development

```bash
npm run dev
```

Uses `.env.local` and runs at `http://localhost:3000` (with `--host` for LAN access).

## Scripts

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `npm run dev`      | Start dev server with `.env.local` |
| `npm run build`    | Build for production               |
| `npm run generate` | Generate static site (uses `.env`) |
| `npm run preview`  | Preview production build           |
| `npm run lint`     | Run ESLint                         |
| `npm run lint:fix` | Run ESLint with auto-fix           |

## Project Structure

```
app/
├── components/       # Vue components
│   ├── base/         # Reusable UI (button, input, modal, table, etc.)
│   ├── community/    # Community views
│   ├── configuration/ # Billable items, coupons, payment methods
│   ├── inquiry/      # Inquiry management
│   ├── subscription/ # Subscription plans
│   └── transaction/  # Transaction & payment flows
├── composables/      # useApi, useStorage, usePagination, etc.
├── config/           # API endpoints, constants
├── middleware/       # Auth (global)
├── pages/            # Route pages
├── stores/           # Pinia stores
├── types/
└── utils/            # Formatters, status helpers
```

## Features

- **Auth:** Admin login, protected routes, token-based auth
- **Communities:** Create, list, manage communities and admins
- **Transactions:** Create invoices (billable items or subscriptions), cancel, record payments
- **Subscriptions:** Manage plans
- **Inquiries:** List, create, update status and logs
- **Configuration:** Billable items, coupons, payment methods
- **Reports:** Analytics and KPIs
- **Settings:** Profile, change password

## Deployment

The project deploys via GitHub Actions to Namecheap (FTP) when:

- Push to `main`
- Commit message includes `prod-build`

Required secrets: `FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_PORT`
Required vars: `NUXT_PUBLIC_API_BASE_URL`, `NUXT_PUBLIC_API_TIMEOUT`

Build output: `.output/public/` (static, `generate`)

## License

Private
