import { Currency, FinanceAccount, FinanceTransaction } from "@/lib/types"

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
      if (tx.account_id === account.id) return bal - tx.amount
      if (tx.to_account_id === account.id) return bal + (tx.to_amount ?? tx.amount)
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
    if (tx.type === 'transfer') continue
    const acc = accountMap[tx.account_id]
    if (!acc) continue
    if (tx.type === 'income') result[acc.currency].income += tx.amount
    if (tx.type === 'expense') result[acc.currency].expense += tx.amount
  }
  return result
}
