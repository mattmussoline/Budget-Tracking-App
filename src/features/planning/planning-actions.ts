"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireInternalSession } from "@/lib/auth/internal-auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { budgetSourceOptions } from "@/features/budget/budget-source";
import { contentUploadTaskExists, createContentUploadTask } from "./clickup";
import { dollarsToOptionalCents } from "./planning-model";
import { ROADMAP_STATUSES, type ContentReviewItem, type ContentReviewUpdate, type ReviewStatus } from "./planning-types";
import { isEmptyNotesHtml, notesHtmlToPlainText, sanitizeNotesHtml } from "./rich-text";

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
  formedUrl: z.union([z.literal(""), z.string().url()]).optional(),
  formedUrlCandidate: z.union([z.literal(""), z.string().url()]).optional(),
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
  notes: z.string().trim().optional().transform((value) => {
    if (!value) return value;
    const sanitized = sanitizeNotesHtml(value);
    return isEmptyNotesHtml(sanitized) ? "" : sanitized;
  }),
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
    formed_url: optionalText(parsed.data.formedUrl),
    formed_url_candidate: parsed.data.formedUrl ? null : optionalText(parsed.data.formedUrlCandidate),
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
      formed_url: optionalText(parsed.data.formedUrl),
      formed_url_candidate: parsed.data.formedUrl ? null : optionalText(parsed.data.formedUrlCandidate),
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

  // New reviews land at the top of the manual order, matching where the queue
  // already showed them. Reserving a slot above the current minimum keeps this
  // to one insert instead of renumbering every existing row.
  const { data: topRow } = await admin
    .from("content_review_items")
    .select("priority_rank")
    .eq("fiscal_year_id", parsed.data.fiscalYearId)
    .not("priority_rank", "is", null)
    .order("priority_rank", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data, error } = await admin
    .from("content_review_items")
    .insert({
      fiscal_year_id: parsed.data.fiscalYearId,
      priority_rank: (topRow?.priority_rank ?? 1) - 1,
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
    .select("id,title,provider,genre,format,review_status,budget_source,notes,proposed_rate_cents,review_link,comparable_content,is_coproduction_opportunity,priority_rank")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await logContentReviewUpdate(admin, {
    fiscalYearId: parsed.data.fiscalYearId,
    itemId: data.id,
    kind: "created",
    toStatus: parsed.data.reviewStatus
  });

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
    isCoproductionOpportunity: data.is_coproduction_opportunity,
    priorityRank: data.priority_rank
  } satisfies ContentReviewItem;
}

export async function updateContentReviewItem(formData: FormData) {
  const parsed = updateReviewItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the content review title and stage.");
  }

  const admin = await requirePlanningAdmin();

  // Read the stored status first so a real transition can be logged. updated_at
  // is bumped by every keystroke-save, so it cannot tell a decision from a typo.
  const { data: existing } = await admin
    .from("content_review_items")
    .select("review_status")
    .eq("id", parsed.data.itemId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId)
    .maybeSingle();

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

  const previousStatus = existing?.review_status as ReviewStatus | undefined;
  if (previousStatus && previousStatus !== parsed.data.reviewStatus) {
    await logContentReviewUpdate(admin, {
      fiscalYearId: parsed.data.fiscalYearId,
      itemId: parsed.data.itemId,
      kind: "status_change",
      fromStatus: previousStatus,
      toStatus: parsed.data.reviewStatus
    });
  }

  revalidatePlanning();
}

const reorderReviewItemsSchema = z.object({
  fiscalYearId: z.string().uuid(),
  itemIds: z.array(z.string().trim().min(1)).min(1),
  movedItemId: z.string().trim().optional(),
  movedToStatus: reviewStatusSchema.optional()
});

const reorderReviewGroupsSchema = z.object({
  fiscalYearId: z.string().uuid(),
  reviewStatuses: z.array(reviewStatusSchema).min(1)
});

const reviewUpdateSchema = z.object({
  fiscalYearId: z.string().uuid(),
  itemId: z.string().trim().min(1),
  body: z.string().trim().min(1).max(2000)
});

const deleteReviewUpdateSchema = z.object({
  fiscalYearId: z.string().uuid(),
  updateId: z.string().uuid()
});

/**
 * Saves the manual review order. `itemIds` is the whole queue in its new order;
 * only rows whose rank actually moved are written. When the drag crossed into a
 * different status group the move doubles as a status change and is logged.
 */
export async function reorderContentReviewItems(formData: FormData) {
  const parsed = reorderReviewItemsSchema.safeParse({
    fiscalYearId: formData.get("fiscalYearId"),
    itemIds: formData.getAll("itemIds"),
    movedItemId: formData.get("movedItemId") ?? undefined,
    movedToStatus: formData.get("movedToStatus") ?? undefined
  });
  if (!parsed.success) {
    throw new Error("Choose a valid review order.");
  }

  const admin = await requirePlanningAdmin();

  const { data: currentRows, error: readError } = await admin
    .from("content_review_items")
    .select("id,review_status,priority_rank")
    .eq("fiscal_year_id", parsed.data.fiscalYearId);

  if (readError) {
    throw new Error(readError.message);
  }

  const currentById = new Map((currentRows ?? []).map((row) => [row.id as string, row]));
  const movedItemId = parsed.data.movedItemId;
  const movedToStatus = parsed.data.movedToStatus;
  const previousStatus = movedItemId ? (currentById.get(movedItemId)?.review_status as ReviewStatus | undefined) : undefined;
  const hasStatusChange = Boolean(movedItemId && movedToStatus && previousStatus && previousStatus !== movedToStatus);

  const writes = parsed.data.itemIds.flatMap((itemId, index) => {
    const rank = index + 1;
    const current = currentById.get(itemId);
    if (!current) return [];
    const needsRank = current.priority_rank !== rank;
    const needsStatus = hasStatusChange && itemId === movedItemId;
    if (!needsRank && !needsStatus) return [];
    return [
      admin
        .from("content_review_items")
        .update(needsStatus ? { priority_rank: rank, review_status: movedToStatus } : { priority_rank: rank })
        .eq("id", itemId)
        .eq("fiscal_year_id", parsed.data.fiscalYearId)
    ];
  });

  const results = await Promise.all(writes);
  const error = results.find((result) => result.error)?.error;
  if (error) {
    throw new Error(error.message);
  }

  if (hasStatusChange && movedItemId && movedToStatus) {
    await logContentReviewUpdate(admin, {
      fiscalYearId: parsed.data.fiscalYearId,
      itemId: movedItemId,
      kind: "status_change",
      fromStatus: previousStatus,
      toStatus: movedToStatus
    });
  }

  revalidatePlanning();
}

export async function reorderContentReviewGroups(formData: FormData) {
  const parsed = reorderReviewGroupsSchema.safeParse({
    fiscalYearId: formData.get("fiscalYearId"),
    reviewStatuses: formData.getAll("reviewStatuses")
  });
  if (!parsed.success) {
    throw new Error("Choose a valid group order.");
  }

  const admin = await requirePlanningAdmin();

  const { error } = await admin.from("content_review_group_order").upsert(
    parsed.data.reviewStatuses.map((reviewStatus, sortOrder) => ({
      fiscal_year_id: parsed.data.fiscalYearId,
      review_status: reviewStatus,
      sort_order: sortOrder
    })),
    { onConflict: "fiscal_year_id,review_status" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePlanning();
}

export async function addContentReviewUpdate(formData: FormData) {
  const parsed = reviewUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Write an update before saving it.");
  }

  const admin = await requirePlanningAdmin();
  const session = await requireInternalSession();

  const { data, error } = await admin
    .from("content_review_updates")
    .insert({
      fiscal_year_id: parsed.data.fiscalYearId,
      item_id: parsed.data.itemId,
      kind: "note",
      body: parsed.data.body,
      author_email: session.email
    })
    .select("id,item_id,kind,body,from_status,to_status,author_email,created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePlanning();

  return {
    id: data.id,
    itemId: data.item_id,
    kind: data.kind,
    body: data.body,
    fromStatus: data.from_status,
    toStatus: data.to_status,
    authorEmail: data.author_email,
    createdAt: data.created_at
  } satisfies ContentReviewUpdate;
}

export async function deleteContentReviewUpdate(formData: FormData) {
  const parsed = deleteReviewUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid update to delete.");
  }

  const admin = await requirePlanningAdmin();

  const { error } = await admin
    .from("content_review_updates")
    .delete()
    .eq("id", parsed.data.updateId)
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
    review.notes ? `Review notes: ${notesHtmlToPlainText(review.notes).replace(/\n+/g, " ")}` : null,
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

/**
 * Appends one entry to the review activity log. Logging is best-effort: a
 * failure here must never roll back the edit that triggered it.
 */
async function logContentReviewUpdate(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  entry: { fiscalYearId: string; itemId: string; kind: "note" | "status_change" | "created"; body?: string | null; fromStatus?: ReviewStatus | null; toStatus?: ReviewStatus | null }
) {
  try {
    const session = await requireInternalSession();
    await admin.from("content_review_updates").insert({
      fiscal_year_id: entry.fiscalYearId,
      item_id: entry.itemId,
      kind: entry.kind,
      body: entry.body ?? null,
      from_status: entry.fromStatus ?? null,
      to_status: entry.toStatus ?? null,
      author_email: session.email
    });
  } catch {
    // Activity logging is not worth failing a save over.
  }
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
