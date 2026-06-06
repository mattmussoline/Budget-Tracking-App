"use client";

import { useState } from "react";
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
  providerOptions: string[];
  isDemo?: boolean;
};

export function ContentLicenseForm({
  fiscalYearId,
  fiscalYear,
  fiscalYearStartMonth,
  providerOptions,
  isDemo
}: ContentLicenseFormProps) {
  const monthOptions = getFiscalMonths(fiscalYear, fiscalYearStartMonth).map((month) => ({
    label: month.label,
    value: String(month.index)
  }));
  const [contentType, setContentType] = useState("standalone");
  const [amount, setAmount] = useState("");
  const fieldClassName = "bg-white";
  const formatAmount = () => {
    const parsedAmount = Number(amount.replace(/[$,]/g, "").trim());
    if (!Number.isFinite(parsedAmount) || amount.trim() === "") {
      return;
    }

    setAmount(
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(parsedAmount)
    );
  };

  return (
    <SoftSurface className="bg-blue-50 p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-500">
          <Plus className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Add Content</h2>
          <p className="text-sm font-medium text-muted">The first quarterly payment is prorated automatically.</p>
        </div>
      </div>
      <form action={addContentLicense} className="grid gap-4">
        <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
        <SoftInput label="Title" name="title" placeholder="Jesus Thirsts" required disabled={isDemo} className={fieldClassName} />
        <SoftInput
          label="Provider"
          name="provider"
          list="provider-options"
          placeholder="Provider name"
          required
          disabled={isDemo}
          className={fieldClassName}
        />
        <datalist id="provider-options">
          {providerOptions.map((provider) => (
            <option key={provider} value={provider} />
          ))}
        </datalist>
        <div className="grid gap-4 md:grid-cols-2">
          <SoftSelect
            label="Type"
            name="contentType"
            value={contentType}
            required
            disabled={isDemo}
            className={fieldClassName}
            onChange={(event) => setContentType(event.currentTarget.value)}
            options={[
              { label: "Standalone", value: "standalone" },
              { label: "Series", value: "series" }
            ]}
          />
          {contentType === "series" ? (
            <SoftInput
              label="Episode Count"
              name="episodeCount"
              type="number"
              min={1}
              step={1}
              placeholder="8"
              required
              disabled={isDemo}
              className={fieldClassName}
            />
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <SoftInput
            label="Amount"
            name="installment"
            inputMode="decimal"
            placeholder="$1,200"
            value={amount}
            onBlur={formatAmount}
            onChange={(event) => setAmount(event.currentTarget.value)}
            required
            disabled={isDemo}
            className={fieldClassName}
          />
          <SoftSelect
            label="Cadence"
            name="cadence"
            defaultValue=""
            placeholder="Select"
            required
            disabled={isDemo}
            className={fieldClassName}
            options={[
              { label: "Quarterly", value: "quarterly" },
              { label: "Yearly", value: "yearly" }
            ]}
          />
          <SoftSelect
            label="Added month"
            name="addedFiscalMonth"
            defaultValue=""
            placeholder="Select"
            options={monthOptions}
            required
            disabled={isDemo}
            className={fieldClassName}
          />
        </div>
        <SoftInput label="Notes" name="notes" placeholder="Optional context" disabled={isDemo} className={fieldClassName} />
        <SoftButton type="submit" variant="primary" disabled={isDemo}>
          Add title
        </SoftButton>
      </form>
    </SoftSurface>
  );
}
