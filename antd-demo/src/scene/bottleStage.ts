import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import profile from '../data/bottle-profile.json'

/** 贴纸的四种做法，对应商家在瓶身上动手的不同方式 */
export type StickerStyle = 'paper' | 'hand' | 'tape' | 'scribble' | 'print' | 'eyes'

export type StageKind = 'fridge' | 'shelf' | 'desk' | 'court' | 'night' | 'camp' | 'office' | 'dorm'

export type SceneConfig = {
  sticker: {
    style: StickerStyle
    line1: string
    line2?: string
    tag?: string
  }
  stage: StageKind
  palette: { from: string; to: string; accent: string; ground: string }
}

const MM = 1 // 场景单位直接用毫米，相机距离按瓶高定
const BODY_R = profile.dims.bodyDiameter / 2
const CAP_Z0 = profile.dims.capZ0
const CAP_Z1 = profile.dims.capZ0 + profile.dims.capHeight
const CAP_R = profile.dims.capDiameter / 2
const RIM = profile.dims.totalHeight
const CENTER = RIM / 2

// 贴纸：宽 96 mm、高 78 mm，贴在标签带正中，包住瓶身约 165 度
const STICKER_W = 60
const STICKER_H = 52
const STICKER_MID = (profile.dims.labelZ0 + profile.dims.labelZ1) / 2 + 2
const STICKER_R = BODY_R + 0.75
const NECK_R = profile.dims.neckDiameter / 2

/** 贴纸成形尺寸，页面文案要用，不另填数字 */
export const STICKER_SIZE = {
  width: STICKER_W,
  height: STICKER_H,
  centerZ: STICKER_MID,
  top: STICKER_MID + STICKER_H / 2,
  bottom: STICKER_MID - STICKER_H / 2,
}

const FONT_STACK =
  '"PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif'
const HAND_STACK =
  '"Kaiti SC", "STKaiti", "KaiTi", "Songti SC", "Noto Serif CJK SC", serif'

function lathe(points: number[][], segments = 96) {
  const pts = points.map(([r, z]) => new THREE.Vector2(r * MM, (z - CENTER) * MM))
  return new THREE.LatheGeometry(pts, segments)
}

/** 纸纹：极淡的噪点，让贴纸不像纯色方块 */
function paperGrain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save()
  ctx.globalAlpha = 0.05
  for (let i = 0; i < 2600; i += 1) {
    const x = Math.random() * w
    const y = Math.random() * h
    ctx.fillStyle = Math.random() > 0.5 ? '#8a6a3a' : '#ffffff'
    ctx.fillRect(x, y, 1.6, 1.6)
  }
  ctx.restore()
}

/** 逐字绘制并加位置扰动，没有手写字体时也能看出是人写的 */
function looseText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  size: number,
  stack: string,
  weight: number,
  seed: number,
) {
  const chars = [...text]
  ctx.font = `${weight} ${size}px ${stack}`
  const widths = chars.map((c) => ctx.measureText(c).width)
  const total = widths.reduce((a, b) => a + b, 0)
  let x = cx - total / 2
  let state = seed
  const rnd = () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
  ctx.save()
  ctx.textAlign = 'center'
  chars.forEach((c, i) => {
    if (c.trim()) {
      ctx.save()
      ctx.translate(
        x + widths[i] / 2 + (rnd() - 0.5) * size * 0.05,
        cy + (rnd() - 0.5) * size * 0.1,
      )
      ctx.rotate((rnd() - 0.5) * 0.08)
      const sc = 0.95 + rnd() * 0.1
      ctx.scale(sc, sc)
      ctx.fillText(c, 0, 0)
      ctx.restore()
    }
    x += widths[i]
  })
  ctx.restore()
}

/** 纸边：不是规矩的矩形，剪的时候会歪一点 */
function roughPaperPath(W: number, H: number, seed: number) {
  const path = new Path2D()
  let state = seed
  const rnd = () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
  const wob = W * 0.006
  const steps = 7
  path.moveTo(0, 0)
  for (let i = 1; i <= steps; i += 1) {
    path.lineTo((W / steps) * i, (rnd() - 0.5) * wob)
  }
  for (let i = 1; i <= steps; i += 1) {
    path.lineTo(W + (rnd() - 0.5) * wob, (H / steps) * i)
  }
  for (let i = 1; i <= steps; i += 1) {
    path.lineTo(W - (W / steps) * i, H + (rnd() - 0.5) * wob)
  }
  for (let i = 1; i <= steps; i += 1) {
    path.lineTo((rnd() - 0.5) * wob, H - (H / steps) * i)
  }
  path.closePath()
  return path
}

/** 手绘表情：两只 U 形眼加一张嘴，模仿参考图里贴纸遮脸的做法 */
function drawFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save()
  ctx.strokeStyle = '#1c1a17'
  ctx.lineWidth = s * 0.085
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  // 左眼 U，右眼 U
  for (const dx of [-s * 0.42, s * 0.42]) {
    ctx.beginPath()
    ctx.arc(cx + dx, cy - s * 0.3, s * 0.2, Math.PI * 0.15, Math.PI * 0.85, false)
    ctx.stroke()
  }
  // 嘴
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.2, cy + s * 0.34)
  ctx.quadraticCurveTo(cx, cy + s * 0.5, cx + s * 0.2, cy + s * 0.34)
  ctx.stroke()
  ctx.restore()
}

function makeStickerTexture(cfg: SceneConfig['sticker']) {
  const W = 1024
  const H = Math.round((W * STICKER_H) / STICKER_W)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const seed = [...cfg.line1].reduce((acc, ch) => acc + ch.charCodeAt(0), 7)
  const paper = roughPaperPath(W, H, seed)
  ctx.save()
  ctx.clip(paper)
  ctx.fillStyle = '#fbf9f3'
  ctx.fillRect(0, 0, W, H)
  paperGrain(ctx, W, H)
  const pad = W * 0.1
  const style = cfg.style

  if (style === 'eyes') {
    // 只画表情，文案缩成一行小字放在下面
    drawFace(ctx, W / 2, H * 0.46, H * 0.6)
    if (cfg.tag) {
      ctx.fillStyle = 'rgba(28, 26, 23, 0.62)'
      ctx.font = `500 ${H * 0.105}px ${FONT_STACK}`
      ctx.textAlign = 'center'
      ctx.fillText(cfg.tag, W / 2, H * 0.86)
    }
  } else if (style === 'print') {
    // 热敏标签机：窄条、等宽字、上下各一条虚线
    ctx.fillStyle = '#fbfaf6'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#1c1a17'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const maxW = W * 0.724
    const fit = (text: string, start: number, weight: number) => {
      let size = start
      ctx.font = `${weight} ${size}px ${FONT_STACK}`
      while (size > 16 && ctx.measureText(text).width > maxW) {
        size -= 4
        ctx.font = `${weight} ${size}px ${FONT_STACK}`
      }
      return size
    }
    const size = fit(cfg.line1, H * 0.34, 700)
    ctx.fillText(cfg.line1, W / 2, cfg.line2 ? H * 0.38 : H * 0.5)
    if (cfg.line2) {
      fit(cfg.line2, size * 0.82, 500)
      ctx.fillText(cfg.line2, W / 2, H * 0.38 + size * 1.25)
    }
    ctx.setLineDash([14, 12])
    ctx.strokeStyle = '#1c1a17'
    ctx.lineWidth = 4
    ;[H * 0.12, H * 0.88].forEach((y) => {
      ctx.beginPath()
      ctx.moveTo(pad * 0.6, y)
      ctx.lineTo(W - pad * 0.6, y)
      ctx.stroke()
    })
  } else {
    const hand = style === 'hand' || style === 'tape'
    ctx.fillStyle = '#16130f'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const maxW = W * 0.72
    const fit = (text: string, start: number, stack: string) => {
      let size = start
      ctx.font = `${hand ? 600 : 700} ${size}px ${stack}`
      while (size > 18 && ctx.measureText(text).width > maxW) {
        size -= 4
        ctx.font = `${hand ? 600 : 700} ${size}px ${stack}`
      }
      return size
    }
    const size = fit(cfg.line1, cfg.line2 ? H * 0.3 : H * 0.36, hand ? HAND_STACK : FONT_STACK)

    if (style === 'scribble') {
      // 先画一条黑条，字压在黑条上，像用记号笔盖住原包装
      const barH = size * 1.6
      ctx.fillStyle = '#141210'
      ctx.fillRect(pad * 0.25, H * 0.5 - barH / 2, W - pad * 0.5, barH)
      ctx.fillStyle = '#fbf9f3'
    }

    const y1 = cfg.line2 ? H * 0.38 : H * 0.5
    if (hand) {
      looseText(ctx, cfg.line1, W / 2, y1, size, HAND_STACK, 600, seed)
      if (cfg.line2) {
        const size2 = fit(cfg.line2, size * 0.96, HAND_STACK)
        looseText(ctx, cfg.line2, W / 2, y1 + Math.max(size, size2) * 1.22, size2, HAND_STACK, 600, seed + 19)
      }
    } else {
      ctx.fillText(cfg.line1, W / 2, y1)
      if (cfg.line2) {
        const size2 = fit(cfg.line2, size * 0.96, FONT_STACK)
        ctx.fillText(cfg.line2, W / 2, y1 + Math.max(size, size2) * 1.22)
      }
    }

    // 角落小字：店名、日期之类，模拟终端老板的落款
    if (cfg.tag) {
      ctx.fillStyle = 'rgba(28, 26, 23, 0.62)'
      ctx.font = `500 ${H * 0.075}px ${FONT_STACK}`
      ctx.textAlign = 'left'
      ctx.fillText(cfg.tag, pad * 0.5, H * 0.87)
    }
  }

  if (style === 'tape') {
    // 顶部一条半透明胶带
    ctx.save()
    ctx.globalAlpha = 0.42
    ctx.fillStyle = '#d9cfae'
    ctx.translate(W * 0.2, H * 0.03)
    ctx.rotate(-0.03)
    ctx.fillRect(0, 0, W * 0.6, H * 0.075)
    ctx.restore()
  }

  if (style === 'paper' || style === 'hand') {
    // 四角一点翘起：用透明渐变吃掉边角，贴到弧面上更自然
    const g = ctx.createLinearGradient(0, 0, W, H)
    g.addColorStop(0, 'rgba(0,0,0,0.05)')
    g.addColorStop(0.45, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }

  ctx.restore()
  // 调试：把纸外区域填成纸白，分线 alpha 的影响
  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = '#fbf9f3'
  ctx.fillRect(0, 0, W, H)
  ctx.globalCompositeOperation = 'source-over'
  // 纸边一圈淡影，让白纸从红标签上分出来
  ctx.strokeStyle = 'rgba(90, 74, 54, 0.42)'
  ctx.lineWidth = 3
  ctx.stroke(paper)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** 各场景的背景插画。都是矢量简笔画，不依赖外部图片。 */
function drawStage(ctx: CanvasRenderingContext2D, w: number, h: number, cfg: SceneConfig) {
  const { stage, palette } = cfg
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, palette.from)
  g.addColorStop(1, palette.to)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const horizon = h * 0.62
  const accent = palette.accent

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 构图约定：中间留给瓶子，道具集中在左右两侧
  if (stage === 'fridge') {
    // 冷柜：两侧竖格栅，顶部一条灯带
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = Math.max(2, w * 0.0025)
    for (const x of [0.04, 0.1, 0.16, 0.22, 0.78, 0.84, 0.9, 0.96]) {
      ctx.beginPath()
      ctx.moveTo(w * x, h * 0.04)
      ctx.lineTo(w * x, horizon)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillRect(0, h * 0.05, w, h * 0.016)
    for (const y of [0.26, 0.46]) {
      ctx.fillStyle = 'rgba(255,255,255,0.28)'
      ctx.fillRect(0, h * y, w, h * 0.01)
    }
  } else if (stage === 'shelf') {
    // 便利店层板：两条横板，两侧摆满商品
    for (const y of [0.32, 0.52]) {
      ctx.fillStyle = 'rgba(255,255,255,0.42)'
      ctx.fillRect(0, h * y, w, h * 0.012)
      for (let i = 0; i < 10; i += 1) {
        const side = i < 5 ? 0 : 1
        const k = i % 5
        const x = side === 0 ? w * (0.03 + k * 0.049) : w * (0.74 + k * 0.049)
        const bh = h * (0.055 + ((i * 7) % 4) * 0.014)
        ctx.fillStyle = `rgba(255,255,255,${0.16 + ((i * 3) % 3) * 0.06})`
        ctx.fillRect(x, h * y - bh, w * 0.036, bh)
      }
    }
  } else if (stage === 'desk') {
    // 课桌：右上角一扇窗，桌面留白
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(w * 0.68, h * 0.12, w * 0.24, h * 0.2)
    ctx.strokeStyle = 'rgba(255,255,255,0.38)'
    ctx.lineWidth = Math.max(3, w * 0.004)
    ctx.strokeRect(w * 0.68, h * 0.12, w * 0.24, h * 0.2)
    ctx.beginPath()
    ctx.moveTo(w * 0.8, h * 0.12)
    ctx.lineTo(w * 0.8, h * 0.32)
    ctx.moveTo(w * 0.68, h * 0.22)
    ctx.lineTo(w * 0.92, h * 0.22)
    ctx.stroke()
    // 左侧一摞书
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    for (let i = 0; i < 4; i += 1) {
      ctx.fillRect(w * 0.04, horizon - h * (0.035 + i * 0.026), w * (0.11 - i * 0.008), h * 0.02)
    }
    ctx.fillStyle = accent
    ctx.fillRect(0, horizon, w, h - horizon)
    ctx.fillStyle = 'rgba(0,0,0,0.05)'
    ctx.fillRect(0, horizon, w, h * 0.018)
  } else if (stage === 'court') {
    // 球场：远端白线、右侧篮架
    ctx.fillStyle = accent
    ctx.fillRect(0, horizon, w, h - horizon)
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = Math.max(3, w * 0.0035)
    ctx.beginPath()
    ctx.arc(w * 0.5, h + h * 0.08, h * 0.5, Math.PI * 1.1, Math.PI * 1.9)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, h * 0.86)
    ctx.lineTo(w, h * 0.86)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = Math.max(4, w * 0.005)
    ctx.beginPath()
    ctx.moveTo(w * 0.88, h * 0.3)
    ctx.lineTo(w * 0.88, horizon)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(w * 0.82, h * 0.3)
    ctx.lineTo(w * 0.94, h * 0.3)
    ctx.stroke()
  } else if (stage === 'night') {
    // 夜宵摊：顶部灯串、地面暖光
    ctx.fillStyle = accent
    ctx.fillRect(0, horizon, w, h - horizon)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = Math.max(2, w * 0.002)
    ctx.beginPath()
    ctx.moveTo(0, h * 0.05)
    ctx.quadraticCurveTo(w * 0.5, h * 0.17, w, h * 0.05)
    ctx.stroke()
    for (let i = 0; i <= 10; i += 1) {
      const t = i / 10
      const x = w * t
      const y = h * (0.05 + 0.12 * Math.sin(Math.PI * t))
      ctx.fillStyle = 'rgba(255, 226, 150, 0.85)'
      ctx.beginPath()
      ctx.arc(x, y, h * 0.011, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (stage === 'camp') {
    // 露营：远山、右侧帐篷
    ctx.fillStyle = 'rgba(255,255,255,0.42)'
    ctx.beginPath()
    ctx.moveTo(0, horizon)
    ctx.lineTo(w * 0.18, h * 0.34)
    ctx.lineTo(w * 0.36, horizon)
    ctx.lineTo(w * 0.58, h * 0.4)
    ctx.lineTo(w * 0.8, horizon)
    ctx.lineTo(w, horizon)
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = accent
    ctx.fillRect(0, horizon, w, h - horizon)
    ctx.fillStyle = 'rgba(255,255,255,0.72)'
    ctx.beginPath()
    ctx.moveTo(w * 0.76, horizon)
    ctx.lineTo(w * 0.85, h * 0.4)
    ctx.lineTo(w * 0.94, horizon)
    ctx.closePath()
    ctx.fill()
  } else if (stage === 'office') {
    // 加班：两侧显示器，灯管在天花板
    for (const x of [0.02, 0.74]) {
      ctx.fillStyle = 'rgba(255,255,255,0.36)'
      ctx.fillRect(w * x, h * 0.26, w * 0.2, h * 0.18)
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.fillRect(w * x + w * 0.012, h * 0.285, w * 0.176, h * 0.13)
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillRect(w * (x + 0.09), h * 0.44, w * 0.02, h * 0.06)
    }
    ctx.fillStyle = 'rgba(255,255,255,0.42)'
    ctx.fillRect(w * 0.3, h * 0.06, w * 0.4, h * 0.014)
    ctx.fillStyle = accent
    ctx.fillRect(0, horizon, w, h - horizon)
  } else {
    // 宿舍：上下铺横杆与床头
    ctx.strokeStyle = 'rgba(255,255,255,0.36)'
    ctx.lineWidth = Math.max(4, w * 0.004)
    for (const y of [0.22, 0.38]) {
      ctx.beginPath()
      ctx.moveTo(0, h * y)
      ctx.lineTo(w, h * y)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(255,255,255,0.28)'
    ctx.fillRect(0, h * 0.1, w * 0.12, h * 0.28)
    ctx.fillRect(w * 0.88, h * 0.1, w * 0.12, h * 0.28)
    ctx.fillStyle = accent
    ctx.fillRect(0, horizon, w, h - horizon)
  }

  // 四周压暗，视线收在中间
  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.52, w * 0.2, w * 0.5, h * 0.5, w * 0.78)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(24,16,8,0.2)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)

  // 底部压暗，让瓶子有落点
  const shade = ctx.createLinearGradient(0, horizon, 0, h)
  shade.addColorStop(0, 'rgba(0,0,0,0)')
  shade.addColorStop(1, 'rgba(0,0,0,0.22)')
  ctx.fillStyle = shade
  ctx.fillRect(0, horizon, w, h - horizon)
  ctx.restore()

  // 接地阴影：瓶子站在画面中央偏下，阴影跟着瓶子走
  const cx = w * 0.5
  const cy = h * 0.875
  const shadowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.12)
  shadowGrad.addColorStop(0, 'rgba(30, 20, 10, 0.42)')
  shadowGrad.addColorStop(0.5, 'rgba(30, 20, 10, 0.2)')
  shadowGrad.addColorStop(1, 'rgba(30, 20, 10, 0)')
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(1, 0.26)
  ctx.translate(-cx, -cy)
  ctx.fillStyle = shadowGrad
  ctx.fillRect(cx - w * 0.14, cy - w * 0.14, w * 0.28, w * 0.28)
  ctx.restore()
}

/** 瓶身标签：红黄配色加竖排水印，示意用，不是康师傅官方设计 */
function makeLabelTexture() {
  const W = 2048
  const H = Math.round((W * profile.dims.labelHeight) / profile.dims.labelCircumference)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#c81f22')
  g.addColorStop(0.55, '#d92b25')
  g.addColorStop(1, '#a5151b')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // 波浪色带
  ctx.fillStyle = 'rgba(255, 220, 120, 0.92)'
  ctx.beginPath()
  ctx.moveTo(0, H * 0.62)
  for (let x = 0; x <= W; x += W / 24) {
    ctx.lineTo(x, H * (0.62 + 0.1 * Math.sin((x / W) * Math.PI * 4)))
  }
  ctx.lineTo(W, H)
  ctx.lineTo(0, H)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#1b1410'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.font = `700 ${H * 0.44}px ${FONT_STACK}`
  ctx.fillText('冰 红 茶', W * 0.25, H * 0.42)
  ctx.fillText('冰 红 茶', W * 0.75, H * 0.42)

  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = `500 ${H * 0.15}px ${FONT_STACK}`
  ctx.fillText('柠檬风味 | 净含量 500 mL', W * 0.25, H * 0.78)
  ctx.fillText('柠檬风味 | 净含量 500 mL', W * 0.75, H * 0.78)

  // 侧缝留白，模拟标签搭接
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(0, 0, W * 0.012, H)
  ctx.fillRect(W * 0.988, 0, W * 0.012, H)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function makeCapTexture() {
  const W = 1024
  const H = 128
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#c01c24'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  for (let x = 0; x < W; x += 16) ctx.fillRect(x, 0, 7, H)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.repeat.set(3, 1)
  return tex
}

export type StageHandle = {
  setScene: (cfg: SceneConfig) => void
  resize: () => void
  dispose: () => void
  nudge: (delta: number) => void
}

export function createStage(container: HTMLElement, initial: SceneConfig): StageHandle {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 5000)
  camera.position.set(0, 62, 520)
  camera.lookAt(0, 2, 0)

  // 环境反射：没有这张贴图，透明瓶身会像塑料片
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.14)
  scene.environment = envRT.texture
  pmrem.dispose()

  const key = new THREE.DirectionalLight('#fff4e2', 2.6)
  key.position.set(-260, 420, 340)
  const fill = new THREE.DirectionalLight('#dce9ff', 0.7)
  fill.position.set(320, 160, 240)
  const rim = new THREE.DirectionalLight('#ffe7c4', 1.8)
  rim.position.set(120, 220, -360)
  const edge = new THREE.DirectionalLight('#e8f0ff', 2.2)
  edge.position.set(340, 90, 60)
  scene.add(key, fill, rim, edge)
  scene.add(new THREE.AmbientLight('#ffffff', 0.55))

  const bottle = new THREE.Group()
  scene.add(bottle)

  // ---- 液体 ----
  const liquidGeo = lathe(profile.liquid, 96)
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: '#7d2b0b',
    roughness: 0.07,
    metalness: 0,
    transparent: false,
    opacity: 1,
    envMapIntensity: 0.95,
    clearcoat: 0.22,
    clearcoatRoughness: 0.16,
    emissive: '#40120a',
    emissiveIntensity: 0.28,
  })
  const liquid = new THREE.Mesh(liquidGeo, liquidMat)
  liquid.renderOrder = 1

  // ---- 瓶盖：圆柱加一圈竖纹贴图 ----
  const capH = (CAP_Z1 - CAP_Z0) * MM
  const capGeo = new THREE.CylinderGeometry(CAP_R * MM, CAP_R * MM * 1.02, capH, 64, 1, false)
  const capTex = makeCapTexture()
  const capMat = new THREE.MeshPhysicalMaterial({
    map: capTex,
    color: '#ffffff',
    roughness: 0.42,
    metalness: 0.05,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.9,
  })
  const cap = new THREE.Mesh(capGeo, capMat)
  cap.position.y = ((CAP_Z0 + CAP_Z1) / 2 - CENTER) * MM

  // 瓶盖顶面细节：一圈浅色环
  const capTop = new THREE.Mesh(
    new THREE.RingGeometry(CAP_R * MM * 0.52, CAP_R * MM * 0.94, 48),
    new THREE.MeshPhysicalMaterial({ color: '#e8e2d8', roughness: 0.5 }),
  )
  capTop.rotation.x = -Math.PI / 2
  capTop.position.y = capH / 2 + 0.0006

  // ---- 标签 ----
  const labelH = profile.dims.labelHeight * MM
  const labelGeo = new THREE.CylinderGeometry(
    (BODY_R + 0.35) * MM,
    (BODY_R + 0.35) * MM,
    labelH,
    128,
    1,
    true,
  )
  const labelTex = makeLabelTexture()
  const labelMat = new THREE.MeshPhysicalMaterial({
    map: labelTex,
    transparent: true,
    roughness: 0.55,
    metalness: 0,
    clearcoat: 0.25,
    envMapIntensity: 0.7,
    side: THREE.DoubleSide,
  })
  const label = new THREE.Mesh(labelGeo, labelMat)
  label.position.y = ((profile.dims.labelZ0 + profile.dims.labelZ1) / 2 - CENTER) * MM
  label.renderOrder = 2

  // ---- 贴纸：一张弯曲的纸，正面朝相机。UV 规整，边缘不会串色 ----
  const stickerGeo = (() => {
    const g = new THREE.PlaneGeometry(STICKER_W, STICKER_H, 48, 2)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i)
      const z = Math.sqrt(Math.max(STICKER_R * STICKER_R - x * x, 0))
      pos.setZ(i, z - STICKER_R)
    }
    g.computeVertexNormals()
    return g
  })()
  const stickerMat = new THREE.MeshPhysicalMaterial({
    roughness: 0.82,
    metalness: 0,
    clearcoat: 0.04,
    envMapIntensity: 0.35,
    emissive: '#ffffff',
    emissiveIntensity: 0.16,
    side: THREE.FrontSide,
    transparent: false,
    alphaTest: 0.5,
    depthWrite: true,
  })
  const sticker = new THREE.Mesh(stickerGeo, stickerMat)
  sticker.position.y = (STICKER_MID - CENTER) * MM
  sticker.position.z = STICKER_R * MM
  sticker.renderOrder = 4
  stickerMat.map = makeStickerTexture(initial.sticker)

  // ---- 瓶颈：PET 厚壁，看起来接近不透明，单独一段 ----
  const neckPts = profile.outer
    .filter(([, z]) => z >= 166 && z <= RIM)
    .map(([r, z]) => new THREE.Vector2(r * MM, (z - CENTER) * MM))
  const neckGeo = new THREE.LatheGeometry(neckPts, 96)
  const neckMat = new THREE.MeshPhysicalMaterial({
    color: '#e3f0f9',
    roughness: 0.12,
    metalness: 0,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.42,
  })
  const neck = new THREE.Mesh(neckGeo, neckMat)
  neck.renderOrder = 3
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry((NECK_R + 0.6) * MM, 0.9 * MM, 12, 48),
    new THREE.MeshPhysicalMaterial({ color: '#d7e6f2', roughness: 0.25, clearcoat: 0.6 }),
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = (184 - CENTER) * MM

  bottle.add(liquid, label, sticker, neck, ring, cap, capTop)

  // ---- 背景 ----
  const bgCanvas = document.createElement('canvas')
  const bgTex = new THREE.CanvasTexture(bgCanvas)
  bgTex.colorSpace = THREE.SRGBColorSpace
  scene.background = bgTex

  let stickerPop = 1
  let current = initial
  let width = 0
  let height = 0

  const paintBackground = () => {
    const aspect = width / Math.max(height, 1)
    const bw = 1400
    const bh = Math.round(bw / Math.max(aspect, 0.35))
    bgCanvas.width = bw
    bgCanvas.height = Math.min(bh, 2200)
    const ctx = bgCanvas.getContext('2d')!
    drawStage(ctx, bgCanvas.width, bgCanvas.height, current)
    bgTex.dispose()
    bgTex.needsUpdate = true
  }

  const resize = () => {
    const rect = container.getBoundingClientRect()
    width = Math.max(rect.width, 1)
    height = Math.max(rect.height, 1)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    // 窄屏时把相机拉远，瓶子不被裁掉
    const dist = 400 * (camera.aspect < 0.9 ? 1.28 : 1)
    camera.position.z = dist
    camera.lookAt(0, 10, 0)
    paintBackground()
  }

  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(container)

  // ---- 交互：拖拽旋转、松手后缓慢回正 ----
  let dragging = false
  let lastX = 0
  let velocity = 0
  let spin = -0.22
  const FRONT = -0.22

  const onPointerDown = (event: PointerEvent) => {
    dragging = true
    lastX = event.clientX
    renderer.domElement.setPointerCapture(event.pointerId)
    renderer.domElement.style.cursor = 'grabbing'
  }
  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return
    const dx = event.clientX - lastX
    lastX = event.clientX
    spin += dx * 0.012
    velocity = dx * 0.012
  }
  const onPointerUp = (event: PointerEvent) => {
    dragging = false
    renderer.domElement.style.cursor = 'grab'
    if (renderer.domElement.hasPointerCapture(event.pointerId)) {
      renderer.domElement.releasePointerCapture(event.pointerId)
    }
  }
  renderer.domElement.style.cursor = 'grab'
  renderer.domElement.style.touchAction = 'pan-y'
  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('pointercancel', onPointerUp)

  const clock = new THREE.Clock()
  let raf = 0
  let visible = true

  const loop = () => {
    raf = requestAnimationFrame(loop)
    const dt = Math.min(clock.getDelta(), 0.05)
    if (!dragging) {
      spin += velocity
      velocity *= 0.92
      if (Math.abs(velocity) < 0.0004) {
        velocity = 0
        if (!reduceMotion) spin += dt * 0.09
      }
    }
    if (stickerPop < 1) {
      stickerPop = Math.min(1, stickerPop + dt * 3.2)
      const k = 0.82 + 0.18 * stickerPop
      sticker.scale.set(1, k, 1)
    }
    bottle.rotation.y = spin
    // 贴着转时轻微摆动，像手上拿着
    bottle.rotation.z = reduceMotion ? 0 : Math.sin(clock.elapsedTime * 0.7) * 0.004
    if (visible) renderer.render(scene, camera)
  }
  loop()

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? true
    },
    { threshold: 0.01 },
  )
  io.observe(container)

  return {
    setScene(cfg) {
      current = cfg
      // 切到正面：把当前角度挪到离 FRONT 最近的同角度位置，不会突然倒转
      const turns = Math.round((spin - FRONT) / (Math.PI * 2))
      spin = FRONT + turns * Math.PI * 2
      velocity = 0
      const old = stickerMat.map
      stickerMat.map = makeStickerTexture(cfg.sticker)
      stickerMat.needsUpdate = true
      old?.dispose()
      // 换纸时纸面轻轻弹一下，提示这是刚贴上去的
      stickerPop = reduceMotion ? 1 : 0.82
      paintBackground()
    },
    resize,
    nudge(delta) {
      spin += delta
      velocity = 0
    },
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointercancel', onPointerUp)
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          const m = obj.material
          if (Array.isArray(m)) m.forEach((x) => x.dispose())
          else m.dispose()
        }
      })
      bgTex.dispose()
      envRT.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
