import { useLedgerStore } from '../store'

interface SidebarProps {
  page: string
  setPage: (page: string) => void
}

const menuItems = [
  { id: 'dashboard', label: '📊 仪表盘', key: 'dashboard' },
  { id: 'transactions', label: '💳 交易记录', key: 'transactions' },
  { id: 'stats', label: '📈 统计', key: 'stats' },
  { id: 'categories', label: '🏷️ 分类管理', key: 'categories' },
  { id: 'settings', label: '⚙️ 设置', key: 'settings' },
] as const

export default function Sidebar({ page, setPage }: SidebarProps): JSX.Element {
  const sidebarOpen = useLedgerStore(s => s.sidebarOpen)
  const setSidebar = useLedgerStore(s => s.setSidebar)
  const theme = useLedgerStore(s => s.theme)
  const setTheme = useLedgerStore(s => s.setTheme)

  return (
    <>
      {sidebarOpen && (
        <div class="sidebar-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 49 }}
          onClick={() => setSidebar(false)} />
      )}
      <aside class={`sidebar ${sidebarOpen ? 'open' : 'closed'} ${theme}`}
        style={{ width: sidebarOpen ? '220px' : '60px', transition: 'width 0.2s ease', display: 'flex', flexDirection: 'column',
          background: 'var(--bg-secondary)', borderRight: sidebarOpen ? '1px solid var(--border-color)' : 'none',
          overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: sidebarOpen ? '18px 16px 10px' : '18px 0', textAlign: 'center' }}>
          <span style={{ fontSize: '22px', cursor: 'pointer' }} title={sidebarOpen ? 'Ledger' : ''}>📒</span>
        </div>
        <button class="btn-icon" style={{ margin: '0 auto 8px', display: 'block' }}
          onClick={() => setSidebar(!sidebarOpen)} title={sidebarOpen ? '收起侧栏' : '展开侧栏'}>
          {sidebarOpen ? '◀' : '▶'}
        </button>
        <nav style={{ flex: 1, padding: '4px 8px' }}>
          {menuItems.map((item) => {
            const active = page === item.key
            return (
              <button key={item.key} onClick={() => setPage(item.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                  padding: sidebarOpen ? '10px 12px' : '10px 0', justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  background: active ? 'var(--accent-light)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '14px', fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s ease', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.label.split(' ')[0]}</span>
                {sidebarOpen && <span>{item.label.split(' ').slice(1).join(' ')}</span>}
              </button>
            )
          })}
        </nav>
        <div style={{ padding: sidebarOpen ? '8px 12px' : '8px 0' }}>
          <button class="btn-icon" style={{ display: 'block', margin: '0 auto', fontSize: '20px' }}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? '切换到暗黑模式' : '切换到亮色模式'}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </aside>
    </>
  )
}
