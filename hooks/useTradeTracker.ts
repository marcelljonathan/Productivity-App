"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { BrokerType, Currency, FuturesSide, TradeAccount, TradeStockLot, TradeStockSell, TradeFuturesTrade } from "@/lib/types"

type NewLot = {
  account_id: string
  stock_code: string
  buy_date: string
  buy_price: number
  volume: number
  fee: number
  note: string | null
}

type NewSell = {
  account_id: string
  stock_code: string
  sell_date: string
  sell_price: number
  volume: number
  fee: number
  note: string | null
}

type NewFuturesTrade = {
  account_id: string
  instrument: string
  side: FuturesSide
  price: number
  volume: number
  contract_size: number
  commission: number
  swap: number
  usd_rate: number
  trade_date: string
}

// One trades page's data: brokers + their stock buys/sells and futures trades, scoped to the page.
export function useTradeTracker(pageId: string) {
  const [brokers, setBrokers] = useState<TradeAccount[]>([])
  const [lots, setLots] = useState<TradeStockLot[]>([])
  const [sells, setSells] = useState<TradeStockSell[]>([])
  const [futures, setFutures] = useState<TradeFuturesTrade[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: accs }, { data: lotRows }, { data: sellRows }, { data: futRows }] = await Promise.all([
      supabase.from('trade_accounts').select('*').eq('page_id', pageId).order('created_at', { ascending: true }),
      supabase.from('trade_stock_lots').select('*').eq('page_id', pageId).order('buy_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('trade_stock_sells').select('*').eq('page_id', pageId).order('sell_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('trade_futures_trades').select('*').eq('page_id', pageId).order('trade_date', { ascending: false }).order('created_at', { ascending: false }),
    ])
    setBrokers((accs ?? []) as TradeAccount[])
    setLots((lotRows ?? []) as TradeStockLot[])
    setSells((sellRows ?? []) as TradeStockSell[])
    setFutures((futRows ?? []) as TradeFuturesTrade[])
    setLoading(false)
  }, [pageId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addBroker = useCallback(async (name: string, broker_type: BrokerType, currency: Currency): Promise<TradeAccount | null> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('trade_accounts')
      .insert({ user_id: user.id, page_id: pageId, name, broker_type, currency })
      .select()
      .single()
    await fetchAll()
    return (data as TradeAccount) ?? null
  }, [pageId, fetchAll])

  const updateBroker = useCallback(async (id: string, updates: { name?: string }) => {
    const supabase = createClient()
    await supabase.from('trade_accounts').update(updates).eq('id', id)
    await fetchAll()
  }, [fetchAll])

  const deleteBroker = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase.from('trade_accounts').delete().eq('id', id)
    await fetchAll()
  }, [fetchAll])

  const addLot = useCallback(async (lot: NewLot) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('trade_stock_lots').insert({
      user_id: user.id,
      page_id: pageId,
      account_id: lot.account_id,
      stock_code: lot.stock_code.trim().toUpperCase(),
      buy_date: lot.buy_date,
      buy_price: lot.buy_price,
      volume: lot.volume,
      fee: lot.fee,
      note: lot.note,
    })
    await fetchAll()
  }, [pageId, fetchAll])

  const updateLot = useCallback(async (id: string, updates: Partial<Omit<NewLot, 'account_id'>>) => {
    const supabase = createClient()
    const patch: Record<string, unknown> = { ...updates }
    if (typeof patch.stock_code === 'string') patch.stock_code = patch.stock_code.trim().toUpperCase()
    await supabase.from('trade_stock_lots').update(patch).eq('id', id)
    await fetchAll()
  }, [fetchAll])

  const deleteLot = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase.from('trade_stock_lots').delete().eq('id', id)
    await fetchAll()
  }, [fetchAll])

  const addSell = useCallback(async (sell: NewSell) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('trade_stock_sells').insert({
      user_id: user.id,
      page_id: pageId,
      account_id: sell.account_id,
      stock_code: sell.stock_code.trim().toUpperCase(),
      sell_date: sell.sell_date,
      sell_price: sell.sell_price,
      volume: sell.volume,
      fee: sell.fee,
      note: sell.note,
    })
    await fetchAll()
  }, [pageId, fetchAll])

  const updateSell = useCallback(async (id: string, updates: Partial<Omit<NewSell, 'account_id'>>) => {
    const supabase = createClient()
    const patch: Record<string, unknown> = { ...updates }
    if (typeof patch.stock_code === 'string') patch.stock_code = patch.stock_code.trim().toUpperCase()
    await supabase.from('trade_stock_sells').update(patch).eq('id', id)
    await fetchAll()
  }, [fetchAll])

  const deleteSell = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase.from('trade_stock_sells').delete().eq('id', id)
    await fetchAll()
  }, [fetchAll])

  const addFuturesTrade = useCallback(async (t: NewFuturesTrade) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('trade_futures_trades').insert({
      user_id: user.id,
      page_id: pageId,
      account_id: t.account_id,
      instrument: t.instrument.trim().toUpperCase(),
      side: t.side,
      price: t.price,
      volume: t.volume,
      contract_size: t.contract_size,
      commission: t.commission,
      swap: t.swap,
      usd_rate: t.usd_rate,
      trade_date: t.trade_date,
    })
    await fetchAll()
  }, [pageId, fetchAll])

  const updateFuturesTrade = useCallback(async (id: string, updates: Partial<Omit<NewFuturesTrade, 'account_id'>>) => {
    const supabase = createClient()
    const patch: Record<string, unknown> = { ...updates }
    if (typeof patch.instrument === 'string') patch.instrument = patch.instrument.trim().toUpperCase()
    await supabase.from('trade_futures_trades').update(patch).eq('id', id)
    await fetchAll()
  }, [fetchAll])

  const deleteFuturesTrade = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase.from('trade_futures_trades').delete().eq('id', id)
    await fetchAll()
  }, [fetchAll])

  return {
    brokers, lots, sells, futures, loading, fetchAll,
    addBroker, updateBroker, deleteBroker,
    addLot, updateLot, deleteLot,
    addSell, updateSell, deleteSell,
    addFuturesTrade, updateFuturesTrade, deleteFuturesTrade,
  }
}
