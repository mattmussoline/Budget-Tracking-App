"use client";

import Link from "next/link";
import { CalendarPlus, ClipboardCheck, FileSignature, LayoutDashboard, ListFilter, Map, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { initialContentReviewItems } from "../content-review-data";
import type { ContentReviewItem } from "../content-review-types";
import { ContentReviewModal } from "./content-review-modal";
import { ContentReviewTable } from "./content-review-table";

type EditableField = "provider" | "genre" | "format" | "reviewStage" | "contractStatus" | "audience";

type SavedView = "All" | "Needs Review" | "Needs Decision" | "Approved" | "Ready for Roadmap" | "Kids Content";

const savedViews: SavedView[] = ["All", "Needs Review", "Needs Decision", "Approved", "Ready for Roadmap", "Kids Content"];

export function ContentReviewDashboard() {
  const [items, setItems] = useState<ContentReviewItem[]>(initialContentReviewItems);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<SavedView>("All");

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;
  const filteredItems = useMemo(() => filterItems(items, activeView, searchTerm), [items, activeView, searchTerm]);
  const needsReviewCount = items.filter((item) => item.reviewStage === "New Request" || item.reviewStage === "Under Review").length;
  const needsDecisionCount = items.filter((item) => item.reviewStage === "Needs Decision").length;
  const readyForRoadmapCount = items.filter((item) => item.reviewStage === "Approved" && item.contractStatus !== "Contract Executed").length;

  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-blue-500 px-5 py-8 text-white md:px-8 md:py-10 lg:px-12">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute bottom-0 right-56 h-44 w-44 rotate-12 rounded-lg bg-white/10" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-extrabold uppercase tracking-wide text-blue-100">Formed internal tools / content review</p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">Content Review Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex min-h-12 items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-blue-700 transition hover:scale-[1.03] hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Content
            </button>
            <button
              type="button"
              className="inline-flex min-h-12 items-center gap-2 rounded-md bg-gray-950 px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:scale-[1.03] hover:bg-gray-900"
            >
              <ListFilter className="h-4 w-4" aria-hidden="true" />
              Saved Views
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-10 md:px-8 lg:px-12">
        <div className="-mt-10 grid gap-4 md:grid-cols-3">
          <SummaryTile colorClass="text-blue-500" count={needsReviewCount} label="Needs Review" note="New or assigned titles awaiting evaluation." />
          <SummaryTile colorClass="text-amber-500" count={needsDecisionCount} label="Needs Decision" note="Ready for approve, reject, discuss, or park." />
          <SummaryTile colorClass="text-emerald-500" count={readyForRoadmapCount} label="Ready for Roadmap" note="Approved titles not yet placed." />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_auto] lg:items-center">
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
          <Link
            href="/roadmap"
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-blue-500 px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:scale-[1.03] hover:bg-blue-600"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Bulk Add to Roadmap
          </Link>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Saved views">
          {savedViews.map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className={`rounded-full px-4 py-2 text-sm font-extrabold transition hover:scale-[1.04] ${
                activeView === view ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-950 hover:bg-gray-200"
              }`}
            >
              {view}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-gray-950 px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:scale-[1.03] hover:bg-gray-800"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Budget Tracker
          </Link>
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-gray-950 transition hover:scale-[1.03] hover:bg-gray-200"
          >
            <Map className="h-4 w-4" aria-hidden="true" />
            Content Roadmap
          </Link>
        </div>

        <ContentReviewTable items={filteredItems} onItemSelect={(item) => setSelectedItemId(item.id)} onFieldChange={updateItemField} />

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg bg-emerald-500 p-6 text-white">
            <h2 className="font-display text-3xl font-extrabold tracking-tight">Review handoff routes</h2>
            <p className="mt-2 max-w-2xl text-base font-medium leading-relaxed text-emerald-50">
              Approved items can move into the monthly roadmap, while titles needing rights work can move into the contract tracker.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <HandoffLink href="/roadmap" icon={<Map className="h-4 w-4" aria-hidden="true" />} label="Roadmap" />
              <HandoffLink href="/dashboard" icon={<FileSignature className="h-4 w-4" aria-hidden="true" />} label="Contract Tracker" />
              <HandoffLink href="/content-review" icon={<ClipboardCheck className="h-4 w-4" aria-hidden="true" />} label="Review Queue" />
            </div>
          </div>
          <div className="rounded-lg bg-amber-500 p-6 text-gray-950">
            <h2 className="font-display text-3xl font-extrabold tracking-tight">Decision meeting</h2>
            <div className="mt-5 grid gap-3">
              {["Approve, reject, discuss, or park", "Confirm contract next step", "Assign roadmap timing if ready"].map((item) => (
                <div key={item} className="rounded-md bg-white px-4 py-3 text-sm font-extrabold">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      {selectedItem ? <ContentReviewModal item={selectedItem} onClose={() => setSelectedItemId(null)} onSave={saveItem} /> : null}
    </main>
  );

  function updateItemField(itemId: string, field: EditableField, value: string) {
    setItems((currentItems) => currentItems.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
  }

  function saveItem(updatedItem: ContentReviewItem) {
    setItems((currentItems) => currentItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    setSelectedItemId(null);
  }
}

function SummaryTile({ count, label, note, colorClass }: { count: number; label: string; note: string; colorClass: string }) {
  return (
    <article className="relative z-10 grid min-h-36 content-between rounded-lg bg-white p-5">
      <div className={`font-display text-5xl font-extrabold tracking-tight ${colorClass}`}>{count}</div>
      <div>
        <h2 className="text-lg font-extrabold tracking-tight text-gray-950">{label}</h2>
        <p className="mt-1 text-sm font-medium leading-snug text-gray-500">{note}</p>
      </div>
    </article>
  );
}

type HandoffHref = "/dashboard" | "/roadmap" | "/content-review";

function HandoffLink({ href, icon, label }: { href: HandoffHref; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-4 text-sm font-extrabold text-gray-950 transition hover:scale-[1.03]">
      {icon}
      {label}
    </Link>
  );
}

function filterItems(items: ContentReviewItem[], activeView: SavedView, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return items.filter((item) => {
    const matchesView =
      activeView === "All" ||
      (activeView === "Needs Review" && (item.reviewStage === "New Request" || item.reviewStage === "Under Review")) ||
      (activeView === "Needs Decision" && item.reviewStage === "Needs Decision") ||
      (activeView === "Approved" && item.reviewStage === "Approved") ||
      (activeView === "Ready for Roadmap" && item.reviewStage === "Approved" && item.contractStatus !== "Contract Executed") ||
      (activeView === "Kids Content" && item.audience === "Kids");

    if (!matchesView) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [item.title, item.provider, item.genre, item.format, item.reviewStage, item.contractStatus, item.audience]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });
}
