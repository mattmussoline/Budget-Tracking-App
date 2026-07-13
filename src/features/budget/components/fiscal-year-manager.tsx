"use client";

import Link from "next/link";
import { MoreHorizontal, Pin, Plus, X } from "lucide-react";
import React, { useEffect, useRef, useState, type ReactNode } from "react";

type FiscalYearOption = {
  id: string;
  label: string;
  fiscal_year: number;
  is_pinned: boolean;
};

type FiscalYearAction = (formData: FormData) => void | Promise<void>;

type FiscalYearManagerProps = {
  fiscalYears: FiscalYearOption[];
  activeFiscalYearId?: string;
  pinAction: FiscalYearAction;
  deleteAction: FiscalYearAction;
  createForm: ReactNode;
  isDemo?: boolean;
  routePrefix?: "" | "/demo";
};

export function FiscalYearManager({
  fiscalYears,
  activeFiscalYearId,
  pinAction,
  deleteAction,
  createForm,
  isDemo = false,
  routePrefix = ""
}: FiscalYearManagerProps) {
  const [menuFiscalYearId, setMenuFiscalYearId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const managerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeMenu(event: PointerEvent) {
      if (!managerRef.current?.contains(event.target as Node)) {
        setMenuFiscalYearId(null);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuFiscalYearId(null);
      }
    }

    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={managerRef} className="mt-5 grid gap-4">
      <nav className="flex flex-wrap items-center gap-2" aria-label="Fiscal year budgets">
        {fiscalYears.map((year) => {
          const isActive = year.id === activeFiscalYearId;
          const isMenuOpen = year.id === menuFiscalYearId;

          return (
            <div key={year.id} className="relative flex items-stretch rounded-md bg-blue-400">
              <Link
                href={`${routePrefix}/dashboard?fy=${year.id}`}
                aria-current={isActive ? "page" : undefined}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setMenuFiscalYearId(year.id);
                }}
                className={`flex min-h-11 items-center gap-1.5 rounded-l-md px-3 py-2 text-sm font-extrabold transition ${
                  isActive ? "bg-white text-blue-700" : "text-white hover:bg-white/20"
                }`}
              >
                {year.is_pinned ? <Pin className="h-3.5 w-3.5" aria-label="Pinned default" /> : null}
                FY{String(year.fiscal_year).slice(-2)}
              </Link>
              <button
                type="button"
                aria-label={`Open actions for ${year.label}`}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                onClick={() => setMenuFiscalYearId(isMenuOpen ? null : year.id)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setMenuFiscalYearId(year.id);
                }}
                className={`grid min-h-11 w-11 place-items-center rounded-r-md border-l transition ${
                  isActive
                    ? "border-blue-100 bg-white text-blue-700 hover:bg-blue-50"
                    : "border-white/20 text-white hover:bg-white/20"
                }`}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </button>

              {isMenuOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-30 mt-2 grid min-w-48 gap-1 rounded-lg border border-gray-200 bg-white p-2 text-gray-900 shadow-xl"
                >
                  <form action={pinAction}>
                    <input type="hidden" name="fiscalYearId" value={year.id} />
                    <button
                      type="submit"
                      role="menuitem"
                      disabled={year.is_pinned || isDemo}
                      className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Pin className="h-4 w-4" aria-hidden="true" />
                      {year.is_pinned ? "Pinned as default" : "Pin as default"}
                    </button>
                  </form>
                  <form
                    action={deleteAction}
                    onSubmit={(event) => {
                      const confirmed = window.confirm(
                        `Permanently delete ${year.label}? This will permanently delete its budget, titles, roadmap items, ongoing series, content-review items, memberships, and provider settings. This cannot be undone.`
                      );

                      if (!confirmed) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="fiscalYearId" value={year.id} />
                    <button
                      type="submit"
                      role="menuitem"
                      disabled={isDemo}
                      className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Delete budget
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          );
        })}

        <button
          type="button"
          disabled={isDemo}
          onClick={() => setIsCreateOpen((isOpen) => !isOpen)}
          className="flex min-h-11 items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-extrabold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add fiscal year
        </button>
      </nav>

      {isCreateOpen ? (
        <div className="relative text-gray-900">
          <button
            type="button"
            aria-label="Cancel adding fiscal year"
            onClick={() => setIsCreateOpen(false)}
            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-md bg-white text-gray-600 shadow-sm transition hover:bg-gray-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          {createForm}
        </div>
      ) : null}
    </div>
  );
}
