# Licensing Budget Dashboard

Internal dashboard for tracking fiscal-year content licensing spend.

## What It Tracks

- Fiscal year label, start month, and budget.
- Content title and provider.
- Payment amount.
- Payment cadence: quarterly or yearly.
- Added month inside the fiscal year.
- Automatic first-quarter proration for quarterly licenses.
- Full recurring quarterly payments after the first prorated quarter.
- Total committed spend and remaining budget.

## Budget Rule

For quarterly licenses, the entered payment amount is the normal quarterly installment.

- First month of quarter: `100%`
- Second month of quarter: `66.67%`
- Third month of quarter: `33.33%`
- Later quarters: `100%`

Yearly licenses are charged once in the added month.

The FY26 workbook was used as workflow evidence, not as formula source code. One-off formulas from that workbook stay historical to FY26.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:5173`.

Without Supabase environment variables, the app runs in local demo mode with seeded FY26-style data.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Add these values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
APP_PASSWORD=...
```

4. Sign in with an email from `app_access_invites` and the shared internal password.
5. Create the fiscal year.
6. Add collaborators from the dashboard before sharing the app link and shared password.

The app only accepts users whose email ends in `@augustineinstitute.org` or `@augustine.edu` and appears in `public.app_access_invites`. `APP_PASSWORD` must stay server-side only.

## Canonical Deployment

The canonical live site is now Cloudflare Workers:

```text
https://app.formedlicensing.workers.dev
```

Deploy with Cloudflare after tests and local browser verification pass:

```bash
npm run cf:build
npm run cf:deploy
```

Cloudflare Workers needs these variables/secrets:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
APP_PASSWORD
CLICKUP_API_TOKEN
CLICKUP_CONTENT_UPLOAD_LIST_ID
```

If `APP_PASSWORD` or another server-side secret changes, update the matching Cloudflare Worker secret and redeploy.

## Legacy Vercel Deployment

1. Create or link a Vercel project for this repository.
2. Add these Vercel environment variables for Production and Preview:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
APP_PASSWORD
```

3. Deploy with Vercel after tests and local browser verification pass.
4. If `APP_PASSWORD` changes in Vercel, redeploy so the server picks up the new value.

## Cloudflare Workers

This app runs on Cloudflare Workers through the OpenNext adapter.

1. Add these Cloudflare Workers variables/secrets:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
APP_PASSWORD
CLICKUP_API_TOKEN
CLICKUP_CONTENT_UPLOAD_LIST_ID
```

2. Build and preview in the Cloudflare runtime:

```bash
npm run cf:build
npm run cf:preview
```

3. Deploy the Worker:

```bash
npm run cf:deploy
```

The free canonical URL is:

```text
https://app.formedlicensing.workers.dev
```

## Verification

```bash
npm run test
npm run build
npm run test:e2e
```
