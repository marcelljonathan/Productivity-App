export type TaskStatus = 'pending' | 'partial' | 'done' | 'failed' | 'moved' | 'cancelled'

// Custom pages (user-created tabs). A page is either a rich-text doc or a trades tracker.
export type PageType = 'doc' | 'trades'

export type CustomPage = {
  id: string
  user_id: string
  title: string
  icon: string | null
  position: number
  type: PageType
  content: Record<string, unknown> | null // TipTap document JSON (doc pages only)
  created_at: string
  updated_at: string
}

// Lightweight shape used by the nav list (no content payload)
export type CustomPageMeta = Pick<CustomPage, 'id' | 'title' | 'icon' | 'position' | 'type'>

// Finance
export type Currency = 'IDR' | 'USD'
export type TransactionType = 'income' | 'expense' | 'transfer' | 'custom'

export type FinanceTransactionType = {
  id: string
  user_id: string
  name: string
  created_at: string
}
export type CategoryType = 'income' | 'expense'

export type FinanceAccountType = {
  id: string
  user_id: string
  name: string
  created_at: string
}

export type FinanceAccount = {
  id: string
  user_id: string
  name: string
  currency: Currency
  account_type_id: string | null
  starting_balance: number
  created_at: string
}

export type FinanceCategory = {
  id: string
  user_id: string
  name: string
  type: CategoryType
  created_at: string
}

export type FinanceSubcategory = {
  id: string
  user_id: string
  category_id: string
  name: string
  created_at: string
}

export type FinanceTransaction = {
  id: string
  user_id: string
  type: TransactionType
  account_id: string
  to_account_id: string | null
  amount: number
  to_amount: number | null
  exchange_rate: number | null
  category_id: string | null
  subcategory_id: string | null
  custom_type_id: string | null
  is_gain: boolean | null
  transfer_fee: number | null
  date: string
  note: string | null
  created_at: string
}

// Trades tracker (isolated from Finance; scoped per page)
export type BrokerType = 'stock' | 'futures'

// A broker is an "account". Types are fixed (stock/futures); no starting balance.
export type TradeAccount = {
  id: string
  user_id: string
  page_id: string
  name: string
  currency: Currency
  broker_type: BrokerType
  created_at: string
}

// One stock purchase. The portfolio merges lots of the same code by weighted average.
export type TradeStockLot = {
  id: string
  user_id: string
  page_id: string
  account_id: string
  stock_code: string
  buy_date: string
  buy_price: number
  volume: number
  fee: number
  note: string | null
  created_at: string
}

// A futures trade. Buy = long, Sell = short. Open positions are the net per instrument;
// realized P/L is computed by average-cost netting.
export type FuturesSide = 'buy' | 'sell'

export type TradeFuturesTrade = {
  id: string
  user_id: string
  page_id: string
  account_id: string
  instrument: string
  side: FuturesSide
  price: number
  volume: number
  contract_size: number  // units per lot (XAUUSD = 100, forex major = 100,000, default 1)
  commission: number
  swap: number           // overnight/financing fee, usually entered after closing
  usd_rate: number       // quote-currency → account-currency (USD) rate at close; 1 for …/USD pairs
  trade_date: string
  created_at: string
}

// One stock sale (partial allowed). Reduces the held position; realized P/L is
// computed against the weighted-average buy price.
export type TradeStockSell = {
  id: string
  user_id: string
  page_id: string
  account_id: string
  stock_code: string
  sell_date: string
  sell_price: number
  volume: number
  fee: number
  note: string | null
  created_at: string
}

export type Subtask = {
  id: string
  task_id: string
  user_id: string
  title: string
  done: boolean
  created_at: string
}

export type Task = {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string | null
  date: string
  scheduled_time: string | null
  end_time: string | null
  status: TaskStatus
  cancellation_reason: string | null
  moved_from_id: string | null
  created_at: string
  updated_at: string
}
