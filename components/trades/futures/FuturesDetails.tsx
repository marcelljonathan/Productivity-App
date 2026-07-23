"use client"

import { useState } from "react"
import { List, CalendarDays, BarChart2, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { TradeAccount, TradeFuturesTrade } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { getTodayLocalDate, formatLocalDate, addDays } from "@/lib/utils/timezone"
import { formatCurrency } from "@/lib/utils/finance"
import { getCalendarMonth, shiftYearMonth, monthLabel, getWeekStart, weekLabel } from "@/lib/utils/trades"
import { futuresNet } from "@/lib/utils/futures"
import FuturesTradeForm from "./FuturesTradeForm"
import FuturesTradeCard from "./FuturesTradeCard"
import FuturesDailyCalendar from "./FuturesDailyCalendar"
import FuturesWeeklyChart from "./FuturesWeeklyChart"
import FuturesMonthlySummary from "./FuturesMonthlySummary"

type ViewMode = 'list' | 'daily' | 'weekly' | 'monthly'
type TradeFields = { instrument: string; side: 'buy' | 'sell'; price: number; volume: number; contract_size: number; commission: number; swap: number; usd_rate: number; trade_date: string }
type NewTrade = TradeFields & { account_id: string }

type Props = {
  broker: TradeAccount
  trades: TradeFuturesTrade[]
  realizedByTrade: Record<string, number>
  contractSizeByInstrument: Record<string, number>
  visible: boolean
  onAdd: (t: NewTrade) => Promise<void>
  onUpdate: (id: string, updates: TradeFields) => Promise<void>
  onDelete: (id: string) => void
}

export default function FuturesDetails({ broker, trades, realizedByTrade, contractSizeByInstrument, visible, onAdd, onUpdate, onDelete }: Props) {
  const today = getTodayLocalDate()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [date, setDate] = useState(today)
  const [yearMonth, setYearMonth] = useState(today.slice(0, 7))
  const [weekStart, setWeekStart] = useState(getWeekStart(today))
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const dayTrades = trades.filter(t => t.trade_date === date)
  const dayNet = futuresNet(dayTrades, realizedByTrade)

  function goToDay(d: string) { setDate(d); setViewMode('list') }
  const toggleEdit = (id: string) => setEditingId(prev => prev === id ? null : id)

  async function handleAdd(t: NewTrade) {
    await onAdd(t)
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
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

          {dayTrades.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">
                Trades: <span className="font-medium text-foreground">{dayTrades.length}</span>
              </span>
              <span className="text-muted-foreground">
                Net P/L:{' '}
                <span className={`font-semibold ${dayNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {visible ? `${dayNet >= 0 ? '+' : '−'}${formatCurrency(Math.abs(dayNet), broker.currency)}` : '••••••'}
                </span>
              </span>
            </div>
          )}

          {dayTrades.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground text-center py-6">No trades on this day.</p>
          )}

          <div className="space-y-2">
            {dayTrades.map(t => (
              <FuturesTradeCard
                key={t.id}
                trade={t}
                broker={broker}
                realizedGross={realizedByTrade[t.id] ?? 0}
                visible={visible}
                isEditing={editingId === t.id}
                contractSizeByInstrument={contractSizeByInstrument}
                onEdit={tt => toggleEdit(tt.id)}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </div>

          <Button variant="outline" size="sm" className="w-full" onClick={() => { setShowForm(v => !v); setEditingId(null) }}>
            <Plus size={14} className="mr-1" /> Add Transaction
          </Button>

          {showForm && (
            <FuturesTradeForm
              broker={broker}
              defaultDate={date}
              contractSizeByInstrument={contractSizeByInstrument}
              mode="open"
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      )}

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
          <FuturesDailyCalendar
            yearMonth={yearMonth}
            trades={trades.filter(t => t.trade_date.slice(0, 7) === yearMonth)}
            broker={broker}
            visible={visible}
            onDayClick={goToDay}
          />
        </div>
      )}

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
          <FuturesWeeklyChart weekStart={weekStart} trades={trades} realizedByTrade={realizedByTrade} broker={broker} visible={visible} onDayClick={goToDay} />
        </div>
      )}

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
            <FuturesMonthlySummary
              periodStart={period.start}
              periodEnd={period.end}
              trades={trades}
              realizedByTrade={realizedByTrade}
              broker={broker}
              visible={visible}
            />
          </div>
        )
      })()}
    </div>
  )
}
