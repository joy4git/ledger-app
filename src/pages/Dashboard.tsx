import { useLedgerStore } from '../store'
import QuickAddModal from '../components/QuickAddModal'
import EditModal from '../components/EditModal'

export default function Dashboard(): JSX.Element {
  const transactions = useLedgerStore(s => s.transactions)
  const stats = useLedgerStore(s => s.stats)
  const categories = useLedgerStore(s => s.categories)
  const settings = useLedgerStore(s => s.settings)
  const openAddModal = useLedgerStore(s => s.openAddModal)

  const getCategoryName = (catId: number): { icon: string; name: string } => {
    const cat = categories.find(c => c.id === catId)
    return cat ? { icon: cat.icon, name: cat.name } : { icon: '❓', name: '未知' }
  }
  const currency = settings.currency || '¥'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>📊 仪表盘</h1>
        <button class="btn btn-primary" onClick={openAddModal}>➕ 记一笔</button>
      </div>

      {stats ? (
        <div class="stats-grid">
          <div class="stat-card expense"><div class="stat-label">本月支出</div><div class="stat-value">{currency}{stats.totalExpense.toFixed(2)}</div></div>
          <div class="stat-card income"><div class="stat-label">本月收入</div><div class="stat-value">{currency}{stats.totalIncome.toFixed(2)}</div></div>
          <div class="stat-card net"><div class="stat-label">本月结余</div><div class="stat-value">{currency}{stats.netIncome.toFixed(2)}</div></div>
          <div class="stat-card"><div class="stat-label">本月笔数</div>
            <div class="stat-value">{transactions.filter(t => t.date.startsWith(useLedgerStore.getState().currentMonth)).length}</div></div>
        </div>
      ) : <div class="loading-spinner" />}

      {stats && stats.byCategory.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 12 }}>🏷️ 支出排行</h3>
          {stats.byCategory.slice(0, 5).map((item) => {
            const pct = stats.totalExpense > 0 ? (item.amount / stats.totalExpense * 100) : 0
            return (
              <div key={item.category_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.name}</span>
                    <span class="amount-expense" style={{ fontSize: '13px', fontWeight: 600 }}>{currency}{item.amount.toFixed(2)}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: 'var(--danger)', borderRadius: 3, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 12 }}>🕐 最近交易</h3>
        {transactions.length === 0 ? (
          <div class="empty-state"><div class="icon">📝</div><p>还没有记录，点击「记一笔」开始</p></div>
        ) : (
          <div class="table-wrapper">
            <table>
              <thead><tr><th>日期</th><th>分类</th><th>备注</th><th>金额</th></tr></thead>
              <tbody>
                {transactions.slice(0, 10).map((tx) => {
                  const cat = getCategoryName(tx.category_id)
                  return (
                    <tr key={tx.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{tx.date}</td>
                      <td><span class="category-tag">{cat.icon} {cat.name}</span></td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.note || '—'}</td>
                      <td><span class={tx.type === 'expense' ? 'amount-expense' : 'amount-income'}>
                        {tx.type === 'expense' ? '-' : '+'}{currency}{tx.amount.toFixed(2)}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <QuickAddModal />
      <EditModal />
    </div>
  )
}
