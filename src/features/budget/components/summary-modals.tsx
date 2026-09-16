"use client";

import { Pin, Trash2, UserPlus, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { cn } from "@/components/ui/soft-surface";
import { formatCurrency } from "@/lib/currency";
import { monthNames } from "@/lib/months";
import {
  addCollaborator,
  addContentLicense,
  createFiscalYear,
  deleteFiscalYear,
  pinFiscalYear,
  removeCollaborator,
  updateFiscalYear
} from "../budget-actions";
import { budgetSourceOptions } from "../budget-source";

export type FiscalYearRow = {
  id: string;
  label: string;
  fiscal_year: number;
  fiscal_year_start_month: number;
  budget_cents: number;
  is_pinned: boolean;
};

type Option = { label: string; value: string };

const monthStartOptions: Option[] = monthNames.map((name, index) => ({ label: name, value: String(index + 1) }));
const cadenceOptions: Option[] = [
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" }
];

/**
 * Every dashboard modal is the same box, centred in the viewport rather than
 * pinned near the top — a short invite form shouldn't sit under the header with
 * the rest of the screen empty below it. Tall bodies scroll inside the panel so
 * the page behind never moves.
 */
export function SummaryModal({
  title,
  description,
  onClose,
  width = "560px",
  children
}: {
  title: string;
  description: string;
  onClose: () => void;
  width?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    panelRef.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[rgba(15,23,35,0.45)] p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width: `min(${width}, 100%)` }}
        className="max-h-[calc(100vh-3rem)] overflow-y-auto rounded-soft border border-hairline bg-panel-warm shadow-[0_18px_48px_rgba(0,0,0,0.20)]"
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-hairline bg-panel-warm px-6 py-4">
          <div className="grid min-w-0 gap-0.5">
            <h2 className="font-display text-[22px] leading-tight">{title}</h2>
            <p className="text-xs text-muted [text-wrap:pretty]">{description}</p>
          </div>
          <SoftButton
            onClick={onClose}
            variant="secondary"
            aria-label="Close"
            className="min-h-8 shrink-0 px-2.5 py-1 text-xs text-muted"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Close
          </SoftButton>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function AddContentModal({
  fiscalYear,
  fiscalYears,
  monthOptions,
  providerOptions,
  isDemo,
  onClose
}: {
  fiscalYear: FiscalYearRow;
  fiscalYears: FiscalYearRow[];
  monthOptions: Option[];
  providerOptions: string[];
  isDemo?: boolean;
  onClose: () => void;
}) {
  const [cadence, setCadence] = useState("");

  return (
    <SummaryModal title="Add content" description="Track a new licensed title against a budget line." onClose={onClose}>
      <form action={addContentLicense} className="grid gap-3">
        <SoftInput label="Title" name="title" placeholder="Jesus Thirsts" required disabled={isDemo} surface="white" />
        <SoftInput
          label="Provider"
          name="provider"
          list="add-content-provider-options"
          placeholder="Provider name"
          required
          disabled={isDemo}
          surface="white"
        />
        <datalist id="add-content-provider-options">
          {providerOptions.map((provider) => (
            <option key={provider} value={provider} />
          ))}
        </datalist>
        <div className="grid gap-3 sm:grid-cols-2">
          <SoftInput
            label="Payment amount"
            name="installment"
            inputMode="decimal"
            placeholder="1200"
            required
            disabled={isDemo}
            surface="white"
          />
          <SoftSelect
            label="Cadence"
            name="cadence"
            value={cadence}
            onChange={(event) => setCadence(event.target.value)}
            placeholder="Select"
            options={cadenceOptions}
            required
            disabled={isDemo}
            surface="white"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SoftSelect
            label="Added month"
            name="addedFiscalMonth"
            defaultValue=""
            placeholder="Select"
            options={monthOptions}
            required
            disabled={isDemo}
            surface="white"
          />
          <SoftSelect
            label="Budget line"
            name="budgetSource"
            defaultValue="misc_licensing"
            options={[...budgetSourceOptions]}
            required
            disabled={isDemo}
            surface="white"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SoftInput
            label="Runtime (minutes)"
            name="minutes"
            inputMode="numeric"
            placeholder="92"
            required
            disabled={isDemo}
            surface="white"
          />
          <SoftSelect
            label="Fiscal year"
            name="fiscalYearId"
            defaultValue={fiscalYear.id}
            options={fiscalYears.map((year) => ({ label: year.label, value: year.id }))}
            required
            disabled={isDemo}
            surface="white"
          />
        </div>
        <SoftInput label="Notes" name="notes" placeholder="Optional context" disabled={isDemo} surface="white" />
        {cadence === "quarterly" ? (
          <p className="text-[11.5px] text-guild-gold-ink">
            Quarterly only: the first payment is prorated automatically from the added month.
          </p>
        ) : null}
        <SoftButton type="submit" variant="primary" className="mt-1 w-full" disabled={isDemo}>
          Add title
        </SoftButton>
      </form>
    </SummaryModal>
  );
}

export function FiscalYearModal({
  fiscalYear,
  fiscalYears,
  routePrefix,
  isDemo,
  onClose
}: {
  fiscalYear: FiscalYearRow;
  fiscalYears: FiscalYearRow[];
  routePrefix: "" | "/demo";
  isDemo?: boolean;
  onClose: () => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const nextFiscalYear = Math.max(new Date().getFullYear(), ...fiscalYears.map((year) => year.fiscal_year)) + 1;

  return (
    <SummaryModal
      title="Add or edit fiscal year"
      description="Label, fiscal calendar, and the misc licensing budget."
      onClose={onClose}
    >
      <div className="grid gap-4">
        <nav className="flex flex-wrap items-center gap-1.5" aria-label="Fiscal year budgets">
          {fiscalYears.map((year) => (
            <a
              key={year.id}
              href={`${routePrefix}/dashboard?fy=${year.id}`}
              aria-current={year.id === fiscalYear.id ? "page" : undefined}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-colors",
                year.id === fiscalYear.id
                  ? "border-formed-blue bg-formed-blue-soft text-formed-blue"
                  : "border-hairline bg-panel text-foreground hover:border-hairline-strong"
              )}
            >
              {year.is_pinned ? <Pin className="h-3.5 w-3.5" aria-label="Pinned default" /> : null}
              {year.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => setIsCreating((open) => !open)}
            disabled={isDemo}
            aria-expanded={isCreating}
            className="inline-flex min-h-9 items-center rounded-lg border border-dashed border-hairline-strong bg-panel px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-formed-blue disabled:cursor-not-allowed disabled:opacity-60"
          >
            + New fiscal year
          </button>
        </nav>

        {isCreating ? (
          <form action={createFiscalYear} className="grid gap-3 rounded-lg border border-hairline bg-panel p-4 sm:grid-cols-2">
            <SoftInput
              label="Label"
              name="label"
              defaultValue={`FY${nextFiscalYear}`}
              required
              disabled={isDemo}
              surface="white"
            />
            <SoftInput
              label="Fiscal year"
              name="fiscalYear"
              type="number"
              defaultValue={nextFiscalYear}
              required
              disabled={isDemo}
              surface="white"
            />
            <SoftSelect
              label="FY starts in"
              name="fiscalYearStartMonth"
              defaultValue={String(fiscalYear.fiscal_year_start_month)}
              options={monthStartOptions}
              disabled={isDemo}
              surface="white"
            />
            <SoftInput label="Budget" name="budget" defaultValue="40000" required disabled={isDemo} surface="white" />
            <SoftButton type="submit" variant="primary" className="w-full sm:col-span-2" disabled={isDemo}>
              Create fiscal year
            </SoftButton>
          </form>
        ) : null}

        <form action={updateFiscalYear} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="fiscalYearId" value={fiscalYear.id} />
          <SoftInput label="Label" name="label" defaultValue={fiscalYear.label} required disabled={isDemo} surface="white" />
          <SoftInput
            label="Fiscal year"
            name="fiscalYear"
            type="number"
            defaultValue={fiscalYear.fiscal_year}
            required
            disabled={isDemo}
            surface="white"
          />
          <SoftSelect
            label="FY starts in"
            name="fiscalYearStartMonth"
            defaultValue={String(fiscalYear.fiscal_year_start_month)}
            options={monthStartOptions}
            disabled={isDemo}
            surface="white"
          />
          <SoftInput
            label="Budget"
            name="budget"
            defaultValue={String(fiscalYear.budget_cents / 100)}
            placeholder={formatCurrency(4000000)}
            required
            disabled={isDemo}
            surface="white"
          />
          <SoftButton type="submit" variant="primary" className="w-full sm:col-span-2" disabled={isDemo}>
            Save fiscal year
          </SoftButton>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-4">
          <form action={pinFiscalYear}>
            <input type="hidden" name="fiscalYearId" value={fiscalYear.id} />
            <SoftButton type="submit" variant="secondary" className="min-h-9 text-xs" disabled={isDemo || fiscalYear.is_pinned}>
              <Pin className="h-3.5 w-3.5" aria-hidden="true" />
              {fiscalYear.is_pinned ? "Pinned as default" : "Pin as default"}
            </SoftButton>
          </form>
          <form
            action={deleteFiscalYear}
            onSubmit={(event) => {
              const confirmed = window.confirm(
                `Permanently delete ${fiscalYear.label}? This will permanently delete its budget, titles, roadmap items, ongoing series, content-review items, memberships, and provider settings. This cannot be undone.`
              );

              if (!confirmed) event.preventDefault();
            }}
          >
            <input type="hidden" name="fiscalYearId" value={fiscalYear.id} />
            <SoftButton type="submit" variant="danger" className="min-h-9 text-xs" disabled={isDemo}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete budget
            </SoftButton>
          </form>
        </div>
      </div>
    </SummaryModal>
  );
}

export function InviteModal({
  allowedEmails,
  currentUserEmail,
  isDemo,
  onClose
}: {
  allowedEmails: string[];
  currentUserEmail?: string;
  isDemo?: boolean;
  onClose: () => void;
}) {
  return (
    <SummaryModal
      title="Invite a teammate"
      description={
        isDemo ? "Connect Supabase to manage who can sign in." : "They sign in with the work email you enter here."
      }
      onClose={onClose}
      width="480px"
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">Current access</span>
          {allowedEmails.length > 0 ? (
            <ul className="grid gap-2">
              {allowedEmails.map((email) => {
                const isCurrentUser = email === currentUserEmail;

                return (
                  <li key={email} className="flex min-w-0 items-center justify-between gap-2">
                    <span className="grid min-w-0 gap-px">
                      <span className="truncate text-[12.5px]">{email}</span>
                      <span className="text-[11px] text-faint">{isCurrentUser ? "You · owner" : "Active"}</span>
                    </span>
                    <form
                      action={removeCollaborator}
                      onSubmit={(event) => {
                        if (!window.confirm(`Remove ${email} from app access?`)) event.preventDefault();
                      }}
                    >
                      <input type="hidden" name="email" value={email} />
                      <button
                        type="submit"
                        disabled={isDemo || isCurrentUser}
                        title={isCurrentUser ? "You cannot remove your own access while signed in." : "Remove access"}
                        className="shrink-0 text-[11.5px] font-semibold text-danger transition-colors hover:underline disabled:cursor-default disabled:text-faint disabled:no-underline"
                      >
                        {isCurrentUser ? "—" : "Remove"}
                        <span className="sr-only"> {email}</span>
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-faint">No collaborators have been added yet.</p>
          )}
        </div>
        <form action={addCollaborator} className="grid gap-2.5 border-t border-hairline pt-4">
          <SoftInput
            label="Work email"
            name="email"
            type="email"
            placeholder="name@augustineinstitute.org"
            required
            disabled={isDemo}
            surface="white"
          />
          <SoftButton type="submit" variant="primary" className="w-full" disabled={isDemo}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Send invite
          </SoftButton>
        </form>
      </div>
    </SummaryModal>
  );
}
