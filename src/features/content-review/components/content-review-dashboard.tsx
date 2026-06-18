// Vercel redeploy fix

"use client";

import Link from "next/link";
import { LayoutDashboard, Map, Search } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import type { ContentReviewItem } from "../content-review-types";
import { ContentReviewModal } from "./content-review-modal";
import { ContentReviewTable } from "./content-review-table";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type EditableField = "reviewStage" | "contractStatus";

export function ContentReviewDashboard() {
  const [items, setItems] = useState<ContentReviewItem[]>([]);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  useEffect(() => {
  async function loadItems() {
    const { data, error } = await supabase
      .from("content_review_items")
      .select("*");

    if (error) {
      console.error("Supabase error:", error);
      return;
    }

    const formatted = (data ?? []).map((item: any) => ({
      id: item.id,
      title: item.title,
      provider: item.provider,
      genre: item.genre,
      format: item.format,
      reviewStage: item.review_stage,
      contractStatus: item.contract_status,
      audience: item.audience,
      releaseDate: item.release_date,
      summary: item.summary,
      notes: item.notes,
    }));

    setItems(formatted);
  }

  loadItems();
}, [supabase]); // 👈 ADD THIS
  const [selectedItem, setSelectedItem] = useState<ContentReviewItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const activeItems = useMemo(() => items.filter((item) => item.reviewStage !== "Approved" && item.reviewStage !== "Rejected"), [items]);
  const approvedItems = useMemo(() => items.filter((item) => item.reviewStage === "Approved"), [items]);
  const filteredItems = useMemo(() => filterItems(activeItems, searchTerm), [activeItems, searchTerm]);
  const needsReviewCount = items.filter((item) => item.reviewStage === "New Request" || item.reviewStage === "Under Review").length;
  const needsDecisionCount = items.filter((item) => item.reviewStage === "Needs Decision").length;
  const readyForRoadmapCount = approvedItems.filter((item) => item.contractStatus !== "Contract Executed").length;

  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-blue-500 px-5 py-7 text-white md:px-8 md:py-9 lg:px-12">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute bottom-0 right-56 h-44 w-44 rotate-12 rounded-lg bg-white/10" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-extrabold uppercase tracking-wide text-blue-100">Formed internal tools / content review</p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl">Content Review Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center gap-2 rounded-md bg-gray-950 px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:scale-[1.03] hover:bg-gray-900"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Budget Tracker
            </Link>
            <Link
              href="/roadmap"
              className="inline-flex min-h-12 items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-blue-700 transition hover:scale-[1.03] hover:bg-blue-50"
            >
              <Map className="h-4 w-4" aria-hidden="true" />
              Content Roadmap
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:px-8 lg:px-12">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryTile colorClass="text-blue-500" count={needsReviewCount} label="Needs Review" note="New or assigned titles awaiting evaluation." />
          <SummaryTile colorClass="text-amber-500" count={needsDecisionCount} label="Needs Decision" note="Ready for approve, reject, discuss, or park." />
          <SummaryTile colorClass="text-emerald-500" count={readyForRoadmapCount} label="Ready for Roadmap" note="Approved titles not yet placed." />
        </div>

        <label className="flex min-h-14 items-center gap-3 rounded-lg bg-gray-100 px-4 text-gray-500">
          <Search className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Search content</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search title, provider, audience, contract status, or review stage..."
            className="w-full border-0 bg-transparent text-base font-medium text-gray-950 placeholder:text-gray-500"
          />
        </label>

        <ContentReviewTable
          items={filteredItems}
          onItemSelect={(item) => setSelectedItem(item)}
          onFieldChange={updateItemField}
          onAddContent={openNewContentModal}
        />

        <ApprovedContentSection items={approvedItems} onItemSelect={(item) => setSelectedItem(item)} />
      </section>

      {selectedItem ? (
        <ContentReviewModal item={selectedItem} onClose={() => setSelectedItem(null)} onSave={saveItem} onDelete={deleteItem} />
      ) : null}
    </main>
  );

  async function updateItemField(
  itemId: string,
  field: EditableField,
  value: string
) {
  // 1. Update UI immediately (optimistic update)
  setItems((currentItems) =>
    currentItems.map((item) =>
      item.id === itemId ? { ...item, [field]: value } : item
    )
  );

  // 2. Convert field names for database
  const dbField =
    field === "reviewStage" ? "review_stage" : "contract_status";

  // 3. Push update to Supabase
  const { error } = await supabase
    .from("content_review_items")
    .update({ [dbField]: value })
    .eq("id", itemId);

  if (error) {
    console.error("Update failed:", error);
  }
}

  async function saveItem(updatedItem: ContentReviewItem) {
  const { error } = await supabase
    .from("content_review_items")
    .upsert({
      id: updatedItem.id,
      title: updatedItem.title,
      provider: updatedItem.provider,
      genre: updatedItem.genre,
      format: updatedItem.format,
      review_stage: updatedItem.reviewStage,
      contract_status: updatedItem.contractStatus,
      audience: updatedItem.audience,
      release_date: updatedItem.releaseDate,
      summary: updatedItem.summary,
      notes: updatedItem.notes,
    });

  if (error) {
    console.error("Save failed:", error);
    return;
  }

  // refresh UI state
  setItems((current) => {
    const exists = current.some((i) => i.id === updatedItem.id);
    return exists
      ? current.map((i) => (i.id === updatedItem.id ? updatedItem : i))
      : [...current, updatedItem];
  });

  setSelectedItem(null);
}

  async function deleteItem(itemId: string) {
  const { error } = await supabase
    .from("content_review_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Delete failed:", error);
    return;
  }

  setItems((currentItems) =>
    currentItems.filter((item) => item.id !== itemId)
  );

  setSelectedItem(null);
}

  function openNewContentModal() {
    setSelectedItem({
      id: `content-${Date.now()}`,
      title: "New Content",
      provider: "Other",
      genre: "Everyday Living",
      format: "Movie",
      reviewStage: "New Request",
      contractStatus: "Not Started",
      audience: "Adults",
      releaseDate: "",
      summary: "New review item",
      notes: ""
    });
  }
}

function SummaryTile({ count, label, note, colorClass }: { count: number; label: string; note: string; colorClass: string }) {
  return (
    <article className="relative z-10 grid min-h-32 content-between rounded-lg bg-gray-100 p-5">
      <div className={`font-display text-5xl font-extrabold tracking-tight ${colorClass}`}>{count}</div>
      <div>
        <h2 className="text-lg font-extrabold tracking-tight text-gray-950">{label}</h2>
        <p className="mt-1 text-sm font-medium leading-snug text-gray-500">{note}</p>
      </div>
    </article>
  );
}

function ApprovedContentSection({ items, onItemSelect }: { items: ContentReviewItem[]; onItemSelect: (item: ContentReviewItem) => void }) {
  return (
    <section className="rounded-lg bg-emerald-50 p-4 md:p-5" aria-label="Approved content">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-emerald-950">Approved</h2>
        <p className="text-sm font-medium text-emerald-800">Content approved for roadmap planning.</p>
      </div>
      {items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemSelect(item)}
              className="rounded-lg bg-white p-4 text-left transition hover:scale-[1.02] hover:bg-emerald-100"
            >
              <span className="block text-base font-extrabold tracking-tight text-gray-950">{item.title}</span>
              <span className="mt-2 inline-flex rounded-md bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-emerald-700">
                {item.contractStatus}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-md bg-white px-4 py-3 text-sm font-bold text-emerald-900">No approved content yet.</p>
      )}
    </section>
  );
}

function filterItems(items: ContentReviewItem[], searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return items.filter((item) => {
    if (!normalizedSearch) {
      return true;
    }

    return [item.title, item.provider, item.genre, item.format, item.reviewStage, item.contractStatus, item.audience]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });
}
