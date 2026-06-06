"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { internalUserIdFromEmail, requireInternalSession } from "@/lib/auth/internal-auth";
import { dollarsToCents } from "@/lib/currency";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { providerColorOptions } from "./provider-colors";

const fiscalYearSchema = z.object({
  label: z.string().min(1),
  fiscalYear: z.coerce.number().int().min(2020).max(2100),
  fiscalYearStartMonth: z.coerce.number().int().min(1).max(12),
  budget: z.string().min(1)
});

const licenseSchema = z.object({
  fiscalYearId: z.string().min(1),
  title: z.string().trim().min(1),
  provider: z.string().trim().min(1),
  installment: z.string().min(1),
  cadence: z.enum(["quarterly", "yearly"]),
  addedFiscalMonth: z.coerce.number().int().min(1).max(12),
  notes: z.string().trim().optional()
});

const createLicenseSchema = licenseSchema
  .extend({
    contentType: z.enum(["standalone", "series"]),
    episodeCount: z.string().trim().optional()
  })
  .superRefine((license, context) => {
    if (license.contentType !== "series") {
      return;
    }

    const episodeCount = Number(license.episodeCount);
    if (!Number.isInteger(episodeCount) || episodeCount < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Series content needs a positive episode count.",
        path: ["episodeCount"]
      });
    }
  });

const updateFiscalYearSchema = fiscalYearSchema.extend({
  fiscalYearId: z.string().uuid()
});

const updateLicenseSchema = licenseSchema.extend({
  licenseId: z.string().uuid()
});

const deleteLicenseSchema = z.object({
  licenseId: z.string().uuid()
});

const providerColorSchema = z.object({
  fiscalYearId: z.string().uuid(),
  provider: z.string().trim().min(1),
  colorKey: z.enum(providerColorOptions.map((color) => color.key) as [string, ...string[]])
});

export async function createFiscalYear(formData: FormData) {
  const session = await requireInternalSession();
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const parsed = fiscalYearSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the fiscal year, start month, and budget fields.");
  }

  const budgetCents = dollarsToCents(parsed.data.budget);
  if (budgetCents === null) {
    throw new Error("Budget must be a positive dollar amount.");
  }

  const { data: fiscalYear, error } = await admin
    .from("fiscal_years")
    .insert({
      owner_id: internalUserIdFromEmail(session.email),
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

  revalidatePath("/dashboard");
  redirect(`/dashboard?fy=${fiscalYear.id}`);
}

export async function addContentLicense(formData: FormData) {
  await requireInternalSession();
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const parsed = createLicenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the title, provider, type, episode count, payment amount, cadence, and added month.");
  }

  const installmentCents = dollarsToCents(parsed.data.installment);
  if (installmentCents === null) {
    throw new Error("Payment amount must be a positive dollar amount.");
  }
  const episodeCount =
    parsed.data.contentType === "series" && parsed.data.episodeCount ? Number(parsed.data.episodeCount) : null;

  const { error } = await admin.from("content_licenses").insert({
    fiscal_year_id: parsed.data.fiscalYearId,
    title: parsed.data.title,
    provider: parsed.data.provider,
    content_type: parsed.data.contentType,
    episode_count: episodeCount,
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

export async function updateFiscalYear(formData: FormData) {
  await requireInternalSession();
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const parsed = updateFiscalYearSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the fiscal year, start month, and budget fields.");
  }

  const budgetCents = dollarsToCents(parsed.data.budget);
  if (budgetCents === null) {
    throw new Error("Budget must be a positive dollar amount.");
  }

  const { error } = await admin
    .from("fiscal_years")
    .update({
      label: parsed.data.label,
      fiscal_year: parsed.data.fiscalYear,
      fiscal_year_start_month: parsed.data.fiscalYearStartMonth,
      budget_cents: budgetCents
    })
    .eq("id", parsed.data.fiscalYearId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function updateContentLicense(formData: FormData) {
  await requireInternalSession();
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const parsed = updateLicenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the title, provider, payment amount, cadence, and added month.");
  }

  const installmentCents = dollarsToCents(parsed.data.installment);
  if (installmentCents === null) {
    throw new Error("Payment amount must be a positive dollar amount.");
  }

  const { error } = await admin
    .from("content_licenses")
    .update({
      title: parsed.data.title,
      provider: parsed.data.provider,
      installment_cents: installmentCents,
      cadence: parsed.data.cadence,
      added_fiscal_month: parsed.data.addedFiscalMonth,
      notes: parsed.data.notes || null
    })
    .eq("id", parsed.data.licenseId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function deleteContentLicense(formData: FormData) {
  await requireInternalSession();
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const parsed = deleteLicenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid content title to delete.");
  }

  const { data: license, error: licenseError } = await admin
    .from("content_licenses")
    .select("fiscal_year_id")
    .eq("id", parsed.data.licenseId)
    .single();

  if (licenseError || !license) {
    throw new Error("Could not find that content title.");
  }

  const { error } = await admin.from("content_licenses").delete().eq("id", parsed.data.licenseId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function updateProviderColor(formData: FormData) {
  await requireInternalSession();
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const parsed = providerColorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid provider color.");
  }

  const { error } = await admin.from("provider_color_overrides").upsert({
    fiscal_year_id: parsed.data.fiscalYearId,
    provider: parsed.data.provider,
    color_key: parsed.data.colorKey
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}
