import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Tag } from 'antd'
import { LeftOutlined, RightOutlined, RotateRightOutlined } from '@ant-design/icons'
import { createStage, type SceneConfig, type StageHandle } from '../scene/bottleStage'
import { scenes, stageNames, type StickerScene } from '../data/stickerScenes'
import profile from '../data/bottle-profile.json'

function toConfig(s: StickerScene): SceneConfig {
  return { sticker: s.sticker, stage: s.stage, palette: s.palette }
}

const STYLE_NAME: Record<StickerScene['sticker']['style'], string> = {
  paper: '白纸打印',
  hand: '手写',
  tape: '胶带贴条',
  scribble: '黑条涂改',
  print: '热敏标签',
  eyes: '手绘表情',
}

const KIND_STYLE: Record<StickerScene['kind'], { bg: string; fg: string }> = {
  有出处: { bg: 'var(--ok-50)', fg: 'var(--ok-600)' },
  设计稿: { bg: 'var(--ink-100)', fg: 'var(--ink-500)' },
}

export default function StickerBoard({ narrow }: { narrow: boolean }) {
  const [activeId, setActiveId] = useState(scenes[0].id)
  const stageRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<StageHandle | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [announce, setAnnounce] = useState('')

  const index = scenes.findIndex((s) => s.id === activeId)
  const current = scenes[index] ?? scenes[0]

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const handle = createStage(el, toConfig(current))
    handleRef.current = handle
    return () => {
      handle.dispose()
      handleRef.current = null
    }
    // 只在挂载时建一次，换场景走 setScene
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    handleRef.current?.setScene(toConfig(current))
  }, [current])

  const pick = (next: StickerScene, focus = false) => {
    setActiveId(next.id)
    setAnnounce(`已切到第 ${next.no} 个场景，${next.name}，贴纸写着${next.sticker.line1}`)
    if (focus) {
      requestAnimationFrame(() => {
        listRef.current?.querySelector<HTMLElement>(`[data-id="${next.id}"]`)?.focus()
      })
    }
  }

  const step = (delta: number) => {
    const next = scenes[(index + delta + scenes.length) % scenes.length]
    pick(next)
  }

  const onListKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      pick(scenes[(index + 1) % scenes.length], true)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      pick(scenes[(index - 1 + scenes.length) % scenes.length], true)
    } else if (event.key === 'Home') {
      event.preventDefault()
      pick(scenes[0], true)
    } else if (event.key === 'End') {
      event.preventDefault()
      pick(scenes[scenes.length - 1], true)
    }
  }

  const counts = useMemo(() => {
    const sourced = scenes.filter((s) => s.kind === '有出处').length
    return { sourced, draft: scenes.length - sourced }
  }, [])

  return (
    <div className={`board ${narrow ? 'board-narrow' : ''}`}>
      <div className="board-stage">
        <div className="stage-canvas" ref={stageRef} role="img" aria-label={`${current.name}的瓶身贴纸效果，背景是${stageNames[current.stage]}`} />
        <div className="stage-overlay">
          <div className="stage-tagline">
            <span className="mono-num stage-no">{current.no}</span>
            <span className="stage-name">{current.name}</span>
          </div>
          <div className="stage-sub">{current.moment}</div>
        </div>
        <div className="stage-controls">
          <Button
            size="small"
            icon={<LeftOutlined />}
            aria-label="上一个场景"
            onClick={() => step(-1)}
          />
          <span className="mono-num stage-count">
            {String(index + 1).padStart(2, '0')} / {scenes.length}
          </span>
          <Button
            size="small"
            icon={<RightOutlined />}
            aria-label="下一个场景"
            onClick={() => step(1)}
          />
          <Button
            size="small"
            icon={<RotateRightOutlined />}
            aria-label="把瓶子转回正面"
            onClick={() => handleRef.current?.nudge(-0.6)}
          />
          <span className="stage-hint">拖动瓶身可转</span>
        </div>
      </div>

      <div className="board-side">
        <div className="board-detail">
          <div className="board-detail-head">
            <div>
              <div className="board-kicker">
                贴纸 {current.no} · {stageNames[current.stage]}
              </div>
              <div className="board-sticker-line">
                {current.sticker.line1}
                {current.sticker.line2 ? `｜${current.sticker.line2}` : ''}
              </div>
            </div>
            <Tag
              style={{
                marginInlineEnd: 0,
                fontWeight: 500,
                borderColor: 'transparent',
                color: KIND_STYLE[current.kind].fg,
                background: KIND_STYLE[current.kind].bg,
              }}
            >
              {current.kind}
            </Tag>
          </div>
          <div className="board-why">{current.why}</div>
          <div className="board-meta">
            <span className="label">建议动作</span>
            <span className="mono-num">{current.suggestion}</span>
            <span className="label">贴纸做法</span>
            <span className="mono-num">{STYLE_NAME[current.sticker.style]}</span>
            <span className="label">瓶身</span>
            <span className="mono-num">
              {profile.dims.bodyDiameter} × {profile.dims.totalHeight} mm
            </span>
            <span className="label">液面</span>
            <span className="mono-num">{profile.fill.surfaceZ} mm</span>
          </div>
          {current.links.length > 0 ? (
            <ul className="board-links">
              {current.links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noreferrer">
                    {l.title}
                  </a>
                  <span className="link-meta">
                    {' '}
                    {l.site} · {l.date}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="board-links board-links-empty">
              这个场景没有检索出处，是设计稿。贴纸文案、场景与配色都由本仓库自己编，不代表现实里发生过。
            </div>
          )}
        </div>

        <div
          className="scene-list"
          ref={listRef}
          role="listbox"
          aria-label={`梗场景，共 ${scenes.length} 个，用上下方向键切换`}
          tabIndex={0}
          aria-activedescendant={`scene-${current.id}`}
          onKeyDown={onListKey}
        >
          {scenes.map((s) => {
            const selected = s.id === current.id
            return (
              <button
                type="button"
                key={s.id}
                id={`scene-${s.id}`}
                data-id={s.id}
                role="option"
                aria-selected={selected}
                tabIndex={-1}
                className={`scene-item ${selected ? 'is-active' : ''}`}
                onClick={() => pick(s)}
              >
                <span
                  className="scene-thumb"
                  aria-hidden="true"
                  style={{
                    background: `linear-gradient(160deg, ${s.palette.from}, ${s.palette.to})`,
                  }}
                >
                  <span className="scene-thumb-no mono-num">{s.no}</span>
                </span>
                <span className="scene-text">
                  <span className="scene-name">{s.name}</span>
                  <span className="scene-sticker">{s.sticker.line1}</span>
                </span>
                <span className={`scene-kind ${s.kind === '有出处' ? 'is-sourced' : ''}`}>
                  {s.kind}
                </span>
              </button>
            )
          })}
        </div>

        <div className="board-foot">
          <span>
            {scenes.length} 个场景，{counts.sourced} 个挂检索到的梗，{counts.draft} 个是设计稿。
          </span>
          <span>贴纸与配色都是示意，不是康师傅官方物料。</span>
        </div>
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {announce}
      </div>
    </div>
  )
}
