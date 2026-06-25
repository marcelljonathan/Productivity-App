import { Currency, FinanceAccount, FinanceTransaction } from "@/lib/types"

function toDateStr(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function adjustForWeekend(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const dow = date.getDay()
  if (dow === 6) date.setDate(date.getDate() - 1) // Sat → Fri
  if (dow === 0) date.setDate(date.getDate() - 2) // Sun → Fri
  return toDateStr(date)
}

export function getMonthPeriod(
  yearMonth: string,
  startDay: number
): { start: string; end: string; label: string } {
  const day = Math.min(Math.max(Math.round(startDay), 1), 28)
  const [y, m] = yearMonth.split('-').map(Number)

  const rawStart = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const start = adjustForWeekend(rawStart)

  // Next period's raw start: same day, next month (JS handles month overflow)
  const nextDate = new Date(y, m - 1 + 1, day)
  const rawNextStart = toDateStr(nextDate)
  const nextStart = adjustForWeekend(rawNextStart)

  // End = 1 day before next period starts
  const endDate = new Date(nextStart + 'T00:00:00')
  endDate.setDate(endDate.getDate() - 1)
  const end = toDateStr(endDate)

  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const label = `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  return { start, end, label }
}

export function datesBetween(start: string, end: string): string[] {
  const dates: string[] = []
  const cur = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')
  while (cur <= endDate) {
    dates.push(toDateStr(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'IDR') {
    return `Rp ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function calcAccountBalance(
  account: FinanceAccount,
  allTransactions: FinanceTransaction[]
): number {
  return allTransactions.reduce((bal, tx) => {
    if (tx.type === 'income' && tx.account_id === account.id) return bal + tx.amount
    if (tx.type === 'expense' && tx.account_id === account.id) return bal - tx.amount
    if (tx.type === 'transfer') {
      if (tx.account_id === account.id) return bal - tx.amount - (tx.transfer_fee ?? 0)
      if (tx.to_account_id === account.id) return bal + (tx.to_amount ?? tx.amount)
    }
    if (tx.type === 'custom' && tx.account_id === account.id) {
      return tx.is_gain ? bal + tx.amount : bal - tx.amount
    }
    return bal
  }, account.starting_balance)
}

export type DayFlow = { income: number; expense: number }

export function calcDayFlowByCurrency(
  transactions: FinanceTransaction[],
  accounts: FinanceAccount[]
): Record<Currency, DayFlow> {
  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]))
  const result: Record<Currency, DayFlow> = {
    IDR: { income: 0, expense: 0 },
    USD: { income: 0, expense: 0 },
  }
  for (const tx of transactions) {
    const acc = accountMap[tx.account_id]
    if (!acc) continue
    if (tx.type === 'transfer') {
      if (tx.transfer_fee) result[acc.currency].expense += tx.transfer_fee
      continue
    }
    if (tx.type === 'income') result[acc.currency].income += tx.amount
    if (tx.type === 'expense') result[acc.currency].expense += tx.amount
  }
  return result
}
