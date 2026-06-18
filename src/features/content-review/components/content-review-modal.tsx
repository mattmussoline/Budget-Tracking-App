"use client";

import Link from "next/link";
import { CalendarPlus, FilePlus2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { contentReviewOptions } from "../content-review-options";
import type { ContentReviewItem } from "../content-review-types";

type ContentReviewModalProps = {
  item: ContentReviewItem;
  onClose: () => void;
  onSave: (item: ContentReviewItem) => void;
  onDelete: (itemId: string) => void;
};

export function ContentReviewModal({ item, onClose, onSave, onDelete }: ContentReviewModalProps) {
  const [draft, setDraft] = useState(item);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-review-modal-title"
      onClick={onClose}
    >
      <article
        className="max-h-[88vh] w-full max-w-5xl overflow-auto rounded-lg bg-white text-gray-950"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-gray-950 p-7 text-white">
          <div className="absolute -right-14 -top-20 h-56 w-56 rounded-full bg-blue-500/30" aria-hidden="true" />
          <button
            type="button"
            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-md bg-white text-gray-950 transition hover:scale-[1.05] hover:bg-gray-100"
            aria-label="Close selected content modal"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="relative z-10">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-blue-200">Selected content piece</p>
            <h2 id="content-review-modal-title" className="font-display text-4xl font-extrabold tracking-tight md:text-6xl">
              {draft.title}
            </h2>
            <p className="mt-3 max-w-2xl text-base font-medium leading-relaxed text-gray-300">
              Use this popup to review the title and decide whether it should move forward.
            </p>
          </div>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-3">
          <ModalTextField label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
          <ModalSelect label="Provider" value={draft.provider} options={contentReviewOptions.providers} onChange={(provider) => setDraft({ ...draft, provider })} />
          <ModalSelect label="Genre" value={draft.genre} options={contentReviewOptions.genres} onChange={(genre) => setDraft({ ...draft, genre })} />
          <ModalSelect label="Format" value={draft.format} options={contentReviewOptions.formats} onChange={(format) => setDraft({ ...draft, format })} />
          <ModalSelect
            label="Review Stage"
            value={draft.reviewStage}
            options={contentReviewOptions.reviewStages}
            onChange={(reviewStage) => setDraft({ ...draft, reviewStage })}
          />
          <ModalSelect
            label="Contract Status"
            value={draft.contractStatus}
            options={contentReviewOptions.contractStatuses}
            onChange={(contractStatus) => setDraft({ ...draft, contractStatus })}
          />
          <ModalSelect label="Audience" value={draft.audience} options={contentReviewOptions.audiences} onChange={(audience) => setDraft({ ...draft, audience })} />
          <ModalTextField label="Release Date" type="date" value={draft.releaseDate} onChange={(releaseDate) => setDraft({ ...draft, releaseDate })} />
          <label className="grid gap-2 rounded-lg bg-gray-100 p-3 text-xs font-extrabold uppercase tracking-wide text-gray-500 md:col-span-3">
            Review Notes
            <textarea
              value={draft.notes}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
              className="min-h-28 resize-y rounded-md border-0 bg-white px-3 py-3 text-base font-bold normal-case tracking-normal text-gray-950"
            />
          </label>
        </div>
        <div className="flex flex-wrap justify-end gap-3 px-5 pb-5">
          <button
            type="button"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-red-50 px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-red-700 transition hover:scale-[1.03] hover:bg-red-100"
            onClick={() => onDelete(draft.id)}
          >
            Delete Content
          </button>
          <button
            type="button"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-gray-100 px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-gray-950 transition hover:scale-[1.03] hover:bg-gray-200"
            onClick={() => onSave(draft)}
          >
            Save Changes
          </button>
          <Link
            href="/roadmap"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald-500 px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:scale-[1.03] hover:bg-emerald-600"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Add to Roadmap
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-blue-500 px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:scale-[1.03] hover:bg-blue-600"
          >
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Send to Contract Tracker
          </Link>
        </div>
      </article>
    </div>
  );
}

function ModalTextField({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date";
}) {
  return (
    <label className="grid gap-2 rounded-lg bg-gray-100 p-3 text-xs font-extrabold uppercase tracking-wide text-gray-500">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-md border-0 bg-white px-3 text-base font-bold normal-case tracking-normal text-gray-950"
      />
    </label>
  );
}

function ModalSelect<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="grid gap-2 rounded-lg bg-gray-100 p-3 text-xs font-extrabold uppercase tracking-wide text-gray-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-h-12 rounded-md border-0 bg-white px-3 text-base font-bold normal-case tracking-normal text-gray-950"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
