"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireInternalSession } from "@/lib/auth/internal-auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapCoproductionRow } from "./coproduction-mappers";
import { COPRODUCTION_STAGES, type CoproductionStage, type CoproductionUpdate } from "./coproduction-types";

const stageSchema = z.enum(COPRODUCTION_STAGES);
const scoreSchema = z.coerce.number().int().min(0).max(100);
const dollarsSchema = z.string().trim().optional().transform((value) => {
  if (!value) return 0;
  const dollars = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(dollars) ? Math.round(dollars * 100) : 0;
});

const opportunitySchema = z.object({
  fiscalYearId: z.string().uuid(),
  title: z.string().trim().min(1),
  partner: z.string().trim().min(1),
  format: z.string().trim().optional(),
  genre: z.string().trim().optional(),
  episodes: z.string().trim().optional(),
  ask: dollarsSchema,
  likelihood: scoreSchema,
  likelihoodRationale: z.string().trim().optional(),
  stage: stageSchema,
  scoreMission: scoreSchema,
  scoreMissionRationale: z.string().trim().optional(),
  scoreAudience: scoreSchema,
  scoreAudienceRationale: z.string().trim().optional(),
  scoreEconomics: scoreSchema,
  scoreEconomicsRationale: z.string().trim().optional(),
  scorePartner: scoreSchema,
  scorePartnerRationale: z.string().trim().optional(),
  scoreDelivery: scoreSchema,
  scoreDeliveryRationale: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  gradedBy: z.string().trim().optional()
});

const updateOpportunitySchema = opportunitySchema.extend({
  opportunityId: z.string().uuid()
});

const deleteOpportunitySchema = z.object({
  opportunityId: z.string().uuid(),
  fiscalYearId: z.string().uuid()
});

const stageChangeSchema = z.object({
  opportunityId: z.string().uuid(),
  fiscalYearId: z.string().uuid(),
  stage: stageSchema
});

const opportunityUpdateSchema = z.object({
  fiscalYearId: z.string().uuid(),
  opportunityId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000)
});

const deleteOpportunityUpdateSchema = z.object({
  fiscalYearId: z.string().uuid(),
  updateId: z.string().uuid()
});

const OPPORTUNITY_COLUMNS =
  "id,title,partner,format,genre,episodes,ask_cents,likelihood,likelihood_rationale,stage,score_mission,score_mission_rationale,score_audience,score_audience_rationale,score_economics,score_economics_rationale,score_partner,score_partner_rationale,score_delivery,score_delivery_rationale,notes,image_url,graded_by,graded_at,updated_at";

const COPRODUCTION_IMAGE_BUCKET = "coproduction-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const opportunityImageSchema = z.object({
  fiscalYearId: z.string().uuid(),
  opportunityId: z.string().uuid()
});

async function requireCoproductionAdmin() {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase is required to save co-production opportunities.");
  }

  await requireInternalSession();

  return admin;
}

function optionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function revalidateCoproduction() {
  revalidatePath("/coproduction");
}

export async function addCoproductionOpportunity(formData: FormData) {
  const parsed = opportunitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the opportunity title, partner, and stage.");
  }

  const admin = await requireCoproductionAdmin();
  const session = await requireInternalSession();

  const { data, error } = await admin
    .from("coproduction_opportunities")
    .insert({
      fiscal_year_id: parsed.data.fiscalYearId,
      title: parsed.data.title,
      partner: parsed.data.partner,
      format: optionalText(parsed.data.format),
      genre: optionalText(parsed.data.genre),
      episodes: optionalText(parsed.data.episodes),
      ask_cents: parsed.data.ask,
      likelihood: parsed.data.likelihood,
      likelihood_rationale: optionalText(parsed.data.likelihoodRationale),
      stage: parsed.data.stage,
      score_mission: parsed.data.scoreMission,
      score_mission_rationale: optionalText(parsed.data.scoreMissionRationale),
      score_audience: parsed.data.scoreAudience,
      score_audience_rationale: optionalText(parsed.data.scoreAudienceRationale),
      score_economics: parsed.data.scoreEconomics,
      score_economics_rationale: optionalText(parsed.data.scoreEconomicsRationale),
      score_partner: parsed.data.scorePartner,
      score_partner_rationale: optionalText(parsed.data.scorePartnerRationale),
      score_delivery: parsed.data.scoreDelivery,
      score_delivery_rationale: optionalText(parsed.data.scoreDeliveryRationale),
      notes: optionalText(parsed.data.notes),
      graded_by: optionalText(parsed.data.gradedBy) ?? session.email,
      graded_at: new Date().toISOString().slice(0, 10)
    })
    .select(OPPORTUNITY_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { data: createdUpdate, error: updateError } = await admin
    .from("coproduction_updates")
    .insert({
      fiscal_year_id: parsed.data.fiscalYearId,
      opportunity_id: data.id,
      kind: "created",
      to_stage: parsed.data.stage,
      author_email: session.email
    })
    .select("id,opportunity_id,kind,body,from_stage,to_stage,author_email,created_at")
    .single();

  revalidateCoproduction();

  const updates: CoproductionUpdate[] = updateError || !createdUpdate ? [] : [{
    id: createdUpdate.id,
    opportunityId: createdUpdate.opportunity_id,
    kind: createdUpdate.kind,
    body: createdUpdate.body,
    fromStage: createdUpdate.from_stage,
    toStage: createdUpdate.to_stage,
    authorEmail: createdUpdate.author_email,
    createdAt: createdUpdate.created_at
  }];

  return mapCoproductionRow(data, updates);
}

export async function updateCoproductionOpportunity(formData: FormData) {
  const parsed = updateOpportunitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Check the opportunity title, partner, and stage.");
  }

  const admin = await requireCoproductionAdmin();

  const { data: existing } = await admin
    .from("coproduction_opportunities")
    .select("stage")
    .eq("id", parsed.data.opportunityId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId)
    .maybeSingle();

  const { data, error } = await admin
    .from("coproduction_opportunities")
    .update({
      title: parsed.data.title,
      partner: parsed.data.partner,
      format: optionalText(parsed.data.format),
      genre: optionalText(parsed.data.genre),
      episodes: optionalText(parsed.data.episodes),
      ask_cents: parsed.data.ask,
      likelihood: parsed.data.likelihood,
      likelihood_rationale: optionalText(parsed.data.likelihoodRationale),
      stage: parsed.data.stage,
      score_mission: parsed.data.scoreMission,
      score_mission_rationale: optionalText(parsed.data.scoreMissionRationale),
      score_audience: parsed.data.scoreAudience,
      score_audience_rationale: optionalText(parsed.data.scoreAudienceRationale),
      score_economics: parsed.data.scoreEconomics,
      score_economics_rationale: optionalText(parsed.data.scoreEconomicsRationale),
      score_partner: parsed.data.scorePartner,
      score_partner_rationale: optionalText(parsed.data.scorePartnerRationale),
      score_delivery: parsed.data.scoreDelivery,
      score_delivery_rationale: optionalText(parsed.data.scoreDeliveryRationale),
      notes: optionalText(parsed.data.notes),
      graded_by: optionalText(parsed.data.gradedBy)
    })
    .eq("id", parsed.data.opportunityId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId)
    .select(OPPORTUNITY_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const previousStage = existing?.stage as CoproductionStage | undefined;
  if (previousStage && previousStage !== parsed.data.stage) {
    const session = await requireInternalSession();
    await admin.from("coproduction_updates").insert({
      fiscal_year_id: parsed.data.fiscalYearId,
      opportunity_id: parsed.data.opportunityId,
      kind: "stage_change",
      from_stage: previousStage,
      to_stage: parsed.data.stage,
      author_email: session.email
    });
  }

  revalidateCoproduction();

  return mapCoproductionRow(data);
}

export async function deleteCoproductionOpportunity(formData: FormData) {
  const parsed = deleteOpportunitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid opportunity to delete.");
  }

  const admin = await requireCoproductionAdmin();

  const { error } = await admin
    .from("coproduction_opportunities")
    .delete()
    .eq("id", parsed.data.opportunityId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateCoproduction();
}

export async function changeCoproductionStage(formData: FormData) {
  const parsed = stageChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid stage.");
  }

  const admin = await requireCoproductionAdmin();
  const session = await requireInternalSession();

  const { data: existing } = await admin
    .from("coproduction_opportunities")
    .select("stage")
    .eq("id", parsed.data.opportunityId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId)
    .maybeSingle();

  const { error } = await admin
    .from("coproduction_opportunities")
    .update({ stage: parsed.data.stage })
    .eq("id", parsed.data.opportunityId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId);

  if (error) {
    throw new Error(error.message);
  }

  const previousStage = existing?.stage as CoproductionStage | undefined;
  if (previousStage && previousStage !== parsed.data.stage) {
    await admin.from("coproduction_updates").insert({
      fiscal_year_id: parsed.data.fiscalYearId,
      opportunity_id: parsed.data.opportunityId,
      kind: "stage_change",
      from_stage: previousStage,
      to_stage: parsed.data.stage,
      author_email: session.email
    });
  }

  revalidateCoproduction();
}

export async function addCoproductionUpdate(formData: FormData): Promise<CoproductionUpdate> {
  const parsed = opportunityUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Write an update before saving it.");
  }

  const admin = await requireCoproductionAdmin();
  const session = await requireInternalSession();

  const { data, error } = await admin
    .from("coproduction_updates")
    .insert({
      fiscal_year_id: parsed.data.fiscalYearId,
      opportunity_id: parsed.data.opportunityId,
      kind: "note",
      body: parsed.data.body,
      author_email: session.email
    })
    .select("id,opportunity_id,kind,body,from_stage,to_stage,author_email,created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidateCoproduction();

  return {
    id: data.id,
    opportunityId: data.opportunity_id,
    kind: data.kind,
    body: data.body,
    fromStage: data.from_stage,
    toStage: data.to_stage,
    authorEmail: data.author_email,
    createdAt: data.created_at
  };
}

export async function deleteCoproductionUpdate(formData: FormData) {
  const parsed = deleteOpportunityUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid update to delete.");
  }

  const admin = await requireCoproductionAdmin();

  const { error } = await admin
    .from("coproduction_updates")
    .delete()
    .eq("id", parsed.data.updateId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateCoproduction();
}

export async function uploadCoproductionImage(formData: FormData) {
  const parsed = opportunityImageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid opportunity.");
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose an image to upload.");
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Upload a PNG, JPEG, WEBP, or GIF image.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Images must be 5MB or smaller.");
  }

  const admin = await requireCoproductionAdmin();

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${parsed.data.opportunityId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await admin.storage
    .from(COPRODUCTION_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = admin.storage.from(COPRODUCTION_IMAGE_BUCKET).getPublicUrl(path);

  const { data, error } = await admin
    .from("coproduction_opportunities")
    .update({ image_url: publicUrlData.publicUrl })
    .eq("id", parsed.data.opportunityId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId)
    .select(OPPORTUNITY_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidateCoproduction();

  return mapCoproductionRow(data);
}

export async function removeCoproductionImage(formData: FormData) {
  const parsed = opportunityImageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Choose a valid opportunity.");
  }

  const admin = await requireCoproductionAdmin();

  const { data, error } = await admin
    .from("coproduction_opportunities")
    .update({ image_url: null })
    .eq("id", parsed.data.opportunityId)
    .eq("fiscal_year_id", parsed.data.fiscalYearId)
    .select(OPPORTUNITY_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidateCoproduction();

  return mapCoproductionRow(data);
}

export async function fetchCoproductionUpdates(admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>, opportunityIds: string[]) {
  if (opportunityIds.length === 0) return [] as CoproductionUpdate[];

  const { data, error } = await admin
    .from("coproduction_updates")
    .select("id,opportunity_id,kind,body,from_stage,to_stage,author_email,created_at")
    .in("opportunity_id", opportunityIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    opportunityId: row.opportunity_id,
    kind: row.kind,
    body: row.body,
    fromStage: row.from_stage,
    toStage: row.to_stage,
    authorEmail: row.author_email,
    createdAt: row.created_at
  })) as CoproductionUpdate[];
}
