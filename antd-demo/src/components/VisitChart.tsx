// 访问量图：柱是当天次数，线是累计次数。
// 左边纵轴读柱子，右边纵轴读累计线；手写 SVG，不引图表库，颜色走 CSS 变量，深色模式自动跟随。
type Point = { date: string; value: number; daily: number | null }

const W = 620
const H = 220
const PAD_T = 26
const PAD_B = 30
const PAD_L = 34
const PAD_R = 52

export default function VisitChart({ points, manual }: { points: Point[]; manual?: boolean }) {
  if (points.length === 0) {
    return <div className="panel-sub">还没有按日数据。第一位访客打开页面后，这里开始累计。</div>
  }

  const first = points[0]
  const last = points[points.length - 1]
  const dailyMax = Math.max(1, ...points.map((p) => p.daily ?? 0))
  const cumMax = Math.max(1, last.value)

  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const slot = plotW / Math.max(points.length, 1)
  const cx = (i: number) => PAD_L + slot * i + slot / 2
  const barW = Math.max(4, Math.min(22, slot - 8))

  const yDaily = (v: number) => PAD_T + plotH * (1 - v / dailyMax)
  const yCum = (v: number) => PAD_T + plotH * (1 - v / cumMax)

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)} ${yCum(p.value).toFixed(1)}`)
    .join(' ')

  const leftTicks = [0, Math.round(dailyMax / 2), dailyMax]
  const rightTicks = [0, Math.round(cumMax / 2), cumMax]
  const labelEvery = points.length <= 8 ? 1 : Math.ceil(points.length / 6)

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`访问量：${first.date} 到 ${last.date}，当天次数最高 ${dailyMax} 次，累计 ${last.value} 次`}
        style={{ display: 'block' }}
      >
        <title>
          {`访问量：${first.date} 到 ${last.date}，当天次数最高 ${dailyMax} 次，累计 ${last.value} 次`}
        </title>

        {/* 网格与左右刻度 */}
        {leftTicks.map((t) => (
          <g key={`l${t}`}>
            <line
              x1={PAD_L}
              y1={yDaily(t)}
              x2={W - PAD_R}
              y2={yDaily(t)}
              stroke="var(--ink-100)"
              strokeWidth={1}
              strokeDasharray={t === dailyMax ? '3 4' : undefined}
            />
            <text x={PAD_L - 6} y={yDaily(t) + 3} fontSize={9} textAnchor="end" fill="var(--ink-400)">
              {t}
            </text>
          </g>
        ))}
        {rightTicks.map((t) => (
          <text key={`r${t}`} x={W - PAD_R + 8} y={yCum(t) + 3} fontSize={9} fill="var(--ink-400)">
            {t}
          </text>
        ))}

        {/* 当天次数柱 */}
        {points.map((p, i) => {
          const v = p.daily ?? 0
          const h = Math.max(v > 0 ? 2 : 0, (v / dailyMax) * plotH)
          return (
            <g key={`b${p.date}`}>
              <rect
                x={cx(i) - barW / 2}
                y={yDaily(0) - h}
                width={barW}
                height={h}
                rx={barW > 8 ? 3 : 1.5}
                fill="var(--brand-200)"
              />
              <title>{`${p.date}：当天 ${v} 次，累计 ${p.value} 次`}</title>
            </g>
          )
        })}

        {/* 累计折线 */}
        <path d={linePath} fill="none" stroke="var(--brand-600)" strokeWidth={2} strokeLinejoin="round" />
        {points.map((p, i) => {
          const isLast = i === points.length - 1
          return (
            <circle
              key={`d${p.date}`}
              cx={cx(i)}
              cy={yCum(p.value)}
              r={isLast ? 4.5 : 2.8}
              fill={isLast ? 'var(--brand-600)' : 'var(--surface)'}
              stroke="var(--brand-600)"
              strokeWidth={1.5}
            />
          )
        })}

        {/* 横轴日期 */}
        {points.map((p, i) => {
          const isLast = i === points.length - 1
          return (i % labelEvery === 0 || isLast) ? (
            <text key={`x${p.date}`} x={cx(i)} y={H - 10} fontSize={9} textAnchor="middle" fill="var(--ink-400)">
              {p.date.slice(5)}
            </text>
          ) : null
        })}



        {/* 图例 */}
        <g>
          <rect x={PAD_L} y={8} width={8} height={8} rx={2} fill="var(--brand-200)" />
          <text x={PAD_L + 12} y={15.5} fontSize={9} fill="var(--ink-500)">
            当天次数（左轴）
          </text>
          <line x1={PAD_L + 120} y1={12} x2={PAD_L + 132} y2={12} stroke="var(--brand-600)" strokeWidth={2} />
          <text x={PAD_L + 136} y={15.5} fontSize={9} fill="var(--ink-500)">
            累计次数（右轴）
          </text>
          <text x={W - PAD_R} y={15.5} fontSize={10} fontWeight={600} textAnchor="middle" fill="var(--brand-600)">
            共 {last.value} 次
          </text>
        </g>
      </svg>
      <figcaption className="method-note" style={{ marginTop: 6 }}>
        从 {first.date} 到 {last.date}。柱子是当天打开次数，最高 {dailyMax} 次；折线是累计，终点 {last.value} 次。
        {first.daily === null ? '起点是统计开始前的服务器日志回填。' : ''}
        悬停任意一天可看当天与累计。
        {manual ? '统计开始前那几天的数字是手工填写，未经服务器日志核实。' : ''}
      </figcaption>
    </figure>
  )
}