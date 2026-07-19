import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { CellSelection } from "@tiptap/pm/tables"

/* eslint-disable @typescript-eslint/no-explicit-any */

export type CellFormat = {
  kind: "number" | "currency" | "percent" | "text"
  currency?: "IDR" | "USD"
  thousands: boolean
  decimals: number
}

const SYMBOL: Record<string, string> = { IDR: "Rp", USD: "$" }
const NEG_COLOR = "#ef4444" // red for negative values, Excel-style

// Parse a number out of possibly-formatted text. A leading "(" (or a "-") means negative,
// so re-reading a "(Rp 1,234.50)" value stays negative.
function parseRaw(text: string): number | null {
  const cleaned = text.replace(/[^0-9.]/g, "")
  if (cleaned === "" || cleaned === ".") return null
  const n = parseFloat(cleaned)
  if (isNaN(n)) return null
  const negative = text.includes("(") || text.includes("-")
  return negative ? -n : n
}

// Returns the formatted display and whether it's negative, or null to leave content untouched.
export function formatCell(text: string, fmt: CellFormat): { display: string; negative: boolean } | null {
  if (!fmt || fmt.kind === "text") return null
  const n = parseRaw(text)
  if (n === null) return null
  const abs = Math.abs(n)
  const num = abs.toLocaleString("en-US", {
    minimumFractionDigits: fmt.decimals,
    maximumFractionDigits: fmt.decimals,
    useGrouping: fmt.thousands,
  })
  let body: string
  if (fmt.kind === "currency") body = `${SYMBOL[fmt.currency || "IDR"] ?? ""} ${num}`.trim()
  else if (fmt.kind === "percent") body = `${num}%`
  else body = num
  const rounded = Number(abs.toFixed(Math.min(fmt.decimals, 20)))
  const negative = n < 0 && rounded !== 0
  return { display: negative ? `(${body})` : body, negative }
}

export function formatCellValue(text: string, fmt: CellFormat): string | null {
  return formatCell(text, fmt)?.display ?? null
}

// Build a marks array from `marks` but with the textStyle color set (or removed when null),
// preserving other textStyle attrs (font/size) and other marks (bold/italic/underline).
function withColor(marks: readonly any[], schema: any, color: string | null): any[] {
  const ts = schema.marks.textStyle
  const others = marks.filter((m: any) => m.type !== ts)
  const existing = marks.find((m: any) => m.type === ts)
  const attrs: any = { ...(existing?.attrs || {}), color }
  const cleaned = Object.fromEntries(Object.entries(attrs).filter(([, v]) => v != null))
  return Object.keys(cleaned).length ? [...others, ts.create(cleaned)] : others
}

function cellAt($pos: any): { node: any; pos: number } | null {
  for (let d = $pos.depth; d > 0; d--) {
    const node = $pos.node(d)
    if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
      return { node, pos: $pos.before(d) }
    }
  }
  return null
}

// Rewrite a cell's content to the formatted value, preserving the paragraph's attrs
// and the marks on its first text run (so bold/color survive).
function reformatCell(tr: any, cellNode: any, cellPos: number, format: CellFormat, schema: any) {
  const res = formatCell(cellNode.textContent, format)
  if (res === null) return
  const firstPara = cellNode.firstChild
  const paraAttrs = firstPara ? firstPara.attrs : {}
  let marks: readonly any[] = []
  cellNode.descendants((n: any) => {
    if (marks.length === 0 && n.isText) marks = n.marks
  })
  // Negatives are red; positives clear the auto-red (font/size preserved).
  const adjusted = withColor(marks, schema, res.negative ? NEG_COLOR : null)
  const textNode = schema.text(res.display, adjusted)
  const paragraph = schema.nodes.paragraph.create(paraAttrs, textNode)
  tr.replaceWith(cellPos + 1, cellPos + cellNode.nodeSize - 1, paragraph)
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tableCellFormat: {
      setCellFormat: (format: CellFormat) => ReturnType
    }
  }
}

export const TableCellFormat = Extension.create({
  name: "tableCellFormat",

  addGlobalAttributes() {
    return [
      {
        types: ["tableCell", "tableHeader"],
        attributes: {
          format: {
            default: null,
            parseHTML: (el: HTMLElement) => {
              const raw = el.getAttribute("data-format")
              return raw ? JSON.parse(raw) : null
            },
            renderHTML: (attrs: any) =>
              attrs.format ? { "data-format": JSON.stringify(attrs.format) } : {},
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setCellFormat: (format) => ({ state, dispatch, tr }) => {
        const sel: any = state.selection
        const cells: { node: any; pos: number }[] = []
        if (sel instanceof CellSelection) {
          sel.forEachCell((node: any, pos: number) => cells.push({ node, pos }))
        } else {
          const c = cellAt(sel.$from)
          if (c) cells.push(c)
        }
        if (!cells.length) return false

        // Set the format attr on every cell (no size change)…
        for (const { node, pos } of cells) {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, format: format.kind === "text" ? null : format })
        }
        // …then reformat content, highest position first so earlier positions stay valid.
        for (const { pos } of [...cells].sort((a, b) => b.pos - a.pos)) {
          const cellNode = tr.doc.nodeAt(pos)
          if (cellNode && format.kind !== "text") reformatCell(tr, cellNode, pos, format, state.schema)
        }
        if (dispatch) dispatch(tr)
        return true
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("tableCellFormat"),
        appendTransaction: (trs, oldState, newState) => {
          if (!trs.some(t => t.selectionSet || t.docChanged)) return null
          const oldCell = cellAt(oldState.selection.$from)
          if (!oldCell || !oldCell.node.attrs.format) return null

          let pos = oldCell.pos
          for (const t of trs) pos = t.mapping.map(pos)

          const newCell = cellAt(newState.selection.$from)
          if (newCell && newCell.pos === pos) return null // still editing the same cell

          const cellNode = newState.doc.nodeAt(pos)
          if (!cellNode || !cellNode.attrs.format) return null

          const tr = newState.tr
          reformatCell(tr, cellNode, pos, cellNode.attrs.format, newState.schema)
          return tr.docChanged ? tr : null
        },
      }),
    ]
  },
})
