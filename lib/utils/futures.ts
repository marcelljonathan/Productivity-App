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
        // Cash P/L scales by the contract size (units per lot), e.g. XAUUSD = 100 oz/lot.
        const closing = Math.min(Math.abs(signed), Math.abs(pos))
        const perUnit = pos > 0 ? (t.price - avgEntry) : (avgEntry - t.price)
        realized += perUnit * closing * t.contract_size
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
