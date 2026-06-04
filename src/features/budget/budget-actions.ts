"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dollarsToCents } from "@/lib/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

const collaboratorSchema = z.object({
  fiscalYearId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["editor", "viewer"])
});

export async function createFiscalYear(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
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

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect("/login");
  }

  const { error } = await supabase
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

  revalidatePath("/dashboard");
}

export async function addContentLicense(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return;
  }

  const parsed = licenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the title, provider, payment amount, cadence, and added month.");
  }

  const installmentCents = dollarsToCents(parsed.data.installment);
  if (installmentCents === null) {
    throw new Error("Payment amount must be a positive dollar amount.");
  }

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

export async function addCollaborator(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return;
  }

  const parsed = collaboratorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid collaborator user id and role.");
  }

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
