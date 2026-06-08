"use client";

import type { ContentReviewItem } from "../content-review-types";
import { contentReviewOptions, type ContentReviewOptionGroup } from "../content-review-options";

type EditableField = "reviewStage" | "contractStatus";

const fieldOptions: Record<EditableField, ContentReviewOptionGroup> = {
  reviewStage: "reviewStages",
  contractStatus: "contractStatuses"
};

const reviewStageClass: Record<string, string> = {
  "New Request": "bg-blue-50 text-blue-700",
  "Under Review": "bg-amber-50 text-amber-800",
  "Needs Decision": "bg-red-50 text-red-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-gray-200 text-gray-600",
  Parked: "bg-violet-50 text-violet-700"
};

type ContentReviewTableProps = {
  items: ContentReviewItem[];
  onItemSelect: (item: ContentReviewItem) => void;
  onFieldChange: (itemId: string, field: EditableField, value: string) => void;
  onAddContent: () => void;
};

export function ContentReviewTable({ items, onItemSelect, onFieldChange, onAddContent }: ContentReviewTableProps) {
  return (
    <section className="overflow-x-auto rounded-lg bg-gray-100 p-4 md:p-5" aria-labelledby="decision-queue-title">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="decision-queue-title" className="font-display text-2xl font-extrabold tracking-tight text-gray-950">
            Decision Queue
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Click a title for full details. Approved and rejected items leave this queue automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddContent}
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-blue-500 px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:scale-[1.03] hover:bg-blue-600"
        >
          Add Content
        </button>
      </div>
      <table className="w-full min-w-[760px] border-separate border-spacing-y-2" aria-label="Content review queue">
        <thead>
          <tr>
            {["Title", "Review Stage", "Contract Status"].map((heading) => (
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
              <td className="rounded-l-lg bg-white px-4 py-4 align-middle transition-colors">
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
              <EditableSelect item={item} field="reviewStage" label="Review Stage" onFieldChange={onFieldChange} />
              <EditableSelect item={item} field="contractStatus" label="Contract Status" onFieldChange={onFieldChange} isLast />
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
        className={`min-h-11 w-full min-w-44 rounded-md border-0 px-3 text-sm font-extrabold transition focus:bg-white ${
          field === "reviewStage" ? reviewStageClass[item.reviewStage] : "bg-gray-100 text-gray-700"
        }`}
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
