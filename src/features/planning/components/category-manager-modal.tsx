"use client";

import { type FormEvent, type KeyboardEvent, type MouseEvent, useRef, useState, useTransition } from "react";
import { KeyRound, Plus, Trash2, X } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { addRoadmapCategory, deleteRoadmapCategory, updateRoadmapCategory } from "../planning-actions";
import { ROADMAP_COLORS } from "../planning-constants";
import type { RoadmapCategory } from "../planning-types";

type CategoryManagerModalProps = {
  fiscalYearId: string;
  categories: RoadmapCategory[];
  isDemo?: boolean;
};

export function CategoryManagerModal({ fiscalYearId, categories, isDemo }: CategoryManagerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  };

  const closeDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else {
      dialog.removeAttribute("open");
      triggerRef.current?.focus();
    }
  };

  const closeFromBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) closeDialog();
  };

  const closeFromEscape = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeDialog();
  };

  return <>
    <button ref={triggerRef} type="button" onClick={openDialog} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-gray-100 px-5 py-3 text-sm font-extrabold uppercase tracking-wide transition-all duration-200 hover:scale-[1.03] hover:bg-gray-200 active:scale-[0.98]">
      <KeyRound className="h-4 w-4" aria-hidden="true" />Manage Key
    </button>
    <dialog ref={dialogRef} aria-labelledby="manage-key-title" onClick={closeFromBackdrop} onKeyDown={closeFromEscape} onClose={() => triggerRef.current?.focus()} className="m-auto w-[calc(100%-2rem)] max-w-3xl rounded-xl bg-white p-0 text-foreground shadow-2xl backdrop:bg-gray-950/60">
      <div className="flex max-h-[calc(100vh-2rem)] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 p-5 sm:p-7">
          <div><p className="text-xs font-extrabold uppercase tracking-wide text-blue-600">Roadmap</p><h2 id="manage-key-title" className="font-display text-3xl font-extrabold">Manage Key</h2><p className="mt-1 text-sm text-muted">Create, rename, recolor, or delete roadmap keys.</p></div>
          <button type="button" onClick={closeDialog} aria-label="Close Manage Key modal" className="rounded-md bg-gray-100 p-3 text-muted transition-colors hover:bg-gray-200 hover:text-foreground"><X className="h-5 w-5" aria-hidden="true" /></button>
        </header>
        <div className="grid min-h-0 gap-3 overflow-y-auto p-5 sm:p-7">
          {categories.map((category) => <CategoryEditor key={category.id} fiscalYearId={fiscalYearId} category={category} isDemo={isDemo} />)}
          <NewCategoryForm fiscalYearId={fiscalYearId} isDemo={isDemo} />
        </div>
        <footer className="flex shrink-0 justify-end border-t border-gray-200 p-4 sm:px-7"><button type="button" onClick={closeDialog} className="min-h-12 rounded-md px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-muted hover:bg-gray-100">Close</button></footer>
      </div>
    </dialog>
  </>;
}

function CategoryEditor({ fiscalYearId, category, isDemo }: { fiscalYearId: string; category: RoadmapCategory; isDemo?: boolean }) {
  const [name, setName] = useState(category.name);
  const [colorKey, setColorKey] = useState(category.colorKey);
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDemo || isPending || !name.trim()) return;
    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    formData.set("categoryId", category.id);
    formData.set("name", name);
    formData.set("colorKey", colorKey);
    setStatus("Saving");
    startTransition(async () => {
      try {
        await updateRoadmapCategory(formData);
        setStatus("Saved");
      } catch {
        setStatus("Error");
      }
    });
  };

  const remove = () => {
    if (isDemo || isPending || !window.confirm("Delete this key? Roadmap items will remain, but they will lose this key and color.")) return;
    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    formData.set("categoryId", category.id);
    startTransition(async () => {
      try {
        await deleteRoadmapCategory(formData);
      } catch {
        setStatus("Error");
      }
    });
  };

  return <form onSubmit={save} className="grid gap-3 rounded-lg bg-gray-100 p-4 sm:grid-cols-[minmax(0,1fr)_150px_auto_auto]">
    <input aria-label={`Category name ${category.name}`} value={name} onChange={(event) => setName(event.target.value)} disabled={isDemo || isPending} className="min-h-11 rounded-md bg-white px-3" />
    <select aria-label={`Category color ${category.name}`} value={colorKey} onChange={(event) => setColorKey(event.target.value)} disabled={isDemo || isPending} className="min-h-11 rounded-md bg-white px-3">{ROADMAP_COLORS.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}</select>
    <SoftButton type="submit" disabled={isDemo || isPending || !name.trim()} aria-label={`Save ${category.name}`}>Save</SoftButton>
    <SoftButton type="button" variant="ghost" onClick={remove} disabled={isDemo || isPending} aria-label={`Delete ${category.name}`} className="text-red-700"><Trash2 className="h-4 w-4" />Delete</SoftButton>
    <span aria-live="polite" className="text-xs font-extrabold uppercase text-muted sm:col-span-4">{status}</span>
  </form>;
}

function NewCategoryForm({ fiscalYearId, isDemo }: { fiscalYearId: string; isDemo?: boolean }) {
  const [name, setName] = useState("");
  const [colorKey, setColorKey] = useState("blue");
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDemo || isPending || !name.trim()) return;
    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    formData.set("name", name);
    formData.set("colorKey", colorKey);
    setStatus("Saving");
    startTransition(async () => {
      try {
        await addRoadmapCategory(formData);
        setName("");
        setColorKey("blue");
        setStatus("Added");
      } catch {
        setStatus("Error");
      }
    });
  };

  return <form onSubmit={add} className="grid gap-3 rounded-lg bg-blue-50 p-4 sm:grid-cols-[minmax(0,1fr)_150px_auto]">
    <input aria-label="New category name" value={name} onChange={(event) => setName(event.target.value)} placeholder="New category" disabled={isDemo || isPending} className="min-h-11 rounded-md bg-white px-3" />
    <select aria-label="New category color" value={colorKey} onChange={(event) => setColorKey(event.target.value)} disabled={isDemo || isPending} className="min-h-11 rounded-md bg-white px-3">{ROADMAP_COLORS.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}</select>
    <SoftButton type="submit" variant="primary" disabled={isDemo || isPending || !name.trim()}><Plus className="h-4 w-4" />Add Key</SoftButton>
    <span aria-live="polite" className="text-xs font-extrabold uppercase text-muted sm:col-span-3">{status}</span>
  </form>;
}
