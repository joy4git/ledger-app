import { useState, useEffect } from 'preact/hooks'
import { useLedgerStore } from '../store'
import type { Transaction } from '../types'

export default function EditModal(): JSX.Element {
  const editModalOpen = useLedgerStore(s => s.editModalOpen)
  const editingTx = useLedgerStore(s => s.editingTx)
  const closeEditModal = useLedgerStore(s => s.closeEditModal)
  const categories = useLedgerStore(s => s.categories)
  const updateTransaction = useLedgerStore(s => s.updateTransaction)
  const loadAll = useLedgerStore(s => s.loadAll)

  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  const [type, setType] = useState<'expense' | 'income'>('expense')

  useEffect(() => {
    if (editingTx) {
      setDate(editingTx.date)
      setAmount(String(editingTx.amount))
      setCategoryId(String(editingTx.category_id))
      setNote(editingTx.note)
      setType(editingTx.type)
    }
  }, [editingTx])

  if (!editModalOpen || !editingTx) return <></>

  const filtered = categories.filter(c => c.type === type)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0 || !categoryId) return
    await updateTransaction(editingTx.id, { date, amount: amt, category_id: parseInt(categoryId), note: note.trim(), type })
    closeEditModal()
    loadAll()
  }

  return (
    <div class="modal-overlay" onClick={closeEditModal}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <h2>✏️ 编辑交易</h2>
        <form onSubmit={handleSubmit}>
          <div class="form-group"><label>类型</label>
            <select value={type} onInput={(e) => setType((e.target as HTMLSelectElement).value as 'expense' | 'income')}>
              <option value="expense">💸 支出</option><option value="income">💰 收入</option></select></div>
          <div class="form-row">
            <div class="form-group"><label>金额</label>
              <input type="number" step="0.01" min="0" value={amount}
                onInput={(e) => setAmount((e.target as HTMLInputElement).value)} required /></div>
            <div class="form-group"><label>日期</label>
              <input type="date" value={date} onInput={(e) => setDate((e.target as HTMLInputElement).value)} required /></div>
          </div>
          <div class="form-group"><label>分类</label>
            <select value={categoryId} onInput={(e) => setCategoryId((e.target as HTMLInputElement).value)} required>
              <option value="">选择分类</option>
              {filtered.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
          <div class="form-group"><label>备注</label>
            <input type="text" value={note} onInput={(e) => setNote((e.target as HTMLInputElement).value)} /></div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onClick={closeEditModal}>取消</button>
            <button type="submit" class="btn btn-primary">更新</button>
          </div>
        </form>
      </div>
    </div>
  )
}
