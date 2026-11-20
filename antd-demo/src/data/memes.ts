// 冻结的示例数据。来源为 2026-11-20 用元宝搜索 MCP 通道实检的结果，
// 每日命中条数只统计 2026-11-14 至 2026-11-20 这 7 天内落库的条目。
// 页面上出现的一切数字都在这份文件里，不另有隐藏来源。

export type VoteValue = '通过' | '不通过' | '未知'

export type Link = {
  title: string
  url: string
  site: string
  date: string
  note?: string
}

export type Vote = {
  key: string
  label: string
  ask: string
  value: VoteValue
  basis: string
  links: Link[]
  by: '代码' | '人工'
}

export type Suggestion = '内容响应' | '人工复核' | '观察' | '不需跟'

export type Meme = {
  id: string
  name: string
  aliases: string[]
  firstSeen: string
  latestHit: string
  hits7d: number
  sites: number
  suggestion: Suggestion
  suggestionWhy: string
  window: string
  samples: string
  confidence: string
  votes: Vote[]
  nextStep: string
  acceptance: { metric: string; threshold: string; note: string }
  incrementDefault: '新场景' | '新客' | '存量重复' | '未知'
}

export const windowOptions = ['短，7 天以内', '中，8 到 45 天', '长，45 天以上', '未知']

export const incrementOptions = [
  { value: '新场景', label: '新场景', hint: '梗带来一个冰红茶现在没占的时刻' },
  { value: '新客', label: '新客', hint: '梗带来的人群目前不喝冰红茶' },
  { value: '存量重复', label: '存量重复', hint: '人还是那批人，时刻还是那个时刻' },
  { value: '未知', label: '未知', hint: '证据不够，先空着' },
]

export const memes: Meme[] = [
  {
    id: 'price',
    name: '涨价老实人',
    aliases: ['饮料界的老实人', '已老实，求降价'],
    firstSeen: '未核实，涨价动作早于 2025 年上半年财报',
    latestHit: '2026-11-17',
    hits7d: 3,
    sites: 3,
    suggestion: '人工复核',
    suggestionWhy: '四项里三项通过，风险一项不通过。梗的语境指向自家涨价，任何官方动作都可能被读成自嘲或辩解。',
    window: '未知',
    samples: '0 / 5',
    confidence: '弱，3 条证据，3 个站点',
    votes: [
      {
        key: 'persist',
        label: '讨论仍在持续',
        ask: '近 7 日是否有独立报道，最近一条在 48 小时内',
        value: '通过',
        basis: '近 7 日命中 3 条，分属 3 个站点，最近一条为 2026-11-17。',
        links: [
          { title: '成本只多 1 毛，饮料巨头集体坐不住', url: 'https://app.myzaker.com/news/article.php?pk=6afbd4f28e9f09656862fa7d', site: 'ZAKER', date: '2026-11-17' },
          { title: '被网友戏称「国窖」之后，康师傅冰红茶在玩一种很新的行为艺术大赏', url: 'https://www.163.com/dy/article/LC3HTL9R0525APMK.html', site: '网易', date: '2026-11-19' },
          { title: '冰红茶的梗，怎么从考试周破防玩到「涨价老实人」', url: 'https://post.smzdm.com/p/a704qpe9/', site: '什么值得买', date: '2026-10-30', note: '超出 7 日窗口，仅作背景' },
        ],
        by: '代码',
      },
      {
        key: 'scene',
        label: '场景挂靠',
        ask: '梗里是否出现冰红茶能出场的消费时刻',
        value: '通过',
        basis: '梗的时刻是便利店货架前比价、结账时的自嘲，冰红茶本体在场。',
        links: [
          { title: '成本只多 1 毛，饮料巨头集体坐不住', url: 'https://app.myzaker.com/news/article.php?pk=6afbd4f28e9f09656862fa7d', site: 'ZAKER', date: '2026-11-17' },
        ],
        by: '代码',
      },
      {
        key: 'unused',
        label: '品牌还没用过',
        ask: '康师傅是否已用同一梗做过官方动作',
        value: '通过',
        basis: '检索未见官方内容，现阶段是消费者自发调侃。',
        links: [
          { title: '冰红茶的梗，怎么从考试周破防玩到「涨价老实人」', url: 'https://post.smzdm.com/p/a704qpe9/', site: '什么值得买', date: '2026-10-30' },
        ],
        by: '代码',
      },
      {
        key: 'risk',
        label: '风险可接受',
        ask: '语境、争议、素材授权是否可控',
        value: '不通过',
        basis: '梗的正文是自家涨价引发的抱怨，2025 年上半年茶饮料收入同比减少 7.2 亿元。素材无授权问题，但语境不适合官方跟进。',
        links: [
          { title: '成本只多 1 毛，饮料巨头集体坐不住', url: 'https://app.myzaker.com/news/article.php?pk=6afbd4f28e9f09656862fa7d', site: 'ZAKER', date: '2026-11-17' },
        ],
        by: '代码',
      },
    ],
    nextStep: '转品牌部判语境。若判可用，只做渠道侧的陈列与价格沟通，不做官方玩梗。',
    acceptance: { metric: '内容响应：发布后 48 小时播放量或互动率', threshold: '播放 10 万次以上，或互动率 5% 以上', note: '阈值为初值，未用康师傅历史数据校准' },
    incrementDefault: '存量重复',
  },
  {
    id: 'exam',
    name: '考试周破防水',
    aliases: ['热带风味冰红茶', '破防水', '考试周圣水'],
    firstSeen: '2021-11',
    latestHit: '2026-11-17',
    hits7d: 2,
    sites: 2,
    suggestion: '不需跟',
    suggestionWhy: '康师傅在 2021 至 2022 年已用这个梗做过官方动作，进过 B 站 2021 年度弹幕短片。现在检索到的多是内容农场对老文的重新发布，不是新机会。',
    window: '未知',
    samples: '0 / 5',
    confidence: '弱，2 条证据，其中 1 条为重发',
    votes: [
      {
        key: 'persist',
        label: '讨论仍在持续',
        ask: '近 7 日是否有独立报道，最近一条在 48 小时内',
        value: '通过',
        basis: '近 7 日命中 2 条，分属 2 个站点。其中一条 URL 带 /a/202211/，属五年前老文的重新发布，不能算新讨论。',
        links: [
          { title: '热带风味冰红茶是什么梗', url: 'http://rank.chinaz.comcaijing.shadafang.com/a/202211/4805099.html', site: '傻大方知识', date: '2026-11-17', note: 'URL 时间痕迹为 2022-11' },
          { title: '热带风味冰红茶是什么梗', url: 'http://www.quxiu.com/news/2137908.html', site: '去秀网', date: '2026-11-14' },
        ],
        by: '代码',
      },
      {
        key: 'scene',
        label: '场景挂靠',
        ask: '梗里是否出现冰红茶能出场的消费时刻',
        value: '通过',
        basis: '考试周熬夜复习、宿舍桌边，冰红茶本体出镜。',
        links: [
          { title: '嫌它腻，还是买了：热带风味冰红茶怎么成了考试周标配', url: 'https://post.smzdm.com/p/aqrz8qdv', site: '什么值得买', date: '2026-10-30', note: '超出 7 日窗口' },
        ],
        by: '代码',
      },
      {
        key: 'unused',
        label: '品牌还没用过',
        ask: '康师傅是否已用同一梗做过官方动作',
        value: '不通过',
        basis: '2021 年 12 月至 2022 年 2 月，康师傅与 B 站联合做「弹幕罐」，并进入 2021 年度弹幕发布短片。',
        links: [
          { title: '从破防水到弹幕罐，康师傅怎样在 B 站拿捏住饮料界「出圈密码」', url: 'https://www.morko.net/article/138534.html', site: 'morko', date: '2022-01-13' },
          { title: '康师傅冰红茶热带风味突围有招', url: 'https://www.creativead.com.cn?p=5642/', site: '创意广告', date: '2022-02-22' },
        ],
        by: '代码',
      },
      {
        key: 'risk',
        label: '风险可接受',
        ask: '语境、争议、素材授权是否可控',
        value: '通过',
        basis: '语境为校园共鸣，无争议。但原始视频已被原作者删除，若复现需另找素材授权。',
        links: [
          { title: '热带风味冰红茶是什么梗', url: 'http://www.quxiu.com/news/2137908.html', site: '去秀网', date: '2026-11-14' },
        ],
        by: '代码',
      },
    ],
    nextStep: '本期不跟。若秋季考试季要复现，只能作为内容复现，不能算新机会。',
    acceptance: { metric: '内容响应：发布后 48 小时播放量或互动率', threshold: '播放 10 万次以上，或互动率 5% 以上', note: '阈值为初值，未校准' },
    incrementDefault: '存量重复',
  },
  {
    id: 'laoshi',
    name: '已老实求放过',
    aliases: ['已老实', '求放过', '已老实，求降价'],
    firstSeen: '2026-06 前后，高考期间牛蛙事件（具体日期未核实）',
    latestHit: '2026-11-14',
    hits7d: 1,
    sites: 1,
    suggestion: '观察',
    suggestionWhy: '近 7 日只有 1 条，持续性够不到判据；句式与冰红茶涨价的关联是旧话，不是新场景。',
    window: '未知',
    samples: '0 / 5',
    confidence: '很弱，1 条命中，原文站点返回 403',
    votes: [
      {
        key: 'persist',
        label: '讨论仍在持续',
        ask: '近 7 日是否有独立报道，最近一条在 48 小时内',
        value: '未知',
        basis: '近 7 日只命中 1 条，且该站点对本机返回 403。只拿到检索摘要，原文打不开，按无证据处理。',
        links: [],
        by: '代码',
      },
      {
        key: 'scene',
        label: '场景挂靠',
        ask: '梗里是否出现冰红茶能出场的消费时刻',
        value: '不通过',
        basis: '检索摘要说句式来自考场外的牛蛙事件，与饮料场景无关；文中提到「冰红茶涨价就老实了」是旧关联，不是新场景。原文站点返回 403，未能核对全文。',
        links: [],
        by: '代码',
      },
      {
        key: 'unused',
        label: '品牌还没用过',
        ask: '康师傅是否已用同一梗做过官方动作',
        value: '通过',
        basis: '检索未见官方动作。',
        links: [],
        by: '代码',
      },
      {
        key: 'risk',
        label: '风险可接受',
        ask: '语境、争议、素材授权是否可控',
        value: '未知',
        basis: '检索摘要看语境为自嘲，但原文打不开，语境与素材都没核对，不能判通过。',
        links: [],
        by: '代码',
      },
    ],
    nextStep: '留在观察列表。下次检索若 7 日命中达到 3 条且出现饮料时刻，再进判定。',
    acceptance: { metric: '观察项，暂不设阈值', threshold: '无', note: '进判定后再填' },
    incrementDefault: '未知',
  },
  {
    id: 'tongyuzhou',
    name: '冰红茶痛宇宙',
    aliases: ['痛包', '痛车', '二创玩梗'],
    firstSeen: '2026-11，品牌自建活动，起点未核实',
    latestHit: '2026-11-19',
    hits7d: 2,
    sites: 2,
    suggestion: '不需跟',
    suggestionWhy: '这是品牌自己搭的场子，用户二创围绕官方周边与代言人展开。平台要识别的是外部机会，不是自家活动的回声。',
    window: '未知',
    samples: '0 / 5',
    confidence: '弱，2 条证据，2 个站点',
    votes: [
      {
        key: 'persist',
        label: '讨论仍在持续',
        ask: '近 7 日是否有独立报道，最近一条在 48 小时内',
        value: '通过',
        basis: '2026-11-19 两家媒体同日报道，一条为新华报业，一条为网易。',
        links: [
          { title: '冰红茶也有自己的「痛宇宙」了？康师傅这波年轻化很会玩', url: 'https://www.xhby.net/content/s6afd5ef7e4b079b9eba7fbd0.html', site: '新华报业网', date: '2026-11-19' },
          { title: '被网友戏称「国窖」之后，康师傅冰红茶在玩一种很新的行为艺术大赏', url: 'https://www.163.com/dy/article/LC3HTL9R0525APMK.html', site: '网易', date: '2026-11-19' },
        ],
        by: '代码',
      },
      {
        key: 'scene',
        label: '场景挂靠',
        ask: '梗里是否出现冰红茶能出场的消费时刻',
        value: '通过',
        basis: 'B 站二创、漫展现场、抖音万圣节装扮，冰红茶在画面中心。',
        links: [
          { title: '冰红茶也有自己的「痛宇宙」了？', url: 'https://www.xhby.net/content/s6afd5ef7e4b079b9eba7fbd0.html', site: '新华报业网', date: '2026-11-19' },
        ],
        by: '代码',
      },
      {
        key: 'unused',
        label: '品牌还没用过',
        ask: '康师傅是否已用同一梗做过官方动作',
        value: '不通过',
        basis: '活动由品牌发起，含官方周边共创与代言人内容。',
        links: [
          { title: '冰红茶也有自己的「痛宇宙」了？', url: 'https://www.xhby.net/content/s6afd5ef7e4b079b9eba7fbd0.html', site: '新华报业网', date: '2026-11-19' },
        ],
        by: '代码',
      },
      {
        key: 'risk',
        label: '风险可接受',
        ask: '语境、争议、素材授权是否可控',
        value: '未知',
        basis: '报道提到王一博与时代少年团参与广告内容，二次使用涉及艺人授权，需法务确认。',
        links: [
          { title: '冰红茶也有自己的「痛宇宙」了？', url: 'https://www.xhby.net/content/s6afd5ef7e4b079b9eba7fbd0.html', site: '新华报业网', date: '2026-11-19' },
        ],
        by: '人工',
      },
    ],
    nextStep: '不占判定名额。需要看的话走品牌自有活动复盘，不进机会清单。',
    acceptance: { metric: '自有活动，用另一套指标', threshold: '不套用本平台阈值', note: '无' },
    incrementDefault: '存量重复',
  },
]

export const methodRows = [
  { dim: '讨论仍在持续', what: '近 7 日命中条数、最近命中日期、与昨日快照的新增 URL 差集、语境是否转为回顾', source: '每日一次检索', strength: '弱证据', who: '代码算前两项，模型判语境' },
  { dim: '场景挂靠', what: '搜「梗名 + 冰红茶」是否命中自然关联内容，梗里的时刻能否让冰红茶出场', source: '定向检索加模型读摘要', strength: '中', who: '代码加模型' },
  { dim: '品牌还没用过', what: '搜「梗名 + 康师傅」「梗名 + 统一冰红茶」，看官方是否已做动作', source: '定向检索', strength: '中', who: '代码加人' },
  { dim: '风险可接受', what: '搜争议、翻车、侵权、授权四类词，核对素材与语境', source: '定向检索加法务', strength: '中偏强', who: '代码加模型加人' },
  { dim: '增量价值', what: '新场景、新客、存量重复，三选一', source: '人工填写', strength: '人工判断', who: '人' },
  { dim: '窗口能否覆盖交付', what: '同类梗的剩余时长与交付周期比较', source: '暂无数据源', strength: '无', who: '人，恒为未知' },
]

export const queryTemplates = [
  { q: '梗名', freq: '每 6 小时一次', args: 'freshness d1，cnt 50', use: '算新增 URL 差集，判断讨论是否仍在持续' },
  { q: '梗名 冰红茶', freq: '每日一次', args: 'freshness d7，cnt 20', use: '场景挂靠' },
  { q: '梗名 康师傅', freq: '每日一次', args: 'freshness d7，cnt 20', use: '品牌是否已用' },
  { q: '梗名 统一冰红茶', freq: '每日一次', args: 'freshness d7，cnt 20', use: '竞品是否已用，顺带识别同名混淆' },
  { q: '梗名 争议 翻车 违规', freq: '每日一次', args: 'freshness y2，cnt 20', use: '风险' },
  { q: '梗名 版权 授权 原作者', freq: '每日一次', args: 'freshness y2，cnt 20', use: '素材授权' },
]

export const boundaries = [
  '平台不预测热度，也不给概率。只回答讨论是否仍在持续，以及有没有可点开的证据。',
  '窗口档位在没有量级数据源之前一律标未知，改造与新品全走人工入口。',
  '首期只自动出快速内容响应一类动作。示例里的四个梗没有一个四项全绿，所以没有内容响应建议。平台宁可少给建议，不构造机会。',
  '原文打不开就不算证据。检索摘要可以写进依据，但不能当原文引用；示例里有一个梗的唯一来源返回 403，因此它的持续性只标未知。',
  '示例数据全部来自 2026-11-20 的实检结果，数字与链接逐条做过可达性检查，打不开的不计。页面上标「示例数据，非实测投放」，不代表康师傅真实决策。',
]
