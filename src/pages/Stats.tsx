import { useState, useEffect } from 'preact/hooks'
import { useLedgerStore } from '../store'
import * as db from '../db'

export default function Stats(): JSX.Element {
  const categories = useLedgerStore(s => s.categories)
  const currentMonth = useLedgerStore(s => s.currentMonth)
  const setMonth = useLedgerStore(s => s.setMonth)
  const setStats = useLedgerStore(s => s.setStats)
  const loading = useLedgerStore(s => s.loading)
  const error = useLedgerStore(s => s.error)

  const [localStats, setLocalStats] = useState<{
    totalExpense: number; totalIncome: number;
    byCategory: Array<{ category_id: number; name: string; icon: string; amount: number }>;
    dailySpending: Array<{ date: string; amount: number }>; netIncome: number;
  } | null>(null)

  const [overview, setOverview] = useState<Array<{ month: string; expense: number; income: number; count: number }>>([])
  const currency = useLedgerStore(s => s.settings.currency) || '¥'

  useEffect(() => {
    loadStats(currentMonth)
    loadOverview()
  }, [currentMonth])

  const loadStats = async (month: string) => {
    try {
      const data = await db.getStats(month)
      setLocalStats(data)
      setStats(data)
    } catch {
      setLocalStats(null)
      setStats(null)
    }
  }

  const loadOverview = async () => {
    try {
      const txs = await db.getTransactions()
      const months: Record<string, { expense: number; income: number; count: number }> = {}
      for (const tx of txs) {
        const m = tx.date.slice(0, 7)
        if (!months[m]) months[m] = { expense: 0, income: 0, count: 0 }
        months[m].count++
        if (tx.type === 'expense') months[m].expense += tx.amount
        else months[m].income += tx.amount
      }
      setOverview(Object.entries(months).map(([month, v]) => ({ month, ...v })))
    } catch { setOverview([]) }
  }

  const allMonths = overview.length > 0 ? overview.map(m => m.month) : [currentMonth]

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 24 }}>📈 统计分析</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 24 }}>
        <label style={{ fontSize: '14px', fontWeight: 500 }}>选择月份:</label>
        <select value={currentMonth}
          onInput={(e) => { const val = (e.target as HTMLSelectElement).value; setMonth(val); loadStats(val) }}
          style={{ width: 'auto', maxWidth: 160 }}>
          {allMonths.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {loading && <div class="loading-spinner" />}
      {error && <div style={{ padding: '12px 16px', background: '#fff3f3', border: '1px solid #ffcdd2', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>{error}</div>}

      {localStats && (
        <>
          <div class="stats-grid">
            <div class="stat-card expense"><div class="stat-label">总支出</div><div class="stat-value">{currency}{localStats.totalExpense.toFixed(2)}</div></div>
            <div class="stat-card income"><div class="stat-label">总收入</div><div class="stat-value">{currency}{localStats.totalIncome.toFixed(2)}</div></div>
            <div class="stat-card net"><div class="stat-label">净收入</div>
              <div class="stat-value" style={{ color: localStats.netIncome >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {currency}{localStats.netIncome.toFixed(2)}</div></div>
          </div>

          <div class="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>📊 分类支出明细</h3>
            {localStats.byCategory.length === 0 ? (
              <div class="empty-state" style={{ padding: '20px' }}><p>本月暂无支出记录</p></div>
            ) : localStats.byCategory.map((item) => {
              const pct = localStats.totalExpense > 0 ? (item.amount / localStats.totalExpense * 100) : 0
              return (
                <div key={item.category_id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '13px' }}>
                    <span>{item.icon} {item.name}</span>
                    <span style={{ fontWeight: 600 }}>{currency}{item.amount.toFixed(2)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height: 10, background: 'var(--bg-secondary)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: `hsl(${350 - pct * 3}, 70%, 55%)`, borderRadius: 5, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div class="card">
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>📅 每日支出趋势</h3>
            {localStats.dailySpending.length === 0 ? (
              <div class="empty-state" style={{ padding: '20px' }}><p>本月暂无每日数据</p></div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'end', gap: 3, height: 120 }}>
                {localStats.dailySpending.map((d) => {
                  const maxAmount = Math.max(...localStats.dailySpending.map(ds => ds.amount), 1)
                  const height = (d.amount / maxAmount) * 100
                  return (
                    <div key={d.date} title={`${d.date}: ${currency}${d.amount.toFixed(2)}`}
                      style={{ flex: 1, minHeight: 4, height: `${Math.max(height, 3)}%`, background: 'var(--danger)', borderRadius: '3px 3px 0 0',
                        opacity: 0.7, transition: 'opacity 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')} />
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
