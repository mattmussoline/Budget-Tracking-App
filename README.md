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
```

4. Enable email magic-link auth in Supabase.
5. Sign in once as Matt.
6. Create the fiscal year.
7. Ask the boss to sign in once.
8. Add the boss's Supabase user id as an editor from the Share panel.

## Vercel Deployment

1. Create or link a Vercel project for this repository.
2. Add these Vercel environment variables for Production and Preview:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

3. In Supabase Auth URL configuration, add the Vercel production URL and preview URL pattern as allowed redirect URLs.
4. Deploy with Vercel after tests and local browser verification pass.

## Verification

```bash
npm run test
npm run build
npm run test:e2e
```
