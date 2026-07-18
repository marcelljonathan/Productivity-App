"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useEditor, EditorContent, useEditorState } from "@tiptap/react"
import type { Content } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import { TextStyle, Color, FontFamily } from "@tiptap/extension-text-style"
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table"
import { createClient } from "@/lib/supabase/client"
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2,
  List, ListOrdered, Table as TableIcon, X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const FONTS: { label: string; value: string }[] = [
  { label: "Default", value: "" },
  { label: "Sans", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "ui-serif, Georgia, Cambria, serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
]

type Props = {
  pageId: string
  initialContent: Record<string, unknown> | null
}

export default function PageEditor({ pageId, initialContent }: Props) {
  const [status, setStatus] = useState<"saved" | "saving">("saved")
  const [showTableOptions, setShowTableOptions] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback((json: Record<string, unknown>) => {
    setStatus("saving")
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const supabase = createClient()
      await supabase.from("custom_pages")
        .update({ content: json, updated_at: new Date().toISOString() })
        .eq("id", pageId)
      setStatus("saved")
    }, 800)
  }, [pageId])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: (initialContent as Content) ?? "",
    onUpdate: ({ editor }) => save(editor.getJSON() as Record<string, unknown>),
  })

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const state = useEditorState({
    editor,
    selector: (ctx) => {
      const e = ctx.editor
      return {
        bold: e?.isActive("bold") ?? false,
        italic: e?.isActive("italic") ?? false,
        underline: e?.isActive("underline") ?? false,
        bullet: e?.isActive("bulletList") ?? false,
        ordered: e?.isActive("orderedList") ?? false,
        h1: e?.isActive("heading", { level: 1 }) ?? false,
        h2: e?.isActive("heading", { level: 2 }) ?? false,
        fontFamily: (e?.getAttributes("textStyle").fontFamily as string) ?? "",
        color: (e?.getAttributes("textStyle").color as string) ?? "",
        inTable: e?.isActive("table") ?? false,
      }
    },
  })

  if (!editor) return <p className="text-sm text-muted-foreground">Loading editor…</p>

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-lg border bg-background/95 backdrop-blur px-2 py-1.5">
        <TbBtn active={state?.bold} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={15} /></TbBtn>
        <TbBtn active={state?.italic} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={15} /></TbBtn>
        <TbBtn active={state?.underline} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon size={15} /></TbBtn>

        <Divider />
        <TbBtn active={state?.h1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 size={15} /></TbBtn>
        <TbBtn active={state?.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 size={15} /></TbBtn>
        <TbBtn active={state?.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list"><List size={15} /></TbBtn>
        <TbBtn active={state?.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list"><ListOrdered size={15} /></TbBtn>

        <Divider />
        {/* Font family */}
        <select
          value={state?.fontFamily ?? ""}
          onChange={e => {
            const f = e.target.value
            if (f) editor.chain().focus().setFontFamily(f).run()
            else editor.chain().focus().unsetFontFamily().run()
          }}
          className="h-7 rounded border bg-background px-1.5 text-xs"
          title="Font"
        >
          {FONTS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
        </select>

        {/* Text color */}
        <label className="flex items-center gap-1 rounded border px-1.5 h-7 cursor-pointer" title="Text color">
          <span className="text-xs" style={{ color: state?.color || undefined }}>A</span>
          <input
            type="color"
            value={state?.color || "#000000"}
            onChange={e => editor.chain().focus().setColor(e.target.value).run()}
            className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
        {state?.color && (
          <TbBtn onClick={() => editor.chain().focus().unsetColor().run()} title="Clear color"><X size={14} /></TbBtn>
        )}

        <Divider />
        <TbBtn
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert table"
        >
          <TableIcon size={15} />
        </TbBtn>

        <div className="ml-auto text-[11px] text-muted-foreground pr-1">
          {status === "saving" ? "Saving…" : "Saved"}
        </div>
      </div>

      {/* Table controls (only inside a table, collapsed under a toggle) */}
      {state?.inTable && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowTableOptions(v => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <span>{showTableOptions ? "▾" : "▸"}</span>
            Table options
          </button>
          {showTableOptions && (
            <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 px-2 py-1.5 text-xs">
              <MiniBtn onClick={() => editor.chain().focus().addColumnBefore().run()}>+ Col left</MiniBtn>
              <MiniBtn onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Col right</MiniBtn>
              <MiniBtn onClick={() => editor.chain().focus().deleteColumn().run()}>− Col</MiniBtn>
              <Divider />
              <MiniBtn onClick={() => editor.chain().focus().addRowBefore().run()}>+ Row above</MiniBtn>
              <MiniBtn onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row below</MiniBtn>
              <MiniBtn onClick={() => editor.chain().focus().deleteRow().run()}>− Row</MiniBtn>
              <Divider />
              <MiniBtn onClick={() => editor.chain().focus().toggleHeaderRow().run()}>Header row</MiniBtn>
              <MiniBtn onClick={() => editor.chain().focus().mergeOrSplit().run()}>Merge/Split</MiniBtn>
              <MiniBtn onClick={() => editor.chain().focus().deleteTable().run()} className="text-red-600">Delete table</MiniBtn>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function TbBtn({ active, onClick, title, children }: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  )
}

function MiniBtn({ onClick, className, children }: {
  onClick: () => void; className?: string; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("rounded border px-2 py-1 hover:bg-muted transition-colors", className)}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-border" />
}
