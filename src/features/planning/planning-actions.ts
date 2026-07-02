"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireInternalSession } from "@/lib/auth/internal-auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { dollarsToOptionalCents } from "./planning-model";
import type { ContentReviewItem, ReviewStatus } from "./planning-types";

const roadmapStatusSchema = z.enum(["planned", "in_progress", "ready", "released"]);
const reviewStatusSchema = z.enum(["not_started", "in_progress", "blocked", "rejected", "approved"]);
const nullableDateSchema = z.union([z.literal(""), z.literal("TBD"), z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)]).optional();
const nullableUuidSchema = z.union([z.literal(""), z.string().uuid()]).optional();

const roadmapItemSchema = z.object({
  fiscalYearId: z.string().uuid(),
  title: z.string().trim().min(1),
  provider: z.string().trim().optional(),
  releaseDate: nullableDateSchema,
  status: roadmapStatusSchema,
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
  notes: z.string().trim().optional(),
  proposedRate: z.string().trim().optional(),
  reviewLink: z.union([z.literal(""), z.string().url()]).optional(),
  comparableContent: z.string().trim().optional()
});

const updateReviewItemSchema = reviewItemSchema.extend({
  itemId: z.string().trim().min(1)
});

const deleteReviewItemSchema = z.object({
  itemId: z.string().trim().min(1),
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
    release_month: optionalText(parsed.data.releaseDate),
    status: parsed.data.status,
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
      release_month: optionalText(parsed.data.releaseDate),
      status: parsed.data.status,
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
      notes: optionalText(parsed.data.notes),
      proposed_rate_cents: dollarsToOptionalCents(parsed.data.proposedRate ?? ""),
      review_link: optionalText(parsed.data.reviewLink),
      comparable_content: optionalText(parsed.data.comparableContent)
    })
    .select("id,title,provider,genre,format,review_status,notes,proposed_rate_cents,review_link,comparable_content")
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
    notes: data.notes,
    proposedRateCents: data.proposed_rate_cents,
    reviewLink: data.review_link,
    comparableContent: data.comparable_content
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
      notes: optionalText(parsed.data.notes),
      proposed_rate_cents: dollarsToOptionalCents(parsed.data.proposedRate ?? ""),
      review_link: optionalText(parsed.data.reviewLink),
      comparable_content: optionalText(parsed.data.comparableContent)
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

function optionalText(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

function revalidatePlanning() {
  revalidatePath("/roadmap");
  revalidatePath("/content-review");
}
