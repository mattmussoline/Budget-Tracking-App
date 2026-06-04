# Licensing Budget Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a simple internal web app for tracking fiscal-year licensing spend by title, provider, month, quarter, payment cadence, proration, budget remaining, and boss collaboration.

**Architecture:** Create a new Next.js App Router application with TypeScript, Tailwind CSS, Supabase Auth/Postgres for shared editing, and a small tested domain layer for all budget/proration math. The UI uses the provided Soft UI/neumorphism design system through centralized CSS tokens and reusable depth primitives, so the app feels tactile without scattering one-off shadow strings across pages.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Supabase, Zod, Vitest, React Testing Library, Playwright, lucide-react.

---

## Context Discovered

- Current workspace: `/Users/mattmussoline/Documents/Codex OS/10_Workstations/09_Budget Tracking App`
- Current codebase state: empty folder, so this plan scaffolds a new app instead of refactoring an existing one.
- FY26 workbook: `/Users/mattmussoline/Library/CloudStorage/OneDrive-AugustineInstitute/FY26 Licensing Budget Tracking.xlsx`
- Workbook structure: one sheet with quarters across the top, months July through June underneath, titles entered inside each month, payment amounts beneath each title, and summary cells for total spent and remaining budget.
- Workbook workflow confirmed:
  - FY starts in July.
  - Quarterly content added partway through a quarter needs first-payment proration.
  - Later quarterly payments repeat at the full installment amount.
  - The sample budget was `$30,000`, total spent was `$26,316.67`, and remaining was `$3,683.33`.
  - The specific Excel formulas in FY26 are historical examples for particular titles, not formulas to port into the app.

## Focused Scope Decisions

This plan uses these defaults so implementation can proceed without stalling:

- **Fee meaning:** The user-entered amount is the payment installment amount. For quarterly cadence, that amount repeats each full quarter after the prorated first quarter.
- **Yearly cadence:** Yearly content is charged once in the month it is added, at the entered amount. It is not prorated unless Matt asks for annual proration later.
- **Sharing and hosting:** Deploy the app on Vercel, with Supabase Auth, Supabase Postgres, and row-level security so Matt and his boss can both view/edit the same fiscal-year dashboard after sign-in.
- **Fiscal year:** Default fiscal year starts in July, matching the FY26 workbook, but the fiscal year start month is editable.

## File Structure

Create the following files:

- `package.json` - scripts and dependencies.
- `next.config.ts` - Next.js config.
- `tsconfig.json` - strict TypeScript config.
- `postcss.config.mjs` - Tailwind processing.
- `tailwind.config.ts` - content scanning and design tokens that Tailwind needs.
- `vitest.config.ts` - unit/component test config.
- `playwright.config.ts` - browser flow test config.
- `.env.example` - Supabase environment variable template.
- `README.md` - setup, Supabase schema, local dev, verification, Vercel deployment, and sharing notes.
- `src/app/globals.css` - Soft UI CSS variables, base styles, focus rings, reusable shadow utilities.
- `src/app/layout.tsx` - root layout, metadata, fonts.
- `src/app/page.tsx` - redirect to dashboard or sign-in state.
- `src/app/dashboard/page.tsx` - server page for main budget dashboard.
- `src/app/login/page.tsx` - sign-in page.
- `src/components/ui/soft-button.tsx` - reusable neumorphic button.
- `src/components/ui/soft-input.tsx` - reusable neumorphic input field.
- `src/components/ui/soft-select.tsx` - reusable select field.
- `src/components/ui/soft-surface.tsx` - reusable raised/inset surface wrapper.
- `src/features/budget/budget-math.ts` - pure fiscal-year, quarter, cadence, and proration logic.
- `src/features/budget/budget-types.ts` - shared budget domain types.
- `src/features/budget/budget-math.test.ts` - Vitest coverage for the workbook rules.
- `src/features/budget/dashboard-model.ts` - converts database rows into dashboard-ready summaries.
- `src/features/budget/dashboard-model.test.ts` - tests for summary totals and monthly board output.
- `src/features/budget/budget-actions.ts` - server actions for fiscal-year settings and content license CRUD.
- `src/features/budget/components/budget-dashboard.tsx` - dashboard shell and layout.
- `src/features/budget/components/content-license-form.tsx` - add/edit title form.
- `src/features/budget/components/fiscal-year-settings.tsx` - fiscal year and budget controls.
- `src/features/budget/components/month-board.tsx` - quarter/month schedule view.
- `src/features/budget/components/summary-metrics.tsx` - budget, spent, remaining, and cadence KPI wells.
- `src/features/budget/components/provider-summary.tsx` - provider grouped spend summary.
- `src/features/budget/components/share-panel.tsx` - boss collaborator invite/status UI.
- `src/lib/currency.ts` - cents parsing and display helpers.
- `src/lib/months.ts` - fiscal-month helpers.
- `src/lib/supabase/server.ts` - server Supabase client.
- `src/lib/supabase/browser.ts` - browser Supabase client.
- `src/lib/supabase/middleware.ts` - auth session refresh helper.
- `src/middleware.ts` - Next.js middleware for Supabase auth.
- `supabase/schema.sql` - tables, indexes, RLS policies, and helper triggers.
- `tests/e2e/budget-flow.spec.ts` - Playwright test for adding a license and seeing budget update.

---

### Task 1: Scaffold the App

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `.env.example`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create project configuration files**

Create `package.json`:

```json
{
  "name": "licensing-budget-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 5173",
    "build": "next build",
    "start": "next start -p 5174",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.16.0",
    "eslint-config-next": "^15.0.0",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true
};

export default nextConfig;
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `postcss.config.mjs`:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};

export default config;
```

Create `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#E0E5EC",
        foreground: "#3D4852",
        muted: "#6B7280",
        accent: "#6C63FF",
        "accent-light": "#8B84FF",
        success: "#38B2AC"
      },
      fontFamily: {
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"]
      },
      borderRadius: {
        soft: "32px"
      }
    }
  },
  plugins: []
};

export default config;
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"]
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  }
});
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ]
});
```

Create `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 2: Create the root app files**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap"
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Licensing Budget",
  description: "Fiscal-year content licensing budget tracker"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${plusJakarta.variable}`}>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/dashboard");
}
```

Create a temporary minimal `src/app/globals.css` so the app compiles before the design tokens task:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

body {
  margin: 0;
}
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
npm install
```

Expected: packages install and `package-lock.json` is created.

- [ ] **Step 4: Verify baseline build**

Run:

```bash
npm run build
```

Expected: build succeeds or fails only because the generated `next-env.d.ts` needs to be created by Next.js. If `next-env.d.ts` is missing, run `npm run dev` once, stop it after compilation, then rerun `npm run build`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs tailwind.config.ts vitest.config.ts playwright.config.ts .env.example src/app/layout.tsx src/app/page.tsx src/app/globals.css next-env.d.ts
git commit -m "chore: scaffold licensing budget app"
```

---

### Task 2: Centralize the Soft UI Design System

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/ui/soft-surface.tsx`
- Create: `src/components/ui/soft-button.tsx`
- Create: `src/components/ui/soft-input.tsx`
- Create: `src/components/ui/soft-select.tsx`

- [ ] **Step 1: Replace global styles with design tokens and utilities**

Replace `src/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
  --surface: #e0e5ec;
  --foreground: #3d4852;
  --muted: #6b7280;
  --accent: #6c63ff;
  --accent-light: #8b84ff;
  --success: #38b2ac;
  --shadow-dark: 163 177 198;
  --shadow-light: 255 255 255;
}

html {
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  margin: 0;
  background: var(--surface);
  color: var(--foreground);
  font-family: var(--font-dm-sans), system-ui, sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

button,
a,
input,
select,
textarea {
  outline: none;
}

:focus-visible {
  box-shadow:
    0 0 0 2px var(--surface),
    0 0 0 4px var(--accent);
}

.font-display {
  font-family: var(--font-plus-jakarta), system-ui, sans-serif;
}

.soft-raised {
  background: var(--surface);
  box-shadow:
    9px 9px 16px rgb(var(--shadow-dark) / 0.6),
    -9px -9px 16px rgb(var(--shadow-light) / 0.5);
}

.soft-raised-hover {
  box-shadow:
    12px 12px 20px rgb(var(--shadow-dark) / 0.7),
    -12px -12px 20px rgb(var(--shadow-light) / 0.6);
}

.soft-raised-sm {
  background: var(--surface);
  box-shadow:
    5px 5px 10px rgb(var(--shadow-dark) / 0.6),
    -5px -5px 10px rgb(var(--shadow-light) / 0.5);
}

.soft-inset {
  background: var(--surface);
  box-shadow:
    inset 6px 6px 10px rgb(var(--shadow-dark) / 0.6),
    inset -6px -6px 10px rgb(var(--shadow-light) / 0.5);
}

.soft-inset-deep {
  background: var(--surface);
  box-shadow:
    inset 10px 10px 20px rgb(var(--shadow-dark) / 0.7),
    inset -10px -10px 20px rgb(var(--shadow-light) / 0.6);
}

.soft-inset-sm {
  background: var(--surface);
  box-shadow:
    inset 3px 3px 6px rgb(var(--shadow-dark) / 0.6),
    inset -3px -3px 6px rgb(var(--shadow-light) / 0.5);
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.soft-float {
  animation: float 3s ease-in-out infinite;
}
```

- [ ] **Step 2: Add a class name helper inside the first component**

Create `src/components/ui/soft-surface.tsx`:

```tsx
import { clsx } from "clsx";

type SoftSurfaceProps = {
  children: React.ReactNode;
  className?: string;
  depth?: "raised" | "inset" | "insetDeep";
  as?: "div" | "section" | "article";
};

const depthClass = {
  raised: "soft-raised",
  inset: "soft-inset",
  insetDeep: "soft-inset-deep"
};

export function cn(...classes: Array<string | false | null | undefined>) {
  return clsx(classes);
}

export function SoftSurface({
  children,
  className,
  depth = "raised",
  as: Component = "div"
}: SoftSurfaceProps) {
  return (
    <Component className={cn("rounded-[32px] bg-surface", depthClass[depth], className)}>
      {children}
    </Component>
  );
}
```

- [ ] **Step 3: Add neumorphic button**

Create `src/components/ui/soft-button.tsx`:

```tsx
import { cn } from "./soft-surface";

type SoftButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function SoftButton({
  className,
  variant = "secondary",
  type = "button",
  children,
  ...props
}: SoftButtonProps) {
  const variantClass =
    variant === "primary"
      ? "bg-accent text-white shadow-[5px_5px_10px_rgb(89_82_215_/_0.35),-5px_-5px_10px_rgb(139_132_255_/_0.45)] active:shadow-[inset_3px_3px_6px_rgb(61_54_180_/_0.45),inset_-3px_-3px_6px_rgb(139_132_255_/_0.45)]"
      : "bg-surface text-foreground soft-raised-sm active:soft-inset-sm";

  return (
    <button
      type={type}
      className={cn(
        "min-h-11 rounded-2xl px-5 py-3 text-sm font-bold transition duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
        variantClass,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Add input and select controls**

Create `src/components/ui/soft-input.tsx`:

```tsx
import { cn } from "./soft-surface";

type SoftInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function SoftInput({ label, error, className, id, ...props }: SoftInputProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="grid gap-2 text-sm font-bold text-foreground" htmlFor={fieldId}>
      {label}
      <input
        id={fieldId}
        className={cn(
          "min-h-12 rounded-2xl border-0 bg-surface px-4 text-base text-foreground soft-inset placeholder:text-[#718096] focus:soft-inset-deep",
          className
        )}
        {...props}
      />
      {error ? <span className="text-sm font-medium text-red-700">{error}</span> : null}
    </label>
  );
}
```

Create `src/components/ui/soft-select.tsx`:

```tsx
import { cn } from "./soft-surface";

type SoftSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Array<{ label: string; value: string }>;
  error?: string;
};

export function SoftSelect({ label, options, error, className, id, ...props }: SoftSelectProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="grid gap-2 text-sm font-bold text-foreground" htmlFor={fieldId}>
      {label}
      <select
        id={fieldId}
        className={cn(
          "min-h-12 rounded-2xl border-0 bg-surface px-4 text-base text-foreground soft-inset focus:soft-inset-deep",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-sm font-medium text-red-700">{error}</span> : null}
    </label>
  );
}
```

- [ ] **Step 5: Verify styles compile**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/components/ui/soft-surface.tsx src/components/ui/soft-button.tsx src/components/ui/soft-input.tsx src/components/ui/soft-select.tsx
git commit -m "feat: add soft ui design system primitives"
```

---

### Task 3: Build and Test the Budget Math

**Files:**
- Create: `src/features/budget/budget-types.ts`
- Create: `src/features/budget/budget-math.test.ts`
- Create: `src/features/budget/budget-math.ts`
- Create: `src/lib/currency.ts`
- Create: `src/lib/months.ts`

- [ ] **Step 1: Write failing budget math tests**

Create `src/features/budget/budget-math.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  calculateLicenseSchedule,
  getFiscalMonths,
  getQuarterPaymentFraction
} from "./budget-math";

describe("getFiscalMonths", () => {
  it("starts FY26 in July and ends in June", () => {
    expect(getFiscalMonths(2026, 7).map((month) => month.label)).toEqual([
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June"
    ]);
  });
});

describe("getQuarterPaymentFraction", () => {
  it("pays full installment in the first month of a quarter", () => {
    expect(getQuarterPaymentFraction(1)).toBe(1);
    expect(getQuarterPaymentFraction(4)).toBe(1);
  });

  it("pays two thirds in the second month of a quarter", () => {
    expect(getQuarterPaymentFraction(2)).toBeCloseTo(2 / 3);
    expect(getQuarterPaymentFraction(5)).toBeCloseTo(2 / 3);
  });

  it("pays one third in the third month of a quarter", () => {
    expect(getQuarterPaymentFraction(3)).toBeCloseTo(1 / 3);
    expect(getQuarterPaymentFraction(12)).toBeCloseTo(1 / 3);
  });
});

describe("calculateLicenseSchedule", () => {
  it("matches the Frassati workbook pattern: third month prorated, later quarters full", () => {
    const schedule = calculateLicenseSchedule({
      id: "frassati",
      title: "Frassati",
      provider: "Example Provider",
      installmentCents: 170000,
      cadence: "quarterly",
      addedFiscalMonth: 3
    });

    expect(schedule.map((payment) => payment.amountCents)).toEqual([
      56667,
      170000,
      170000,
      170000
    ]);
  });

  it("matches the Glorious Mysteries workbook pattern: second month prorated, later quarters full", () => {
    const schedule = calculateLicenseSchedule({
      id: "glorious",
      title: "Glorious Mysteries",
      provider: "Example Provider",
      installmentCents: 12500,
      cadence: "quarterly",
      addedFiscalMonth: 6
    });

    expect(schedule.map((payment) => payment.amountCents)).toEqual([8333, 12500, 12500]);
  });

  it("charges yearly cadence once in the added month", () => {
    const schedule = calculateLicenseSchedule({
      id: "yearly",
      title: "Annual License",
      provider: "Example Provider",
      installmentCents: 240000,
      cadence: "yearly",
      addedFiscalMonth: 10
    });

    expect(schedule).toEqual([
      {
        licenseId: "yearly",
        title: "Annual License",
        provider: "Example Provider",
        fiscalMonth: 10,
        quarter: 4,
        amountCents: 240000,
        isProrated: false
      }
    ]);
  });
});
```

- [ ] **Step 2: Run tests and confirm they fail**

Run:

```bash
npm run test -- src/features/budget/budget-math.test.ts
```

Expected: FAIL because `budget-math.ts` does not exist.

- [ ] **Step 3: Add budget types and helpers**

Create `src/features/budget/budget-types.ts`:

```ts
export type PaymentCadence = "quarterly" | "yearly";

export type ContentLicense = {
  id: string;
  title: string;
  provider: string;
  installmentCents: number;
  cadence: PaymentCadence;
  addedFiscalMonth: number;
  notes?: string | null;
};

export type LicensePayment = {
  licenseId: string;
  title: string;
  provider: string;
  fiscalMonth: number;
  quarter: number;
  amountCents: number;
  isProrated: boolean;
};

export type FiscalMonth = {
  index: number;
  calendarMonth: number;
  label: string;
  quarter: number;
};
```

Create `src/lib/months.ts`:

```ts
export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

export function getCalendarMonthForFiscalIndex(fiscalMonth: number, fiscalYearStartMonth: number) {
  return ((fiscalYearStartMonth - 1 + fiscalMonth - 1) % 12) + 1;
}
```

Create `src/lib/currency.ts`:

```ts
export function dollarsToCents(value: string) {
  const normalized = value.replace(/[$,]/g, "").trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(cents / 100);
}
```

- [ ] **Step 4: Implement budget math**

Create `src/features/budget/budget-math.ts`:

```ts
import { getCalendarMonthForFiscalIndex, monthNames } from "@/lib/months";
import type { ContentLicense, FiscalMonth, LicensePayment } from "./budget-types";

export function getQuarterForFiscalMonth(fiscalMonth: number) {
  assertFiscalMonth(fiscalMonth);
  return Math.floor((fiscalMonth - 1) / 3) + 1;
}

export function getQuarterPaymentFraction(fiscalMonth: number) {
  assertFiscalMonth(fiscalMonth);
  const monthInQuarter = ((fiscalMonth - 1) % 3) + 1;
  return (4 - monthInQuarter) / 3;
}

export function getFiscalMonths(fiscalYear: number, fiscalYearStartMonth: number): FiscalMonth[] {
  if (!Number.isInteger(fiscalYearStartMonth) || fiscalYearStartMonth < 1 || fiscalYearStartMonth > 12) {
    throw new Error("Fiscal year start month must be between 1 and 12.");
  }

  return Array.from({ length: 12 }, (_, index) => {
    const fiscalMonth = index + 1;
    const calendarMonth = getCalendarMonthForFiscalIndex(fiscalMonth, fiscalYearStartMonth);

    return {
      index: fiscalMonth,
      calendarMonth,
      label: monthNames[calendarMonth - 1],
      quarter: getQuarterForFiscalMonth(fiscalMonth)
    };
  });
}

export function calculateLicenseSchedule(license: ContentLicense): LicensePayment[] {
  assertFiscalMonth(license.addedFiscalMonth);

  if (!Number.isInteger(license.installmentCents) || license.installmentCents < 0) {
    throw new Error("Installment amount must be a positive number of cents.");
  }

  if (license.cadence === "yearly") {
    return [
      {
        licenseId: license.id,
        title: license.title,
        provider: license.provider,
        fiscalMonth: license.addedFiscalMonth,
        quarter: getQuarterForFiscalMonth(license.addedFiscalMonth),
        amountCents: license.installmentCents,
        isProrated: false
      }
    ];
  }

  const firstQuarter = getQuarterForFiscalMonth(license.addedFiscalMonth);
  const firstAmount = Math.round(license.installmentCents * getQuarterPaymentFraction(license.addedFiscalMonth));
  const payments: LicensePayment[] = [
    {
      licenseId: license.id,
      title: license.title,
      provider: license.provider,
      fiscalMonth: license.addedFiscalMonth,
      quarter: firstQuarter,
      amountCents: firstAmount,
      isProrated: firstAmount !== license.installmentCents
    }
  ];

  for (let quarter = firstQuarter + 1; quarter <= 4; quarter += 1) {
    payments.push({
      licenseId: license.id,
      title: license.title,
      provider: license.provider,
      fiscalMonth: (quarter - 1) * 3 + 1,
      quarter,
      amountCents: license.installmentCents,
      isProrated: false
    });
  }

  return payments;
}

function assertFiscalMonth(fiscalMonth: number) {
  if (!Number.isInteger(fiscalMonth) || fiscalMonth < 1 || fiscalMonth > 12) {
    throw new Error("Fiscal month must be an integer from 1 to 12.");
  }
}
```

- [ ] **Step 5: Run tests and confirm they pass**

Run:

```bash
npm run test -- src/features/budget/budget-math.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/budget/budget-types.ts src/features/budget/budget-math.ts src/features/budget/budget-math.test.ts src/lib/currency.ts src/lib/months.ts
git commit -m "feat: add tested licensing budget math"
```

---

### Task 4: Add Supabase Persistence and Security

**Files:**
- Create: `supabase/schema.sql`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Add database schema with row-level security**

Create `supabase/schema.sql`:

```sql
create table if not exists public.fiscal_years (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  fiscal_year integer not null,
  fiscal_year_start_month integer not null default 7 check (fiscal_year_start_month between 1 and 12),
  budget_cents integer not null check (budget_cents >= 0),
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fiscal_year_members (
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (fiscal_year_id, user_id)
);

create table if not exists public.content_licenses (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  title text not null,
  provider text not null,
  installment_cents integer not null check (installment_cents >= 0),
  cadence text not null check (cadence in ('quarterly', 'yearly')),
  added_fiscal_month integer not null check (added_fiscal_month between 1 and 12),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_licenses_fiscal_year_id_idx on public.content_licenses(fiscal_year_id);
create index if not exists fiscal_year_members_user_id_idx on public.fiscal_year_members(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fiscal_years_set_updated_at on public.fiscal_years;
create trigger fiscal_years_set_updated_at
before update on public.fiscal_years
for each row execute function public.set_updated_at();

drop trigger if exists content_licenses_set_updated_at on public.content_licenses;
create trigger content_licenses_set_updated_at
before update on public.content_licenses
for each row execute function public.set_updated_at();

alter table public.fiscal_years enable row level security;
alter table public.fiscal_year_members enable row level security;
alter table public.content_licenses enable row level security;

create policy "members can read fiscal years"
on public.fiscal_years for select
using (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = fiscal_years.id
      and members.user_id = auth.uid()
  )
);

create policy "owners can create fiscal years"
on public.fiscal_years for insert
with check (owner_id = auth.uid());

create policy "owners and editors can update fiscal years"
on public.fiscal_years for update
using (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = fiscal_years.id
      and members.user_id = auth.uid()
      and members.role in ('owner', 'editor')
  )
);

create policy "members can read memberships"
on public.fiscal_year_members for select
using (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = fiscal_year_members.fiscal_year_id
      and members.user_id = auth.uid()
  )
);

create policy "owners can manage memberships"
on public.fiscal_year_members for all
using (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = fiscal_year_members.fiscal_year_id
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
)
with check (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = fiscal_year_members.fiscal_year_id
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
);

create policy "members can read content licenses"
on public.content_licenses for select
using (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = content_licenses.fiscal_year_id
      and members.user_id = auth.uid()
  )
);

create policy "owners and editors can manage content licenses"
on public.content_licenses for all
using (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = content_licenses.fiscal_year_id
      and members.user_id = auth.uid()
      and members.role in ('owner', 'editor')
  )
)
with check (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = content_licenses.fiscal_year_id
      and members.user_id = auth.uid()
      and members.role in ('owner', 'editor')
  )
);
```

- [ ] **Step 2: Add Supabase clients**

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );
}
```

Create `src/lib/supabase/browser.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create `src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  await supabase.auth.getUser();
  return response;
}
```

Create `src/middleware.ts`:

```ts
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
```

- [ ] **Step 3: Add login page**

Create `src/app/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSurface } from "@/components/ui/soft-surface";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    setIsSending(false);
    setMessage(error ? error.message : "Check your email for the sign-in link.");
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <SoftSurface className="w-full max-w-md p-8">
        <div className="mb-8 grid gap-3 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl soft-inset-deep">
            <Mail className="h-6 w-6 text-accent" aria-hidden="true" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Licensing Budget</h1>
          <p className="text-muted">Sign in to manage fiscal-year content licensing spend.</p>
        </div>
        <form className="grid gap-5" onSubmit={signIn}>
          <SoftInput
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <SoftButton type="submit" variant="primary" disabled={isSending}>
            {isSending ? "Sending..." : "Send sign-in link"}
          </SoftButton>
          {message ? <p className="text-center text-sm font-medium text-muted">{message}</p> : null}
        </form>
      </SoftSurface>
    </main>
  );
}
```

- [ ] **Step 4: Verify compile**

Run:

```bash
npm run build
```

Expected: build succeeds when Supabase env vars are present. If env vars are absent, the app should still compile, but runtime auth will require `.env.local`.

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql src/lib/supabase/server.ts src/lib/supabase/browser.ts src/lib/supabase/middleware.ts src/middleware.ts src/app/login/page.tsx
git commit -m "feat: add supabase auth and data security"
```

---

### Task 5: Build Dashboard Data Model

**Files:**
- Create: `src/features/budget/dashboard-model.test.ts`
- Create: `src/features/budget/dashboard-model.ts`

- [ ] **Step 1: Write failing dashboard model tests**

Create `src/features/budget/dashboard-model.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildDashboardModel } from "./dashboard-model";
import type { ContentLicense } from "./budget-types";

const licenses: ContentLicense[] = [
  {
    id: "frassati",
    title: "Frassati",
    provider: "Provider A",
    installmentCents: 170000,
    cadence: "quarterly",
    addedFiscalMonth: 3
  },
  {
    id: "ben",
    title: "Ben Cello",
    provider: "Provider B",
    installmentCents: 600000,
    cadence: "quarterly",
    addedFiscalMonth: 4
  },
  {
    id: "heart",
    title: "A Father's Heart",
    provider: "Provider C",
    installmentCents: 60000,
    cadence: "yearly",
    addedFiscalMonth: 11
  }
];

describe("buildDashboardModel", () => {
  it("calculates budget totals and remaining amount", () => {
    const model = buildDashboardModel({
      fiscalYear: 2026,
      fiscalYearStartMonth: 7,
      budgetCents: 3000000,
      licenses
    });

    expect(model.totalSpentCents).toBe(2536667);
    expect(model.remainingCents).toBe(463333);
  });

  it("groups payment rows by fiscal month", () => {
    const model = buildDashboardModel({
      fiscalYear: 2026,
      fiscalYearStartMonth: 7,
      budgetCents: 3000000,
      licenses
    });

    expect(model.months.find((month) => month.index === 3)?.payments).toHaveLength(1);
    expect(model.months.find((month) => month.index === 4)?.payments.map((payment) => payment.title)).toEqual([
      "Ben Cello",
      "Frassati"
    ]);
  });

  it("groups totals by provider", () => {
    const model = buildDashboardModel({
      fiscalYear: 2026,
      fiscalYearStartMonth: 7,
      budgetCents: 3000000,
      licenses
    });

    expect(model.providers).toEqual([
      { provider: "Provider B", totalCents: 1800000 },
      { provider: "Provider A", totalCents: 566667 },
      { provider: "Provider C", totalCents: 60000 }
    ]);
  });
});
```

- [ ] **Step 2: Run tests and confirm they fail**

Run:

```bash
npm run test -- src/features/budget/dashboard-model.test.ts
```

Expected: FAIL because `dashboard-model.ts` does not exist.

- [ ] **Step 3: Implement dashboard model**

Create `src/features/budget/dashboard-model.ts`:

```ts
import { calculateLicenseSchedule, getFiscalMonths } from "./budget-math";
import type { ContentLicense, LicensePayment } from "./budget-types";

export type DashboardModel = {
  fiscalYear: number;
  budgetCents: number;
  totalSpentCents: number;
  remainingCents: number;
  months: Array<{
    index: number;
    label: string;
    quarter: number;
    totalCents: number;
    payments: LicensePayment[];
  }>;
  providers: Array<{
    provider: string;
    totalCents: number;
  }>;
};

export function buildDashboardModel({
  fiscalYear,
  fiscalYearStartMonth,
  budgetCents,
  licenses
}: {
  fiscalYear: number;
  fiscalYearStartMonth: number;
  budgetCents: number;
  licenses: ContentLicense[];
}): DashboardModel {
  const payments = licenses.flatMap(calculateLicenseSchedule);
  const totalSpentCents = payments.reduce((total, payment) => total + payment.amountCents, 0);
  const fiscalMonths = getFiscalMonths(fiscalYear, fiscalYearStartMonth);

  const months = fiscalMonths.map((month) => {
    const monthPayments = payments
      .filter((payment) => payment.fiscalMonth === month.index)
      .sort((a, b) => a.title.localeCompare(b.title));

    return {
      index: month.index,
      label: month.label,
      quarter: month.quarter,
      totalCents: monthPayments.reduce((total, payment) => total + payment.amountCents, 0),
      payments: monthPayments
    };
  });

  const providerTotals = new Map<string, number>();
  payments.forEach((payment) => {
    providerTotals.set(payment.provider, (providerTotals.get(payment.provider) ?? 0) + payment.amountCents);
  });

  const providers = Array.from(providerTotals.entries())
    .map(([provider, totalCents]) => ({ provider, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);

  return {
    fiscalYear,
    budgetCents,
    totalSpentCents,
    remainingCents: budgetCents - totalSpentCents,
    months,
    providers
  };
}
```

- [ ] **Step 4: Run model tests**

Run:

```bash
npm run test -- src/features/budget/dashboard-model.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/budget/dashboard-model.ts src/features/budget/dashboard-model.test.ts
git commit -m "feat: derive dashboard budget summaries"
```

---

### Task 6: Add Server Actions and Dashboard Page

**Files:**
- Create: `src/features/budget/budget-actions.ts`
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Implement server actions**

Create `src/features/budget/budget-actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/currency";

const fiscalYearSchema = z.object({
  label: z.string().min(1),
  fiscalYear: z.coerce.number().int().min(2020).max(2100),
  fiscalYearStartMonth: z.coerce.number().int().min(1).max(12),
  budget: z.string().min(1)
});

const licenseSchema = z.object({
  fiscalYearId: z.string().uuid(),
  title: z.string().trim().min(1),
  provider: z.string().trim().min(1),
  installment: z.string().min(1),
  cadence: z.enum(["quarterly", "yearly"]),
  addedFiscalMonth: z.coerce.number().int().min(1).max(12),
  notes: z.string().trim().optional()
});

export async function createFiscalYear(formData: FormData) {
  const parsed = fiscalYearSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the fiscal year, start month, and budget fields.");
  }

  const budgetCents = dollarsToCents(parsed.data.budget);
  if (budgetCents === null) {
    throw new Error("Budget must be a positive dollar amount.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect("/login");
  }

  const { data: fiscalYear, error } = await supabase
    .from("fiscal_years")
    .insert({
      owner_id: userData.user.id,
      label: parsed.data.label,
      fiscal_year: parsed.data.fiscalYear,
      fiscal_year_start_month: parsed.data.fiscalYearStartMonth,
      budget_cents: budgetCents
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { error: memberError } = await supabase.from("fiscal_year_members").insert({
    fiscal_year_id: fiscalYear.id,
    user_id: userData.user.id,
    role: "owner"
  });

  if (memberError) {
    throw new Error(memberError.message);
  }

  revalidatePath("/dashboard");
}

export async function addContentLicense(formData: FormData) {
  const parsed = licenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the title, provider, payment amount, cadence, and added month.");
  }

  const installmentCents = dollarsToCents(parsed.data.installment);
  if (installmentCents === null) {
    throw new Error("Payment amount must be a positive dollar amount.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("content_licenses").insert({
    fiscal_year_id: parsed.data.fiscalYearId,
    title: parsed.data.title,
    provider: parsed.data.provider,
    installment_cents: installmentCents,
    cadence: parsed.data.cadence,
    added_fiscal_month: parsed.data.addedFiscalMonth,
    notes: parsed.data.notes || null
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}
```

- [ ] **Step 2: Implement dashboard data loading page**

Create `src/app/dashboard/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { BudgetDashboard } from "@/features/budget/components/budget-dashboard";
import { buildDashboardModel } from "@/features/budget/dashboard-model";
import type { ContentLicense } from "@/features/budget/budget-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: fiscalYears, error: fiscalYearsError } = await supabase
    .from("fiscal_years")
    .select("id,label,fiscal_year,fiscal_year_start_month,budget_cents")
    .order("fiscal_year", { ascending: false });

  if (fiscalYearsError) {
    throw new Error(fiscalYearsError.message);
  }

  const activeFiscalYear = fiscalYears?.[0] ?? null;

  if (!activeFiscalYear) {
    return <BudgetDashboard fiscalYear={null} model={null} licenses={[]} />;
  }

  const { data: licenseRows, error: licensesError } = await supabase
    .from("content_licenses")
    .select("id,title,provider,installment_cents,cadence,added_fiscal_month,notes")
    .eq("fiscal_year_id", activeFiscalYear.id)
    .order("created_at", { ascending: true });

  if (licensesError) {
    throw new Error(licensesError.message);
  }

  const licenses: ContentLicense[] = (licenseRows ?? []).map((license) => ({
    id: license.id,
    title: license.title,
    provider: license.provider,
    installmentCents: license.installment_cents,
    cadence: license.cadence,
    addedFiscalMonth: license.added_fiscal_month,
    notes: license.notes
  }));

  const model = buildDashboardModel({
    fiscalYear: activeFiscalYear.fiscal_year,
    fiscalYearStartMonth: activeFiscalYear.fiscal_year_start_month,
    budgetCents: activeFiscalYear.budget_cents,
    licenses
  });

  return <BudgetDashboard fiscalYear={activeFiscalYear} model={model} licenses={licenses} />;
}
```

- [ ] **Step 3: Run tests and build**

Run:

```bash
npm run test
```

Expected: PASS.

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/budget/budget-actions.ts src/app/dashboard/page.tsx
git commit -m "feat: connect dashboard to supabase data"
```

---

### Task 7: Build the Main Dashboard UI

**Files:**
- Create: `src/features/budget/components/budget-dashboard.tsx`
- Create: `src/features/budget/components/content-license-form.tsx`
- Create: `src/features/budget/components/fiscal-year-settings.tsx`
- Create: `src/features/budget/components/month-board.tsx`
- Create: `src/features/budget/components/summary-metrics.tsx`
- Create: `src/features/budget/components/provider-summary.tsx`
- Create: `src/features/budget/components/share-panel.tsx`

- [ ] **Step 1: Add fiscal year setup and content form components**

Create `src/features/budget/components/fiscal-year-settings.tsx`:

```tsx
import { CalendarDays } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface } from "@/components/ui/soft-surface";
import { createFiscalYear } from "../budget-actions";

const monthOptions = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" }
];

export function FiscalYearSettings() {
  return (
    <SoftSurface className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl soft-inset-deep">
          <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Start a Fiscal Year</h2>
          <p className="text-sm font-medium text-muted">Set the budget once, then add titles as they come in.</p>
        </div>
      </div>
      <form action={createFiscalYear} className="grid gap-4 md:grid-cols-2">
        <SoftInput label="Label" name="label" defaultValue="FY26 Licensing Budget" required />
        <SoftInput label="Fiscal year" name="fiscalYear" type="number" defaultValue="2026" required />
        <SoftSelect label="FY starts in" name="fiscalYearStartMonth" defaultValue="7" options={monthOptions} />
        <SoftInput label="Budget" name="budget" defaultValue="30000" required />
        <SoftButton type="submit" variant="primary" className="md:col-span-2">
          Create budget
        </SoftButton>
      </form>
    </SoftSurface>
  );
}
```

Create `src/features/budget/components/content-license-form.tsx`:

```tsx
import { Plus } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface } from "@/components/ui/soft-surface";
import { getFiscalMonths } from "../budget-math";
import { addContentLicense } from "../budget-actions";

type ContentLicenseFormProps = {
  fiscalYearId: string;
  fiscalYear: number;
  fiscalYearStartMonth: number;
};

export function ContentLicenseForm({
  fiscalYearId,
  fiscalYear,
  fiscalYearStartMonth
}: ContentLicenseFormProps) {
  const monthOptions = getFiscalMonths(fiscalYear, fiscalYearStartMonth).map((month) => ({
    label: month.label,
    value: String(month.index)
  }));

  return (
    <SoftSurface className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl soft-inset-deep">
          <Plus className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Add Content</h2>
          <p className="text-sm font-medium text-muted">The first quarterly payment is prorated automatically.</p>
        </div>
      </div>
      <form action={addContentLicense} className="grid gap-4">
        <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
        <SoftInput label="Title" name="title" required />
        <SoftInput label="Provider" name="provider" required />
        <div className="grid gap-4 md:grid-cols-3">
          <SoftInput label="Payment amount" name="installment" inputMode="decimal" required />
          <SoftSelect
            label="Cadence"
            name="cadence"
            defaultValue="quarterly"
            options={[
              { label: "Quarterly", value: "quarterly" },
              { label: "Yearly", value: "yearly" }
            ]}
          />
          <SoftSelect label="Added month" name="addedFiscalMonth" options={monthOptions} />
        </div>
        <SoftInput label="Notes" name="notes" />
        <SoftButton type="submit" variant="primary">
          Add title
        </SoftButton>
      </form>
    </SoftSurface>
  );
}
```

- [ ] **Step 2: Add summary and board components**

Create `src/features/budget/components/summary-metrics.tsx`:

```tsx
import { CircleDollarSign, PiggyBank, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { SoftSurface } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";

type SummaryMetricsProps = {
  model: DashboardModel;
};

export function SummaryMetrics({ model }: SummaryMetricsProps) {
  const metrics = [
    { label: "Budget", value: formatCurrency(model.budgetCents), icon: PiggyBank },
    { label: "Committed", value: formatCurrency(model.totalSpentCents), icon: CircleDollarSign },
    { label: "Remaining", value: formatCurrency(model.remainingCents), icon: TrendingDown }
  ];

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {metrics.map((metric) => (
        <SoftSurface key={metric.label} className="p-6">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl soft-inset-deep">
            <metric.icon className="h-5 w-5 text-accent" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold uppercase text-muted">{metric.label}</p>
          <p className="font-display text-3xl font-extrabold tracking-tight">{metric.value}</p>
        </SoftSurface>
      ))}
    </div>
  );
}
```

Create `src/features/budget/components/month-board.tsx`:

```tsx
import { formatCurrency } from "@/lib/currency";
import { SoftSurface } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";

type MonthBoardProps = {
  model: DashboardModel;
};

export function MonthBoard({ model }: MonthBoardProps) {
  const quarters = [1, 2, 3, 4].map((quarter) => ({
    quarter,
    months: model.months.filter((month) => month.quarter === quarter)
  }));

  return (
    <div className="grid gap-6">
      {quarters.map((quarter) => (
        <SoftSurface key={quarter.quarter} className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-extrabold tracking-tight">Quarter {quarter.quarter}</h2>
            <p className="rounded-full px-4 py-2 text-sm font-bold text-muted soft-inset-sm">
              {formatCurrency(quarter.months.reduce((total, month) => total + month.totalCents, 0))}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {quarter.months.map((month) => (
              <div key={month.index} className="min-h-48 rounded-2xl p-4 soft-inset">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-bold tracking-tight">{month.label}</h3>
                  <span className="text-sm font-bold text-muted">{formatCurrency(month.totalCents)}</span>
                </div>
                <div className="grid gap-3">
                  {month.payments.length === 0 ? (
                    <p className="text-sm font-medium text-muted">No payments</p>
                  ) : (
                    month.payments.map((payment) => (
                      <div key={`${payment.licenseId}-${payment.fiscalMonth}`} className="rounded-xl p-3 soft-raised-sm">
                        <p className="text-sm font-bold text-foreground">{payment.title}</p>
                        <p className="text-xs font-medium text-muted">{payment.provider}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-sm font-bold">{formatCurrency(payment.amountCents)}</span>
                          {payment.isProrated ? (
                            <span className="rounded-full px-2 py-1 text-xs font-bold text-accent soft-inset-sm">
                              prorated
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </SoftSurface>
      ))}
    </div>
  );
}
```

Create `src/features/budget/components/provider-summary.tsx`:

```tsx
import { formatCurrency } from "@/lib/currency";
import { SoftSurface } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";

type ProviderSummaryProps = {
  model: DashboardModel;
};

export function ProviderSummary({ model }: ProviderSummaryProps) {
  return (
    <SoftSurface className="p-6 md:p-8">
      <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight">Provider Summary</h2>
      <div className="grid gap-3">
        {model.providers.length === 0 ? (
          <p className="text-sm font-medium text-muted">Providers will appear here after content is added.</p>
        ) : (
          model.providers.map((provider) => (
            <div key={provider.provider} className="flex items-center justify-between gap-4 rounded-2xl p-4 soft-inset">
              <span className="font-bold">{provider.provider}</span>
              <span className="font-display text-lg font-extrabold">{formatCurrency(provider.totalCents)}</span>
            </div>
          ))
        )}
      </div>
    </SoftSurface>
  );
}
```

Create `src/features/budget/components/share-panel.tsx`:

```tsx
import { Users } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface } from "@/components/ui/soft-surface";

export function SharePanel() {
  return (
    <SoftSurface className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl soft-inset-deep">
          <Users className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Share</h2>
          <p className="text-sm font-medium text-muted">Invite your boss as an editor after his account exists.</p>
        </div>
      </div>
      <form className="grid gap-4">
        <SoftInput label="Email" name="email" type="email" disabled />
        <SoftSelect
          label="Role"
          name="role"
          disabled
          options={[
            { label: "Editor", value: "editor" },
            { label: "Viewer", value: "viewer" }
          ]}
        />
        <SoftButton disabled>Invite collaborator</SoftButton>
      </form>
    </SoftSurface>
  );
}
```

- [ ] **Step 3: Add dashboard shell**

Create `src/features/budget/components/budget-dashboard.tsx`:

```tsx
import { ContentLicenseForm } from "./content-license-form";
import { FiscalYearSettings } from "./fiscal-year-settings";
import { MonthBoard } from "./month-board";
import { ProviderSummary } from "./provider-summary";
import { SharePanel } from "./share-panel";
import { SummaryMetrics } from "./summary-metrics";
import type { ContentLicense } from "../budget-types";
import type { DashboardModel } from "../dashboard-model";

type FiscalYearRow = {
  id: string;
  label: string;
  fiscal_year: number;
  fiscal_year_start_month: number;
  budget_cents: number;
};

type BudgetDashboardProps = {
  fiscalYear: FiscalYearRow | null;
  model: DashboardModel | null;
  licenses: ContentLicense[];
};

export function BudgetDashboard({ fiscalYear, model }: BudgetDashboardProps) {
  return (
    <main className="min-h-screen px-5 py-6 md:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8">
        <header className="flex flex-col gap-4 py-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase text-muted">Internal Licensing</p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl">
              {fiscalYear?.label ?? "Licensing Budget"}
            </h1>
          </div>
          <p className="max-w-xl text-base font-medium leading-7 text-muted">
            Track titles, providers, payment cadence, quarter proration, committed spend, and remaining budget in one place.
          </p>
        </header>

        {!fiscalYear || !model ? (
          <FiscalYearSettings />
        ) : (
          <div className="grid gap-8">
            <SummaryMetrics model={model} />
            <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
              <div className="grid content-start gap-8">
                <ContentLicenseForm
                  fiscalYearId={fiscalYear.id}
                  fiscalYear={fiscalYear.fiscal_year}
                  fiscalYearStartMonth={fiscalYear.fiscal_year_start_month}
                />
                <ProviderSummary model={model} />
                <SharePanel />
              </div>
              <MonthBoard model={model} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/budget/components
git commit -m "feat: build soft ui budget dashboard"
```

---

### Task 8: Add Real Collaborator Invites

**Files:**
- Modify: `src/features/budget/budget-actions.ts`
- Modify: `src/features/budget/components/share-panel.tsx`
- Modify: `src/features/budget/components/budget-dashboard.tsx`

- [ ] **Step 1: Add collaborator server action**

Append to `src/features/budget/budget-actions.ts`:

```ts
const collaboratorSchema = z.object({
  fiscalYearId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["editor", "viewer"])
});

export async function addCollaborator(formData: FormData) {
  const parsed = collaboratorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid collaborator user id and role.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("fiscal_year_members").upsert({
    fiscal_year_id: parsed.data.fiscalYearId,
    user_id: parsed.data.userId,
    role: parsed.data.role
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}
```

- [ ] **Step 2: Wire the share panel**

Replace `src/features/budget/components/share-panel.tsx` with:

```tsx
import { Users } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface } from "@/components/ui/soft-surface";
import { addCollaborator } from "../budget-actions";

type SharePanelProps = {
  fiscalYearId: string;
};

export function SharePanel({ fiscalYearId }: SharePanelProps) {
  return (
    <SoftSurface className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl soft-inset-deep">
          <Users className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Share</h2>
          <p className="text-sm font-medium text-muted">Add the Supabase user id for your boss after he signs in once.</p>
        </div>
      </div>
      <form action={addCollaborator} className="grid gap-4">
        <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
        <SoftInput label="Collaborator user id" name="userId" required />
        <SoftSelect
          label="Role"
          name="role"
          defaultValue="editor"
          options={[
            { label: "Editor", value: "editor" },
            { label: "Viewer", value: "viewer" }
          ]}
        />
        <SoftButton type="submit">Add collaborator</SoftButton>
      </form>
    </SoftSurface>
  );
}
```

In `src/features/budget/components/budget-dashboard.tsx`, replace:

```tsx
<SharePanel />
```

with:

```tsx
<SharePanel fiscalYearId={fiscalYear.id} />
```

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/budget/budget-actions.ts src/features/budget/components/share-panel.tsx src/features/budget/components/budget-dashboard.tsx
git commit -m "feat: allow fiscal year collaborators"
```

---

### Task 9: Add Documentation and Verification

**Files:**
- Create: `README.md`
- Create: `tests/e2e/budget-flow.spec.ts`

- [ ] **Step 1: Add README**

Create `README.md`:

```md
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

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:5173`.

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
```

- [ ] **Step 2: Add Playwright smoke test**

Create `tests/e2e/budget-flow.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("login page renders when not authenticated", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Licensing Budget" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});
```

- [ ] **Step 3: Run verification**

Run:

```bash
npm run test
```

Expected: PASS.

Run:

```bash
npm run build
```

Expected: PASS.

Run:

```bash
npm run test:e2e
```

Expected: PASS if dev server starts and Supabase env vars are configured. If Supabase env vars are not configured, expected result is a clear runtime env error; document the missing env vars in the final handoff.

- [ ] **Step 4: Visual/browser QA**

Run:

```bash
npm run dev
```

Open `http://127.0.0.1:5173` and verify:

- Login page uses the `#E0E5EC` background.
- Sign-in card is raised and not white.
- Inputs are inset.
- Focus rings are visible on email input and button.
- Dashboard page redirects unauthenticated users to login.
- Mobile viewport does not overlap text or controls.

- [ ] **Step 5: Commit**

```bash
git add README.md tests/e2e/budget-flow.spec.ts
git commit -m "docs: document budget dashboard setup"
```

---

### Task 10: Deploy on Vercel

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Confirm local verification is complete**

Run:

```bash
npm run test
```

Expected: PASS.

Run:

```bash
npm run build
```

Expected: PASS.

Run:

```bash
npm run test:e2e
```

Expected: PASS with Supabase env vars configured.

- [ ] **Step 2: Link or create the Vercel project**

Run:

```bash
npx vercel link
```

Expected: Vercel links the local project to the correct Vercel project. Choose a new project if this budget dashboard does not already exist in Vercel.

- [ ] **Step 3: Add Supabase environment variables to Vercel**

Run:

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add NEXT_PUBLIC_SUPABASE_URL preview
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
npx vercel env add SUPABASE_SERVICE_ROLE_KEY preview
```

Expected: each command prompts for the matching value and confirms it was saved.

- [ ] **Step 4: Configure Supabase auth redirect URLs**

In Supabase dashboard, open Authentication settings and add:

```text
https://<vercel-production-domain>/dashboard
https://*.vercel.app/dashboard
```

Expected: Supabase magic links can redirect users back to the deployed dashboard.

- [ ] **Step 5: Deploy**

Run:

```bash
npx vercel --prod
```

Expected: production deployment succeeds and prints the production URL.

- [ ] **Step 6: Verify deployed app**

Open the production URL and verify:

- Login page renders with Soft UI styling.
- Magic-link sign-in works for Matt.
- Fiscal year creation works.
- Adding quarterly content in month 1 records full payment for that quarter.
- Adding quarterly content in month 2 records two-thirds payment for that quarter.
- Adding quarterly content in month 3 records one-third payment for that quarter.
- Later quarters show full installment payments.
- Yearly content appears once in the added month.
- Boss account can be added as editor after first sign-in.

- [ ] **Step 7: Commit deployment docs**

```bash
git add README.md
git commit -m "docs: add vercel deployment steps"
```

---

## Self-Review

**Spec coverage:**

- Add content titles: covered by Task 7 content form and Task 6 server action.
- Add provider: covered by Task 7 form and Task 6 persistence.
- Add licensing fee in a month/quarter: covered by `addedFiscalMonth`, month board, and tested budget math.
- Quarterly proration: covered by Task 3 tests and implementation.
- Later quarterly payments: covered by Task 3 schedule generation.
- Yearly cadence: covered by Task 3 tests and form cadence select.
- Set fiscal year: covered by Task 7 fiscal-year settings.
- Set budget: covered by Task 7 fiscal-year settings.
- Automatically update budget: covered by Task 5 dashboard model and Task 7 summary metrics.
- Share with boss and edit: covered by Task 4 Supabase RLS and Task 8 collaborators.
- Vercel hosting: covered by Task 10 deployment.
- Simple and intuitive: covered by the single dashboard screen, add form, KPI wells, month board, and provider summary.
- Design system: covered by Task 2 centralized tokens and Task 7 component usage.

**Placeholder scan:** No red-flag placeholder instructions or unspecified implementation steps remain. The plan has open decisions only where defaults are explicitly defined.

**Type consistency:** The plan consistently uses `installmentCents`, `addedFiscalMonth`, `cadence`, `ContentLicense`, `LicensePayment`, and `DashboardModel` across tests, implementation, and UI.

## Teaching Notes for Matt

**Simple layer:** The key change from the spreadsheet to the app is that the spreadsheet mixes three jobs in one grid: data entry, calculation, and presentation. The app separates those jobs. You enter titles in a form, tested code calculates the general proration schedule, and the dashboard displays the results.

**Technical layer:** The important craft pattern is a pure domain layer. Budget math lives in `budget-math.ts` with tests before it touches Supabase or React. That means the most important business rule can be trusted independently of the UI.

**How to recognize this next time:** If a spreadsheet contains a repeated business rule, that rule should usually become a named function with tests before becoming an app. One-off formulas for specific rows should usually stay historical evidence, not product logic.

**Craft takeaway:** Put business rules where they can be tested without the browser, the database, or the user interface.
