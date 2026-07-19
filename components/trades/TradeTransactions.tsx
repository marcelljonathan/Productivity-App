"use client"

import { useState } from "react"
import { List, CalendarDays, BarChart2, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { TradeAccount, TradeStockLot, TradeStockSell } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { getTodayLocalDate, formatLocalDate, addDays } from "@/lib/utils/timezone"
import { formatCurrency } from "@/lib/utils/finance"
import {
  getCalendarMonth, shiftYearMonth, monthLabel, getWeekStart, weekLabel,
  sumInvested, costBasisByCode, sumRealizedGross, netPL,
} from "@/lib/utils/trades"
import TradeBuyCard from "./TradeBuyCard"
import TradeSellCard from "./TradeSellCard"
import StockBuyForm from "./StockBuyForm"
import TradeDailyCalendar from "./TradeDailyCalendar"
import TradeWeeklyChart from "./TradeWeeklyChart"
import TradeMonthlySummary from "./TradeMonthlySummary"

type ViewMode = 'list' | 'daily' | 'weekly' | 'monthly'
type LotFields = { stock_code: string; buy_date: string; buy_price: number; volume: number; fee: number }
type NewLot = LotFields & { account_id: string }
type SellFields = { stock_code: string; sell_date: string; sell_price: number; volume: number; fee: number }

type Props = {
  broker: TradeAccount
  lots: TradeStockLot[]        // this broker's buys
  sells: TradeStockSell[]      // this broker's sells
  visible: boolean
  onAddLot: (lot: NewLot) => Promise<void>
  onUpdateLot: (id: string, updates: LotFields) => Promise<void>
  onDeleteLot: (id: string) => void
  onUpdateSell: (id: string, updates: SellFields) => Promise<void>
  onDeleteSell: (id: string) => void
}

const codeKey = (c: string) => c.trim().toUpperCase()

export default function TradeTransactions({ broker, lots, sells, visible, onAddLot, onUpdateLot, onDeleteLot, onUpdateSell, onDeleteSell }: Props) {
  const today = getTodayLocalDate()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [date, setDate] = useState(today)
  const [yearMonth, setYearMonth] = useState(today.slice(0, 7))
  const [weekStart, setWeekStart] = useState(getWeekStart(today))
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const costBasis = costBasisByCode(lots)

  const dayBuys = lots.filter(l => l.buy_date === date)
  const daySells = sells.filter(s => s.sell_date === date)
  const dayTotal = sumInvested(dayBuys)
  const dayRealized = sumRealizedGross(daySells, costBasis)
  const dayNet = netPL(dayBuys, daySells, costBasis)
  const dayHasActivity = dayBuys.length > 0 || daySells.length > 0

  // Buys + sells for the selected day, newest first.
  const dayItems = [
    ...dayBuys.map(l => ({ kind: 'buy' as const, at: l.created_at, lot: l })),
    ...daySells.map(s => ({ kind: 'sell' as const, at: s.created_at, sell: s })),
  ].sort((a, b) => b.at.localeCompare(a.at))

  function goToDay(d: string) {
    setDate(d)
    setViewMode('list')
  }

  async function handleAdd(lot: NewLot) {
    await onAddLot(lot)
    setShowForm(false)
  }

  const toggleEdit = (id: string) => setEditingId(prev => prev === id ? null : id)

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 border rounded-lg p-1">
          {([
            { key: 'list', icon: <List className="h-4 w-4" />, title: 'List' },
            { key: 'daily', icon: <CalendarDays className="h-4 w-4" />, title: 'Daily' },
            { key: 'weekly', icon: <BarChart2 className="h-4 w-4" />, title: 'Weekly' },
            { key: 'monthly', icon: <BarChart2 className="h-4 w-4 rotate-90" />, title: 'Monthly' },
          ] as const).map(({ key, icon, title }) => (
            <Button
              key={key}
              variant={viewMode === key ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode(key)}
              title={title}
            >
              {icon}
            </Button>
          ))}
        </div>
      </div>

      {/* LIST */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setDate(d => addDays(d, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-medium">{formatLocalDate(date)}</p>
              {date !== today && (
                <button onClick={() => setDate(today)} className="text-xs text-muted-foreground underline">Back to today</button>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDate(d => addDays(d, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {dayHasActivity && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {dayBuys.length > 0 && (
                <span className="text-muted-foreground">
                  Total transaction: <span className="font-medium text-foreground">{visible ? formatCurrency(dayTotal, broker.currency) : '••••••'}</span>
                </span>
              )}
              {daySells.length > 0 && (
                <span className="text-muted-foreground">
                  Realized:{' '}
                  <span className={`font-medium ${dayRealized >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {visible ? `${dayRealized >= 0 ? '+' : '−'}${formatCurrency(Math.abs(dayRealized), broker.currency)}` : '••••••'}
                  </span>
                </span>
              )}
              <span className="text-muted-foreground">
                Net P/L:{' '}
                <span className={`font-semibold ${dayNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {visible ? `${dayNet >= 0 ? '+' : '−'}${formatCurrency(Math.abs(dayNet), broker.currency)}` : '••••••'}
                </span>
              </span>
            </div>
          )}

          {dayItems.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground text-center py-6">No transactions on this day.</p>
          )}

          <div className="space-y-2">
            {dayItems.map(item => item.kind === 'buy' ? (
              <TradeBuyCard
                key={item.lot.id}
                lot={item.lot}
                broker={broker}
                visible={visible}
                isEditing={editingId === item.lot.id}
                onEdit={l => toggleEdit(l.id)}
                onUpdateLot={onUpdateLot}
                onDeleteLot={onDeleteLot}
              />
            ) : (
              <TradeSellCard
                key={item.sell.id}
                sell={item.sell}
                broker={broker}
                avgBuyPrice={costBasis[codeKey(item.sell.stock_code)] ?? 0}
                visible={visible}
                isEditing={editingId === item.sell.id}
                onEdit={s => toggleEdit(s.id)}
                onUpdateSell={onUpdateSell}
                onDeleteSell={onDeleteSell}
              />
            ))}
          </div>

          <Button variant="outline" size="sm" className="w-full" onClick={() => { setShowForm(v => !v); setEditingId(null) }}>
            <Plus size={14} className="mr-1" /> Add Transaction
          </Button>

          {showForm && (
            <StockBuyForm
              broker={broker}
              defaultDate={date}
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      )}

      {/* DAILY */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setYearMonth(ym => shiftYearMonth(ym, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium">{monthLabel(yearMonth)}</p>
            <Button variant="ghost" size="icon" onClick={() => setYearMonth(ym => shiftYearMonth(ym, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <TradeDailyCalendar
            yearMonth={yearMonth}
            lots={lots.filter(l => l.buy_date.slice(0, 7) === yearMonth)}
            sells={sells.filter(s => s.sell_date.slice(0, 7) === yearMonth)}
            broker={broker}
            visible={visible}
            onDayClick={goToDay}
          />
        </div>
      )}

      {/* WEEKLY */}
      {viewMode === 'weekly' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setWeekStart(ws => getWeekStart(addDays(ws, -7)))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium">{weekLabel(weekStart)}</p>
            <Button variant="ghost" size="icon" onClick={() => setWeekStart(ws => getWeekStart(addDays(ws, 7)))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <TradeWeeklyChart weekStart={weekStart} lots={lots} sells={sells} costBasis={costBasis} broker={broker} visible={visible} onDayClick={goToDay} />
        </div>
      )}

      {/* MONTHLY */}
      {viewMode === 'monthly' && (() => {
        const period = getCalendarMonth(yearMonth)
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setYearMonth(ym => shiftYearMonth(ym, -1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="text-sm font-medium">{period.label}</p>
              <Button variant="ghost" size="icon" onClick={() => setYearMonth(ym => shiftYearMonth(ym, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <TradeMonthlySummary
              periodStart={period.start}
              periodEnd={period.end}
              lots={lots}
              sells={sells}
              costBasis={costBasis}
              broker={broker}
              visible={visible}
            />
          </div>
        )
      })()}
    </div>
  )
}
