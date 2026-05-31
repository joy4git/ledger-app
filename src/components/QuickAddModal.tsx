import { useState, useEffect } from 'preact/hooks'
import { useLedgerStore } from '../store'

export default function QuickAddModal(): JSX.Element {
  const addModalOpen = useLedgerStore(s => s.addModalOpen)
  const closeAddModal = useLedgerStore(s => s.closeAddModal)
  const categories = useLedgerStore(s => s.categories)
  const addTransaction = useLedgerStore(s => s.addTransaction)
  const loadAll = useLedgerStore(s => s.loadAll)

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  const [type, setType] = useState<'expense' | 'income'>('expense')

  const filtered = categories.filter(c => c.type === type)

  useEffect(() => {
    if (addModalOpen && categories.length > 0) {
      const first = filtered[0]
      if (first) setCategoryId(String(first.id))
    }
  }, [addModalOpen, categories, filtered.length])

  if (!addModalOpen) return <></>

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0 || !categoryId) return
    await addTransaction({ date, amount: amt, category_id: parseInt(categoryId), note: note.trim(), type })
    setAmount(''); setNote(''); closeAddModal(); loadAll()
  }

  return (
    <div class="modal-overlay" onClick={closeAddModal}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <h2>➕ 快速记账</h2>
        <form onSubmit={handleSubmit}>
          <div class="form-group" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button type="button" class={`btn ${type === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setType('expense'); const f = categories.filter(c => c.type === 'expense')[0]; if (f) setCategoryId(String(f.id)) }}>💸 支出</button>
            <button type="button" class={`btn ${type === 'income' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setType('income'); const f = categories.filter(c => c.type === 'income')[0]; if (f) setCategoryId(String(f.id)) }}>💰 收入</button>
          </div>
          <div class="form-group"><label>金额</label>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={amount}
              onInput={(e) => setAmount((e.target as HTMLInputElement).value)} required /></div>
          <div class="form-row">
            <div class="form-group"><label>日期</label>
              <input type="date" value={date} onInput={(e) => setDate((e.target as HTMLInputElement).value)} required /></div>
            <div class="form-group"><label>分类</label>
              <select value={categoryId} onInput={(e) => setCategoryId((e.target as HTMLInputElement).value)} required>
                <option value="">选择分类</option>
                {filtered.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
          </div>
          <div class="form-group"><label>备注（可选）</label>
            <input type="text" placeholder="添加备注..." value={note}
              onInput={(e) => setNote((e.target as HTMLInputElement).value)} /></div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onClick={closeAddModal}>取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  )
}
