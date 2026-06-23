import { ListPlus, Trash2 } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface } from "@/components/ui/soft-surface";
import { addContentReviewItem, deleteContentReviewItem, updateContentReviewItem } from "../planning-actions";
import type { ContentReviewItem } from "../planning-types";

type ContentReviewDashboardProps = {
  fiscalYearId: string;
  items: ContentReviewItem[];
  isDemo?: boolean;
};

const reviewStages = [
  { label: "New", value: "new" },
  { label: "Reviewing", value: "reviewing" },
  { label: "Approved", value: "approved" },
  { label: "Parked", value: "parked" },
  { label: "Rejected", value: "rejected" }
];

export function ContentReviewDashboard({ fiscalYearId, items, isDemo }: ContentReviewDashboardProps) {
  return (
    <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
      <SoftSurface className="h-fit bg-blue-50 p-6 md:p-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-500">
            <ListPlus className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Add Review Content</h2>
            <p className="text-sm font-medium text-muted">This queue saves to Supabase.</p>
          </div>
        </div>
        <form action={addContentReviewItem} className="grid gap-4">
          <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
          <SoftInput label="Title" name="title" placeholder="Content title" required disabled={isDemo} />
          <SoftInput label="Provider" name="provider" placeholder="Provider name" disabled={isDemo} />
          <SoftInput label="Genre" name="genre" placeholder="Formation" disabled={isDemo} />
          <SoftInput label="Format" name="format" placeholder="Series, film, course..." disabled={isDemo} />
          <SoftSelect label="Stage" name="stage" defaultValue="new" options={reviewStages} disabled={isDemo} />
          <SoftInput label="Notes" name="notes" placeholder="Review notes" disabled={isDemo} />
          <SoftButton type="submit" variant="primary" disabled={isDemo}>
            Add to review
          </SoftButton>
        </form>
      </SoftSurface>

      <SoftSurface className="overflow-hidden bg-gray-900">
        <div className="p-6 text-white md:p-8">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Saved Content Review</h2>
          <p className="mt-1 text-sm font-medium text-gray-300">{items.length} review items saved.</p>
        </div>
        <div className="grid gap-4 bg-gray-100 p-4 md:p-6">
          {items.length === 0 ? (
            <p className="rounded-lg bg-white p-4 text-sm font-bold text-muted">Add content to start the review queue.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-lg bg-white p-4">
                <form action={updateContentReviewItem} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <SoftInput label="Title" name="title" defaultValue={item.title} required disabled={isDemo} />
                  <SoftInput label="Provider" name="provider" defaultValue={item.provider ?? ""} disabled={isDemo} />
                  <SoftInput label="Genre" name="genre" defaultValue={item.genre ?? ""} disabled={isDemo} />
                  <SoftInput label="Format" name="format" defaultValue={item.format ?? ""} disabled={isDemo} />
                  <SoftSelect label="Stage" name="stage" defaultValue={item.stage} options={reviewStages} disabled={isDemo} />
                  <SoftInput label="Notes" name="notes" defaultValue={item.notes ?? ""} disabled={isDemo} />
                  <div className="grid gap-2 sm:grid-cols-2 xl:col-span-3">
                    <SoftButton type="submit" variant="primary" disabled={isDemo}>
                      Save
                    </SoftButton>
                    <SoftButton form={`delete-review-${item.id}`} type="submit" variant="ghost" className="text-red-700 hover:bg-red-100" disabled={isDemo}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </SoftButton>
                  </div>
                </form>
                <form id={`delete-review-${item.id}`} action={deleteContentReviewItem}>
                  <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                  <input type="hidden" name="itemId" value={item.id} />
                </form>
              </div>
            ))
          )}
        </div>
      </SoftSurface>
    </div>
  );
}
