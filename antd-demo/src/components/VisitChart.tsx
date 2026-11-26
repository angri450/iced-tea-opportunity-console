// 访问量随时间变化的柱状图。不引图表库，直接画 SVG，颜色取 CSS 变量，深色模式自动跟随。
type Day = { date: string; count: number }

const W = 560
const H = 150
const PAD_T = 14
const PAD_B = 26
const PAD_X = 6

export default function VisitChart({ days }: { days: Day[] }) {
  if (days.length === 0) {
    return <div className="panel-sub">还没有按日数据。第一位访客打开页面后，这里开始按天累计。</div>
  }

  // 只有今天一天时画一根柱子看不出趋势，先给一句话，攒够两天再画图
  if (days.length === 1) {
    return (
      <div className="panel-sub">
        统计从今天开始，目前 {days[0].count} 次。攒够两天后，这里会出现按日的柱状图。
      </div>
    )
  }

  const max = Math.max(1, ...days.map((d) => d.count))
  const plotH = H - PAD_T - PAD_B
  const slot = (W - PAD_X * 2) / days.length
  const barW = Math.max(3, Math.min(28, slot - 3))
  const total = days.reduce((sum, d) => sum + d.count, 0)
  const peak = days.reduce((best, d) => (d.count > best.count ? d : best), days[0])

  const y = (v: number) => PAD_T + plotH * (1 - v / max)
  const labelEvery = days.length <= 10 ? 1 : Math.ceil(days.length / 8)

  const summary =
    days.length === 1
      ? `今天访问 ${days[0].count} 次，统计从今天开始`
      : `从 ${days[0].date} 到 ${days[days.length - 1].date} 共 ${total} 次访问，最高一天 ${peak.count} 次（${peak.date}）`

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`访问量随时间变化：${summary}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <title>访问量随时间变化：{summary}</title>

        {/* 基线 */}
        <line x1={PAD_X} y1={y(0)} x2={W - PAD_X} y2={y(0)} stroke="var(--ink-200)" strokeWidth={1} />
        {/* 最高值参考线 */}
        <line
          x1={PAD_X}
          y1={y(max)}
          x2={W - PAD_X}
          y2={y(max)}
          stroke="var(--ink-100)"
          strokeWidth={1}
          strokeDasharray="3 4"
        />
        <text x={PAD_X} y={y(max) - 4} fontSize={9} fill="var(--ink-400)">
          {max} 次
        </text>

        {days.map((d, i) => {
          const cx = PAD_X + slot * i + slot / 2
          const barH = Math.max(d.count > 0 ? 2 : 0, (d.count / max) * plotH)
          const isToday = i === days.length - 1
          return (
            <g key={d.date}>
              <rect
                x={cx - barW / 2}
                y={y(0) - barH}
                width={barW}
                height={barH}
                rx={barW > 8 ? 3 : 1.5}
                fill={isToday ? 'var(--brand-600)' : 'var(--brand-200)'}
              />
              <title>{`${d.date}：${d.count} 次`}</title>
              {(i % labelEvery === 0 || isToday) && (
                <text x={cx} y={H - 8} fontSize={9} textAnchor="middle" fill="var(--ink-400)">
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <figcaption className="method-note" style={{ marginTop: 6 }}>
        {summary}。深色柱子是今天。
      </figcaption>
    </figure>
  )
}