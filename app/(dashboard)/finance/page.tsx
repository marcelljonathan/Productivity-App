"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, List, CalendarDays, BarChart2, Settings } from "lucide-react"
import Link from "next/link"
import { useFinanceAccounts } from "@/hooks/useFinanceAccounts"
import { useFinanceCategories } from "@/hooks/useFinanceCategories"
import { useFinanceTransactions } from "@/hooks/useFinanceTransactions"
import { useFinanceMonth } from "@/hooks/useFinanceMonth"
import { useFinanceRange } from "@/hooks/useFinanceRange"
import AccountBar from "@/components/finance/AccountBar"
import TransactionList from "@/components/finance/TransactionList"
import DailyFinanceSummary from "@/components/finance/summary/DailyFinanceSummary"
import WeeklyFinanceSummary from "@/components/finance/summary/WeeklyFinanceSummary"
import MonthlyFinanceSummary from "@/components/finance/summary/MonthlyFinanceSummary"
import { Button } from "@/components/ui/button"
import { getTodayLocalDate, formatLocalDate, addDays } from "@/lib/utils/timezone"

type ViewMode = 'list' | 'daily' | 'weekly' | 'monthly'

function toYearMonth(d: string) { return d.slice(0, 7) }

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function getWeekStart(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(y, m - 1, d + diff)
  return [mon.getFullYear(), String(mon.getMonth() + 1).padStart(2, '0'), String(mon.getDate()).padStart(2, '0')].join('-')
}

function weekLabel(ws: string): string {
  const we = addDays(ws, 6)
  const s = new Date(ws + 'T00:00:00')
  const e = new Date(we + 'T00:00:00')
  return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export default function FinancePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [date, setDate] = useState(getTodayLocalDate())
  const [yearMonth, setYearMonth] = useState(toYearMonth(getTodayLocalDate()))
  const [weekStart, setWeekStart] = useState(getWeekStart(getTodayLocalDate()))

  const { accounts, balances, loading: accLoading, fetchAll: refetchAccounts } = useFinanceAccounts()
  const { categories, subcategories } = useFinanceCategories()
  const { transactions, loading: txLoading, fetchTransactions } = useFinanceTransactions(date)
  const { transactions: monthTxs, txByDate: monthTxByDate, loading: monthLoading, fetchTransactions: fetchMonth } = useFinanceMonth(yearMonth)
  const { txByDate: weekTxByDate, loading: weekLoading, fetchTransactions: fetchWeek } = useFinanceRange(weekStart, addDays(weekStart, 6))

  function handleRefresh() {
    fetchTransactions()
    refetchAccounts()
    fetchMonth()
    fetchWeek()
  }

  function handleDayClick(d: string) {
    setDate(d)
    setViewMode('list')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg">Finance</h1>
        <Link href="/finance/settings" className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Settings size={18} />
        </Link>
      </div>

      <AccountBar accounts={accounts} balances={balances} loading={accLoading} />

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
              {date !== getTodayLocalDate() && (
                <button onClick={() => setDate(getTodayLocalDate())} className="text-xs text-muted-foreground underline">
                  Back to today
                </button>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDate(d => addDays(d, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {txLoading ? (
            <p className="text-sm text-muted-foreground text-center">Loading...</p>
          ) : (
            <TransactionList
              transactions={transactions}
              date={date}
              accounts={accounts}
              categories={categories}
              subcategories={subcategories}
              onRefresh={handleRefresh}
            />
          )}
        </div>
      )}

      {viewMode === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setYearMonth(ym => shiftMonth(ym, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium">{monthLabel(yearMonth)}</p>
            <Button variant="ghost" size="icon" onClick={() => setYearMonth(ym => shiftMonth(ym, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {monthLoading ? (
            <p className="text-sm text-muted-foreground text-center">Loading...</p>
          ) : (
            <DailyFinanceSummary
              yearMonth={yearMonth}
              txByDate={monthTxByDate}
              accounts={accounts}
              onDayClick={handleDayClick}
            />
          )}
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
          {weekLoading ? (
            <p className="text-sm text-muted-foreground text-center">Loading...</p>
          ) : (
            <WeeklyFinanceSummary
              weekStart={weekStart}
              txByDate={weekTxByDate}
              accounts={accounts}
              onDayClick={handleDayClick}
            />
          )}
        </div>
      )}

      {viewMode === 'monthly' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setYearMonth(ym => shiftMonth(ym, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium">{monthLabel(yearMonth)}</p>
            <Button variant="ghost" size="icon" onClick={() => setYearMonth(ym => shiftMonth(ym, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {monthLoading ? (
            <p className="text-sm text-muted-foreground text-center">Loading...</p>
          ) : (
            <MonthlyFinanceSummary
              yearMonth={yearMonth}
              transactions={monthTxs}
              accounts={accounts}
              categories={categories}
            />
          )}
        </div>
      )}
    </div>
  )
}
