import { useState, useEffect } from 'preact/hooks'
import { useLedgerStore } from '../store'

export default function Settings(): JSX.Element {
  const settings = useLedgerStore(s => s.settings)
  const updateSetting = useLedgerStore(s => s.updateSetting)
  const theme = useLedgerStore(s => s.theme)
  const setTheme = useLedgerStore(s => s.setTheme)
  const transactions = useLedgerStore(s => s.transactions)
  const categories = useLedgerStore(s => s.categories)
  const loadAll = useLedgerStore(s => s.loadAll)

  const [currency, setCurrency] = useState(settings.currency || '¥')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ inserted: number; errors: number } | null>(null)

  const handleSaveCurrency = async () => {
    await updateSetting('currency', currency)
    loadAll()
  }

  const handleImportClick = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setImporting(true)
      try {
        const path = (file as any).path || file.webkitRelativePath || ''
        const result = await window.ledgerApi?.importCsv(path)
        if (result) setImportResult(result)
      } catch (err) {
        setImportResult({ inserted: 0, errors: 1 })
      } finally {
        setImporting(false)
      }
    }
    input.click()
  }

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    return { value: String(m), label: `${m}日` }
  })

  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 24 }}>⚙️ 设置</h1>

      <div class="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>🎨 外观</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button class={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center' }} onClick={() => setTheme('light')}>☀️ 亮色模式</button>
          <button class={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center' }} onClick={() => setTheme('dark')}>🌙 暗黑模式</button>
        </div>
      </div>

      <div class="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>💱 货币符号</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" value={currency}
            onInput={(e) => setCurrency((e.target as HTMLInputElement).value)} style={{ maxWidth: 80 }} placeholder="¥" />
          <button class="btn btn-primary" onClick={handleSaveCurrency}>保存</button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 8 }}>
          用于在金额前显示货币符号（如 ¥、$、€）
        </p>
      </div>

      <div class="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>📅 月度起始日</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={settings.month_start || '1'}
            onInput={(e) => updateSetting('month_start', (e.target as HTMLSelectElement).value)}
            style={{ width: 'auto', maxWidth: 120 }}>
            {monthOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      <div class="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>📦 数据导入</h3>
        <button class="btn btn-secondary" onClick={handleImportClick} disabled={importing}>
          {importing ? '⏳ 导入中...' : '📥 导入 CSV'}
        </button>
        {importResult && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
            <span style={{ color: 'var(--success)' }}>成功: {importResult.inserted} 条</span>
            {importResult.errors > 0 && <span style={{ color: 'var(--danger)', marginLeft: 12 }}>错误: {importResult.errors} 条</span>}
          </div>
        )}
      </div>

      <div class="card">
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>📊 数据概览</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>总交易数</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{transactions.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>总支出</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--danger)' }}>
              {currency}{totalExpense.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>总收入</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success)' }}>
              {currency}{totalIncome.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>分类数</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{categories.length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
