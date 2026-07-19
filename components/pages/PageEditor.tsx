"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useEditor, EditorContent, useEditorState } from "@tiptap/react"
import type { Content } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import { TextStyle, Color, FontFamily, FontSize } from "@tiptap/extension-text-style"
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table"
import TextAlign from "@tiptap/extension-text-align"
import { createClient } from "@/lib/supabase/client"
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2,
  List, ListOrdered, Table as TableIcon, X, ChevronDown,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PendingCellMarks, isCellMarkActive, cellTextStyleAttr } from "@/lib/tiptap/pendingCellMarks"

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

// Frequently used colors shown as swatches (custom RGB still available via the picker)
const COLORS: string[] = [
  "#000000", "#6b7280", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
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
  const sizeBoxRef = useRef<HTMLDivElement>(null)
  const [colorOpen, setColorOpen] = useState(false)
  const colorBoxRef = useRef<HTMLDivElement>(null)
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
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      PendingCellMarks,
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
        bold: e ? isCellMarkActive(e, "bold") : false,
        italic: e ? isCellMarkActive(e, "italic") : false,
        underline: e ? isCellMarkActive(e, "underline") : false,
        bullet: e?.isActive("bulletList") ?? false,
        ordered: e?.isActive("orderedList") ?? false,
        h1: e?.isActive("heading", { level: 1 }) ?? false,
        h2: e?.isActive("heading", { level: 2 }) ?? false,
        alignLeft: e?.isActive({ textAlign: "left" }) ?? false,
        alignCenter: e?.isActive({ textAlign: "center" }) ?? false,
        alignRight: e?.isActive({ textAlign: "right" }) ?? false,
        alignJustify: e?.isActive({ textAlign: "justify" }) ?? false,
        fontFamily: e ? cellTextStyleAttr(e, "fontFamily") : "",
        fontSize: e ? cellTextStyleAttr(e, "fontSize") : "",
        color: e ? cellTextStyleAttr(e, "color") : "",
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

  // Close the color dropdown when clicking outside it
  useEffect(() => {
    if (!colorOpen) return
    function onDocMouseDown(e: MouseEvent) {
      if (colorBoxRef.current && !colorBoxRef.current.contains(e.target as Node)) setColorOpen(false)
    }
    document.addEventListener("mousedown", onDocMouseDown)
    return () => document.removeEventListener("mousedown", onDocMouseDown)
  }, [colorOpen])

  function applyColor(hex: string) {
    editor?.chain().focus().applyCellMark("textStyle", { color: hex }).run()
  }
  function clearColor() {
    editor?.chain().focus().applyCellMark("textStyle", { color: null }).run()
  }

  // Apply the typed size to the current selection (cell-aware)
  function applySize() {
    if (!editor) return
    const n = parseInt(sizeDraft, 10)
    if (sizeDraft.trim() === "") editor.chain().focus().applyCellMark("textStyle", { fontSize: null }).run()
    else if (!isNaN(n) && n > 0) editor.chain().focus().applyCellMark("textStyle", { fontSize: `${n}px` }).run()
  }

  // Apply a preset picked from the dropdown
  function pickSize(num: string) {
    if (!editor) return
    const n = parseInt(num, 10)
    if (!isNaN(n) && n > 0) editor.chain().focus().applyCellMark("textStyle", { fontSize: `${n}px` }).run()
    setSizeDraft(num)
    setSizeOpen(false)
    sizeFocused.current = false
  }

  if (!editor) return <p className="text-sm text-muted-foreground">Loading editor…</p>

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-lg border bg-background/95 backdrop-blur px-2 py-1.5">
        <TbBtn active={state?.bold} onClick={() => editor.chain().focus().applyCellMark("bold").run()} title="Bold"><Bold size={15} /></TbBtn>
        <TbBtn active={state?.italic} onClick={() => editor.chain().focus().applyCellMark("italic").run()} title="Italic"><Italic size={15} /></TbBtn>
        <TbBtn active={state?.underline} onClick={() => editor.chain().focus().applyCellMark("underline").run()} title="Underline"><UnderlineIcon size={15} /></TbBtn>

        <Divider />
        <TbBtn active={state?.h1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 size={15} /></TbBtn>
        <TbBtn active={state?.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 size={15} /></TbBtn>
        <TbBtn active={state?.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list"><List size={15} /></TbBtn>
        <TbBtn active={state?.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list"><ListOrdered size={15} /></TbBtn>

        <Divider />
        <TbBtn active={state?.alignLeft} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left"><AlignLeft size={15} /></TbBtn>
        <TbBtn active={state?.alignCenter} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center"><AlignCenter size={15} /></TbBtn>
        <TbBtn active={state?.alignRight} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right"><AlignRight size={15} /></TbBtn>
        <TbBtn active={state?.alignJustify} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justify"><AlignJustify size={15} /></TbBtn>

        <Divider />
        {/* Font family */}
        <select
          value={state?.fontFamily ?? ""}
          onChange={e => {
            const f = e.target.value
            editor.chain().focus().applyCellMark("textStyle", { fontFamily: f || null }).run()
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
              onFocus={() => { sizeFocused.current = true }}
              onBlur={() => { sizeFocused.current = false; applySize() }}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur() } }}
              className="h-full w-10 bg-transparent px-1.5 text-xs outline-none"
            />
            <button
              type="button"
              title="Size presets"
              onMouseDown={e => { e.preventDefault(); setSizeOpen(o => !o) }}
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

        {/* Text color — presets + custom picker */}
        <div className="relative" ref={colorBoxRef}>
          <button
            type="button"
            title="Text color"
            onMouseDown={e => { e.preventDefault(); setColorOpen(o => !o) }}
            className="flex h-7 items-center gap-1 rounded border px-1.5"
          >
            <span className="text-xs font-semibold" style={{ color: state?.color || undefined }}>A</span>
            <span className="h-2.5 w-2.5 rounded-sm border" style={{ background: state?.color || "transparent" }} />
            <ChevronDown size={12} className="text-muted-foreground" />
          </button>
          {colorOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-40 rounded-md border bg-background p-2 shadow-md">
              <div className="grid grid-cols-5 gap-1.5">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onMouseDown={e => { e.preventDefault(); applyColor(c); setColorOpen(false) }}
                    className="h-5 w-5 rounded-sm border"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-2">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer" title="Custom color">
                  <span className="h-4 w-4 rounded-sm border" style={{ background: state?.color || "transparent" }} />
                  Custom
                  <input
                    type="color"
                    value={state?.color || "#000000"}
                    onChange={e => applyColor(e.target.value)}
                    className="h-5 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                </label>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); clearColor(); setColorOpen(false) }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X size={12} /> Clear
                </button>
              </div>
            </div>
          )}
        </div>

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
      // Keep the editor's selection (incl. multi-cell selection) — don't let the button steal focus
      onMouseDown={e => e.preventDefault()}
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
      onMouseDown={e => e.preventDefault()}
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
