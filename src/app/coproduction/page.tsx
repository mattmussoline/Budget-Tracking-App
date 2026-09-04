import { redirect } from "next/navigation";
import { fetchCoproductionUpdates } from "@/features/coproduction/coproduction-actions";
import { mapCoproductionRow } from "@/features/coproduction/coproduction-mappers";
import { CoproductionSlate } from "@/features/coproduction/components/coproduction-slate";
import type { CoproductionOpportunity, CoproductionUpdate } from "@/features/coproduction/coproduction-types";
import { selectFiscalYear } from "@/features/budget/fiscal-year-selection";
import { PlanningShell } from "@/features/planning/components/planning-shell";
import { TopBarChip } from "@/features/planning/components/app-top-bar";
import { requireInternalSession } from "@/lib/auth/internal-auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CoproductionPageProps = {
  searchParams?: Promise<{
    fy?: string;
  }>;
};

export const metadata = {
  title: "Co-Production | Licensing Budget",
  description: "Live co-production slate with graded opportunities, asking prices, and deal tracking"
};

const OPPORTUNITY_COLUMNS =
  "id,title,partner,format,genre,episodes,ask_cents,likelihood,likelihood_rationale,stage,score_mission,score_mission_rationale,score_audience,score_audience_rationale,score_economics,score_economics_rationale,score_partner,score_partner_rationale,score_delivery,score_delivery_rationale,notes,image_url,graded_by,graded_at,updated_at";

export default async function CoproductionPage({ searchParams }: CoproductionPageProps) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return (
      <PlanningShell activeSection="coproduction">
        <CoproductionSlate opportunities={[]} isDemo />
      </PlanningShell>
    );
  }

  const sessionPromise = requireInternalSession();
  const paramsPromise = searchParams;

  const [{ data: fiscalYears, error: fiscalYearsError }, params] = await Promise.all([
    admin
      .from("fiscal_years")
      .select("id,label,fiscal_year,is_pinned")
      .order("fiscal_year", { ascending: false }),
    paramsPromise,
    sessionPromise
  ]);

  if (fiscalYearsError) {
    throw new Error(fiscalYearsError.message);
  }

  const selectedFiscalYearId = params?.fy;
  const activeFiscalYear = selectFiscalYear(fiscalYears ?? [], selectedFiscalYearId);

  if (!activeFiscalYear) {
    redirect("/dashboard");
  }

  const { data: opportunityRows, error: opportunityError } = await admin
    .from("coproduction_opportunities")
    .select(OPPORTUNITY_COLUMNS)
    .eq("fiscal_year_id", activeFiscalYear.id)
    .order("created_at", { ascending: false });

  if (opportunityError) {
    throw new Error(opportunityError.message);
  }

  const opportunityIds = (opportunityRows ?? []).map((row) => row.id as string);
  const updates = await fetchCoproductionUpdates(admin, opportunityIds);
  const updatesByOpportunity = new Map<string, CoproductionUpdate[]>();
  for (const update of updates) {
    const list = updatesByOpportunity.get(update.opportunityId) ?? [];
    list.push(update);
    updatesByOpportunity.set(update.opportunityId, list);
  }

  const opportunities: CoproductionOpportunity[] = (opportunityRows ?? []).map((row) =>
    mapCoproductionRow(row, updatesByOpportunity.get(row.id as string) ?? [])
  );

  return (
    <PlanningShell
      activeSection="coproduction"
      topBarRight={<TopBarChip>FY{String(activeFiscalYear.fiscal_year).slice(-2)}</TopBarChip>}
    >
      <CoproductionSlate opportunities={opportunities} fiscalYearId={activeFiscalYear.id} />
    </PlanningShell>
  );
}
