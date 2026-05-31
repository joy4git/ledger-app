import { create } from 'zustand'
import type { Transaction, Category, AppSettings, StatsResult } from './types'
import * as db from './db'

interface LedgerState {
  transactions: Transaction[]
  categories: Category[]
  settings: AppSettings
  currentMonth: string
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  addModalOpen: boolean
  editModalOpen: boolean
  editingTx: Transaction | null
  loading: boolean
  error: string | null
  stats: StatsResult | null

  loadAll: () => Promise<void>
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>
  updateTransaction: (id: number, tx: Partial<Omit<Transaction, 'id'>>) => Promise<void>
  removeTransaction: (id: number) => Promise<void>
  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>
  updateCategory: (id: number, cat: Partial<Omit<Category, 'id'>>) => Promise<void>
  removeCategory: (id: number) => Promise<void>
  setMonth: (m: string) => void
  setSidebar: (o: boolean) => void
  setTheme: (t: 'light' | 'dark') => Promise<void>
  openAddModal: () => void
  closeAddModal: () => void
  openEditModal: (tx: Transaction) => void
  closeEditModal: () => void
  setStats: (s: StatsResult | null) => void
  setError: (e: string | null) => void
}

function loadPersisted(): Pick<LedgerState, 'settings' | 'theme' | 'currentMonth'> {
  try {
    const raw = localStorage.getItem('ledger-persisted')
    if (raw) {
      const p = JSON.parse(raw)
      return {
        settings: p.settings || { currency: '¥', theme: 'light', month_start: '1' },
        theme: p.theme || 'light',
        currentMonth: p.currentMonth || new Date().toISOString().slice(0, 7),
      }
    }
  } catch { /* ignore */ }
  return {
    settings: { currency: '¥', theme: 'light', month_start: '1' },
    theme: 'light',
    currentMonth: new Date().toISOString().slice(0, 7),
  }
}

function persist(state: LedgerState): void {
  try {
    localStorage.setItem('ledger-persisted', JSON.stringify({
      settings: state.settings,
      theme: state.theme,
      currentMonth: state.currentMonth,
    }))
  } catch { /* ignore */ }
}

export const useLedgerStore = create<LedgerState>((set, get) => {
  const persisted = loadPersisted()

  return {
    transactions: [],
    categories: [],
    settings: persisted.settings,
    currentMonth: persisted.currentMonth,
    sidebarOpen: true,
    theme: persisted.theme,
    addModalOpen: false,
    editModalOpen: false,
    editingTx: null,
    loading: false,
    error: null,
    stats: null,

    setLoading: (loading) => { set({ loading }); persist({ ...get(), loading }) },
    setError: (error) => set({ error }),
    setStats: (stats) => set({ stats }),

    loadAll: async () => {
      set({ loading: true, error: null })
      try {
        const [transactions, categories, settings] = await Promise.all([
          db.getTransactions() as Promise<Transaction[]>,
          db.getCategories() as Promise<Category[]>,
          db.getSettings() as Promise<AppSettings>,
        ])
        set({ transactions, categories, settings, loading: false })
        persist({ ...get(), settings })
        const month = get().currentMonth
        const stats = await db.getStats(month)
        set({ stats })
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : '加载数据失败',
          loading: false,
        })
      }
    },

    addTransaction: async (tx) => {
      const id = await db.insertTransaction(tx)
      set((s) => ({ transactions: [{ ...tx, id }, ...s.transactions] }))
    },

    updateTransaction: async (id, tx) => {
      await db.updateTransaction(id, tx)
      set((s) => ({
        transactions: s.transactions.map((t) => t.id === id ? { ...t, ...tx } : t),
      }))
    },

    removeTransaction: async (id) => {
      await db.deleteTransaction(id)
      set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
    },

    addCategory: async (cat) => {
      const id = await db.insertCategory(cat)
      set((s) => ({ categories: [...s.categories, { ...cat, id }] }))
    },

    updateCategory: async (id, cat) => {
      await db.updateCategory(id, cat)
      set((s) => ({
        categories: s.categories.map((c) => c.id === id ? { ...c, ...cat } : c),
      }))
    },

    removeCategory: async (id) => {
      await db.deleteCategory(id)
      set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
    },

    setMonth: (currentMonth) => {
      set({ currentMonth })
      persist({ ...get(), currentMonth })
      db.getStats(currentMonth).then((stats) => set({ stats }))
    },

    setSidebar: (sidebarOpen) => set({ sidebarOpen }),

    setTheme: async (theme) => {
      set({ theme })
      persist({ ...get(), theme })
      await db.updateSetting('theme', theme)
    },

    openAddModal: () => set({ addModalOpen: true }),
    closeAddModal: () => set({ addModalOpen: false }),
    openEditModal: (editingTx) => set({ editModalOpen: true, editingTx }),
    closeEditModal: () => set({ editModalOpen: false, editingTx: null }),
  }
})
