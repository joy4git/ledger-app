export interface Transaction {
  id: number
  date: string
  amount: number
  category_id: number
  note: string
  type: 'expense' | 'income'
}

export interface Category {
  id: number
  name: string
  type: 'expense' | 'income'
  icon: string
}

export interface AppSettings {
  currency: string
  theme: 'light' | 'dark'
  month_start: string
}

export interface StatsResult {
  totalExpense: number
  totalIncome: number
  byCategory: Array<{ category_id: number; name: string; icon: string; amount: number }>
  dailySpending: Array<{ date: string; amount: number }>
  netIncome: number
}

export interface LedgerApi {
  queryTransactions: () => Promise<Transaction[]>
  insertTransaction: (tx: Omit<Transaction, 'id'>) => Promise<number>
  updateTransaction: (id: number, tx: Partial<Omit<Transaction, 'id'>>) => Promise<void>
  deleteTransaction: (id: number) => Promise<void>
  queryCategories: () => Promise<Category[]>
  insertCategory: (cat: Omit<Category, 'id'>) => Promise<number>
  updateCategory: (id: number, cat: Partial<Omit<Category, 'id'>>) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
  querySettings: () => Promise<AppSettings>
  updateSetting: (key: string, value: string) => Promise<void>
  getStats: (month: string) => Promise<StatsResult>
  importCsv: (filePath: string) => Promise<{ inserted: number; errors: number }>
}

export interface Window {
  ledgerApi: LedgerApi
}
