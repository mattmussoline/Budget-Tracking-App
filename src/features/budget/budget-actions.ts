"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { allowedEmailDomainText, isAllowedWorkEmail } from "@/lib/auth/domain-access";
import { requireInternalSession } from "@/lib/auth/internal-auth-server";
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

const collaboratorSchema = z.object({
  email: z.string().email()
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

const fiscalYearIdSchema = z.object({
  fiscalYearId: z.string().uuid()
});

const providerColorSchema = z.object({
  fiscalYearId: z.string().uuid(),
  provider: z.string().trim().min(1),
  colorKey: z.enum(providerColorOptions.map((color) => color.key) as [string, ...string[]])
});

export async function createFiscalYear(formData: FormData) {
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

  const session = await requireInternalSession();
  const userId = await ensureSupabaseUserId(admin, session.email);

  const { data: fiscalYear, error } = await admin
    .from("fiscal_years")
    .insert({
      owner_id: userId,
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
  const admin = createSupabaseAdminClient();
  if (!admin) {
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

  await requireInternalSession();

  const { error } = await admin.from("content_licenses").insert({
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

export async function updateFiscalYear(formData: FormData) {
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

  await requireInternalSession();

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

export async function pinFiscalYear(formData: FormData) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const parsed = fiscalYearIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid fiscal year to pin.");
  }

  await requireInternalSession();

  const { error } = await admin.rpc("pin_fiscal_year", {
    target_fiscal_year_id: parsed.data.fiscalYearId
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateFiscalYearPages();
}

export async function deleteFiscalYear(formData: FormData) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const parsed = fiscalYearIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid fiscal year to delete.");
  }

  await requireInternalSession();

  const { data: fiscalYear, error: findError } = await admin
    .from("fiscal_years")
    .select("id")
    .eq("id", parsed.data.fiscalYearId)
    .maybeSingle();

  if (findError || !fiscalYear) {
    throw new Error(findError?.message ?? "Could not find that fiscal year.");
  }

  const { error } = await admin.from("fiscal_years").delete().eq("id", parsed.data.fiscalYearId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateFiscalYearPages();
  redirect("/dashboard");
}

export async function updateContentLicense(formData: FormData) {
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

  await requireInternalSession();

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
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const parsed = deleteLicenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid content title to delete.");
  }

  await requireInternalSession();

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

export async function addCollaborator(formData: FormData) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const parsed = collaboratorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid collaborator email and role.");
  }

  if (!isAllowedWorkEmail(parsed.data.email)) {
    throw new Error(`Collaborators must use ${allowedEmailDomainText()} email addresses.`);
  }

  const session = await requireInternalSession();
  const email = parsed.data.email.trim().toLowerCase();

  const { error } = await admin.from("app_access_invites").upsert({
    email,
    invited_by_email: session.email
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function removeCollaborator(formData: FormData) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const parsed = collaboratorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid collaborator email.");
  }

  const session = await requireInternalSession();
  const email = parsed.data.email.trim().toLowerCase();

  if (email === session.email) {
    throw new Error("You cannot remove your own access while signed in.");
  }

  const { error } = await admin.from("app_access_invites").delete().eq("email", email);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function updateProviderColor(formData: FormData) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const parsed = providerColorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid provider color.");
  }

  await requireInternalSession();

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

async function ensureSupabaseUserId(admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>, email: string) {
  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) {
    throw new Error(usersError.message);
  }

  const existingUser = usersData.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return existingUser.id;
  }

  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true
  });

  if (createError || !createdUser.user) {
    throw new Error(createError?.message ?? "Could not prepare that internal user.");
  }

  return createdUser.user.id;
}

function revalidateFiscalYearPages() {
  revalidatePath("/dashboard");
  revalidatePath("/roadmap");
  revalidatePath("/content-review");
}
