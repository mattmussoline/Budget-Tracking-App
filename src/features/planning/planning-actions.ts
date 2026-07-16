"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireInternalSession } from "@/lib/auth/internal-auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { budgetSourceOptions } from "@/features/budget/budget-source";
import { contentUploadTaskExists, createContentUploadTask } from "./clickup";
import { dollarsToOptionalCents } from "./planning-model";
import { ROADMAP_STATUSES, type ContentReviewItem, type ReviewStatus } from "./planning-types";

const roadmapStatusSchema = z.enum(ROADMAP_STATUSES);
const reviewStatusSchema = z.enum(["not_started", "on_the_radar", "in_progress", "blocked", "rejected", "approved"]);
const budgetSourceSchema = z.enum(budgetSourceOptions.map((option) => option.value) as [string, ...string[]]);
const nullableDateSchema = z.union([z.literal(""), z.literal("TBD"), z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-((0[1-9]|[12]\d|3[01])|TBD)$/)]).optional();
const nullableUuidSchema = z.union([z.literal(""), z.string().uuid()]).optional();

const roadmapItemSchema = z.object({
  fiscalYearId: z.string().uuid(),
  title: z.string().trim().min(1),
  provider: z.string().trim().optional(),
  genre: z.string().trim().optional(),
  format: z.string().trim().optional(),
  featuredInIndividualMarketing: z.preprocess((value) => value === "on" || value === "true", z.boolean()).default(false),
  releaseDate: nullableDateSchema,
  status: roadmapStatusSchema,
  budgetSource: budgetSourceSchema.default("misc_licensing"),
  notes: z.string().trim().optional(),
  categoryId: nullableUuidSchema
});

const updateRoadmapItemSchema = roadmapItemSchema.extend({
  itemId: z.string().uuid()
});

const reviewItemSchema = z.object({
  fiscalYearId: z.string().uuid(),
  title: z.string().trim().min(1),
  provider: z.string().trim().optional(),
  genre: z.string().trim().optional(),
  format: z.string().trim().optional(),
  reviewStatus: reviewStatusSchema,
  budgetSource: budgetSourceSchema.default("misc_licensing"),
  notes: z.string().trim().optional(),
  proposedRate: z.string().trim().optional(),
  reviewLink: z.union([z.literal(""), z.string().url()]).optional(),
  comparableContent: z.string().trim().optional(),
  isCoproductionOpportunity: z.preprocess((value) => value === "on" || value === "true", z.boolean()).default(false)
});

const updateReviewItemSchema = reviewItemSchema.extend({
  itemId: z.string().trim().min(1)
});

const deleteReviewItemSchema = z.object({
  itemId: z.string().trim().min(1),
  fiscalYearId: z.string().uuid()
});

const reviewPipelineSchema = z.object({
  itemId: z.string().trim().min(1),
  fiscalYearId: z.string().uuid()
});

const roadmapPipelineSchema = z.object({
  itemId: z.string().uuid(),
  fiscalYearId: z.string().uuid()
});

const roadmapMonthPipelineSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  fiscalYearId: z.string().uuid()
});

const seriesSchema = z.object({
  fiscalYearId: z.string().uuid(),
  series: z.string().trim().min(1),
  cadence: z.string().trim().min(1),
  notes: z.string().trim().optional()
});

const updateSeriesSchema = seriesSchema.extend({
  seriesId: z.string().uuid()
});

const deleteItemSchema = z.object({
  itemId: z.string().uuid(),
  fiscalYearId: z.string().uuid()
});

export async function addRoadmapItem(formData: FormData) {
  const admin = await requirePlanningAdmin();
  const parsed = roadmapItemSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    throw new Error("Check the roadmap title, release date, and status.");
  }

  const { error } = await admin.from("roadmap_items").insert({
    fiscal_year_id: parsed.data.fiscalYearId,
    title: parsed.data.title,
    provider: optionalText(parsed.data.provider),
    genre: optionalText(parsed.data.genre),
    format: optionalText(parsed.data.format),
    featured_in_individual_marketing: parsed.data.featuredInIndividualMarketing,
    release_month: optionalText(parsed.data.releaseDate),
    status: parsed.data.status,
    budget_source: parsed.data.budgetSource,
    notes: optionalText(parsed.data.notes),
    category_id: optionalText(parsed.data.categoryId)
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePlanning();
}

export async function updateRoadmapItem(formData: FormData) {
  const parsed = updateRoadmapItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the roadmap title, release date, and status.");
  }

  const admin = await requirePlanningAdmin();

  const { error } = await admin
    .from("roadmap_items")
    .update({
      title: parsed.data.title,
      provider: optionalText(parsed.data.provider),
      genre: optionalText(parsed.data.genre),
      format: optionalText(parsed.data.format),
      featured_in_individual_marketing: parsed.data.featuredInIndividualMarketing,
      release_month: optionalText(parsed.data.releaseDate),
      status: parsed.data.status,
      budget_source: parsed.data.budgetSource,
      notes: optionalText(parsed.data.notes),
      category_id: optionalText(parsed.data.categoryId)
    })
    .eq("id", parsed.data.itemId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePlanning();
}

export async function deleteRoadmapItem(formData: FormData) {
  const parsed = deleteItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid roadmap item to delete.");
  }

  const admin = await requirePlanningAdmin();

  const { error } = await admin.from("roadmap_items").delete().eq("id", parsed.data.itemId).eq("fiscal_year_id", parsed.data.fiscalYearId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePlanning();
}

export async function addContentReviewItem(formData: FormData) {
  const parsed = reviewItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the content review title and stage.");
  }

  const admin = await requirePlanningAdmin();

  const { data, error } = await admin
    .from("content_review_items")
    .insert({
      fiscal_year_id: parsed.data.fiscalYearId,
      title: parsed.data.title,
      provider: optionalText(parsed.data.provider),
      genre: optionalText(parsed.data.genre),
      format: optionalText(parsed.data.format),
      review_status: parsed.data.reviewStatus,
      budget_source: parsed.data.budgetSource,
      notes: optionalText(parsed.data.notes),
      proposed_rate_cents: dollarsToOptionalCents(parsed.data.proposedRate ?? ""),
      review_link: optionalText(parsed.data.reviewLink),
      comparable_content: optionalText(parsed.data.comparableContent),
      is_coproduction_opportunity: parsed.data.isCoproductionOpportunity
    })
    .select("id,title,provider,genre,format,review_status,budget_source,notes,proposed_rate_cents,review_link,comparable_content,is_coproduction_opportunity")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePlanning();

  return {
    id: data.id,
    title: data.title,
    provider: data.provider,
    genre: data.genre,
    format: data.format,
    reviewStatus: data.review_status as ReviewStatus,
    budgetSource: data.budget_source ?? "misc_licensing",
    notes: data.notes,
    proposedRateCents: data.proposed_rate_cents,
    reviewLink: data.review_link,
    comparableContent: data.comparable_content,
    isCoproductionOpportunity: data.is_coproduction_opportunity
  } satisfies ContentReviewItem;
}

export async function updateContentReviewItem(formData: FormData) {
  const parsed = updateReviewItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the content review title and stage.");
  }

  const admin = await requirePlanningAdmin();

  const { error } = await admin
    .from("content_review_items")
    .update({
      title: parsed.data.title,
      provider: optionalText(parsed.data.provider),
      genre: optionalText(parsed.data.genre),
      format: optionalText(parsed.data.format),
      review_status: parsed.data.reviewStatus,
      budget_source: parsed.data.budgetSource,
      notes: optionalText(parsed.data.notes),
      proposed_rate_cents: dollarsToOptionalCents(parsed.data.proposedRate ?? ""),
      review_link: optionalText(parsed.data.reviewLink),
      comparable_content: optionalText(parsed.data.comparableContent),
      is_coproduction_opportunity: parsed.data.isCoproductionOpportunity
    })
    .eq("id", parsed.data.itemId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePlanning();
}

export async function deleteContentReviewItem(formData: FormData) {
  const parsed = deleteReviewItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid review item to delete.");
  }

  const admin = await requirePlanningAdmin();

  const { error } = await admin
    .from("content_review_items")
    .delete()
    .eq("id", parsed.data.itemId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePlanning();
}

export async function sendReviewToRoadmap(formData: FormData) {
  const parsed = reviewPipelineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid approved review to send to the roadmap.");
  }

  const admin = await requirePlanningAdmin();
  const { data: review, error: reviewError } = await admin
    .from("content_review_items")
    .select("id,title,provider,genre,format,review_status,budget_source,notes,proposed_rate_cents,is_coproduction_opportunity")
    .eq("id", parsed.data.itemId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId)
    .single();

  if (reviewError || !review) {
    throw new Error(reviewError?.message ?? "Could not find that review.");
  }

  if (review.review_status !== "approved") {
    throw new Error("Only approved reviews can be sent to the roadmap.");
  }

  const noteParts = [
    "Created from content review.",
    review.is_coproduction_opportunity ? "Potential co-production opportunity." : null,
    review.notes ? `Review notes: ${review.notes}` : null,
    review.proposed_rate_cents ? `Proposed rate: ${formatCents(review.proposed_rate_cents)}` : null
  ].filter(Boolean);

  const { error } = await admin.from("roadmap_items").insert({
    fiscal_year_id: parsed.data.fiscalYearId,
    title: review.title,
    provider: optionalText(review.provider),
    genre: optionalText(review.genre),
    format: optionalText(review.format),
    release_month: "TBD",
    status: "planned",
    budget_source: review.budget_source ?? "misc_licensing",
    notes: noteParts.join(" ")
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePlanning();
}

export async function sendRoadmapItemToBudget(formData: FormData) {
  const parsed = roadmapPipelineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid roadmap item to add to the licensing summary.");
  }

  const admin = await requirePlanningAdmin();
  const { data: roadmapItem, error: roadmapError } = await admin
    .from("roadmap_items")
    .select("id,title,provider,genre,format,release_month,status,budget_source,notes")
    .eq("id", parsed.data.itemId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId)
    .single();

  if (roadmapError || !roadmapItem) {
    throw new Error(roadmapError?.message ?? "Could not find that roadmap item.");
  }

  const { error } = await admin.from("content_licenses").insert({
    fiscal_year_id: parsed.data.fiscalYearId,
    title: roadmapItem.title,
    provider: optionalText(roadmapItem.provider) ?? "Provider TBD",
    installment_cents: 0,
    cadence: "yearly",
    added_fiscal_month: monthToFiscalMonth(roadmapItem.release_month),
    budget_source: roadmapItem.budget_source ?? "misc_licensing",
    notes: ["Created from roadmap.", roadmapItem.notes].filter(Boolean).join(" ")
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePlanning();
}

export async function sendRoadmapItemToClickUp(formData: FormData) {
  const parsed = roadmapPipelineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid roadmap item to send to ClickUp.");
  }

  const admin = await requirePlanningAdmin();
  const { data: roadmapItem, error: roadmapError } = await admin
    .from("roadmap_items")
    .select("id,title,provider,genre,format,release_month,clickup_task_id,clickup_task_url")
    .eq("id", parsed.data.itemId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId)
    .single();

  if (roadmapError || !roadmapItem) {
    throw new Error(roadmapError?.message ?? "Could not find that roadmap item.");
  }

  if (roadmapItem.clickup_task_id && await contentUploadTaskExists(roadmapItem.clickup_task_id)) {
    return { created: false, replacedMissingTask: false, taskUrl: roadmapItem.clickup_task_url };
  }

  const task = await createContentUploadTask({
    title: roadmapItem.title,
    provider: optionalText(roadmapItem.provider),
    genre: optionalText(roadmapItem.genre),
    format: optionalText(roadmapItem.format),
    releaseDate: optionalText(roadmapItem.release_month)
  });

  const { error } = await admin
    .from("roadmap_items")
    .update({
      clickup_task_id: task.taskId,
      clickup_task_url: task.taskUrl,
      clickup_synced_at: new Date().toISOString()
    })
    .eq("id", roadmapItem.id)
    .eq("fiscal_year_id", parsed.data.fiscalYearId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePlanning();
  return { created: true, replacedMissingTask: Boolean(roadmapItem.clickup_task_id), taskUrl: task.taskUrl };
}

export async function sendRoadmapMonthToClickUp(formData: FormData) {
  const parsed = roadmapMonthPipelineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid roadmap month to send to ClickUp.");
  }

  const admin = await requirePlanningAdmin();
  const { data: roadmapItems, error: roadmapError } = await admin
    .from("roadmap_items")
    .select("id,title,provider,genre,format,release_month,clickup_task_id")
    .eq("fiscal_year_id", parsed.data.fiscalYearId)
    .gte("release_month", `${parsed.data.monthKey}-01`)
    .lt("release_month", nextMonthKey(parsed.data.monthKey))
    .order("release_month", { ascending: true })
    .order("created_at", { ascending: true });

  if (roadmapError) {
    throw new Error(roadmapError.message);
  }

  let createdCount = 0;
  let existingCount = 0;
  let replacedMissingCount = 0;

  for (const roadmapItem of roadmapItems ?? []) {
    if (roadmapItem.clickup_task_id && await contentUploadTaskExists(roadmapItem.clickup_task_id)) {
      existingCount += 1;
      continue;
    }

    const task = await createContentUploadTask({
      title: roadmapItem.title,
      provider: optionalText(roadmapItem.provider),
      genre: optionalText(roadmapItem.genre),
      format: optionalText(roadmapItem.format),
      releaseDate: optionalText(roadmapItem.release_month)
    });

    const { error } = await admin
      .from("roadmap_items")
      .update({
        clickup_task_id: task.taskId,
        clickup_task_url: task.taskUrl,
        clickup_synced_at: new Date().toISOString()
      })
      .eq("id", roadmapItem.id)
      .eq("fiscal_year_id", parsed.data.fiscalYearId);

    if (error) {
      throw new Error(error.message);
    }

    createdCount += 1;
    if (roadmapItem.clickup_task_id) {
      replacedMissingCount += 1;
    }
  }

  revalidatePlanning();
  return { createdCount, existingCount, replacedMissingCount };
}

export async function addOngoingSeries(formData: FormData) {
  const parsed = seriesSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the series name and cadence.");
  }

  const admin = await requirePlanningAdmin();

  const { error } = await admin.from("ongoing_series").insert({
    fiscal_year_id: parsed.data.fiscalYearId,
    series: parsed.data.series,
    cadence: parsed.data.cadence,
    notes: optionalText(parsed.data.notes)
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePlanning();
}

export async function updateOngoingSeries(formData: FormData) {
  const parsed = updateSeriesSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the series name and cadence.");
  }

  const admin = await requirePlanningAdmin();

  const { error } = await admin
    .from("ongoing_series")
    .update({
      series: parsed.data.series,
      cadence: parsed.data.cadence,
      notes: optionalText(parsed.data.notes)
    })
    .eq("id", parsed.data.seriesId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePlanning();
}

export async function deleteOngoingSeries(formData: FormData) {
  const parsed = z
    .object({
      seriesId: z.string().uuid(),
      fiscalYearId: z.string().uuid()
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    throw new Error("Choose a valid series to delete.");
  }

  const admin = await requirePlanningAdmin();

  const { error } = await admin.from("ongoing_series").delete().eq("id", parsed.data.seriesId).eq("fiscal_year_id", parsed.data.fiscalYearId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePlanning();
}

const categorySchema = z.object({
  fiscalYearId: z.string().uuid(),
  name: z.string().trim().min(1),
  colorKey: z.enum(["blue", "amber", "green", "purple", "red", "cyan", "orange", "slate"])
});

export async function addRoadmapCategory(formData: FormData) {
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Add a category name and color.");
  const admin = await requirePlanningAdmin();
  const { error } = await admin.from("roadmap_categories").insert({
    fiscal_year_id: parsed.data.fiscalYearId,
    name: parsed.data.name,
    color_key: parsed.data.colorKey
  });
  if (error) throw new Error(error.message);
  revalidatePlanning();
}

export async function updateRoadmapCategory(formData: FormData) {
  const parsed = categorySchema.extend({ categoryId: z.string().uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Check the category name and color.");
  const admin = await requirePlanningAdmin();
  const { error } = await admin.from("roadmap_categories").update({
    name: parsed.data.name,
    color_key: parsed.data.colorKey
  }).eq("id", parsed.data.categoryId).eq("fiscal_year_id", parsed.data.fiscalYearId);
  if (error) throw new Error(error.message);
  revalidatePlanning();
}

export async function reorderRoadmapCategories(formData: FormData) {
  const parsed = z.object({
    fiscalYearId: z.string().uuid(),
    categoryIds: z.array(z.string().uuid()).min(1)
  }).safeParse({
    fiscalYearId: formData.get("fiscalYearId"),
    categoryIds: formData.getAll("categoryIds")
  });
  if (!parsed.success) throw new Error("Choose a valid key order.");
  const admin = await requirePlanningAdmin();
  const results = await Promise.all(
    parsed.data.categoryIds.map((categoryId, sortOrder) =>
      admin
        .from("roadmap_categories")
        .update({ sort_order: sortOrder })
        .eq("id", categoryId)
        .eq("fiscal_year_id", parsed.data.fiscalYearId)
    )
  );
  const error = results.find((result) => result.error)?.error;
  if (error) throw new Error(error.message);
  revalidatePlanning();
}

export async function deleteRoadmapCategory(formData: FormData) {
  const parsed = z.object({
    categoryId: z.string().uuid(),
    fiscalYearId: z.string().uuid()
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Choose a valid key to delete.");
  const admin = await requirePlanningAdmin();
  const { error } = await admin
    .from("roadmap_categories")
    .delete()
    .eq("id", parsed.data.categoryId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId);
  if (error) throw new Error(error.message);
  revalidatePlanning();
}

async function requirePlanningAdmin() {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase is required to save roadmap and review items.");
  }

  await requireInternalSession();

  return admin;
}

function optionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatCents(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value / 100);
}

function monthToFiscalMonth(value: string | null | undefined) {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])/.test(value)) return 1;
  const month = Number(value.slice(5, 7));
  return ((month + 5) % 12) + 1;
}

function revalidatePlanning() {
  revalidatePath("/roadmap");
  revalidatePath("/content-review");
  revalidatePath("/dashboard");
}

function nextMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-01`;
}
