import type { TradeFuturesTrade } from "@/lib/types"

export type FuturesPosition = {
  instrument: string
  direction: 'long' | 'short'
  volume: number   // open contracts (absolute)
  avgEntry: number // average entry price of the open position
}

export type FuturesComputed = {
  positions: FuturesPosition[]
  // Gross realized P/L attributed to each trade (0 for pure opens/adds), keyed by trade id.
  realizedByTrade: Record<string, number>
}

const key = (s: string) => s.trim().toUpperCase()
const EPS = 1e-9

// Walk each instrument's trades in time order, maintaining a signed net position and its
// average entry. A trade in the opposite direction realizes P/L against that average
// (average-cost method), and may flip the position if it's larger than what's open.
export function computeFutures(trades: TradeFuturesTrade[]): FuturesComputed {
  const byInstrument = new Map<string, TradeFuturesTrade[]>()
  for (const t of trades) {
    const k = key(t.instrument)
    ;(byInstrument.get(k) ?? byInstrument.set(k, []).get(k)!).push(t)
  }

  const realizedByTrade: Record<string, number> = {}
  const positions: FuturesPosition[] = []

  for (const [instrument, list] of byInstrument) {
    const ordered = [...list].sort((a, b) =>
      a.trade_date === b.trade_date ? a.created_at.localeCompare(b.created_at) : a.trade_date.localeCompare(b.trade_date)
    )

    let pos = 0        // signed contracts (+long / −short)
    let avgEntry = 0

    for (const t of ordered) {
      const signed = t.side === 'buy' ? t.volume : -t.volume
      let realized = 0

      if (pos === 0 || Math.sign(pos) === Math.sign(signed)) {
        // opening or increasing the same direction → update weighted-average entry
        const newAbs = Math.abs(pos) + Math.abs(signed)
        avgEntry = newAbs ? (avgEntry * Math.abs(pos) + t.price * Math.abs(signed)) / newAbs : 0
        pos += signed
      } else {
        // opposite direction → close against the average, maybe flip.
        // Cash P/L scales by the contract size (units per lot), e.g. XAUUSD = 100 oz/lot,
        // and by the closing trade's quote→USD rate (1 for …/USD pairs).
        const closing = Math.min(Math.abs(signed), Math.abs(pos))
        const perUnit = pos > 0 ? (t.price - avgEntry) : (avgEntry - t.price)
        realized += perUnit * closing * t.contract_size * t.usd_rate
        const remaining = Math.abs(signed) - closing
        pos += signed
        if (Math.abs(pos) < EPS) { pos = 0; avgEntry = 0 }
        if (remaining > EPS && pos !== 0) avgEntry = t.price // flipped: opened new side at this price
      }

      realizedByTrade[t.id] = realized
    }

    if (Math.abs(pos) > EPS) {
      positions.push({
        instrument,
        direction: pos > 0 ? 'long' : 'short',
        volume: Math.abs(pos),
        avgEntry,
      })
    }
  }

  positions.sort((a, b) => a.instrument.localeCompare(b.instrument))
  return { positions, realizedByTrade }
}

// One realized close. Every closing trade is its own dated history entry, so closing
// part of a position counts only the lots actually closed; closing the rest later is
// a separate entry on its own date.
export type FuturesClose = {
  id: string            // the closing trade's id
  instrument: string
  direction: 'long' | 'short'   // the side that was closed
  volume: number        // lots closed in this event
  avgEntry: number      // running average entry at the moment of the close
  exitPrice: number
  gross: number         // realized P/L before costs
  costs: number         // this trade's comm+swap + its share of the opening costs
  netPL: number         // gross − costs
  openDate: string      // when the position being closed was opened
  closeDate: string
}

export function futuresCloses(trades: TradeFuturesTrade[]): FuturesClose[] {
  const byInstrument = new Map<string, TradeFuturesTrade[]>()
  for (const t of trades) {
    const k = key(t.instrument)
    ;(byInstrument.get(k) ?? byInstrument.set(k, []).get(k)!).push(t)
  }

  const out: FuturesClose[] = []

  for (const [instrument, list] of byInstrument) {
    const ordered = [...list].sort((a, b) =>
      a.trade_date === b.trade_date ? a.created_at.localeCompare(b.created_at) : a.trade_date.localeCompare(b.trade_date)
    )

    let pos = 0
    let avgEntry = 0
    let openCosts = 0   // commissions/swaps booked while opening the current position
    let openDate = ''

    for (const t of ordered) {
      const signed = t.side === 'buy' ? t.volume : -t.volume
      const tradeCosts = t.commission + t.swap
      const absS = Math.abs(signed)

      if (pos === 0 || Math.sign(pos) === Math.sign(signed)) {
        // opening or adding
        if (pos === 0) openDate = t.trade_date
        avgEntry = (avgEntry * Math.abs(pos) + t.price * absS) / (Math.abs(pos) + absS)
        pos += signed
        openCosts += tradeCosts
      } else {
        // closing some or all of the position (possibly flipping)
        const closing = Math.min(absS, Math.abs(pos))
        const perUnit = pos > 0 ? (t.price - avgEntry) : (avgEntry - t.price)
        const gross = perUnit * closing * t.contract_size * t.usd_rate
        // Opening costs follow the lots being closed, pro rata.
        const alloc = Math.abs(pos) ? openCosts * (closing / Math.abs(pos)) : 0
        const costs = tradeCosts + alloc
        openCosts -= alloc

        out.push({
          id: t.id,
          instrument,
          direction: pos > 0 ? 'long' : 'short',
          volume: closing,
          avgEntry,
          exitPrice: t.price,
          gross,
          costs,
          netPL: gross - costs,
          openDate,
          closeDate: t.trade_date,
        })

        const remaining = absS - closing
        pos += signed

        if (Math.abs(pos) < EPS) {
          pos = 0
          avgEntry = 0
          openCosts = 0
        } else if (remaining > EPS) {
          // flipped: the leftover opens a new position at this price
          avgEntry = t.price
          openCosts = 0
          openDate = t.trade_date
        }
      }
    }
  }

  out.sort((a, b) => b.closeDate.localeCompare(a.closeDate) || a.instrument.localeCompare(b.instrument))
  return out
}

// ---- period aggregates ----

export function futuresCommissions(trades: TradeFuturesTrade[]): number {
  return trades.reduce((s, t) => s + t.commission, 0)
}

export function futuresSwaps(trades: TradeFuturesTrade[]): number {
  return trades.reduce((s, t) => s + t.swap, 0)
}

export function futuresRealizedGross(trades: TradeFuturesTrade[], realizedByTrade: Record<string, number>): number {
  return trades.reduce((s, t) => s + (realizedByTrade[t.id] ?? 0), 0)
}

// Net P/L = gross realized − commissions − swaps.
// (An open-only day is negative by its commissions/swaps.)
export function futuresNet(trades: TradeFuturesTrade[], realizedByTrade: Record<string, number>): number {
  return futuresRealizedGross(trades, realizedByTrade) - futuresCommissions(trades) - futuresSwaps(trades)
}

// Net P/L for one trade = its realized − its commission − its swap.
export function futuresTradeNet(trade: TradeFuturesTrade, realizedByTrade: Record<string, number>): number {
  return (realizedByTrade[trade.id] ?? 0) - trade.commission - trade.swap
}
