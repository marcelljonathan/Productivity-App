export type TaskStatus = 'pending' | 'partial' | 'done' | 'failed' | 'moved' | 'cancelled'

// Custom pages (user-created rich-text tabs)
export type CustomPage = {
  id: string
  user_id: string
  title: string
  icon: string | null
  position: number
  content: Record<string, unknown> | null // TipTap document JSON
  created_at: string
  updated_at: string
}

// Lightweight shape used by the nav list (no content payload)
export type CustomPageMeta = Pick<CustomPage, 'id' | 'title' | 'icon' | 'position'>

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
