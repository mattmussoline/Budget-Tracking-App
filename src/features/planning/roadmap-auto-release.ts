import type { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SupabaseAdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export function getTodayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function releaseDueScheduledRoadmapItems(admin: SupabaseAdminClient, fiscalYearId: string, todayKey = getTodayKey()) {
  const { error } = await admin
    .from("roadmap_items")
    .update({ status: "released" })
    .eq("fiscal_year_id", fiscalYearId)
    .eq("status", "scheduled")
    .like("release_month", "____-__-__")
    .lte("release_month", todayKey);

  if (error) {
    throw new Error(error.message);
  }
}
