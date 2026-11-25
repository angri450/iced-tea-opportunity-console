import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Card,
  Checkbox,
  ConfigProvider,
  Divider,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  Radio,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  EyeOutlined,
  FileSearchOutlined,
  LinkOutlined,
  MenuOutlined,
  MoonOutlined,
  ReadOutlined,
  ShoppingOutlined,
  SunOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import zhCN from 'antd/locale/zh_CN'
import StickerBoard from './components/StickerBoard'
import { STICKER_SIZE } from './scene/bottleStage'
import profile from './data/bottle-profile.json'
import { scenes } from './data/stickerScenes'
import { buildTheme, type ThemeMode } from './theme'
import {
  boundaries,
  incrementOptions,
  memes,
  methodRows,
  queryTemplates,
  type Meme,
  type Suggestion,
  type VoteValue,
} from './data/memes'

const { Header, Sider, Content } = Layout

type Backfill = {
  actual: string
  confounders: string[]
  note: string
  verdict: '成立' | '不成立' | '无法判断'
  filledAt: string
}

type Decision = {
  status?: '已放行' | '已否决'
  by?: string
  reason?: string
  increment?: string
  backfill?: Backfill
}

type Store = Record<string, Decision>

type VisitStats = {
  total: number
  today: number
  visitors: number
  first: string | null
  last: string | null
  baseline: string | null
  recent: [string, number][]
}

const STORAGE_KEY = 'iced-tea-console-v1'
const THEME_KEY = 'iced-tea-theme'
const CONFS = ['促销活动', '天气', '铺货与陈列', '竞品动作']

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

function readMode(): ThemeMode {
  const attr = document.documentElement.dataset.theme
  return attr === 'dark' ? 'dark' : 'light'
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function stateStyle(value: VoteValue | Suggestion) {
  if (value === '通过' || value === '内容响应') {
    return { color: 'var(--ok-600)', background: 'var(--ok-50)', borderColor: 'transparent' }
  }
  if (value === '不通过' || value === '不需跟') {
    return { color: 'var(--bad-600)', background: 'var(--bad-50)', borderColor: 'transparent' }
  }
  return { color: 'var(--warn-600)', background: 'var(--warn-50)', borderColor: 'transparent' }
}

function StateTag({ value }: { value: VoteValue | Suggestion }) {
  return <Tag style={{ ...stateStyle(value), fontWeight: 500, marginInlineEnd: 0 }}>{value}</Tag>
}

function App() {
  const [mode, setMode] = useState<ThemeMode>(readMode)
  const [view, setView] = useState<'candidates' | 'card' | 'method' | 'sticker'>('candidates')
  const [selected, setSelected] = useState<string>(memes[0].id)
  const [store, setStore] = useState<Store>(() => loadStore())
  const [collapsed, setCollapsed] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [announce, setAnnounce] = useState('')
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null)

  const toggleRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const cardHeadingRef = useRef<HTMLHeadingElement>(null)
  const listHeadingRef = useRef<HTMLHeadingElement>(null)

  const [decisionOpen, setDecisionOpen] = useState(false)
  const [decisionKind, setDecisionKind] = useState<'已放行' | '已否决'>('已放行')
  const [backfillOpen, setBackfillOpen] = useState(false)
  const [decisionForm] = Form.useForm<{ name: string; reason?: string }>()
  const [backfillForm] = Form.useForm<{ actual: string; confounders?: string[]; note?: string; verdict: string }>()

  useEffect(() => {
    document.documentElement.dataset.theme = mode
    try {
      localStorage.setItem(THEME_KEY, mode)
    } catch {
      // 隐私模式下写入失败时不影响页面
    }
  }, [mode])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  }, [store])

  // 抽屉打开时锁滚动、接 Escape、把焦点移进抽屉
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeDrawer()
      }
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const firstLink = navRef.current?.querySelector<HTMLElement>('.ant-menu-item')
    firstLink?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
    // closeDrawer 是稳定的闭包，只依赖 drawerOpen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen])

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as VisitStats
        if (alive) setVisitStats(data)
      } catch {
        // 本地开发没有 /api/stats 时不显示，不影响其他功能
      }
    }
    load()
    const timer = window.setInterval(load, 30000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [])

  const closeDrawer = () => {
    setDrawerOpen(false)
    window.requestAnimationFrame(() => toggleRef.current?.focus())
  }

  const meme: Meme = memes.find((m) => m.id === selected) ?? memes[0]
  const dec: Decision = store[meme.id] ?? {}

  const patch = (id: string, next: Partial<Decision>) => {
    setStore((prev) => ({ ...prev, [id]: { ...prev[id], ...next } }))
  }

  const stats = useMemo(() => {
    const green = memes.filter((m) => m.votes.every((v) => v.value === '通过')).length
    const manual = memes.filter((m) => m.suggestion === '人工复核' || m.suggestion === '观察').length
    const filled = Object.values(store).filter((d) => d.backfill).length
    return [
      { label: '候选梗', value: memes.length, unit: '个' },
      { label: '四项全绿', value: green, unit: '个' },
      { label: '需人工判定', value: manual, unit: '个' },
      { label: '已回填', value: filled, unit: '条' },
    ]
  }, [store])

  const blockerText: Record<string, { fail: string; unknown: string }> = {
    讨论仍在持续: { fail: '持续性证据不足', unknown: '持续性证据不足' },
    场景挂靠: { fail: '场景挂不住', unknown: '场景未核实' },
    品牌还没用过: { fail: '品牌已用过', unknown: '品牌是否已用未核实' },
    风险可接受: { fail: '风险不可接受', unknown: '风险未核实' },
  }

  const blocker = (m: Meme) => {
    const bad = m.votes.filter((v) => v.value !== '通过')
    if (bad.length === 0) return '四项全绿'
    return bad
      .map((v) => {
        const text = blockerText[v.label]
        if (!text) return v.label
        return v.value === '未知' ? `${text.unknown}（未知）` : text.fail
      })
      .join('、')
  }

  // 列表与判定卡之间的视图切换。支持时用 View Transitions，并把焦点交给新视图的标题。
  const transitionTo = (apply: () => void, done: () => void) => {
    const start = document.startViewTransition?.bind(document)
    if (!start || prefersReducedMotion()) {
      apply()
      window.requestAnimationFrame(done)
      return
    }
    start(apply).finished.finally(done)
  }

  const openCard = (id: string, titleEl?: Element | null) => {
    if (titleEl instanceof HTMLElement) titleEl.style.viewTransitionName = 'meme-title'
    transitionTo(
      () => {
        setSelected(id)
        setView('card')
      },
      () => cardHeadingRef.current?.focus(),
    )
  }

  const backToList = () => {
    transitionTo(
      () => setView('candidates'),
      () => listHeadingRef.current?.focus(),
    )
  }

  const columns: ColumnsType<Meme> = [
    {
      title: '梗名',
      dataIndex: 'name',
      width: 210,
      render: (name: string, m) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <div className="panel-sub">{m.aliases.join(' · ')}</div>
        </div>
      ),
    },
    {
      title: '近 7 日命中',
      dataIndex: 'hits7d',
      width: 118,
      align: 'right',
      sorter: (a, b) => a.hits7d - b.hits7d,
      render: (n: number, m) => (
        <span className="mono-num">
          {n} 条<span className="muted"> / {m.sites} 站</span>
        </span>
      ),
    },
    {
      title: '最近命中',
      dataIndex: 'latestHit',
      width: 118,
      responsive: ['lg'],
      render: (d: string) => <span className="mono-num muted">{d}</span>,
    },
    {
      title: '卡在哪一项',
      dataIndex: 'suggestion',
      width: 190,
      responsive: ['xl'],
      render: (_, m) => (
        <span className="panel-sub" style={{ marginTop: 0 }}>
          {blocker(m)}
        </span>
      ),
    },
    {
      title: '建议动作',
      dataIndex: 'suggestion',
      width: 116,
      render: (s: Suggestion) => <StateTag value={s} />,
    },
    {
      title: '放行状态',
      width: 132,
      responsive: ['xl'],
      render: (_, m) => {
        const d = store[m.id]
        if (!d?.status) {
          return (
            <span className="panel-sub" style={{ marginTop: 0 }}>
              未放行
            </span>
          )
        }
        return (
          <span className="panel-sub" style={{ marginTop: 0 }}>
            {d.status} · {d.by}
          </span>
        )
      },
    },
    {
      title: '',
      width: 84,
      align: 'right',
      render: (_, m) => (
        <Button size="small" aria-label={`打开${m.name}的判定卡`} onClick={() => openCard(m.id)}>
          判定卡
        </Button>
      ),
    },
  ]

  const headerTitle =
    view === 'method'
      ? '方法与边界'
      : view === 'sticker'
        ? '包装整活台'
        : view === 'card'
          ? '判定卡'
          : '候选梗清单'

  const voteRows = meme.votes.map((v) => (
    <div className="vote-row" key={v.key}>
      <div>
        <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {v.label}
          <Tag
            style={{
              background: 'transparent',
              borderColor: 'var(--ink-200)',
              color: 'var(--ink-400)',
              fontSize: '0.6875rem',
              lineHeight: '1.125rem',
              padding: '0 0.3125rem',
            }}
          >
            {v.by}
          </Tag>
        </div>
        <div className="vote-ask">{v.ask}</div>
      </div>
      <div style={{ paddingTop: 2 }}>
        <StateTag value={v.value} />
      </div>
      <div>
        <div style={{ lineHeight: 1.6 }}>{v.basis}</div>
        {v.links.length > 0 && (
          <ul className="evidence">
            {v.links.map((l) => (
              <li key={l.url + l.date}>
                <a href={l.url} target="_blank" rel="noreferrer">
                  {l.title}
                </a>
                <span className="link-meta">
                  {' '}
                  {l.site} · {l.date}
                  {l.note ? ` · ${l.note}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
        {v.links.length === 0 && (
          <div className="panel-sub" style={{ marginTop: 6 }}>
            {v.value === '通过'
              ? '检索无命中，没有原文可点。这一项按“查不到”处理，属弱证据。'
              : '没有可点的原文，这一项只能靠人工判断。'}
          </div>
        )}
      </div>
    </div>
  ))

  return (
    <ConfigProvider locale={zhCN} theme={buildTheme(mode)}>
      <a className="skip-link" href="#main">
        跳到主内容
      </a>
      <div role="status" aria-live="polite" className="sr-only">
        {announce}
      </div>

      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          width={224}
          breakpoint="lg"
          collapsedWidth={narrow ? 0 : 68}
          collapsed={narrow ? !drawerOpen : collapsed}
          onCollapse={setCollapsed}
          onBreakpoint={(below) => {
            setNarrow(below)
            if (!below) setDrawerOpen(false)
          }}
          aria-label="主导航"
          id="side-nav"
          style={{
            position: narrow ? 'fixed' : 'sticky',
            top: 0,
            left: 0,
            height: '100vh',
            zIndex: 20,
            overflow: 'auto',
            borderRight: '1px solid var(--ink-100)',
            background: 'var(--surface)',
          }}
        >
          <div ref={navRef}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1.25rem 1rem 0.5rem' }}>
              <div className="brand-mark" aria-hidden="true">
                冰
              </div>
              {!(narrow ? false : collapsed) && (
                <div>
                  <div style={{ fontWeight: 600, lineHeight: 1.2 }}>冰红茶机会台</div>
                  <div className="panel-sub">康师傅 · 热梗判定</div>
                </div>
              )}
              {narrow && drawerOpen && (
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  aria-label="关闭导航"
                  onClick={closeDrawer}
                  style={{ marginLeft: 'auto' }}
                />
              )}
            </div>
            <Menu
              mode="inline"
              selectedKeys={[view === 'method' || view === 'sticker' ? view : 'candidates']}
              onClick={(e) => {
                setView(e.key as typeof view)
                if (narrow) closeDrawer()
              }}
              style={{ borderInlineEnd: 'none', padding: '0.5rem' }}
              items={[
                { key: 'candidates', icon: <FileSearchOutlined />, label: '候选梗与判定' },
                { key: 'sticker', icon: <ShoppingOutlined />, label: '包装整活台' },
                { key: 'method', icon: <ReadOutlined />, label: '方法与边界' },
              ]}
            />
            {(narrow ? drawerOpen : !collapsed) && (
              <div style={{ padding: '1rem 1.125rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Tag
                  style={{
                    color: 'var(--warn-600)',
                    background: 'var(--warn-50)',
                    borderColor: 'transparent',
                    width: 'fit-content',
                  }}
                >
                  示例数据，非实测投放
                </Tag>
                <div className="panel-sub">数据截取 2026-11-20，检索 4 个梗，逐条可点开原文。</div>
              </div>
            )}
          </div>
        </Sider>

        {narrow && drawerOpen && (
          <button
            type="button"
            className="drawer-mask"
            aria-label="关闭导航"
            tabIndex={-1}
            onClick={closeDrawer}
          />
        )}

        <Layout inert={narrow && drawerOpen ? true : undefined}>
          <Header
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingInline: 16,
              borderBottom: '1px solid var(--ink-100)',
              background: 'var(--surface)',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <Button
              ref={toggleRef}
              type="text"
              icon={<MenuOutlined />}
              aria-label="切换侧栏"
              aria-expanded={narrow ? drawerOpen : !collapsed}
              aria-controls="side-nav"
              onClick={() => {
                if (narrow) {
                  if (drawerOpen) closeDrawer()
                  else setDrawerOpen(true)
                } else {
                  setCollapsed((v) => !v)
                }
              }}
            />
            {view === 'card' && (
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={backToList} aria-label="返回清单" />
            )}
            <span
              className="panel-title"
              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}
            >
              {headerTitle}
            </span>
            <div style={{ flex: 1 }} />
            {visitStats && (
              <Tooltip
                title={`今日 ${visitStats.today} 次 ｜ 独立访客 ${visitStats.visitors} 人 ｜ 每 30 秒刷新`}
              >
                <span className="visit-badge" aria-label={`累计访问 ${visitStats.total} 次`}>
                  <EyeOutlined aria-hidden="true" />
                  <span className="mono-num">{visitStats.total}</span>
                </span>
              </Tooltip>
            )}
            <Button
              type="text"
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              aria-label={mode === 'dark' ? '切换到浅色' : '切换到深色'}
              aria-pressed={mode === 'dark'}
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            />
            {view === 'card' && (
              <Space>
                <Button
                  icon={<CheckCircleOutlined />}
                  aria-label="放行"
                  onClick={() => {
                    setDecisionKind('已放行')
                    decisionForm.setFieldsValue({ name: dec.by ?? '', reason: dec.reason ?? '' })
                    setDecisionOpen(true)
                  }}
                >
                  {narrow ? null : '放行'}
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  aria-label="否决"
                  onClick={() => {
                    setDecisionKind('已否决')
                    decisionForm.setFieldsValue({ name: dec.by ?? '', reason: dec.reason ?? '' })
                    setDecisionOpen(true)
                  }}
                >
                  {narrow ? null : '否决'}
                </Button>
              </Space>
            )}
            {view !== 'card' && view !== 'sticker' && !narrow && (
              <span className="panel-sub" style={{ marginTop: 0, whiteSpace: 'nowrap' }}>
                2026-11-20 · 示例数据
              </span>
            )}
            {view === 'sticker' && !narrow && (
              <span className="panel-sub" style={{ marginTop: 0, whiteSpace: 'nowrap' }}>
                贴纸与瓶子都是示意
              </span>
            )}
          </Header>

          <Content
            id="main"
            tabIndex={-1}
            style={{ padding: narrow ? 14 : 24, maxWidth: 1220, width: '100%', margin: '0 auto' }}
          >
            {view === 'candidates' && (
              <>
                <div className="action-band" style={{ marginBottom: 18 }}>
                  {stats.map((s) => (
                    <div className="action-cell" key={s.label}>
                      <div className="action-label">{s.label}</div>
                      <div className="kpi-value">
                        {s.value}
                        <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: 4 }} className="muted">
                          {s.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="note-block" style={{ marginBottom: 16 }}>
                  <span className="note-label">这个示例里没有“内容响应”建议</span>
                  <div>
                    四个候选梗没有一个四项全绿。最近 7 日的检索里没有发现既在持续、场景能挂靠、品牌没用过、风险又可控的新梗。平台宁可少给建议，也不构造机会。
                  </div>
                </div>

                <Card styles={{ body: { paddingTop: 12 } }}>
                  <h2
                    ref={listHeadingRef}
                    tabIndex={-1}
                    style={{ margin: '0.25rem 0 0.75rem', fontSize: '0.8125rem', fontWeight: 400, color: 'var(--ink-500)' }}
                  >
                    点任意一行打开判定卡，四项判定都带能点开的原文。
                  </h2>

                  {narrow ? (
                    <ul className="meme-list">
                      {memes.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={(e) =>
                              openCard(m.id, e.currentTarget.querySelector('.meme-name'))
                            }
                          >
                            <div className="row">
                              <span className="meme-name" style={{ fontWeight: 500 }}>
                                {m.name}
                              </span>
                              <StateTag value={m.suggestion} />
                            </div>
                            <div className="row" style={{ marginTop: 4 }}>
                              <span className="panel-sub" style={{ marginTop: 0 }}>
                                {m.aliases.join(' · ')}
                              </span>
                            </div>
                            <div className="row" style={{ marginTop: 6 }}>
                              <span className="mono-num">
                                <span className="label">近 7 日 </span>
                                {m.hits7d} 条 / {m.sites} 站
                              </span>
                              <span className="mono-num">
                                <span className="label">最近 </span>
                                {m.latestHit}
                              </span>
                            </div>
                            <div className="row" style={{ marginTop: 4 }}>
                              <span>
                                <span className="label">卡在 </span>
                                <span className="panel-sub" style={{ marginTop: 0, display: 'inline' }}>
                                  {blocker(m)}
                                </span>
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div
                      role="region"
                      aria-label="候选梗清单，可用键盘滚动的表格"
                      tabIndex={0}
                      style={{ borderRadius: 8 }}
                    >
                      <Table
                        dataSource={memes}
                        columns={columns}
                        rowKey="id"
                        size="middle"
                        scroll={{ x: 860 }}
                        pagination={false}
                        onRow={(m) => ({
                          onClick: () => openCard(m.id),
                          style: { cursor: 'pointer' },
                        })}
                      />
                    </div>
                  )}
                </Card>
              </>
            )}

            {view === 'card' && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <h1
                      id="card-heading"
                      ref={cardHeadingRef}
                      tabIndex={-1}
                      style={{
                        margin: 0,
                        fontSize: '1.375rem',
                        fontWeight: 650,
                        letterSpacing: '-0.02em',
                        outline: 'none',
                      }}
                    >
                      {meme.name}
                    </h1>
                    <span className="panel-sub" style={{ marginTop: 0 }}>
                      {meme.aliases.join(' · ')}
                    </span>
                  </div>
                  <div className="panel-sub">
                    首次出现 {meme.firstSeen} ｜ 最近命中 {meme.latestHit} ｜ 近 7 日 {meme.hits7d} 条，{meme.sites} 个站点
                  </div>
                </div>

                <div className="action-band" style={{ marginBottom: 12 }}>
                  <div className="action-cell">
                    <div className="action-label">建议动作</div>
                    <div className="action-value" style={{ color: stateStyle(meme.suggestion).color }}>
                      {meme.suggestion}
                    </div>
                  </div>
                  <div className="action-cell">
                    <div className="action-label">窗口档位</div>
                    <div className="action-value" style={{ color: 'var(--warn-600)' }}>
                      {meme.window}
                    </div>
                    <div className="panel-sub" style={{ marginTop: 4, fontSize: '0.75rem' }}>
                      同类样本 {meme.samples}
                    </div>
                  </div>
                  <div className="action-cell">
                    <div className="action-label">置信</div>
                    <div className="action-value" style={{ fontSize: '0.875rem' }}>
                      {meme.confidence}
                    </div>
                  </div>
                  <div className="action-cell">
                    <div className="action-label">放行状态</div>
                    <div className="action-value" style={{ fontSize: '0.9375rem' }}>
                      {dec.status ? `${dec.status} · ${dec.by}` : '未放行'}
                    </div>
                    {dec.reason && (
                      <div className="panel-sub" style={{ marginTop: 4, fontSize: '0.75rem' }}>
                        {dec.reason}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="note-block"
                  style={{
                    marginBottom: 16,
                    borderLeftColor:
                      meme.suggestion === '内容响应'
                        ? 'var(--ok-600)'
                        : meme.suggestion === '不需跟'
                          ? 'var(--bad-600)'
                          : 'var(--warn-600)',
                  }}
                >
                  <span className="note-label">为什么给这个动作</span>
                  <div>{meme.suggestionWhy}</div>
                </div>

                <Card
                  title="四项判定"
                  extra={
                    <span className="panel-sub" style={{ marginTop: 0 }}>
                      每项都带能点开的原文
                    </span>
                  }
                  styles={{ body: { paddingTop: 4 } }}
                >
                  {voteRows}
                </Card>

                <Card title="两项只能靠人" styles={{ body: { paddingTop: 12 } }} style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 6, fontWeight: 500 }}>增量价值</div>
                  <div className="panel-sub" style={{ marginBottom: 10 }}>
                    梗带来的是新场景、新客，还是在存量场景里再来一次曝光。平台抓不到这类数据，只留按钮。
                  </div>
                  <Radio.Group
                    value={dec.increment ?? meme.incrementDefault}
                    onChange={(e) => {
                      const value = e.target.value as string
                      patch(meme.id, { increment: value })
                      setAnnounce(`增量价值已记为${value}`)
                    }}
                  >
                    <Space direction="vertical" size={6}>
                      {incrementOptions.map((o) => (
                        <Radio key={o.value} value={o.value}>
                          <span style={{ fontWeight: 500 }}>{o.value}</span>
                          <span className="panel-sub" style={{ marginLeft: 8, display: 'inline' }}>
                            {o.hint}
                          </span>
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>

                  <Divider style={{ margin: '18px 0 14px' }} />

                  <div style={{ marginBottom: 6, fontWeight: 500 }}>窗口能否覆盖交付</div>
                  <div className="panel-sub">
                    没有同类梗的历史时长数据，这一项恒为未知。改造与新品必须人工确认交付周期后才可进入下一步。
                  </div>

                  <Divider style={{ margin: '18px 0 14px' }} />

                  <div style={{ marginBottom: 8, fontWeight: 500 }}>下一步</div>
                  <div style={{ lineHeight: 1.7 }}>{meme.nextStep}</div>
                </Card>

                <Card
                  title="验收与回填"
                  style={{ marginTop: 16 }}
                  styles={{ body: { paddingTop: 12 } }}
                  extra={
                    dec.backfill ? null : (
                      <Button
                        onClick={() => {
                          backfillForm.setFieldsValue({
                            actual: '',
                            confounders: [],
                            note: '',
                            verdict: '无法判断',
                          })
                          setBackfillOpen(true)
                        }}
                      >
                        填回填记录
                      </Button>
                    )
                  }
                >
                  <div className="vote-row" style={{ paddingTop: 0 }}>
                    <div>验收阈值</div>
                    <div />
                    <div>
                      <div>{meme.acceptance.threshold}</div>
                      <div className="panel-sub">
                        {meme.acceptance.metric}。{meme.acceptance.note}。
                      </div>
                    </div>
                  </div>

                  {dec.backfill ? (
                    <div className="vote-row">
                      <div>回填记录</div>
                      <div style={{ paddingTop: 2 }}>
                        <Tag
                          style={{
                            fontWeight: 500,
                            marginInlineEnd: 0,
                            ...(dec.backfill.verdict === '成立'
                              ? stateStyle('通过')
                              : dec.backfill.verdict === '不成立'
                                ? stateStyle('不通过')
                                : stateStyle('未知')),
                          }}
                        >
                          {dec.backfill.verdict}
                        </Tag>
                      </div>
                      <div>
                        <div>实际结果：{dec.backfill.actual || '未填'}</div>
                        <div className="panel-sub">
                          同期其他变化：
                          {dec.backfill.confounders.length ? dec.backfill.confounders.join('、') : '无'}
                        </div>
                        {dec.backfill.note && <div className="panel-sub">{dec.backfill.note}</div>}
                        <div className="panel-sub">
                          判定：{dec.backfill.verdict} ｜ 填写时间 {dec.backfill.filledAt}
                        </div>
                        <Button
                          size="small"
                          style={{ marginTop: 8 }}
                          onClick={() => {
                            backfillForm.setFieldsValue({
                              actual: dec.backfill?.actual ?? '',
                              confounders: dec.backfill?.confounders ?? [],
                              note: dec.backfill?.note ?? '',
                              verdict: dec.backfill?.verdict ?? '无法判断',
                            })
                            setBackfillOpen(true)
                          }}
                        >
                          补全或修改
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="vote-row">
                      <div>回填记录</div>
                      <div style={{ paddingTop: 2 }}>
                        <StateTag value="未知" />
                      </div>
                      <div className="panel-sub">
                        还没有回填。没有回填的判定等于未验证，卡片会一直保持这个状态。
                      </div>
                    </div>
                  )}
                </Card>

                <div style={{ height: 8 }} />
                <div className="panel-sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LinkOutlined aria-hidden="true" /> 全部链接为检索返回的原文地址，点击会在新窗口打开。
                </div>
              </>
            )}

            {view === 'sticker' && (
              <>
                <div className="note-block" style={{ marginBottom: 14 }}>
                  <span className="note-label">这一块把贴纸整活做成能试的模型</span>
                  <div>
                    梗卡说哪个梗能用，这里看贴上瓶身长什么样。瓶身由 build123d 旋转成形，
                    <span className="nowrap">直径 {profile.dims.bodyDiameter} mm</span>、
                    <span className="nowrap">高 {profile.dims.totalHeight} mm</span>，
                    <span className="nowrap">装 500 mL 时液面在 {profile.fill.surfaceZ} mm</span>。
                    <span className="nowrap">
                      {scenes.length} 个场景里{' '}
                      {scenes.filter((s) => s.kind === '有出处').length} 个
                    </span>
                    挂在 <span className="nowrap">2026-11-20</span> 检索到的梗上并带原文链接，其余是设计稿。
                  </div>
                </div>

                <StickerBoard narrow={narrow} />

                <Card title="这块怎么用" styles={{ body: { paddingTop: 12 } }} style={{ marginTop: 16 }}>
                  <div className="vote-row" style={{ paddingTop: 0 }}>
                    <div>先看能贴在哪</div>
                    <div />
                    <div>
                      贴纸只改瓶身正面，不动标签、不动瓶型。
                      <span className="nowrap">
                        {STICKER_SIZE.width} × {STICKER_SIZE.height} mm
                      </span>
                      的贴纸压在{' '}
                      <span className="nowrap">
                        {profile.dims.labelZ0} 到 {profile.dims.labelZ1} mm
                      </span>
                      的标签带中间，上下各留一圈红边，拆开包装仍然认得出是哪个 SKU。
                    </div>
                  </div>
                  <div className="vote-row">
                    <div>再看能不能自己贴</div>
                    <div />
                    <div>
                      白纸、胶带、记号笔就能做出前五种做法，单店一天之内能贴完。需要印刷的是喷墨标签和手写体两种，走小批量。
                    </div>
                  </div>
                  <div className="vote-row">
                    <div>最后看该不该由品牌贴</div>
                    <div />
                    <div>
                      贴纸的价值在于像是别人说的。品牌自己贴会把玩笑变成广告，因此有风险的梗只走终端自发。
                    </div>
                  </div>
                </Card>
              </>
            )}

            {view === 'method' && (
              <>
                <div className="note-block" style={{ marginBottom: 16 }}>
                  <span className="note-label">示例数据，非实测投放</span>
                  <div>
                    四个梗的四项判定与全部链接来自 2026-11-20 的实际检索，链接可逐条点开。示例不代表康师傅真实决策，也不含投放数据。
                  </div>
                </div>

                <Card title="宣发统计" styles={{ body: { paddingTop: 12 } }} style={{ marginBottom: 16 }}>
                  <div className="action-band">
                    <div className="action-cell">
                      <div className="action-label">累计访问</div>
                      <div className="kpi-value">
                        {visitStats ? visitStats.total : '—'}
                        <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: 4 }} className="muted">
                          次
                        </span>
                      </div>
                    </div>
                    <div className="action-cell">
                      <div className="action-label">今日访问</div>
                      <div className="kpi-value">
                        {visitStats ? visitStats.today : '—'}
                        <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: 4 }} className="muted">
                          次
                        </span>
                      </div>
                    </div>
                    <div className="action-cell">
                      <div className="action-label">独立访客</div>
                      <div className="kpi-value">
                        {visitStats ? visitStats.visitors : '—'}
                        <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: 4 }} className="muted">
                          人
                        </span>
                      </div>
                    </div>
                    <div className="action-cell">
                      <div className="action-label">最近一次</div>
                      <div className="action-value" style={{ fontSize: '0.875rem' }}>
                        {visitStats?.last
                          ? new Date(visitStats.last).toLocaleString('zh-CN', { hour12: false })
                          : '尚无记录'}
                      </div>
                    </div>
                  </div>
                  <div className="method-note" style={{ marginTop: 12 }}>
                    统计只数打开页面的请求，排除搜索爬虫、浏览器预取、本机与回环地址，避免把自测算进宣发量。数字每 30 秒刷新一次。
                    {visitStats?.baseline ? ` ${visitStats.baseline}。` : ''}
                  </div>
                </Card>

                <Card title="能力边界" styles={{ body: { paddingTop: 8 } }} style={{ marginBottom: 16 }}>
                  {boundaries.map((b, i) => (
                    <div
                      className="vote-row"
                      key={b}
                      style={{ gridTemplateColumns: '1.75rem 1fr', paddingTop: i === 0 ? 4 : undefined }}
                    >
                      <div className="mono-num muted">{i + 1}</div>
                      <div style={{ lineHeight: 1.7 }}>{b}</div>
                    </div>
                  ))}
                </Card>

                <Card title="六项判定怎么算" styles={{ body: { paddingTop: 4 } }} style={{ marginBottom: 16 }}>
                  <Table
                    dataSource={methodRows}
                    rowKey="dim"
                    size="middle"
                    scroll={{ x: 720 }}
                    pagination={false}
                    columns={[
                      {
                        title: '判定项',
                        dataIndex: 'dim',
                        width: 150,
                        render: (t: string) => <span style={{ fontWeight: 500 }}>{t}</span>,
                      },
                      { title: '看什么', dataIndex: 'what' },
                      { title: '证据强度', dataIndex: 'strength', width: 104 },
                      { title: '谁算', dataIndex: 'who', width: 210 },
                    ]}
                  />
                  <div className="method-note" style={{ marginTop: 12 }}>
                    裁决用代码算，不用模型。同一份输入重跑两次结果相同，出错能追到哪条规则。模型只把摘要读成标签，每条标签必须附原文链接，不输出结论。
                  </div>
                </Card>

                <Card title="裁决规则" styles={{ body: { paddingTop: 8 } }} style={{ marginBottom: 16 }}>
                  {[
                    '内容响应：讨论仍在持续、场景挂靠、风险可接受，三项通过即可出建议。',
                    '现有产品改造：再加窗口覆盖交付周期、增量价值不是存量重复。',
                    '新品探索：再加窗口覆盖 180 天、该梗二次升温或跨季复现。',
                    '任一项为未知：不进自动建议，走人工放行，并记录放行人。',
                  ].map((r, i) => (
                    <div
                      className="vote-row"
                      key={r}
                      style={{ gridTemplateColumns: '1.75rem 1fr', paddingTop: i === 0 ? 4 : undefined }}
                    >
                      <div className="mono-num muted">{i + 1}</div>
                      <div style={{ lineHeight: 1.7 }}>{r}</div>
                    </div>
                  ))}
                </Card>

                <Card title="每个梗每日的检索动作" styles={{ body: { paddingTop: 4 } }} style={{ marginBottom: 16 }}>
                  <Table
                    dataSource={queryTemplates}
                    rowKey="q"
                    size="middle"
                    scroll={{ x: 700 }}
                    pagination={false}
                    columns={[
                      {
                        title: '查询词',
                        dataIndex: 'q',
                        width: 190,
                        render: (t: string) => (
                          <span className="q-block" style={{ display: 'inline-block', padding: '2px 6px' }}>
                            {t}
                          </span>
                        ),
                      },
                      { title: '频率', dataIndex: 'freq', width: 118 },
                      {
                        title: '参数',
                        dataIndex: 'args',
                        width: 170,
                        render: (t: string) => <span className="mono-num muted">{t}</span>,
                      },
                      { title: '用途', dataIndex: 'use' },
                    ]}
                  />
                  <div className="method-note" style={{ marginTop: 12 }}>
                    单梗每日 9 次调用，50 个梗是每日 450 次。检索只能证明“仍在被讨论”，不能证明“仍在升温”。五年前的旧梗会被内容农场重发，重发日期不等于新出现日期。
                  </div>
                </Card>

                <Card title="这一版没做" styles={{ body: { paddingTop: 8 } }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      '不做热度预测与概率曲线。',
                      '不做自动对外发布的文案，只出脚本草案，由业务签字。',
                      '不接平台播放量，窗口档位保持未知。',
                      '不做跨品类，只服务康师傅冰红茶。',
                    ].map((t) => (
                      <div key={t} className="method-note" style={{ display: 'flex', gap: 8 }}>
                        <span className="muted" aria-hidden="true">
                          ·
                        </span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      marginTop: 16,
                      marginBottom: 4,
                      color: 'var(--ink-500)',
                      fontWeight: 500,
                    }}
                  >
                    数据来源
                  </div>
                  <div className="method-note">
                    腾讯云元宝搜索 MCP 通道，2026-11-20 实检。仓库自带的 HTTP 通道在同一把密钥下返回 UnauthorizedOperation，因此本项目只走 MCP。
                  </div>
                </Card>
              </>
            )}
          </Content>
        </Layout>
      </Layout>

      <Modal
        title={decisionKind === '已放行' ? '放行这张卡' : '否决这张卡'}
        open={decisionOpen}
        onCancel={() => setDecisionOpen(false)}
        okText={decisionKind === '已放行' ? '放行' : '否决'}
        cancelText="取消"
        okButtonProps={{ danger: decisionKind === '已否决' }}
        onOk={() => decisionForm.submit()}
        width={460}
        destroyOnHidden
      >
        <Form
          form={decisionForm}
          layout="vertical"
          requiredMark={false}
          onFinishFailed={({ errorFields }) => {
            setAnnounce(errorFields[0]?.errors?.[0] ?? '表单有必填项没有填')
          }}
          onFinish={(values) => {
            patch(meme.id, {
              status: decisionKind,
              by: values.name.trim(),
              reason: (values.reason ?? '').trim(),
            })
            setAnnounce(`${meme.name} 已${decisionKind === '已放行' ? '放行' : '否决'}，放行人 ${values.name.trim()}`)
            setDecisionOpen(false)
          }}
        >
          <div className="panel-sub" style={{ marginTop: 0, marginBottom: 12 }}>
            放行表示这一步由你担责，卡片会记下名字与理由。理由可以不填，但填了对下一个看卡的人有用。
          </div>
          <Form.Item
            name="name"
            label="放行人"
            rules={[{ required: true, message: '填上放行人才能记录这次放行' }]}
          >
            <Input maxLength={20} autoComplete="name" aria-required="true" placeholder="填你的名字" />
          </Form.Item>
          <Form.Item name="reason" label="理由">
            <Input.TextArea rows={3} maxLength={120} showCount placeholder="例如：语境需品牌部确认后才可发内容" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="回填记录"
        open={backfillOpen}
        onCancel={() => setBackfillOpen(false)}
        okText="保存回填"
        cancelText="取消"
        onOk={() => backfillForm.submit()}
        width={520}
        destroyOnHidden
      >
        <Form
          form={backfillForm}
          layout="vertical"
          requiredMark={false}
          initialValues={{ verdict: '无法判断', confounders: [] }}
          onFinishFailed={({ errorFields }) => {
            setAnnounce(errorFields[0]?.errors?.[0] ?? '表单有必填项没有填')
          }}
          onFinish={(values) => {
            const filled: Backfill = {
              actual: values.actual.trim(),
              confounders: values.confounders ?? [],
              note: (values.note ?? '').trim(),
              verdict: values.verdict as Backfill['verdict'],
              filledAt: new Date().toLocaleString('zh-CN', { hour12: false }),
            }
            patch(meme.id, { backfill: filled })
            setAnnounce(`${meme.name} 的回填已保存，结论 ${filled.verdict}`)
            setBackfillOpen(false)
          }}
        >
          <div className="panel-sub" style={{ marginTop: 0, marginBottom: 12 }}>
            回填是为了让判断能被证伪。实际结果必须填，同期其他变化必须勾，否则销量变化不能算到这个梗头上。
          </div>
          <Form.Item
            name="actual"
            label="实际结果"
            rules={[{ required: true, message: '填上实际结果才能保存' }]}
          >
            <Input aria-required="true" placeholder="例如：播放 6.8 万次，互动率 3.1%" />
          </Form.Item>
          <Form.Item name="confounders" label="同期其他变化（可多选）">
            <Checkbox.Group options={CONFS} />
          </Form.Item>
          <Form.Item name="note" label="补充说明">
            <Input.TextArea rows={2} maxLength={120} placeholder="例如：同周有门店促销，销量不能只归因于内容" />
          </Form.Item>
          <Form.Item name="verdict" label="判断结论">
            <Radio.Group>
              <Space direction="vertical" size={4}>
                <Radio value="成立">成立，这次判断对了</Radio>
                <Radio value="不成立">不成立，这次判断错了</Radio>
                <Radio value="无法判断">无法判断，同期变化太大</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  )
}

export default App
