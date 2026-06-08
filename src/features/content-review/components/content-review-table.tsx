"use client";

import type { ContentReviewItem } from "../content-review-types";
import { contentReviewOptions, type ContentReviewOptionGroup } from "../content-review-options";

type EditableField = "provider" | "genre" | "format" | "reviewStage" | "contractStatus" | "audience";

const fieldOptions: Record<EditableField, ContentReviewOptionGroup> = {
  provider: "providers",
  genre: "genres",
  format: "formats",
  reviewStage: "reviewStages",
  contractStatus: "contractStatuses",
  audience: "audiences"
};

const fieldClass: Record<EditableField, string> = {
  provider: "bg-blue-50 text-blue-700",
  genre: "bg-orange-50 text-orange-800",
  format: "bg-emerald-50 text-emerald-700",
  reviewStage: "bg-amber-50 text-amber-800",
  contractStatus: "bg-gray-100 text-gray-700",
  audience: "bg-violet-50 text-violet-800"
};

type ContentReviewTableProps = {
  items: ContentReviewItem[];
  onItemSelect: (item: ContentReviewItem) => void;
  onFieldChange: (itemId: string, field: EditableField, value: string) => void;
};

export function ContentReviewTable({ items, onItemSelect, onFieldChange }: ContentReviewTableProps) {
  return (
    <section className="overflow-x-auto rounded-lg bg-gray-100 p-4" aria-labelledby="decision-queue-title">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="decision-queue-title" className="font-display text-2xl font-extrabold tracking-tight text-gray-950">
            Decision Queue
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Click a content title to open the full review modal. Fields can be edited directly from the queue.
          </p>
        </div>
      </div>
      <table className="w-full min-w-[1120px] border-separate border-spacing-y-2" aria-label="Content review queue">
        <thead>
          <tr>
            {["Title", "Provider", "Genre", "Format", "Review Stage", "Contract Status", "Audience"].map((heading) => (
              <th key={heading} className="px-3 pb-1 text-left text-xs font-extrabold uppercase tracking-wide text-gray-500">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="cursor-pointer transition hover:scale-[1.006]"
              onClick={() => onItemSelect(item)}
            >
              <td className="rounded-l-lg bg-white px-3 py-4 align-middle transition-colors group-hover:bg-blue-50">
                <button
                  type="button"
                  className="text-left transition hover:text-blue-700 focus-visible:rounded-md"
                  aria-label={`Open ${item.title} review details`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onItemSelect(item);
                  }}
                >
                  <span className="block text-base font-extrabold tracking-tight text-gray-950">{item.title}</span>
                  <span className="mt-1 block text-sm font-medium text-gray-500">{item.summary}</span>
                </button>
              </td>
              <EditableSelect item={item} field="provider" label="Provider" onFieldChange={onFieldChange} />
              <EditableSelect item={item} field="genre" label="Genre" onFieldChange={onFieldChange} />
              <EditableSelect item={item} field="format" label="Format" onFieldChange={onFieldChange} />
              <EditableSelect item={item} field="reviewStage" label="Review Stage" onFieldChange={onFieldChange} />
              <EditableSelect item={item} field="contractStatus" label="Contract Status" onFieldChange={onFieldChange} />
              <EditableSelect item={item} field="audience" label="Audience" onFieldChange={onFieldChange} isLast />
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function EditableSelect({
  item,
  field,
  label,
  onFieldChange,
  isLast = false
}: {
  item: ContentReviewItem;
  field: EditableField;
  label: string;
  onFieldChange: (itemId: string, field: EditableField, value: string) => void;
  isLast?: boolean;
}) {
  return (
    <td className={`${isLast ? "rounded-r-lg" : ""} bg-white px-3 py-4 align-middle transition-colors`}>
      <label className="sr-only" htmlFor={`${field}-${item.id}`}>
        {label} for {item.title}
      </label>
      <select
        id={`${field}-${item.id}`}
        value={item[field]}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onFieldChange(item.id, field, event.target.value)}
        className={`min-h-11 w-full min-w-36 rounded-md border-0 bg-gray-100 px-3 text-sm font-extrabold transition focus:bg-white ${fieldClass[field]}`}
        aria-label={`${label} for ${item.title}`}
      >
        {contentReviewOptions[fieldOptions[field]].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </td>
  );
}
