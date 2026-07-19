"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useEditor, EditorContent, useEditorState } from "@tiptap/react"
import type { Content } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import { TextStyle, Color, FontFamily, FontSize } from "@tiptap/extension-text-style"
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table"
import { createClient } from "@/lib/supabase/client"
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2,
  List, ListOrdered, Table as TableIcon, X, ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

const FONTS: { label: string; value: string }[] = [
  { label: "Default", value: "" },
  { label: "Sans", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "ui-serif, Georgia, Cambria, serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
]

const SIZES: { label: string; value: string }[] = [
  { label: "Size", value: "" },
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "30", value: "30px" },
]

type Props = {
  pageId: string
  initialContent: Record<string, unknown> | null
}

export default function PageEditor({ pageId, initialContent }: Props) {
  const [status, setStatus] = useState<"saved" | "saving">("saved")
  const [showTableOptions, setShowTableOptions] = useState(false)
  const [sizeDraft, setSizeDraft] = useState("")
  const [sizeOpen, setSizeOpen] = useState(false)
  const sizeFocused = useRef(false)
  const savedSel = useRef<{ from: number; to: number } | null>(null)
  const sizeBoxRef = useRef<HTMLDivElement>(null)
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
      FontSize,
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
        fontSize: (e?.getAttributes("textStyle").fontSize as string) ?? "",
        color: (e?.getAttributes("textStyle").color as string) ?? "",
        inTable: e?.isActive("table") ?? false,
      }
    },
  })

  // Keep the size box showing the current selection's size, unless the user is typing in it
  useEffect(() => {
    if (!sizeFocused.current) {
      setSizeDraft(state?.fontSize ? state.fontSize.replace("px", "") : "")
    }
  }, [state?.fontSize])

  // Close the size preset dropdown when clicking anywhere outside it
  useEffect(() => {
    if (!sizeOpen) return
    function onDocMouseDown(e: MouseEvent) {
      if (sizeBoxRef.current && !sizeBoxRef.current.contains(e.target as Node)) setSizeOpen(false)
    }
    document.addEventListener("mousedown", onDocMouseDown)
    return () => document.removeEventListener("mousedown", onDocMouseDown)
  }, [sizeOpen])

  // Apply the typed size to the selection we had when the box was focused
  function applySize() {
    if (!editor) return
    const chain = editor.chain().focus()
    if (savedSel.current) chain.setTextSelection(savedSel.current)
    const n = parseInt(sizeDraft, 10)
    if (sizeDraft.trim() === "") chain.unsetFontSize().run()
    else if (!isNaN(n) && n > 0) chain.setFontSize(`${n}px`).run()
    else chain.run()
  }

  // Apply a preset picked from the dropdown (keeps the saved selection)
  function pickSize(num: string) {
    if (!editor) return
    const n = parseInt(num, 10)
    const chain = editor.chain().focus()
    if (savedSel.current) chain.setTextSelection(savedSel.current)
    if (!isNaN(n) && n > 0) chain.setFontSize(`${n}px`).run()
    else chain.run()
    setSizeDraft(num)
    setSizeOpen(false)
    sizeFocused.current = false
  }

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

        {/* Font size — type a number, or open presets with the chevron */}
        <div className="relative" ref={sizeBoxRef}>
          <div className="flex h-7 items-center rounded border bg-background">
            <input
              value={sizeDraft}
              inputMode="numeric"
              placeholder="Size"
              title="Font size (type a number)"
              onChange={e => setSizeDraft(e.target.value.replace(/[^0-9]/g, ""))}
              onFocus={() => {
                sizeFocused.current = true
                savedSel.current = { from: editor.state.selection.from, to: editor.state.selection.to }
              }}
              onBlur={() => { sizeFocused.current = false; applySize() }}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur() } }}
              className="h-full w-10 bg-transparent px-1.5 text-xs outline-none"
            />
            <button
              type="button"
              title="Size presets"
              onMouseDown={e => {
                e.preventDefault()
                savedSel.current = { from: editor.state.selection.from, to: editor.state.selection.to }
                setSizeOpen(o => !o)
              }}
              className="flex h-full items-center border-l px-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronDown size={12} />
            </button>
          </div>
          {sizeOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 max-h-56 w-16 overflow-y-auto rounded-md border bg-background py-1 shadow-md">
              {SIZES.filter(s => s.value).map(s => (
                <button
                  key={s.value}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); pickSize(s.label) }}
                  className="block w-full px-2 py-1 text-left text-xs hover:bg-muted"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

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
