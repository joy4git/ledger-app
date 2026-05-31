import { render } from 'preact'
import { App } from './App'
import { initDb } from './db'

// ─── 先初始化数据库，再渲染 App ─────────────────────────
// 关键：sql.js WASM 加载是异步的，必须在渲染前完成
// 否则 App 挂载时 DB 未就绪 → 数据加载失败 → 白屏
async function main(): Promise<void> {
  try {
    await initDb()
  } catch (err) {
    console.error('[main] DB init failed:', err)
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
        <div style="text-align:center;color:#ef4444;">
          <h2>数据库初始化失败</h2>
          <p>${err instanceof Error ? err.message : String(err)}</p>
        </div>
      </div>
    `
    return
  }

  // DB 就绪后渲染
  const root = document.getElementById('app')
  if (root) {
    render(<App />, root)
  } else {
    console.error('[main] #app element not found')
  }
}

main()
