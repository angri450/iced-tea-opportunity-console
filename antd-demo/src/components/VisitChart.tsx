// 访问量图：柱子是当天次数，折线是累计次数，两者共用同一条纵轴。
// 之前用左右两条轴，20 次的柱子看着比 60 次的折线还高，容易读错，这里改成单一刻度。
// 手写 SVG，不引图表库，颜色走 CSS 变量，深色模式自动跟随。
type Point = { date: string; value: number; daily: number | null }

const W = 620
const H = 230
const PAD_T = 26
const PAD_B = 30
const PAD_L = 40
const PAD_R = 16

export default function VisitChart({ points, manual }: { points: Point[]; manual?: boolean }) {
  if (points.length === 0) {
    return <div className="panel-sub">还没有按日数据。第一位访客打开页面后，这里开始累计。</div>
  }

  const first = points[0]
  const last = points[points.length - 1]
  const dailyMax = Math.max(1, ...points.map((p) => p.daily ?? 0))
  const cumMax = Math.max(1, last.value)

  // 单一纵轴，上限取累计终点，留一点空间，刻度取整十
  const yMax = Math.ceil((cumMax * 1.08) / 10) * 10

  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const slot = plotW / Math.max(points.length, 1)
  const cx = (i: number) => PAD_L + slot * i + slot / 2
  const barW = Math.max(4, Math.min(22, slot - 10))
  const y = (v: number) => PAD_T + plotH * (1 - v / yMax)

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(' ')

  const ticks = [0, Math.round(yMax / 2 / 5) * 5, yMax]
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

        {/* 横向刻度与纵轴数字，柱和线共用这一条轴 */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              y1={y(t)}
              x2={W - PAD_R}
              y2={y(t)}
              stroke="var(--ink-100)"
              strokeWidth={1}
              strokeDasharray={t === yMax ? '3 4' : undefined}
            />
            <text x={PAD_L - 6} y={y(t) + 3} fontSize={9} textAnchor="end" fill="var(--ink-400)">
              {t}
            </text>
          </g>
        ))}

        {/* 当天次数柱 */}
        {points.map((p, i) => {
          const v = p.daily ?? 0
          const h = Math.max(v > 0 ? 2 : 0, (v / yMax) * plotH)
          return (
            <g key={`b${p.date}`}>
              <rect
                x={cx(i) - barW / 2}
                y={y(0) - h}
                width={barW}
                height={h}
                rx={barW > 8 ? 3 : 1.5}
                fill="var(--brand-200)"
              />
              {/* 柱子顶上标当天数字，免得小柱子看不出大小 */}
              {v > 0 && (
                <text
                  x={cx(i)}
                  y={y(0) - h - 4}
                  fontSize={9}
                  textAnchor="middle"
                  fill="var(--ink-500)"
                  stroke="var(--surface)"
                  strokeWidth={2.5}
                  paintOrder="stroke"
                >
                  {v}
                </text>
              )}
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
              cy={y(p.value)}
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
            当天次数
          </text>
          <line x1={PAD_L + 76} y1={12} x2={PAD_L + 88} y2={12} stroke="var(--brand-600)" strokeWidth={2} />
          <text x={PAD_L + 92} y={15.5} fontSize={9} fill="var(--ink-500)">
            累计次数
          </text>
          <text x={W - PAD_R} y={15.5} fontSize={10} fontWeight={600} textAnchor="end" fill="var(--brand-600)">
            共 {last.value} 次
          </text>
        </g>
      </svg>
      <figcaption className="method-note" style={{ marginTop: 6 }}>
        从 {first.date} 到 {last.date}，柱和线共用一条纵轴。柱子是当天打开次数，最高 {dailyMax} 次；折线是累计，终点 {last.value} 次。
        {first.daily === null ? '起点是统计开始前的服务器日志回填。' : ''}
        悬停任意一天可看当天与累计。
        {manual ? '统计开始前那几天的数字是手工填写，未经服务器日志核实。' : ''}
      </figcaption>
    </figure>
  )
}