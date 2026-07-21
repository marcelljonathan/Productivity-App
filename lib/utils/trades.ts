import { TradeStockLot, TradeStockSell } from "@/lib/types"

// A holding of one stock code: buys merged by weighted average, reduced by any sells.
export type StockPosition = {
  stock_code: string
  volume: number       // remaining shares held (bought − sold)
  avgPrice: number     // weighted-average buy price (cost basis per share)
  totalBuy: number     // remaining invested = volume * avgPrice
  realizedPL: number   // realized profit/loss from sells of this code
  lots: TradeStockLot[] // the buys
}

const codeKey = (c: string) => c.trim().toUpperCase()

// Combine buys (and optional sells) into per-code positions. Pass no sells to get a
// pure buy aggregate (used for period breakdowns).
export function aggregatePositions(buys: TradeStockLot[], sells: TradeStockSell[] = []): StockPosition[] {
  type Entry = { code: string; bought: number; cost: number; lots: TradeStockLot[]; sells: TradeStockSell[] }
  const map = new Map<string, Entry>()
  const get = (code: string): Entry => {
    const key = codeKey(code)
    let e = map.get(key)
    if (!e) { e = { code: key, bought: 0, cost: 0, lots: [], sells: [] }; map.set(key, e) }
    return e
  }

  for (const b of buys) {
    const e = get(b.stock_code)
    e.bought += b.volume
    e.cost += b.buy_price * b.volume
    e.lots.push(b)
  }
  for (const s of sells) get(s.stock_code).sells.push(s)

  const positions: StockPosition[] = [...map.values()].map(e => {
    const avgPrice = e.bought ? e.cost / e.bought : 0
    const sold = e.sells.reduce((s, x) => s + x.volume, 0)
    const volume = e.bought - sold
    const realizedPL = e.sells.reduce((s, x) => s + sellRealizedPL(x, avgPrice), 0)
    return { stock_code: e.code, volume, avgPrice, totalBuy: volume * avgPrice, realizedPL, lots: e.lots }
  })
  positions.sort((a, b) => a.stock_code.localeCompare(b.stock_code))
  return positions
}

// One realized close: every sell is its own dated history entry, so a partial sale
// counts only the shares actually sold, and a later sale is a separate entry.
export type StockClose = {
  id: string             // the sell's id
  stock_code: string
  volume: number         // shares sold in this event
  avgBuy: number         // weighted-average cost basis
  sellPrice: number
  gross: number          // (sellPrice − avgBuy) × volume
  fees: number           // this sell's fee + its share of buy fees
  netPL: number          // gross − fees
  closeDate: string
  buyNotes: string[]
  sellNote: string | null
}

export function stockCloses(buys: TradeStockLot[], sells: TradeStockSell[]): StockClose[] {
  // Per-code cost basis, fee-per-share and buy descriptions.
  const agg: Record<string, { vol: number; cost: number; fees: number; notes: string[] }> = {}
  for (const b of buys) {
    const k = codeKey(b.stock_code)
    const a = agg[k] ?? { vol: 0, cost: 0, fees: 0, notes: [] }
    a.vol += b.volume
    a.cost += b.buy_price * b.volume
    a.fees += b.fee
    if (b.note) a.notes.push(b.note)
    agg[k] = a
  }

  const out: StockClose[] = sells.map(s => {
    const k = codeKey(s.stock_code)
    const a = agg[k]
    const avgBuy = a && a.vol ? a.cost / a.vol : 0
    const buyFeePerShare = a && a.vol ? a.fees / a.vol : 0
    const gross = (s.sell_price - avgBuy) * s.volume
    const fees = s.fee + buyFeePerShare * s.volume
    return {
      id: s.id,
      stock_code: k,
      volume: s.volume,
      avgBuy,
      sellPrice: s.sell_price,
      gross,
      fees,
      netPL: gross - fees,
      closeDate: s.sell_date,
      buyNotes: a ? a.notes : [],
      sellNote: s.note,
    }
  })

  out.sort((a, b) => b.closeDate.localeCompare(a.closeDate) || a.stock_code.localeCompare(b.stock_code))
  return out
}

// Weighted-average buy price per stock code (cost basis for realized P/L).
export function costBasisByCode(buys: TradeStockLot[]): Record<string, number> {
  const agg: Record<string, { cost: number; vol: number }> = {}
  for (const b of buys) {
    const k = codeKey(b.stock_code)
    const a = agg[k] ?? { cost: 0, vol: 0 }
    a.cost += b.buy_price * b.volume
    a.vol += b.volume
    agg[k] = a
  }
  const out: Record<string, number> = {}
  for (const k in agg) out[k] = agg[k].vol ? agg[k].cost / agg[k].vol : 0
  return out
}

// Gross realized gain from a sale, before any fee: (sell − avg buy) × volume.
export function sellGross(sell: TradeStockSell, avgBuyPrice: number): number {
  return (sell.sell_price - avgBuyPrice) * sell.volume
}

// Net realized for a single sale = gross − that sale's fee.
export function sellRealizedPL(sell: TradeStockSell, avgBuyPrice: number): number {
  return sellGross(sell, avgBuyPrice) - sell.fee
}

export function sellProceeds(sell: TradeStockSell): number {
  return sell.sell_price * sell.volume
}

// Total GROSS realized P/L across sells (fees not yet deducted).
export function sumRealizedGross(sells: TradeStockSell[], costBasis: Record<string, number>): number {
  return sells.reduce((s, x) => s + sellGross(x, costBasis[codeKey(x.stock_code)] ?? 0), 0)
}

export function sumSellFees(sells: TradeStockSell[]): number {
  return sells.reduce((s, x) => s + x.fee, 0)
}

// Net P/L for a period = gross realized − all fees (buy fees + sell fees).
// With no sells, this is just −(buy fees), i.e. the fee drag for the period.
export function netPL(buys: TradeStockLot[], sells: TradeStockSell[], costBasis: Record<string, number>): number {
  return sumRealizedGross(sells, costBasis) - (sumFees(buys) + sumSellFees(sells))
}

// ---- Amount helpers ---------------------------------------------------------

export function lotInvested(lot: TradeStockLot): number {
  return lot.buy_price * lot.volume
}

export function sumInvested(lots: TradeStockLot[]): number {
  return lots.reduce((s, l) => s + lotInvested(l), 0)
}

export function sumFees(lots: TradeStockLot[]): number {
  return lots.reduce((s, l) => s + l.fee, 0)
}

// ---- Date helpers (calendar months, Monday-based weeks) ---------------------

export function getCalendarMonth(yearMonth: string): { start: string; end: string; label: string } {
  const [y, m] = yearMonth.split('-').map(Number)
  const start = `${y}-${String(m).padStart(2, '0')}-01`
  const endDate = new Date(y, m, 0) // day 0 of next month = last day of this month
  const end = [endDate.getFullYear(), String(endDate.getMonth() + 1).padStart(2, '0'), String(endDate.getDate()).padStart(2, '0')].join('-')
  const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return { start, end, label }
}

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function getWeekStart(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday-based
  const mon = new Date(y, m - 1, d + diff)
  return [mon.getFullYear(), String(mon.getMonth() + 1).padStart(2, '0'), String(mon.getDate()).padStart(2, '0')].join('-')
}

export function weekLabel(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const s = new Date(y, m - 1, d)
  const e = new Date(y, m - 1, d + 6)
  return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}
