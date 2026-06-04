"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { allowedEmailDomainText, isAllowedWorkEmail } from "@/lib/auth/domain-access";
import { dollarsToCents } from "@/lib/currency";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  fiscalYearId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["editor", "viewer"])
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
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
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

  const { data: fiscalYear, error } = await admin
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
  redirect(`/dashboard?fy=${fiscalYear.id}`);
}

export async function addContentLicense(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
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

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect("/login");
  }

  const canEdit = await hasFiscalYearRole(admin, parsed.data.fiscalYearId, userData.user.id, ["owner", "editor"]);
  if (!canEdit) {
    throw new Error("You do not have permission to add content to this fiscal year.");
  }

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
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
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

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect("/login");
  }

  const canEdit = await hasFiscalYearRole(admin, parsed.data.fiscalYearId, userData.user.id, ["owner", "editor"]);
  if (!canEdit) {
    throw new Error("You do not have permission to edit this fiscal year.");
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
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
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

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect("/login");
  }

  const canEdit = await hasFiscalYearRole(admin, parsed.data.fiscalYearId, userData.user.id, ["owner", "editor"]);
  if (!canEdit) {
    throw new Error("You do not have permission to edit this content.");
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
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    return;
  }

  const parsed = deleteLicenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid content title to delete.");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect("/login");
  }

  const { data: license, error: licenseError } = await admin
    .from("content_licenses")
    .select("fiscal_year_id")
    .eq("id", parsed.data.licenseId)
    .single();

  if (licenseError || !license) {
    throw new Error("Could not find that content title.");
  }

  const canEdit = await hasFiscalYearRole(admin, license.fiscal_year_id, userData.user.id, ["owner", "editor"]);
  if (!canEdit) {
    throw new Error("You do not have permission to delete this content.");
  }

  const { error } = await admin.from("content_licenses").delete().eq("id", parsed.data.licenseId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function addCollaborator(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    return;
  }

  const parsed = collaboratorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid collaborator email and role.");
  }

  if (!isAllowedWorkEmail(parsed.data.email)) {
    throw new Error(`Collaborators must use ${allowedEmailDomainText()} email addresses.`);
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect("/login");
  }

  const isOwner = await hasFiscalYearRole(admin, parsed.data.fiscalYearId, userData.user.id, ["owner"]);
  if (!isOwner) {
    throw new Error("Only the fiscal year owner can add collaborators.");
  }

  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) {
    throw new Error(usersError.message);
  }

  const collaborator = usersData.users.find((user) => user.email?.toLowerCase() === parsed.data.email.toLowerCase());
  if (!collaborator) {
    throw new Error("That person needs to sign in with Outlook once before you can add them.");
  }

  const { error } = await admin.from("fiscal_year_members").upsert({
    fiscal_year_id: parsed.data.fiscalYearId,
    user_id: collaborator.id,
    role: parsed.data.role
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function updateProviderColor(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    return;
  }

  const parsed = providerColorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid provider color.");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect("/login");
  }

  const canEdit = await hasFiscalYearRole(admin, parsed.data.fiscalYearId, userData.user.id, ["owner", "editor"]);
  if (!canEdit) {
    throw new Error("You do not have permission to change provider colors.");
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

async function hasFiscalYearRole(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  fiscalYearId: string,
  userId: string,
  roles: string[]
) {
  const { data: membership, error } = await admin
    .from("fiscal_year_members")
    .select("role")
    .eq("fiscal_year_id", fiscalYearId)
    .eq("user_id", userId)
    .single();

  return !error && membership ? roles.includes(membership.role) : false;
}
