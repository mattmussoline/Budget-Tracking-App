"use client";

import { useRouter } from "next/navigation";
import { type DragEvent, type FormEvent, type KeyboardEvent, type MouseEvent, useEffect, useRef, useState, useTransition } from "react";
import { GripVertical, KeyRound, Plus, Trash2, X } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { addRoadmapCategory, deleteRoadmapCategory, reorderRoadmapCategories, updateRoadmapCategory } from "../planning-actions";
import { ROADMAP_COLORS } from "../planning-constants";
import type { RoadmapCategory } from "../planning-types";

type CategoryManagerModalProps = {
  fiscalYearId: string;
  categories: RoadmapCategory[];
  isDemo?: boolean;
};

export function CategoryManagerModal({ fiscalYearId, categories, isDemo }: CategoryManagerModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [orderedCategories, setOrderedCategories] = useState(categories);
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState("");
  const [isOrdering, startOrdering] = useTransition();

  useEffect(() => {
    setOrderedCategories(categories);
  }, [categories]);

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

  const saveOrder = (nextCategories: RoadmapCategory[]) => {
    if (isDemo) return;
    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    nextCategories.forEach((category) => formData.append("categoryIds", category.id));
    setOrderStatus("Saving order");
    startOrdering(async () => {
      try {
        await reorderRoadmapCategories(formData);
        setOrderStatus("Order saved");
        router.refresh();
      } catch {
        setOrderStatus("Order error");
      }
    });
  };

  const moveCategory = (sourceId: string, targetId: string) => {
    if (sourceId === targetId || isOrdering) return;
    const sourceIndex = orderedCategories.findIndex((category) => category.id === sourceId);
    const targetIndex = orderedCategories.findIndex((category) => category.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const nextCategories = [...orderedCategories];
    const [movedCategory] = nextCategories.splice(sourceIndex, 1);
    nextCategories.splice(targetIndex, 0, movedCategory);
    setOrderedCategories(nextCategories);
    saveOrder(nextCategories);
  };

  const startCategoryDrag = (event: DragEvent<HTMLFormElement>, categoryId: string) => {
    if (isDemo || isOrdering) {
      event.preventDefault();
      return;
    }
    setDraggedCategoryId(categoryId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", categoryId);
  };

  const dropCategory = (event: DragEvent<HTMLFormElement>, targetId: string) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("text/plain") || draggedCategoryId;
    setDraggedCategoryId(null);
    if (!sourceId) return;
    moveCategory(sourceId, targetId);
  };

  return <>
    <button ref={triggerRef} type="button" onClick={openDialog} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-gray-100 px-5 py-3 text-sm font-extrabold uppercase tracking-wide transition-all duration-200 hover:scale-[1.03] hover:bg-gray-200 active:scale-[0.98]">
      <KeyRound className="h-4 w-4" aria-hidden="true" />Manage Key
    </button>
    <dialog ref={dialogRef} aria-labelledby="manage-key-title" onClick={closeFromBackdrop} onKeyDown={closeFromEscape} onClose={() => triggerRef.current?.focus()} className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-xl bg-white p-0 text-foreground shadow-2xl backdrop:bg-gray-950/60">
      <div className="flex max-h-[calc(100vh-2rem)] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 p-4 sm:p-5">
          <div><p className="text-[11px] font-extrabold uppercase tracking-wide text-blue-600">Roadmap</p><h2 id="manage-key-title" className="font-display text-2xl font-extrabold">Manage Key</h2><p className="mt-1 text-xs font-bold text-muted">Roadmap key overview.</p></div>
          <button type="button" onClick={closeDialog} aria-label="Close Manage Key modal" className="rounded-md bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"><X className="h-5 w-5" aria-hidden="true" /></button>
        </header>
        <div className="grid min-h-0 gap-2 overflow-y-auto p-4 sm:p-5">
          <span aria-live="polite" className="min-h-4 text-xs font-extrabold uppercase text-muted">{orderStatus}</span>
          {orderedCategories.map((category) => <CategoryEditor key={category.id} fiscalYearId={fiscalYearId} category={category} isDemo={isDemo} isOrdering={isOrdering} draggedCategoryId={draggedCategoryId} onDragStart={startCategoryDrag} onDragEnd={() => setDraggedCategoryId(null)} onDragOver={(event) => event.preventDefault()} onDrop={dropCategory} />)}
          <NewCategoryForm fiscalYearId={fiscalYearId} isDemo={isDemo} />
        </div>
        <footer className="flex shrink-0 justify-end border-t border-gray-200 p-3 sm:px-5"><button type="button" onClick={closeDialog} className="min-h-10 rounded-md bg-blue-600 px-5 py-2 text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-blue-700">Close</button></footer>
      </div>
    </dialog>
  </>;
}

function CategoryEditor({
  fiscalYearId,
  category,
  isDemo,
  isOrdering,
  draggedCategoryId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: {
  fiscalYearId: string;
  category: RoadmapCategory;
  isDemo?: boolean;
  isOrdering: boolean;
  draggedCategoryId: string | null;
  onDragStart: (event: DragEvent<HTMLFormElement>, categoryId: string) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLFormElement>) => void;
  onDrop: (event: DragEvent<HTMLFormElement>, categoryId: string) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [colorKey, setColorKey] = useState(category.colorKey);
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setName(category.name);
    setColorKey(category.colorKey);
  }, [category.colorKey, category.name]);

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
        router.refresh();
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
        router.refresh();
      } catch {
        setStatus("Error");
      }
    });
  };

  return <form draggable={!isDemo && !isOrdering} onDragStart={(event) => onDragStart(event, category.id)} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={(event) => onDrop(event, category.id)} onSubmit={save} className={`grid gap-2 rounded-md bg-gray-100 p-3 transition-opacity sm:grid-cols-[auto_minmax(0,1fr)_132px_auto_auto] ${draggedCategoryId === category.id ? "opacity-60" : ""}`}>
    <button type="button" aria-label={`Drag ${category.name}`} className="flex min-h-10 cursor-grab items-center justify-center rounded-md bg-white px-2 text-muted active:cursor-grabbing" tabIndex={-1}><GripVertical className="h-4 w-4" aria-hidden="true" /></button>
    <input aria-label={`Category name ${category.name}`} value={name} onChange={(event) => setName(event.target.value)} disabled={isDemo || isPending || isOrdering} className="min-h-10 rounded-md bg-white px-3 text-sm" />
    <select aria-label={`Category color ${category.name}`} value={colorKey} onChange={(event) => setColorKey(event.target.value)} disabled={isDemo || isPending || isOrdering} className="min-h-10 rounded-md bg-white px-3 text-sm">{ROADMAP_COLORS.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}</select>
    <SoftButton type="submit" disabled={isDemo || isPending || isOrdering || !name.trim()} aria-label={`Save ${category.name}`}>Save</SoftButton>
    <SoftButton type="button" variant="ghost" onClick={remove} disabled={isDemo || isPending || isOrdering} aria-label={`Delete ${category.name}`} className="text-red-700"><Trash2 className="h-4 w-4" />Delete</SoftButton>
    <span aria-live="polite" className="text-xs font-extrabold uppercase text-muted sm:col-span-5">{status}</span>
  </form>;
}

function NewCategoryForm({ fiscalYearId, isDemo }: { fiscalYearId: string; isDemo?: boolean }) {
  const router = useRouter();
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
        router.refresh();
      } catch {
        setStatus("Error");
      }
    });
  };

  return <form onSubmit={add} className="grid gap-2 rounded-md bg-blue-50 p-3 sm:grid-cols-[minmax(0,1fr)_132px_auto]">
    <input aria-label="New category name" value={name} onChange={(event) => setName(event.target.value)} placeholder="New category" disabled={isDemo || isPending} className="min-h-10 rounded-md bg-white px-3 text-sm" />
    <select aria-label="New category color" value={colorKey} onChange={(event) => setColorKey(event.target.value)} disabled={isDemo || isPending} className="min-h-10 rounded-md bg-white px-3 text-sm">{ROADMAP_COLORS.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}</select>
    <SoftButton type="submit" variant="primary" disabled={isDemo || isPending || !name.trim()}><Plus className="h-4 w-4" />Add Key</SoftButton>
    <span aria-live="polite" className="text-xs font-extrabold uppercase text-muted sm:col-span-3">{status}</span>
  </form>;
}
