export type TaskStatus = 'pending' | 'partial' | 'done' | 'failed' | 'moved' | 'cancelled'

// Finance
export type Currency = 'IDR' | 'USD'
export type TransactionType = 'income' | 'expense' | 'transfer'
export type CategoryType = 'income' | 'expense'

export type FinanceAccount = {
  id: string
  user_id: string
  name: string
  currency: Currency
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
