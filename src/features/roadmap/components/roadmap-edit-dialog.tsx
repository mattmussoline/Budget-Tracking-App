"use client";

import { X } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/components/ui/soft-surface";
import { releaseColorOptions } from "../release-colors";
import type { OngoingSeries, RoadmapMonth, RoadmapRelease } from "../roadmap-types";

export type ReleaseFieldOptions = {
  audiences: string[];
  formats: string[];
  statuses: string[];
  genres: string[];
  useCases: string[];
  series: string[];
};

type RoadmapEditDialogProps =
  | {
      mode: "release";
      title: string;
      value: RoadmapRelease;
      months: RoadmapMonth[];
      options: ReleaseFieldOptions;
      selectedMonthLabel: string;
      onMonthChange: (monthLabel: string) => void;
      onChange: (value: RoadmapRelease) => void;
      onSave: () => void;
      onClose: () => void;
    }
  | {
      mode: "series";
      title: string;
      value: OngoingSeries;
      onChange: (value: OngoingSeries) => void;
      onSave: () => void;
      onClose: () => void;
    };

export function RoadmapEditDialog(props: RoadmapEditDialogProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-gray-950/30 p-3 sm:place-items-center">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-blue-600">
              {props.mode === "release" ? "Release Card" : "Ongoing Series"}
            </p>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-gray-950">{props.title}</h2>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-md bg-gray-100 text-gray-700 transition hover:scale-[1.03] hover:bg-gray-200"
            onClick={props.onClose}
            aria-label="Close editor"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {props.mode === "release" ? <ReleaseEditor {...props} /> : <SeriesEditor {...props} />}
      </section>
    </div>
  );
}

function ReleaseEditor({
  value,
  months,
  selectedMonthLabel,
  onMonthChange,
  options,
  onChange,
  onSave,
  onClose
}: Extract<RoadmapEditDialogProps, { mode: "release" }>) {
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ComboField label="Month" value={selectedMonthLabel} options={months.map((month) => month.label)} onChange={onMonthChange} />
        <Field label="Title" value={value.title} placeholder="Title" onChange={(title) => onChange({ ...value, title })} />
        <ComboField label="Audience" value={value.audience} options={options.audiences} onChange={(audience) => onChange({ ...value, audience })} />
        <ComboField label="Format" value={value.format} options={options.formats} onChange={(format) => onChange({ ...value, format })} />
        <Field label="Release Date" value={value.releaseDate} placeholder="TBD or 9/1" onChange={(releaseDate) => onChange({ ...value, releaseDate })} />
        <ComboField label="Status" value={value.status} options={options.statuses} onChange={(status) => onChange({ ...value, status })} />
        <ComboField label="Genre" value={value.genre} options={options.genres} onChange={(genre) => onChange({ ...value, genre })} />
        <ComboField label="Series" value={value.series ?? ""} options={options.series} onChange={(series) => onChange({ ...value, series })} />
        <ComboField label="Use Case" value={value.useCase} options={options.useCases} onChange={(useCase) => onChange({ ...value, useCase })} />
        <ColorField value={value.colorOverride ?? ""} onChange={(colorOverride) => onChange({ ...value, colorOverride })} />
      </div>
      <TextArea label="Notes" value={value.notes} placeholder="Planning notes" onChange={(notes) => onChange({ ...value, notes })} />
      <DialogActions onClose={onClose} />
    </form>
  );
}

function ComboField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const customInputId = useId();
  const optionValues = uniqueOptions(options);
  const matchingOption = optionValues.find((option) => option.toLowerCase() === value.trim().toLowerCase());
  const isCustom = Boolean(value.trim()) && !matchingOption;
  const [isAddingCustom, setIsAddingCustom] = useState(isCustom);
  const showCustomInput = isCustom || isAddingCustom;
  const selectValue = showCustomInput ? "__custom__" : matchingOption ?? "";

  return (
    <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide text-gray-900">
      {label}
      <select
        className={selectClassName(selectValue)}
        value={selectValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          const nextIsCustom = nextValue === "__custom__";
          setIsAddingCustom(nextIsCustom);
          if (!nextIsCustom) {
            onChange(nextValue);
          }
        }}
      >
        <option value="">Select {label}</option>
        {optionValues.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value="__custom__">Custom...</option>
      </select>
      {showCustomInput ? (
        <input
          id={customInputId}
          aria-label={`Custom ${label}`}
          className="min-h-11 rounded-md border-0 bg-gray-50 px-3 text-sm font-bold normal-case tracking-normal text-gray-950 placeholder:text-gray-300 focus:bg-white focus:outline focus:outline-2 focus:outline-blue-500"
          value={value}
          placeholder={`Custom ${label.toLowerCase()}`}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}
    </label>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide text-gray-900">
      Color
      <select className={selectClassName(value)} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Automatic</option>
        {releaseColorOptions.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function selectClassName(value: string) {
  return cn(
    "min-h-11 rounded-md border-0 bg-gray-100 px-3 text-sm font-bold normal-case tracking-normal focus:bg-white focus:outline focus:outline-2 focus:outline-blue-500",
    value ? "text-gray-950" : "text-gray-400"
  );
}

function uniqueOptions(options: string[]) {
  const seen = new Set<string>();

  return options
    .map((option) => option.trim())
    .filter((option) => {
      const key = option.toLowerCase();
      if (!option || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function SeriesEditor({ value, onChange, onSave, onClose }: Extract<RoadmapEditDialogProps, { mode: "series" }>) {
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Series" value={value.series} onChange={(series) => onChange({ ...value, series })} />
        <Field label="Start Date" value={value.startDate} onChange={(startDate) => onChange({ ...value, startDate })} />
        <Field label="End Date" value={value.endDate} onChange={(endDate) => onChange({ ...value, endDate })} />
        <Field label="Cadence" value={value.cadence} onChange={(cadence) => onChange({ ...value, cadence })} />
      </div>
      <TextArea label="Notes" value={value.notes} onChange={(notes) => onChange({ ...value, notes })} />
      <DialogActions onClose={onClose} />
    </form>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide text-gray-900">
      {label}
      <input
        className="min-h-11 rounded-md border-0 bg-gray-100 px-3 text-sm font-bold normal-case tracking-normal text-gray-950 placeholder:text-gray-300 focus:bg-white focus:outline focus:outline-2 focus:outline-blue-500"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  placeholder,
  onChange
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide text-gray-900">
      {label}
      <textarea
        className="min-h-28 rounded-md border-0 bg-gray-100 px-3 py-3 text-sm font-bold normal-case tracking-normal text-gray-950 placeholder:text-gray-300 focus:bg-white focus:outline focus:outline-2 focus:outline-blue-500"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function DialogActions({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-wrap justify-end gap-3">
      <button
        type="button"
        className="min-h-11 rounded-md bg-gray-100 px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-gray-700 transition hover:scale-[1.03] hover:bg-gray-200"
        onClick={onClose}
      >
        Cancel
      </button>
      <button
        type="submit"
        className="min-h-11 rounded-md bg-blue-500 px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-white transition hover:scale-[1.03] hover:bg-blue-600"
      >
        Save Changes
      </button>
    </div>
  );
}
