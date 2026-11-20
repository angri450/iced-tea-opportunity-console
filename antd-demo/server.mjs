// 静态服务：读取 dist 目录，对文本类型做 gzip，并给带哈希的资源长缓存
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join, extname, normalize } from 'node:path'

const ROOT = new URL('./dist/', import.meta.url).pathname
const PORT = Number(process.env.PORT || 19052)

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

createServer(async (req, res) => {
  const started = Date.now()
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
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
}).listen(PORT, '0.0.0.0', () => {
  console.log(`静态服务已启动 http://0.0.0.0:${PORT}/  (根目录 ${ROOT})`)
})
