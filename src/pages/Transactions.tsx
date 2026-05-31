import { useState } from 'preact/hooks'
import { useLedgerStore } from '../store'
import QuickAddModal from '../components/QuickAddModal'
import EditModal from '../components/EditModal'

export default function Transactions(): JSX.Element {
  const transactions = useLedgerStore(s => s.transactions)
  const categories = useLedgerStore(s => s.categories)
  const settings = useLedgerStore(s => s.settings)
  const removeTransaction = useLedgerStore(s => s.removeTransaction)
  const openEditModal = useLedgerStore(s => s.openEditModal)
  const openAddModal = useLedgerStore(s => s.openAddModal)

  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const currency = settings.currency || '¥'

  const getCategoryName = (catId: number): { icon: string; name: string } => {
    const cat = categories.find(c => c.id === catId)
    return cat ? { icon: cat.icon, name: cat.name } : { icon: '❓', name: '未知' }
  }

  const filtered = transactions
    .filter((tx) => {
      if (filterType !== 'all' && tx.type !== filterType) return false
      if (search && !tx.note.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortBy === 'date') cmp = a.date.localeCompare(b.date)
      else cmp = a.amount - b.amount
      return sortDir === 'desc' ? -cmp : cmp
    })

  const handleDelete = async (id: number) => {
    await removeTransaction(id)
    setDeleteConfirm(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>💳 交易记录</h1>
        <button class="btn btn-primary" onClick={openAddModal}>➕ 记一笔</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', padding: '14px 18px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
        <input type="text" placeholder="搜索备注..." value={search}
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)} style={{ maxWidth: 200 }} />
        <select value={filterType}
          onInput={(e) => setFilterType((e.target as HTMLSelectElement).value as typeof filterType)}
          style={{ width: 'auto', maxWidth: 120 }}>
          <option value="all">全部</option><option value="expense">支出</option><option value="income">收入</option>
        </select>
        <select value={`${sortBy}-${sortDir}`}
          onInput={(e) => { const val = (e.target as HTMLSelectElement).value; const [by, dir] = val.split('-') as [typeof sortBy, typeof sortDir]; setSortBy(by); setSortDir(dir) }}
          style={{ width: 'auto', maxWidth: 120 }}>
          <option value="date-desc">日期 ↓</option><option value="date-asc">日期 ↑</option>
          <option value="amount-desc">金额 ↓</option><option value="amount-asc">金额 ↑</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div class="empty-state"><div class="icon">📭</div>
          <p>{transactions.length === 0 ? '还没有交易记录' : '没有找到匹配的记录'}</p></div>
      ) : (
        <div class="table-wrapper">
          <table>
            <thead><tr><th>日期</th><th>分类</th><th>备注</th><th>金额</th><th style={{ textAlign: 'right' }}>操作</th></tr></thead>
            <tbody>
              {filtered.map((tx) => {
                const cat = getCategoryName(tx.category_id)
                return (
                  <tr key={tx.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{tx.date}</td>
                    <td><span class="category-tag">{cat.icon} {cat.name}</span></td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.note || '—'}</td>
                    <td><span class={tx.type === 'expense' ? 'amount-expense' : 'amount-income'}>
                      {tx.type === 'expense' ? '-' : '+'}{currency}{tx.amount.toFixed(2)}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button class="btn-icon" title="编辑" onClick={() => openEditModal(tx)}>✏️</button>
                        {deleteConfirm === tx.id ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button class="btn btn-sm btn-primary" onClick={() => handleDelete(tx.id)}>确认</button>
                            <button class="btn btn-sm btn-secondary" onClick={() => setDeleteConfirm(null)}>取消</button>
                          </div>
                        ) : (
                          <button class="btn-icon" title="删除" onClick={() => setDeleteConfirm(tx.id)}>🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <QuickAddModal />
      <EditModal />
    </div>
  )
}
