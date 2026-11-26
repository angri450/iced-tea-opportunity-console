// 静态服务：读取 dist 目录，对文本类型做 gzip，并给带哈希的资源长缓存
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { join, extname, normalize } from 'node:path'

const ROOT = new URL('./dist/', import.meta.url).pathname
const DATA_DIR = new URL('./.data/', import.meta.url).pathname
const STATS_FILE = join(DATA_DIR, 'stats.json')
const PORT = Number(process.env.PORT || 19053)
const HOST = process.env.HOST || '127.0.0.1'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

const cache = new Map()

async function load(file) {
  // 带哈希的资源不会变，可以缓存；index.html 每次构建都变，必须重读
  const cacheable = /-[A-Za-z0-9_]{8,}\.(js|css)$/.test(file)
  if (cacheable && cache.has(file)) return cache.get(file)
  const buf = await readFile(file)
  const type = TYPES[extname(file)] || 'application/octet-stream'
  const compressed = /text|javascript|css|json|svg/.test(type) ? gzipSync(buf, { level: 9 }) : null
  const entry = { buf, compressed, type }
  if (cacheable) cache.set(file, entry)
  return entry
}


// ---------------------------------------------------------------- 访问统计
// 只数“打开页面”的请求：排除爬虫、预取、本机与回环，避免把自测算进宣发量。
mkdirSync(DATA_DIR, { recursive: true })

const dayKey = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
const LOCAL_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', '49.232.197.22'])

function loadStats() {
  try {
    const raw = JSON.parse(readFileSync(STATS_FILE, 'utf8'))
    return {
      total: raw.total || 0,
      first: raw.first || null,
      last: raw.last || null,
      baseline: raw.baseline || null,
      days: raw.days || {},
      visitors: raw.visitors || {},
    }
  } catch {
    // 首次启动：11-20 至 11-25 的服务器日志里能数出 156 次页面请求，作为基线
    return {
      total: 156,
      first: '2026-11-20',
      last: null,
      baseline: '启动前服务器日志回填 156 次（2026-11-20 至 2026-11-25）',
      days: {},
      visitors: {},
    }
  }
}

let stats = loadStats()
let flushTimer = null

function saveStats() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    const cutoff = new Date(Date.now() - 120 * 86400 * 1000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
    for (const d of Object.keys(stats.days)) if (d < cutoff) delete stats.days[d]
    try {
      writeFileSync(STATS_FILE, JSON.stringify(stats))
    } catch (e) {
      console.error('写统计失败', e.message)
    }
  }, 200)
}

function countView(req) {
  const ua = String(req.headers['user-agent'] || '')
  if (!ua || /bot|spider|crawl|headless|preview|lighthouse|curl|wget|python/i.test(ua)) return false
  const purpose = String(req.headers['sec-purpose'] || req.headers['purpose'] || '').toLowerCase()
  if (purpose.includes('prefetch') || purpose.includes('prerender')) return false
  const forwarded = String(req.headers['x-real-ip'] || '').trim()
  const ip = forwarded || String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || ''
  if (LOCAL_IPS.has(ip)) return false
  const key = createHash('sha256').update(ip + '|' + ua).digest('hex').slice(0, 16)
  const day = dayKey()
  stats.total += 1
  stats.days[day] = (stats.days[day] || 0) + 1
  stats.visitors[key] = Date.now()
  stats.last = new Date().toISOString()
  if (!stats.first) stats.first = day
  saveStats()
  return true
}

function statsPayload() {
  const today = dayKey()
  const tracked = Object.keys(stats.days).sort()
  const since = tracked[0] || null
  // 从开始统计那天到今天，逐日补零，画图时不漏空档
  const days = []
  if (since) {
    const cursor = new Date(since + 'T00:00:00+08:00')
    const end = new Date(today + 'T00:00:00+08:00')
    while (cursor <= end && days.length < 60) {
      const key = cursor.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
      days.push({ date: key, count: stats.days[key] || 0 })
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  return {
    total: stats.total,
    today: stats.days[today] || 0,
    visitors: Object.keys(stats.visitors).length,
    first: stats.first,
    last: stats.last,
    baseline: stats.baseline,
    since,
    days,
  }
}

createServer(async (req, res) => {
  const started = Date.now()
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)

    if (urlPath === '/api/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end(JSON.stringify(statsPayload()))
      return
    }
    let file = normalize(join(ROOT, urlPath === '/' ? 'index.html' : urlPath))
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end('forbidden')
      return
    }
    try {
      await stat(file)
    } catch {
      file = join(ROOT, 'index.html')
    }
    const entry = await load(file)
    if (urlPath === '/' || file === join(ROOT, 'index.html')) {
      const accept = String(req.headers['accept'] || '')
      if (req.method === 'GET' && (accept.includes('text/html') || accept === '')) countView(req)
    }
    const acceptGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '')
    const hashed = /-[A-Za-z0-9_]{8,}\.(js|css)$/.test(file)
    res.setHeader('Content-Type', entry.type)
    res.setHeader('Cache-Control', hashed ? 'public, max-age=31536000, immutable' : 'no-cache')
    res.setHeader('Vary', 'Accept-Encoding')
    if (entry.compressed && acceptGzip) {
      res.setHeader('Content-Encoding', 'gzip')
      res.setHeader('Content-Length', entry.compressed.length)
      res.writeHead(200)
      res.end(req.method === 'HEAD' ? undefined : entry.compressed)
    } else {
      res.setHeader('Content-Length', entry.buf.length)
      res.writeHead(200)
      res.end(req.method === 'HEAD' ? undefined : entry.buf)
    }
    console.log(`${req.method} ${urlPath} ${entry.buf.length}B -> ${entry.compressed && acceptGzip ? entry.compressed.length + 'B gzip' : 'no gzip'} ${Date.now() - started}ms`)
  } catch (e) {
    res.writeHead(500).end(String(e))
  }
}).listen(PORT, HOST, () => {
  console.log(`静态服务已启动 http://${HOST}:${PORT}/  (根目录 ${ROOT})`)
})
