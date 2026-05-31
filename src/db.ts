import type { Transaction, Category, AppSettings, StatsResult } from './types'

let SQL: any = null
let db: any = null

// ─── Schema SQL ──────────────────────────────────────────
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
    icon TEXT NOT NULL DEFAULT '📁'
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount >= 0),
    category_id INTEGER NOT NULL,
    note TEXT DEFAULT '',
    type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );
`

// ─── Default data ────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { name: '餐饮', type: 'expense', icon: '🍜' },
  { name: '交通', type: 'expense', icon: '🚗' },
  { name: '购物', type: 'expense', icon: '🛒' },
  { name: '娱乐', type: 'expense', icon: '🎮' },
  { name: '居住', type: 'expense', icon: '🏠' },
  { name: '医疗', type: 'expense', icon: '💊' },
  { name: '教育', type: 'expense', icon: '📚' },
  { name: '工资', type: 'income', icon: '💰' },
  { name: '兼职', type: 'income', icon: '💼' },
  { name: '投资', type: 'income', icon: '📈' },
]

const DEFAULT_SETTINGS = [
  { key: 'currency', value: '¥' },
  { key: 'theme', value: 'light' },
  { key: 'month_start', value: '1' },
]

/**
 * 初始化数据库（WASM + Schema + 默认数据）。
 * 返回一个 Promise，确保所有初始化完成。
 */
export async function initDb(): Promise<void> {
  if (db) return

  // 1. 加载 sql.js WASM
  const initSqlJs = (await import('sql.js')).default
  SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
  })

  // 2. 尝试从 localStorage 恢复
  const saved = localStorage.getItem('ledger-db')
  if (saved) {
    try {
      const buf = Uint8Array.from(atob(saved), c => c.charCodeAt(0))
      db = new SQL.Database(buf)
      db.run('PRAGMA journal_mode = WAL')
      db.run('PRAGMA foreign_keys = ON')
      return
    } catch {
      // corrupted, rebuild
      localStorage.removeItem('ledger-db')
    }
  }

  // 3. 新建数据库
  db = new SQL.Database()
  db.run('PRAGMA journal_mode = WAL')
  db.run('PRAGMA foreign_keys = ON')
  db.exec(SCHEMA)

  // 4. 插入默认分类
  db.exec("INSERT OR IGNORE INTO categories (name, type, icon) VALUES ('餐饮','expense','🍜')")
  db.exec("INSERT OR IGNORE INTO categories (name, type, icon) VALUES ('交通','expense','🚗')")
  db.exec("INSERT OR IGNORE INTO categories (name, type, icon) VALUES ('购物','expense','🛒')")
  db.exec("INSERT OR IGNORE INTO categories (name, type, icon) VALUES ('娱乐','expense','🎮')")
  db.exec("INSERT OR IGNORE INTO categories (name, type, icon) VALUES ('居住','expense','🏠')")
  db.exec("INSERT OR IGNORE INTO categories (name, type, icon) VALUES ('医疗','expense','💊')")
  db.exec("INSERT OR IGNORE INTO categories (name, type, icon) VALUES ('教育','expense','📚')")
  db.exec("INSERT OR IGNORE INTO categories (name, type, icon) VALUES ('工资','income','💰')")
  db.exec("INSERT OR IGNORE INTO categories (name, type, icon) VALUES ('兼职','income','💼')")
  db.exec("INSERT OR IGNORE INTO categories (name, type, icon) VALUES ('投资','income','📈')")

  // 5. 插入默认设置
  db.exec("INSERT OR IGNORE INTO settings (key, value) VALUES ('currency', '¥')")
  db.exec("INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'light')")
  db.exec("INSERT OR IGNORE INTO settings (key, value) VALUES ('month_start', '1')")

  // 6. 保存到 localStorage
  saveDb()
}

/** 保存当前数据库到 localStorage */
export function saveDb(): void {
  if (!db) return
  const data = db.export()
  const buf = Buffer.from(data)
  const b64 = buf.toString('base64')
  localStorage.setItem('ledger-db', b64)
}

// ─── 交易 CRUD ────────────────────────────────────────────

export function getTransactions(): Transaction[] {
  const rows = db.exec('SELECT * FROM transactions ORDER BY date DESC, id DESC')
  if (rows.length === 0) return []
  return formatTransactions(rows[0])
}

function formatTransactions(res: any): Transaction[] {
  const { columns, values } = res
  const result: Transaction[] = []
  for (const row of values) {
    const obj: Record<string, any> = {}
    columns.forEach((col: string, i: number) => { obj[col] = row[i] })
    result.push({
      id: obj.id,
      date: obj.date,
      amount: obj.amount,
      category_id: obj.category_id,
      note: obj.note || '',
      type: obj.type as 'expense' | 'income',
    })
  }
  return result
}

export function insertTransaction(tx: Omit<Transaction, 'id'>): number {
  db.run(
    'INSERT INTO transactions (date, amount, category_id, note, type) VALUES (?, ?, ?, ?, ?)',
    [tx.date, tx.amount, tx.category_id, tx.note, tx.type]
  )
  const result = db.exec('SELECT last_insert_rowid() as id')
  const id = result[0]?.values?.[0]?.[0] ?? 0
  saveDb()
  return id
}

export function updateTransaction(id: number, updates: Partial<Omit<Transaction, 'id'>>): void {
  const sets: string[] = []
  const vals: any[] = []
  if (updates.date !== undefined)      { sets.push('date = ?'); vals.push(updates.date) }
  if (updates.amount !== undefined)     { sets.push('amount = ?'); vals.push(updates.amount) }
  if (updates.category_id !== undefined){ sets.push('category_id = ?'); vals.push(updates.category_id) }
  if (updates.note !== undefined)       { sets.push('note = ?'); vals.push(updates.note) }
  if (updates.type !== undefined)       { sets.push('type = ?'); vals.push(updates.type) }
  if (sets.length === 0) return
  vals.push(id)
  db.run(`UPDATE transactions SET ${sets.join(', ')} WHERE id = ?`, vals)
  saveDb()
}

export function deleteTransaction(id: number): void {
  db.run('DELETE FROM transactions WHERE id = ?', [id])
  saveDb()
}

// ─── 分类 CRUD ────────────────────────────────────────────

export function getCategories(): Category[] {
  const rows = db.exec('SELECT * FROM categories ORDER BY type, name')
  if (rows.length === 0) return []
  const { columns, values } = rows[0]
  return values.map(v => ({
    id: v[0], name: v[1], type: v[2] as 'expense' | 'income', icon: v[3],
  }))
}

export function insertCategory(cat: Omit<Category, 'id'>): number {
  db.run(
    'INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)',
    [cat.name, cat.type, cat.icon]
  )
  const result = db.exec('SELECT last_insert_rowid() as id')
  const id = result[0]?.values?.[0]?.[0] ?? 0
  saveDb()
  return id
}

export function updateCategory(id: number, updates: Partial<Omit<Category, 'id'>>): void {
  const sets: string[] = []
  const vals: any[] = []
  if (updates.name !== undefined)  { sets.push('name = ?'); vals.push(updates.name) }
  if (updates.type !== undefined)  { sets.push('type = ?'); vals.push(updates.type) }
  if (updates.icon !== undefined)  { sets.push('icon = ?'); vals.push(updates.icon) }
  if (sets.length === 0) return
  vals.push(id)
  db.run(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, vals)
  saveDb()
}

export function deleteCategory(id: number): void {
  db.run('UPDATE transactions SET category_id = 1 WHERE category_id = ?', [id])
  db.run('DELETE FROM categories WHERE id = ?', [id])
  saveDb()
}

// ─── 设置 ─────────────────────────────────────────────────

export function getSettings(): AppSettings {
  const result: AppSettings = { currency: '¥', theme: 'light', month_start: '1' }
  const rows = db.exec('SELECT key, value FROM settings')
  if (rows.length === 0) return result
  const { columns, values } = rows[0]
  for (const row of values) {
    const obj: Record<string, string> = {}
    columns.forEach((col, i) => { obj[col] = String(row[i]) })
    if (obj.key === 'currency') result.currency = obj.value
    if (obj.key === 'theme') result.theme = obj.value as 'light' | 'dark'
    if (obj.key === 'month_start') result.month_start = obj.value
  }
  return result
}

export function updateSetting(key: string, value: string): void {
  db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
  saveDb()
}

// ─── 统计 ─────────────────────────────────────────────────

export function getStats(month: string): StatsResult {
  const start = `${month}-01`
  const [y, m] = month.split('-').map(Number)
  const nextM = m >= 12 ? 1 : m + 1
  const nextY = m >= 12 ? y + 1 : y
  const end = `${nextY}-${String(nextM).padStart(2, '0')}-01`

  const totalExpense = sumQuery(`type = 'expense' AND date >= '${start}' AND date < '${end}'`)
  const totalIncome = sumQuery(`type = 'income' AND date >= '${start}' AND date < '${end}'`)

  const byCat: StatsResult['byCategory'] = []
  const rows = db.exec(`
    SELECT c.id as category_id, c.name, c.icon, COALESCE(SUM(t.amount), 0) as amount
    FROM categories c
    LEFT JOIN transactions t ON t.category_id = c.id
      AND t.type = 'expense' AND t.date >= '${start}' AND t.date < '${end}'
    GROUP BY c.id
    HAVING amount > 0
    ORDER BY amount DESC
  `)
  if (rows.length > 0) {
    const { columns, values } = rows[0]
    for (const v of values) {
      const obj: Record<string, any> = {}
      columns.forEach((col, i) => { obj[col] = v[i] })
      byCat.push({
        category_id: obj.category_id,
        name: obj.name,
        icon: obj.icon,
        amount: obj.amount,
      })
    }
  }

  const dailySpending: StatsResult['dailySpending'] = []
  const dailyRows = db.exec(`
    SELECT date, SUM(amount) as amount
    FROM transactions
    WHERE type = 'expense' AND date >= '${start}' AND date < '${end}'
    GROUP BY date ORDER BY date
  `)
  if (dailyRows.length > 0) {
    const { columns, values } = dailyRows[0]
    for (const v of values) {
      const obj: Record<string, any> = {}
      columns.forEach((col, i) => { obj[col] = v[i] })
      dailySpending.push({ date: obj.date, amount: obj.amount })
    }
  }

  return {
    totalExpense, totalIncome, byCategory: byCat,
    dailySpending, netIncome: totalIncome - totalExpense,
  }
}

function sumQuery(where: string): number {
  const result = db.exec(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE ${where}`)
  if (result.length === 0 || result[0].values.length === 0) return 0
  return Number(result[0].values[0][0])
}

// ─── CSV 导入 ────────────────────────────────────────────

export function importCsv(filePath: string): { inserted: number; errors: number } {
  // 在 Electron 环境中，filePath 是文件路径
  // 在浏览器环境中（如果测试用），需要 FileReader
  let content: string
  if (typeof window !== 'undefined' && (window as any).ledgerApi?._readFile) {
    content = (window as any).ledgerApi._readFile(filePath)
  } else {
    try {
      const fs = require('fs')
      content = fs.readFileSync(filePath, 'utf-8')
    } catch {
      return { inserted: 0, errors: 1 }
    }
  }

  const lines = content.split('\n').filter(l => l.trim())
  if (lines.length < 2) return { inserted: 0, errors: 0 }

  let count = 0, errors = 0
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    if (cols.length < 4) { errors++; continue }
    try {
      const [dateStr, amountStr, typeStr, categoryStr, ...rest] = cols
      const amount = parseFloat(amountStr)
      if (isNaN(amount) || !dateStr) { errors++; continue }
      const type = typeStr === 'income' ? 'income' : 'expense'

      // 查找或创建分类
      const catRows = db.exec(
        `SELECT id FROM categories WHERE name='${categoryStr.replace(/'/g, "''")}' AND type='${type}'`
      )
      let categoryId: number
      if (catRows.length > 0 && catRows[0].values.length > 0) {
        categoryId = catRows[0].values[0][0]
      } else {
        const res = db.exec(`INSERT INTO categories (name, type, icon) VALUES ('${categoryStr.replace(/'/g, "''")}', '${type}', '📁')`)
        categoryId = res[0]?.values?.[0]?.[0] ?? 0
      }

      const note = rest.join(',').replace(/'/g, "''")
      db.run(
        `INSERT INTO transactions (date, amount, category_id, note, type) VALUES ('${dateStr}', ${amount}, ${categoryId}, '${note}', '${type}')`
      )
      count++
    } catch { errors++ }
  }
  saveDb()
  return { inserted: count, errors }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let q = false
  for (const c of line) {
    if (c === '"') q = !q
    else if (c === ',' && !q) { result.push(cur.trim()); cur = '' }
    else cur += c
  }
  result.push(cur.trim())
  return result
}
