import { useState, useEffect } from 'preact/hooks'
import { useLedgerStore } from './store'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Stats from './pages/Stats'
import Categories from './pages/Categories'
import Settings from './pages/Settings'
import './styles/global.css'

type Page = 'dashboard' | 'transactions' | 'stats' | 'categories' | 'settings'

export function App(): JSX.Element {
  const [page, setPage] = useState<Page>('dashboard')
  const sidebarOpen = useLedgerStore(s => s.sidebarOpen)
  const theme = useLedgerStore(s => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const renderPage = (): JSX.Element => {
    switch (page) {
      case 'dashboard': return <Dashboard />
      case 'transactions': return <Transactions />
      case 'stats': return <Stats />
      case 'categories': return <Categories />
      case 'settings': return <Settings />
    }
  }

  return (
    <div class={`app ${theme}`}>
      <Sidebar page={page} setPage={setPage} />
      <main class={`main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div class="page-content">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}
