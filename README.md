# Depot — Full-Stack GraphQL E-commerce POC

A proof-of-concept storefront for learning full-stack GraphQL. Browse products, manage a cart, and place fake orders — no real payments.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19 |
| API | Apollo Server 4 (GraphQL at `/api/graphql`) |
| Data fetching | Apollo Client 3 |
| Database | PostgreSQL via Prisma ORM |

## What you'll learn

- GraphQL schema design (types, queries, mutations)
- Resolver patterns and server-side validation
- Apollo Server inside Next.js route handlers
- Apollo Client queries/mutations with cache updates
- Relational data modeling (products, carts, orders)
- Session-less cart identity via browser `localStorage`

## POC scope

**In scope**

- Product catalog (list + detail)
- Add to cart / update quantity / remove items
- Fake checkout (creates an order, decrements stock, clears cart)

**Out of scope (for now)**

- User authentication
- Real payment processing
- Admin panel / CMS
- Headless CMS integration

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local install, Docker, or [Render Postgres](https://render.com/docs/postgresql))

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the database

Copy the example env file and set your connection string:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_depot"
```

### 3. Create tables and seed sample products

```bash
npm run db:setup
```

This runs `prisma db push` (creates tables) and seeds 6 sample products.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Explore the GraphQL API

Visit [http://localhost:3000/api/graphql](http://localhost:3000/api/graphql) for Apollo Sandbox.

Example query:

```graphql
query {
  products {
    id
    name
    price
    stock
  }
}
```

Example mutation:

```graphql
mutation {
  addToCart(cartId: "your-cart-uuid", productId: "product-id", quantity: 1) {
    id
    itemCount
    total
  }
}
```

> Use a UUID for `cartId` — the web app generates one automatically in `localStorage` under `depot_cart_id`.

## Project structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── api/graphql/        # Apollo Server endpoint
│   ├── cart/
│   ├── checkout/
│   └── products/[id]/
├── components/             # UI components
├── graphql/
│   ├── schema.ts           # GraphQL type definitions
│   ├── resolvers.ts        # Query & mutation resolvers
│   └── operations.ts       # Client-side queries/mutations
└── lib/
    ├── prisma.ts           # Prisma client singleton
    ├── apollo-provider.tsx # Apollo Client provider
    └── cart-session.ts     # Browser cart ID helpers
prisma/
├── schema.prisma           # Database models
└── seed.ts                 # Sample product data
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Run production build |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed sample products |
| `npm run db:setup` | Push schema + seed |

## Docker Postgres (optional)

If you don't have Postgres installed locally:

```bash
docker run --name depot-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ecommerce_depot \
  -p 5432:5432 \
  -d postgres:16
```

Then use:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_depot"
```

## Deploying to Render (cloud)

This repo includes a [`render.yaml`](render.yaml) Blueprint that provisions a **free web service** and **free Postgres database** automatically.

### One-click Blueprint deploy

1. **Merge the PR** (or push `render.yaml` to your default branch on GitHub).
2. Open the Blueprint link:

   [https://dashboard.render.com/blueprint/new?repo=https://github.com/awongCM/fullstack-graphql-ecommerce-depot](https://dashboard.render.com/blueprint/new?repo=https://github.com/awongCM/fullstack-graphql-ecommerce-depot)

3. Connect your GitHub account if prompted.
4. Review the two resources Render will create:
   - `depot` — Next.js web service
   - `depot-db` — PostgreSQL database
5. Click **Apply** to deploy.

The Blueprint wires `DATABASE_URL` automatically and runs `npm run db:setup` (schema push + seed) before each deploy. The seed is idempotent — it only inserts products when the database is empty.

Your live URL will be something like `https://depot.onrender.com`.

### Free tier notes

- Web services **spin down after 15 minutes** of inactivity — the first visit after idle may take ~30 seconds to wake up.
- Free Postgres databases **expire after 90 days** (Render may show 30 days in some docs; check your dashboard). Fine for a learning POC; upgrade or export data if you want to keep it longer.

### Manual deploy (without Blueprint)

If you prefer the Dashboard:

1. Create a [Render Postgres](https://render.com/docs/postgresql) database.
2. Create a **Web Service** connected to this repo.
3. Build command: `npm ci && npm run build`
4. Pre-deploy command: `npm run db:setup`
5. Start command: `npm start`
6. Add env var `DATABASE_URL` from the database **Internal Connection String**.

## Next learning steps

1. Add user auth (NextAuth or similar) and tie carts to accounts
2. Swap `localStorage` cart IDs for HTTP-only cookies
3. Add DataLoader to solve N+1 queries in resolvers
4. Integrate a headless CMS for product content
5. Add Stripe for real checkout flows

## License

MIT — learning project.
