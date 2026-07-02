"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { SoftButton } from "@/components/ui/soft-button";
import { cn } from "@/components/ui/soft-surface";
import { addContentReviewItem, deleteContentReviewItem, updateContentReviewItem } from "../planning-actions";
import { CONTENT_FORMATS, CONTENT_GENRES, REVIEW_STATUSES, TONE_CLASSES } from "../planning-constants";
import { dollarsToOptionalCents, formatOptionalCurrency } from "../planning-model";
import type { ContentReviewItem, ReviewStatus } from "../planning-types";
import { ColoredSelect } from "./colored-select";

type ContentReviewDashboardProps = { fiscalYearId: string; items: ContentReviewItem[]; isDemo?: boolean };
type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";

const blankDraft = (): ContentReviewItem => ({
  id: "draft",
  title: "",
  provider: "",
  genre: "",
  format: "",
  reviewStatus: "not_started",
  notes: "",
  proposedRateCents: null,
  reviewLink: "",
  comparableContent: ""
});

export function ContentReviewDashboard({ fiscalYearId, items, isDemo }: ContentReviewDashboardProps) {
  const [records, setRecords] = useState(items);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [draft, setDraft] = useState<ContentReviewItem | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isPending, startTransition] = useTransition();
  const selected = selectedId === "draft" ? draft : records.find((item) => item.id === selectedId) ?? null;

  function selectItem(id: string) {
    if (id !== selectedId) setSaveState("idle");
    setSelectedId(id);
  }

  function changeItem(id: string, field: keyof ContentReviewItem, value: string | number | null) {
    setSelectedId(id);
    setSaveState("unsaved");
    if (id === "draft") {
      setDraft((current) => current ? { ...current, [field]: value } : current);
      return;
    }
    setRecords((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  }

  function itemFormData(item: ContentReviewItem) {
    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    if (item.id !== "draft") formData.set("itemId", item.id);
    formData.set("title", item.title);
    formData.set("provider", item.provider ?? "");
    formData.set("genre", item.genre ?? "");
    formData.set("format", item.format ?? "");
    formData.set("reviewStatus", item.reviewStatus);
    formData.set("notes", item.notes ?? "");
    formData.set("proposedRate", formatOptionalCurrency(item.proposedRateCents));
    formData.set("reviewLink", item.reviewLink ?? "");
    formData.set("comparableContent", item.comparableContent ?? "");
    return formData;
  }

  function save(item: ContentReviewItem) {
    if (isDemo || isPending || !item.title.trim()) return;
    setSaveState("saving");
    startTransition(async () => {
      try {
        const formData = itemFormData(item);
        if (item.id === "draft") {
          const savedItem = await addContentReviewItem(formData);
          setRecords((current) => [savedItem, ...current]);
          setDraft(null);
          setSelectedId(savedItem.id);
        } else {
          await updateContentReviewItem(formData);
        }
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    });
  }

  function addDraft() {
    const next = blankDraft();
    setDraft(next);
    setSelectedId("draft");
    setSaveState("idle");
  }

  const queue = draft ? [draft, ...records] : records;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(600px,1.15fr)_minmax(520px,1fr)]">
      <section className="rounded-lg bg-gray-100 p-4 md:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div><h2 className="font-display text-2xl font-extrabold">Decision Queue</h2><p className="text-sm text-muted">Select a title to edit every review detail.</p></div>
          <SoftButton type="button" variant="primary" onClick={addDraft}><Plus className="h-4 w-4" />Add Content</SoftButton>
        </div>
        <div className="mb-2 hidden grid-cols-[auto_1.3fr_1fr_0.9fr_1fr] gap-2 px-3 text-[10px] font-extrabold uppercase tracking-wide text-muted md:grid">
          <span className="sr-only">Select</span><span>Title</span><span>Review Status</span><span>Proposed Rate</span><span>Provider</span>
        </div>
        <div className="grid gap-2">
          {queue.length === 0 ? <p className="rounded-lg bg-white p-5 font-bold text-muted">Add content to start the decision queue.</p> : queue.map((item) => {
            const status = REVIEW_STATUSES.find((option) => option.value === item.reviewStatus) ?? REVIEW_STATUSES[0];
            const active = selectedId === item.id;
            return (
              <div key={item.id} aria-current={active ? "true" : undefined} className={cn("grid gap-2 rounded-lg border-l-4 bg-white p-3 transition md:grid-cols-[auto_1.3fr_1fr_0.9fr_1fr]", TONE_CLASSES[status.tone].accent, active && "ring-2 ring-blue-500")}>
                <button
                  type="button"
                  aria-label={`Select ${item.title || "Untitled review"}`}
                  onClick={() => selectItem(item.id)}
                  className={cn(
                    "min-h-10 rounded-md px-3 text-left text-xs font-extrabold uppercase tracking-wide transition",
                    active ? "bg-blue-600 text-white" : "bg-gray-900 text-white hover:bg-gray-800"
                  )}
                >
                  Select
                </button>
                <input aria-label="Summary Title" value={item.title} placeholder="Untitled review" disabled={isDemo} onFocus={() => selectItem(item.id)} onChange={(event) => changeItem(item.id, "title", event.target.value)} className="min-h-10 min-w-0 w-full rounded-md border-0 bg-gray-50 px-3 text-sm font-extrabold" />
                <select aria-label="Summary Review Status" value={item.reviewStatus} disabled={isDemo} onFocus={() => selectItem(item.id)} onChange={(event) => { changeItem(item.id, "reviewStatus", event.target.value as ReviewStatus); }} className={cn("min-h-10 min-w-0 w-full rounded-md border-0 px-2 text-xs font-bold", TONE_CLASSES[status.tone].field)}>{REVIEW_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                <CurrencyInput ariaLabel="Summary Proposed Rate" value={item.proposedRateCents} disabled={isDemo} onFocus={() => selectItem(item.id)} onChange={(value) => changeItem(item.id, "proposedRateCents", value)} className="min-h-10 min-w-0 w-full rounded-md border-0 bg-gray-50 px-3 text-sm" />
                <input aria-label="Summary Provider" value={item.provider ?? ""} disabled={isDemo} onFocus={() => selectItem(item.id)} onChange={(event) => changeItem(item.id, "provider", event.target.value)} className="min-h-10 min-w-0 w-full rounded-md border-0 bg-blue-50 px-3 text-sm font-bold text-blue-800" />
              </div>
            );
          })}
        </div>
      </section>

      <section className="h-fit rounded-lg bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.12)] md:p-7">
        {selected ? <ReviewEditor item={selected} isDemo={isDemo} isPending={isPending} saveState={isPending ? "saving" : saveState} onChange={(field, value) => changeItem(selected.id, field, value)} onSave={() => save(selected)} fiscalYearId={fiscalYearId} /> : <div className="grid min-h-64 place-items-center text-center text-muted"><div><h2 className="text-xl font-extrabold">Select a review</h2><p>Choose a queue item or add new content.</p></div></div>}
      </section>
    </div>
  );
}

function ReviewEditor({ item, isDemo, isPending, saveState, onChange, onSave, fiscalYearId }: { item: ContentReviewItem; isDemo?: boolean; isPending: boolean; saveState: SaveState; onChange: (field: keyof ContentReviewItem, value: string | number | null) => void; onSave: () => void; fiscalYearId: string }) {
  return <div className="grid gap-5">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-wide text-blue-600">Selected Review</p><h2 className="font-display text-2xl font-extrabold">{item.id === "draft" ? "New Content Review" : item.title}</h2></div><span aria-live="polite" className="text-xs font-extrabold uppercase text-muted">{saveState === "idle" ? "" : saveState}</span></div>
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Detail Title" value={item.title} onChange={(value) => onChange("title", value)} disabled={isDemo} />
      <CurrencyField label="Proposed Rate" value={item.proposedRateCents} onChange={(value) => onChange("proposedRateCents", value)} disabled={isDemo} />
      <Field label="Provider" value={item.provider ?? ""} onChange={(value) => onChange("provider", value)} disabled={isDemo} />
      <ColoredSelect label="Review Status" name="detailReviewStatus" value={item.reviewStatus} options={REVIEW_STATUSES} onChange={(event) => onChange("reviewStatus", event.target.value)} disabled={isDemo} />
      <ColoredSelect label="Genre" name="detailGenre" value={item.genre ?? ""} options={CONTENT_GENRES} onChange={(event) => onChange("genre", event.target.value)} disabled={isDemo} />
      <ColoredSelect label="Format" name="detailFormat" value={item.format ?? ""} options={CONTENT_FORMATS} onChange={(event) => onChange("format", event.target.value)} disabled={isDemo} />
      <div className="md:col-span-2"><Field label="Review Link" type="url" value={item.reviewLink ?? ""} onChange={(value) => onChange("reviewLink", value)} disabled={isDemo} /></div>
      <TextArea label="Review Notes" value={item.notes ?? ""} onChange={(value) => onChange("notes", value)} disabled={isDemo} />
      <TextArea label="Comparable Content" value={item.comparableContent ?? ""} onChange={(value) => onChange("comparableContent", value)} disabled={isDemo} />
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      {item.id !== "draft" ? <form action={deleteContentReviewItem} onSubmit={(event) => { if (!window.confirm(`Delete ${item.title}? This cannot be undone.`)) event.preventDefault(); }}><input type="hidden" name="fiscalYearId" value={fiscalYearId} /><input type="hidden" name="itemId" value={item.id} /><SoftButton type="submit" variant="ghost" className="text-red-700" disabled={isDemo}><Trash2 className="h-4 w-4" />Delete Review</SoftButton></form> : <span />}
      <SoftButton type="button" variant="primary" onClick={onSave} disabled={isDemo || isPending || !item.title.trim()}><Save className="h-4 w-4" />Save Changes</SoftButton>
    </div>
  </div>;
}

function Field({ label, value, onChange, disabled, type = "text" }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; type?: string }) {
  return <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide">{label}<input aria-label={label} type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="min-h-11 rounded-md border-0 bg-gray-100 px-3 text-sm font-medium normal-case tracking-normal" /></label>;
}

function CurrencyField({ label, value, onChange, disabled }: { label: string; value: number | null; onChange: (value: number | null) => void; disabled?: boolean }) {
  return <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide">{label}<CurrencyInput ariaLabel={label} value={value} onChange={onChange} disabled={disabled} className="min-h-11 rounded-md border-0 bg-gray-100 px-3 text-sm font-medium normal-case tracking-normal" /></label>;
}

function CurrencyInput({ ariaLabel, value, onChange, disabled, onClick, onFocus, className }: { ariaLabel: string; value: number | null; onChange: (value: number | null) => void; disabled?: boolean; onClick?: React.MouseEventHandler<HTMLInputElement>; onFocus?: React.FocusEventHandler<HTMLInputElement>; className: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState("");

  return <input
    aria-label={ariaLabel}
    inputMode="decimal"
    value={isEditing ? draftValue : formatOptionalCurrency(value)}
    disabled={disabled}
    onClick={onClick}
    onFocus={(event) => {
      onFocus?.(event);
      setDraftValue(value === null ? "" : String(value / 100));
      setIsEditing(true);
    }}
    onBlur={() => setIsEditing(false)}
    onChange={(event) => {
      setDraftValue(event.target.value);
      onChange(dollarsToOptionalCents(event.target.value));
    }}
    className={className}
  />;
}

function TextArea({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide">{label}<textarea aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} rows={5} className="rounded-md border-0 bg-gray-100 p-3 text-sm font-medium normal-case tracking-normal" /></label>;
}
