import { useState } from 'preact/hooks'
import { useLedgerStore } from '../store'

export default function Categories(): JSX.Element {
  const categories = useLedgerStore(s => s.categories)
  const addCategory = useLedgerStore(s => s.addCategory)
  const updateCategory = useLedgerStore(s => s.updateCategory)
  const removeCategory = useLedgerStore(s => s.removeCategory)
  const loadAll = useLedgerStore(s => s.loadAll)

  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('📁')
  const [formType, setFormType] = useState<'expense' | 'income'>('expense')
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('📁')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const expenseCategories = categories.filter(c => c.type === 'expense')
  const incomeCategories = categories.filter(c => c.type === 'income')

  const handleAdd = async () => {
    if (!formName.trim()) return
    await addCategory({ name: formName.trim(), icon: formIcon, type: formType })
    setFormName(''); setFormIcon('📁'); setAdding(false); loadAll()
  }

  const handleUpdate = async (id: number) => {
    if (!newName.trim()) return
    await updateCategory(id, { name: newName.trim(), icon: newIcon })
    setEditId(null); setNewName(''); setNewIcon('📁'); loadAll()
  }

  const handleDelete = async (id: number) => {
    await removeCategory(id); setDeleteConfirm(null); loadAll()
  }

  const iconOptions = ['🍜', '🚗', '🛒', '🎮', '🏠', '💊', '📚', '💰', '💼', '📈', '✈️', '🎁', '📱', '👕', '🍕', '☕', '🎬', '💡', '🔧', '📦', '📁']

  const renderSection = (title: string, cats: typeof categories) => {
    return (
      <div class="card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 12 }}>{title}</h3>
        {cats.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>暂无分类</p>
        ) : (
          cats.map((cat) => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{cat.icon}</span>
              {editId === cat.id ? (
                <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select value={newIcon} onInput={(e) => setNewIcon((e.target as HTMLSelectElement).value)}
                    style={{ width: 48, textAlign: 'center' }}>
                    {iconOptions.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                  <input type="text" value={newName} onInput={(e) => setNewName((e.target as HTMLInputElement).value)}
                    style={{ flex: 1 }} placeholder="分类名称" />
                </div>
              ) : (
                <span style={{ flex: 1, fontWeight: 500, fontSize: '14px' }}>{cat.name}</span>
              )}
              <div style={{ display: 'flex', gap: '4px' }}>
                {editId === cat.id ? (
                  <>
                    <button class="btn btn-sm btn-primary" onClick={() => handleUpdate(cat.id)}>保存</button>
                    <button class="btn btn-sm btn-secondary" onClick={() => setEditId(null)}>取消</button>
                  </>
                ) : deleteConfirm === cat.id ? (
                  <>
                    <button class="btn btn-sm btn-danger" onClick={() => handleDelete(cat.id)}>删除</button>
                    <button class="btn btn-sm btn-secondary" onClick={() => setDeleteConfirm(null)}>取消</button>
                  </>
                ) : (
                  <>
                    <button class="btn-icon" title="编辑" onClick={() => { setEditId(cat.id); setNewName(cat.name); setNewIcon(cat.icon) }}>✏️</button>
                    <button class="btn-icon" title="删除" style={{ color: 'var(--danger)' }} onClick={() => setDeleteConfirm(cat.id)}>🗑️</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 24 }}>🏷️ 分类管理</h1>
      {renderSection('💸 支出分类', expenseCategories)}
      {renderSection('💰 收入分类', incomeCategories)}

      {adding ? (
        <div class="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>添加新分类</h3>
          <div class="form-row">
            <div class="form-group"><label>名称</label>
              <input type="text" placeholder="分类名称" value={formName}
                onInput={(e) => setFormName((e.target as HTMLInputElement).value)} /></div>
            <div class="form-group"><label>类型</label>
              <select value={formType}
                onInput={(e) => setFormType((e.target as HTMLSelectElement).value as 'expense' | 'income')}>
                <option value="expense">支出</option><option value="income">收入</option></select></div>
          </div>
          <div class="form-group"><label>图标</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {iconOptions.map((icon) => (
                <button key={icon}
                  class={`btn-icon ${formIcon === icon ? 'selected' : ''}`}
                  style={{ fontSize: '20px', background: formIcon === icon ? 'var(--accent-light)' : 'transparent', border: formIcon === icon ? '2px solid var(--accent)' : '1px solid var(--border-color)' }}
                  onClick={() => setFormIcon(icon)}>{icon}</button>
              ))}
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" onClick={() => setAdding(false)}>取消</button>
            <button class="btn btn-primary" onClick={handleAdd}>添加</button>
          </div>
        </div>
      ) : (
        <button class="btn btn-primary" onClick={() => setAdding(true)} style={{ marginTop: 20 }}>➕ 添加分类</button>
      )}
    </div>
  )
}
