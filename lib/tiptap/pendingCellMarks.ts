import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { CellSelection } from "@tiptap/pm/tables"

// A "pending mark" is a mark we want empty cells to remember and apply to text typed later.
type PendingMark = { type: string; attrs?: Record<string, unknown> }

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pendingCellMarks: {
      // Apply a mark across a cell-selection: text cells get it directly, empty cells remember it.
      applyCellMark: (markName: string, attrs?: Record<string, unknown>) => ReturnType
    }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function marksFromPending(pending: PendingMark[], schema: any) {
  return pending
    .filter(m => schema.marks[m.type])
    .map(m => schema.marks[m.type].create(m.attrs || {}))
}

// Merge a mark into an empty cell's pending list (textStyle merges attrs; toggles add/remove).
function mergePending(
  pending: PendingMark[] | null,
  markName: string,
  attrs: Record<string, unknown>,
  adding: boolean,
): PendingMark[] {
  const list = (pending || []).filter(Boolean)
  if (markName === "textStyle") {
    const existing = list.find(m => m.type === "textStyle")
    const merged: Record<string, unknown> = { ...(existing?.attrs || {}), ...attrs }
    const cleaned = Object.fromEntries(Object.entries(merged).filter(([, v]) => v != null))
    const rest = list.filter(m => m.type !== "textStyle")
    return Object.keys(cleaned).length ? [...rest, { type: "textStyle", attrs: cleaned }] : rest
  }
  const has = list.some(m => m.type === markName)
  if (adding && !has) return [...list, { type: markName }]
  if (!adding && has) return list.filter(m => m.type !== markName)
  return list
}

// Do all cells in a cell-selection already carry this mark? (empty cells check pendingMarks,
// text cells check their text). Used for both toggle direction and toolbar active state.
function cellsAllHaveMark(state: any, sel: any, markName: string): boolean {
  let allHave = true
  let anyCell = false
  sel.forEachCell((cell: any, pos: number) => {
    anyCell = true
    const para = cell.firstChild
    if (!para) return
    if (para.content.size === 0) {
      const pend: PendingMark[] = para.attrs.pendingMarks || []
      if (!pend.some(m => m.type === markName)) allHave = false
    } else {
      const from = pos + 1
      const to = pos + cell.nodeSize - 1
      state.doc.nodesBetween(from, to, (node: any) => {
        if (node.isText && !node.marks.some((m: any) => m.type.name === markName)) allHave = false
      })
    }
  })
  return anyCell && allHave
}

// Toolbar active state that also understands cell-selections (falls back to isActive otherwise).
export function isCellMarkActive(editor: any, markName: string): boolean {
  const sel = editor.state.selection
  if (!(sel instanceof CellSelection)) return editor.isActive(markName)
  return cellsAllHaveMark(editor.state, sel, markName)
}

// Reads a textStyle attribute (color / fontFamily / fontSize) across a cell-selection.
// Returns the shared value if every selected cell agrees, otherwise "" (mixed/none).
export function cellTextStyleAttr(editor: any, attrName: string): string {
  const state = editor.state
  const sel: any = state.selection
  if (!(sel instanceof CellSelection)) {
    return (editor.getAttributes("textStyle")[attrName] as string) ?? ""
  }
  const values: (string | null)[] = []
  let mixed = false
  sel.forEachCell((cell: any, pos: number) => {
    const para = cell.firstChild
    if (!para) return
    if (para.content.size === 0) {
      const pend: PendingMark[] = para.attrs.pendingMarks || []
      const ts = pend.find(m => m.type === "textStyle")
      values.push((ts?.attrs?.[attrName] as string) ?? null)
    } else {
      const from = pos + 1
      const to = pos + cell.nodeSize - 1
      let first: string | null | undefined = undefined
      state.doc.nodesBetween(from, to, (node: any) => {
        if (!node.isText) return
        const ts = node.marks.find((m: any) => m.type.name === "textStyle")
        const v = (ts?.attrs?.[attrName] as string) ?? null
        if (first === undefined) first = v
        else if (first !== v) mixed = true
      })
      values.push(first === undefined ? null : first)
    }
  })
  if (mixed || values.length === 0) return ""
  return values.every(v => v === values[0]) && values[0] ? values[0] : ""
}

export const PendingCellMarks = Extension.create({
  name: "pendingCellMarks",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph"],
        attributes: {
          pendingMarks: {
            default: null,
            keepOnSplit: false,
            parseHTML: (el: HTMLElement) => {
              const raw = el.getAttribute("data-pending-marks")
              return raw ? JSON.parse(raw) : null
            },
            renderHTML: (attrs: any) =>
              attrs.pendingMarks ? { "data-pending-marks": JSON.stringify(attrs.pendingMarks) } : {},
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      applyCellMark: (markName, attrs = {}) => ({ state, dispatch, tr, commands }) => {
        const sel: any = state.selection

        if (!(sel instanceof CellSelection)) {
          // Cursor sitting in a single EMPTY cell → edit that cell's pending marks (so it toggles
          // and persists, instead of a stored mark that appendTransaction would immediately re-seed).
          const $c = sel.$cursor
          const cellName = $c && $c.node($c.depth - 1)?.type.name
          const inEmptyCell =
            $c && $c.parent.type.name === "paragraph" && $c.parent.content.size === 0 &&
            (cellName === "tableCell" || cellName === "tableHeader")
          if (inEmptyCell) {
            const para = $c.parent
            const paraPos = $c.before()
            const has = (para.attrs.pendingMarks || []).some((m: PendingMark) => m.type === markName)
            const adding = markName === "textStyle" ? true : !has
            const merged = mergePending(para.attrs.pendingMarks, markName, attrs, adding)
            tr.setNodeMarkup(paraPos, undefined, { ...para.attrs, pendingMarks: merged.length ? merged : null })
            tr.setStoredMarks(marksFromPending(merged, state.schema))
            if (dispatch) dispatch(tr)
            return true
          }
          // Normal selection / non-cell empty line: standard behavior
          if (markName === "textStyle") return commands.setMark("textStyle", attrs)
          return commands.toggleMark(markName)
        }

        const schema = state.schema
        const markType = schema.marks[markName]
        if (!markType) return false

        // Toggle direction (bold/italic/underline): remove only if EVERY selected cell already
        // has the mark. textStyle always sets.
        const adding = markName === "textStyle" ? true : !cellsAllHaveMark(state, sel, markName)
        let changed = false

        sel.forEachCell((cell: any, pos: number) => {
          const para = cell.firstChild
          if (!para) return
          const paraPos = pos + 1

          if (para.content.size === 0) {
            // Empty cell: remember the mark so future typing inherits it
            const merged = mergePending(para.attrs.pendingMarks, markName, attrs, adding)
            tr.setNodeMarkup(paraPos, undefined, { ...para.attrs, pendingMarks: merged.length ? merged : null })
            changed = true
            return
          }

          // Cell with text: apply directly, merging textStyle attrs so we don't wipe other styles
          const from = pos + 1
          const to = pos + cell.nodeSize - 1
          if (markName === "textStyle") {
            state.doc.nodesBetween(from, to, (node: any, p2: number) => {
              if (!node.isText) return
              const existing = node.marks.find((m: any) => m.type === markType)
              const a = existing ? { ...existing.attrs, ...attrs } : attrs
              tr.addMark(Math.max(p2, from), Math.min(p2 + node.nodeSize, to), markType.create(a))
            })
          } else if (adding) {
            tr.addMark(from, to, markType.create())
          } else {
            tr.removeMark(from, to, markType)
          }
          changed = true
        })

        if (changed && dispatch) dispatch(tr)
        return changed
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("pendingCellMarks"),
        appendTransaction: (trs, _oldState, newState) => {
          let tr: any = null

          // Once a paragraph gains content, its pending marks have been consumed — clear them.
          if (trs.some(t => t.docChanged)) {
            newState.doc.descendants((node: any, pos: number) => {
              if (node.type.name === "paragraph" && node.attrs.pendingMarks && node.content.size > 0) {
                tr = (tr || newState.tr).setNodeMarkup(pos, undefined, { ...node.attrs, pendingMarks: null })
              }
            })
          }

          // Cursor resting in an empty, pre-formatted cell → seed storedMarks so typing is formatted
          const sel: any = newState.selection
          if (sel.empty && sel.$cursor) {
            const parent = sel.$cursor.parent
            if (parent.type.name === "paragraph" && parent.attrs.pendingMarks && parent.content.size === 0) {
              const want = marksFromPending(parent.attrs.pendingMarks, newState.schema)
              const cur = newState.storedMarks || sel.$cursor.marks()
              const same = cur.length === want.length && want.every((w: any) => w.isInSet(cur))
              if (!same) tr = (tr || newState.tr).setStoredMarks(want)
            }
          }

          return tr
        },
      }),
    ]
  },
})
