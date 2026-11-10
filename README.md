# Bobalicious

Online ordering for a boba tea bar: a menu of drinks built on single-origin teas, each one
made to order (size, sweetness, ice and up to three extra toppings), saved drinks, a bag,
checkout for pickup or delivery with a map address picker, discount codes, and Paystack
payments (card, mobile money, bank transfer).

Started as a copy of `schoolshop`; it has its own database (`bobashop`), auth secret and
port (3010), so both can run side by side.

## Rebranding

The business name, phone, WhatsApp, email, address, hours and pickup time are placeholders
in `packages/api/src/data/shop.ts`. The menu (drinks, prices, toppings, sizes, which drinks
can be served hot) is in `packages/api/src/data/catalog.ts`; give a drink an `image` path
(files go in `apps/web/public/`) to show a top-down photo instead of the illustrated cup.
Colours and fonts are tokens in `apps/web/src/index.css`.

Every price on the menu is a placeholder. The server prices each order from the catalogue
with the same `unitPrice()` the storefront uses, so customers always pay what they saw.

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Self, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **tRPC** - End-to-end type-safe APIs
- **Mongoose** - TypeScript-first ORM
- **MongoDB** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Database Setup

This project uses MongoDB with Mongoose.

1. Make sure you have MongoDB set up.
2. Update your `apps/web/.env` file with your MongoDB connection URI.

Then, run the development server:

```bash
pnpm run dev
```

Open [http://localhost:3010](http://localhost:3010) in your browser to see the fullstack application.

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@bobashop/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Environment Configuration

Each app owns its environment schema in `.env.schema`. Varlock generates `src/env.ts` during installation; run `pnpm run env:generate` after changing a schema. Commit schemas, and keep secrets in ignored env files or your deployment platform.

Import the generated `ENV` accessor in application code. Shared database and auth packages receive configuration or initialized clients from the application. See [Varlock's monorepo guide](https://varlock.dev/guides/monorepos/).

Bun's automatic env loading is disabled in `bunfig.toml`; the framework integration or server bootstrap loads Varlock. Node deployments must include Varlock and its dependencies alongside the app schema.

Run standalone Node/Bun tools that use Varlock from the owning app directory so they load that app's schema and env files. `env:generate` only generates TypeScript files; it does not initialize environment values in a subsequent command.

## Deployment

### Vercel Services

- Target: web + server
- Config: `vercel.json`
- Link the project first: pnpm run deploy:setup
- Local Vercel dev: pnpm run dev:vercel
- Sync preview env: pnpm run env:preview
- Sync production env: pnpm run env:production
- Dry-run check (no upload): pnpm run deploy:check
- Preview deploy: pnpm run deploy
- Production deploy: pnpm run deploy:prod
  Vercel Services share project environment variables, but deploys do not upload local `.env` files automatically. Link the project with `vercel link`, then run the env sync command before your first deploy (otherwise the deployment starts with no env vars), or pass one-off envs with `vercel deploy -e KEY=value`.
  Pass Vercel CLI flags to the env sync command directly, for example: `pnpm run env:production --scope your-team`.

For more details, see the guide on [Deploying to Vercel](https://www.better-t-stack.dev/docs/guides/vercel).

## Project Structure

```
bobashop/
├── apps/
│   └── web/         # Fullstack application (Next.js)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `pnpm run dev`: Start all applications in development mode
- `pnpm run build`: Build all applications
- `pnpm run dev:web`: Start only the web application
- `pnpm run check-types`: Check TypeScript types across all apps
- `pnpm run deploy:setup`: Link this repo to a Vercel project (first-time setup)
- `pnpm run dev:vercel`: Run the Vercel Services dev environment locally
- `pnpm run env:preview`: Sync local env files to the Vercel preview environment
- `pnpm run env:production`: Sync local env files to the Vercel production environment
- `pnpm run deploy`: Create a Vercel preview deployment
- `pnpm run deploy:prod`: Deploy to Vercel production
- `pnpm run deploy:check`: Dry-run a deploy to preview framework detection and included files without uploading

## Environment variables

Declared in `apps/web/.env.schema` (varlock validates them at build and start):

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | for accounts and orders | MongoDB connection string, e.g. a MongoDB Atlas `mongodb+srv://…` URI with the database name in the path |
| `BETTER_AUTH_SECRET` | for accounts | At least 32 characters. Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | no on Vercel | Defaults to the deployment URL from Vercel's system env vars |
| `PAYSTACK_SECRET_KEY` | for payments | `sk_test_…` or `sk_live_…`. Without it, checkout asks customers to call instead |

## Deploying to Vercel

**As a prototype (no environment variables):** import the repo in Vercel and deploy. With no
`DATABASE_URL` the site runs in prototype mode: the menu, drink pages, bag, discount codes and
checkout all work; sign-in is hidden; and checkout asks customers to call instead of paying.
Add `DATABASE_URL` and `BETTER_AUTH_SECRET` later and accounts switch on, with no code change.

**Fully, with accounts and payments:**

1. **Database:** create a MongoDB Atlas cluster. Under *Network Access*, allow `0.0.0.0/0`
   (Vercel functions don't have fixed IPs). Copy the connection string into `DATABASE_URL`.
2. **Import the repo** in Vercel. `vercel.json` already points the project at `apps/web`
   and installs from the monorepo root with pnpm; leave the framework as Next.js.
3. **Environment variables:** add the variables above in *Project → Settings → Environment
   Variables*, or set them in `apps/web/.env` and run `pnpm env:production` (and
   `pnpm env:preview`) to sync them with the Vercel CLI. Values that point at `localhost`
   are flagged by the sync script.
4. **Paystack:** in the Paystack dashboard, set the webhook URL to
   `https://<your-domain>/api/paystack/webhook`. Use test keys on preview deployments and
   live keys only on production.
5. **Deploy:** push to `main` (or run `pnpm deploy:prod`). Run `pnpm deploy:check` first
   for a dry run.

Delivery pricing (GH₵ 15, free over GH₵ 150, pickup free) lives in
`packages/api/src/pricing.ts` and is shared by the storefront and the server, which prices
every order from the catalogue rather than trusting the browser.
