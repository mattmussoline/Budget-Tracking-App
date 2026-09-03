"use client";

import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";
import { type MouseEvent as ReactMouseEvent, useLayoutEffect, useRef } from "react";
import { cn } from "@/components/ui/soft-surface";
import { NOTE_LINK_CLASS, isEmptyNotesHtml, renderNotesHtml, sanitizeNotesHtml } from "../rich-text";

type RichTextNotesProps = { label: string; value: string; onChange: (value: string) => void; disabled?: boolean };

const TOOLBAR_ACTIONS = [
  { command: "bold", label: "Bold", shortcut: "Cmd+B", Icon: Bold },
  { command: "italic", label: "Italic", shortcut: "Cmd+I", Icon: Italic },
  { command: "underline", label: "Underline", shortcut: "Cmd+U", Icon: Underline },
  { command: "insertUnorderedList", label: "Bulleted list", shortcut: null, Icon: List },
  { command: "insertOrderedList", label: "Numbered list", shortcut: null, Icon: ListOrdered }
] as const;

export function RichTextNotes({ label, value, onChange, disabled }: RichTextNotesProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);

  // Only sync from props while the field is idle. Rewriting innerHTML mid-typing collapses the
  // caret and loses characters, which is the bug this editor already had once.
  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor || isEditingRef.current) return;
    editor.innerHTML = renderNotesHtml(value);
  }, [value]);

  function runCommand(command: string) {
    const editor = editorRef.current;
    if (!editor || disabled) return;
    editor.focus();
    isEditingRef.current = true;
    // Without this, browsers can express bold as <span style> instead of a tag, and the sanitizer
    // would drop the styling on blur.
    document.execCommand?.("styleWithCSS", false, "false");
    document.execCommand?.(command);
    onChange(editor.innerHTML);
  }

  function commit(editor: HTMLDivElement) {
    linkifyEditor(editor);
    const sanitized = sanitizeNotesHtml(editor.innerHTML);
    editor.innerHTML = sanitized;
    onChange(isEmptyNotesHtml(sanitized) ? "" : sanitized);
  }

  return <div className="grid gap-2 text-xs font-semibold uppercase tracking-wide">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span id={`${label}-rich-text-label`}>{label}</span>
      <div role="group" aria-label={`${label} formatting`} className="flex flex-wrap gap-1">
        {TOOLBAR_ACTIONS.map(({ command, label: actionLabel, shortcut, Icon }) => <button
          key={command}
          type="button"
          aria-label={shortcut ? `${actionLabel} (${shortcut})` : actionLabel}
          title={shortcut ? `${actionLabel} (${shortcut})` : actionLabel}
          disabled={disabled}
          // Keep the selection alive: mousedown would otherwise blur the editor before the command runs.
          onMouseDown={(event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault()}
          onClick={() => runCommand(command)}
          className="grid h-8 w-8 place-items-center rounded-md bg-panel-warm text-muted transition hover:bg-hairline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-formed-blue disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>)}
      </div>
    </div>
    <div
      ref={editorRef}
      aria-disabled={disabled}
      aria-label={label}
      className={cn(
        "min-h-[7rem] break-words rounded-md border-0 bg-panel-warm p-3 text-sm font-medium normal-case tracking-normal outline-none focus:ring-2 focus:ring-formed-blue",
        "[&_p]:min-h-[1.25rem] [&_p:not(:last-child)]:mb-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline",
        disabled && "cursor-not-allowed opacity-60"
      )}
      contentEditable={!disabled}
      onBlur={(event) => {
        isEditingRef.current = false;
        commit(event.currentTarget);
      }}
      onClick={(event) => {
        const link = (event.target as HTMLElement).closest("a");
        if (!link) return;
        event.preventDefault();
        window.open(link.href, "_blank", "noopener,noreferrer");
      }}
      onInput={(event) => {
        isEditingRef.current = true;
        onChange(event.currentTarget.innerHTML);
      }}
      onFocus={() => {
        isEditingRef.current = true;
      }}
      onPaste={(event) => {
        const html = event.clipboardData?.getData("text/html");
        const text = event.clipboardData?.getData("text/plain");
        if (!html && !text) return;
        event.preventDefault();
        isEditingRef.current = true;
        const markup = html ? sanitizeNotesHtml(html) : renderNotesHtml(text ?? "");
        document.execCommand?.("insertHTML", false, markup);
        onChange(event.currentTarget.innerHTML);
      }}
      role="textbox"
      aria-multiline="true"
      suppressContentEditableWarning
    />
  </div>;
}

/** Linkifies bare URLs in place so existing bold, italic, and list markup survives. */
function linkifyEditor(editor: HTMLDivElement) {
  const doc = editor.ownerDocument;
  const walker = doc.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  const targets: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.parentElement?.closest("a")) continue;
    if (!/https?:\/\//.test(node.textContent ?? "")) continue;
    targets.push(node);
  }

  for (const node of targets) {
    const parts = (node.textContent ?? "").split(/(https?:\/\/[^\s<>"']+)/g);
    const fragment = doc.createDocumentFragment();

    for (const part of parts) {
      if (!part) continue;
      if (!/^https?:\/\//.test(part)) {
        fragment.appendChild(doc.createTextNode(part));
        continue;
      }
      const anchor = doc.createElement("a");
      anchor.href = part;
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      anchor.className = NOTE_LINK_CLASS;
      anchor.textContent = part;
      fragment.appendChild(anchor);
    }

    node.parentNode?.replaceChild(fragment, node);
  }
}
