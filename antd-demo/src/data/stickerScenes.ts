// 包装整活台的场景数据。
// 分两类：kind 为 '有出处' 的场景挂在 2026-11-20 元宝搜索实检到的梗上，带原文链接；
// kind 为 '设计稿' 的场景是本仓库自己编的试贴方案，没有检索出处，用来给设计方向看效果。
// 贴纸文案都是设计稿，不是康师傅已发布的物料。

import type { StageKind, StickerStyle } from '../scene/bottleStage'
import type { Suggestion } from './memes'

export type StickerScene = {
  id: string
  name: string
  moment: string
  kind: '有出处' | '设计稿'
  sticker: {
    style: StickerStyle
    line1: string
    line2?: string
    tag?: string
  }
  stage: StageKind
  palette: { from: string; to: string; accent: string; ground: string }
  suggestion: Suggestion
  why: string
  links: { title: string; url: string; site: string; date: string }[]
}

const P = {
  cold: { from: '#d8e8f7', to: '#9fbed6', accent: '#eef7ff', ground: '#c3d6e3' },
  shelf: { from: '#f8edd9', to: '#dcc7a4', accent: '#fff8ea', ground: '#d7c3a1' },
  desk: { from: '#f4f0e7', to: '#d8cab2', accent: '#c9a97e', ground: '#bf9f77' },
  court: { from: '#dcecdd', to: '#a4c6aa', accent: '#8bbb95', ground: '#9abfa1' },
  night: { from: '#2b2f45', to: '#3c3244', accent: '#241f2c', ground: '#211c29' },
  camp: { from: '#e4efe0', to: '#b4cfb8', accent: '#8bb597', ground: '#a5c1a8' },
  office: { from: '#eef1f5', to: '#c8d1da', accent: '#97a4b1', ground: '#b4bec8' },
  dorm: { from: '#f1eae3', to: '#d3c4b3', accent: '#bfab95', ground: '#b19c87' },
}

export const scenes: StickerScene[] = [
  {
    id: 'exam',
    name: '考试周破防水',
    moment: '自习室桌面，两个人的复习资料中间空出一个瓶子的位置',
    kind: '有出处',
    sticker: {
      style: 'hand',
      line1: '考试周 靠它了',
      line2: '挂了也别怪我',
      tag: '北门小卖部 · 期末周',
    },
    stage: 'desk',
    palette: P.desk,
    suggestion: '内容响应',
    why: '梗有明确场景与情绪，冰红茶本体在画面里，贴纸只加一句学生的自嘲，不替品牌表态。',
    links: [
      {
        title: '冰红茶的梗，怎么从考试周破防玩到「涨价老实人」',
        url: 'https://post.smzdm.com/p/a704qpe9/',
        site: '什么值得买',
        date: '2026-10-30',
      },
    ],
  },
  {
    id: 'price',
    name: '涨价老实人',
    moment: '便利店货架，价签旁边立着一瓶被贴了黑条的同款',
    kind: '有出处',
    sticker: {
      style: 'scribble',
      line1: '已老实 求降价',
      line2: '',
      tag: '别问 问就是进货价涨了',
    },
    stage: 'shelf',
    palette: P.shelf,
    suggestion: '不需跟',
    why: '梗的靶心是品牌自己涨价。终端贴着玩是自嘲，品牌跟着贴就是承认涨价扎心。',
    links: [
      {
        title: '成本只多 1 毛，饮料巨头集体坐不住',
        url: 'https://app.myzaker.com/news/article.php?pk=6afbd4f28e9f09656862fa7d',
        site: 'ZAKER',
        date: '2026-11-17',
      },
    ],
  },
  {
    id: 'guojiao',
    name: '冰镇如国窖',
    moment: '冷柜前，手正伸向最里排那瓶',
    kind: '有出处',
    sticker: {
      style: 'paper',
      line1: '冰镇如国窖',
      line2: '常温请放回',
      tag: '本柜已冰 6 小时',
    },
    stage: 'fridge',
    palette: P.cold,
    suggestion: '内容响应',
    why: '梗说的是温度差，跟终端能提供的动作正好对上。贴纸替店主说话，比品牌自夸可信。',
    links: [
      {
        title: '属于年轻人的冰红茶玩梗大赏：一句「冰镇如国窖」，他们玩了三年多',
        url: 'https://post.smzdm.com/p/a3m464xn/',
        site: '什么值得买',
        date: '2026-10-30',
      },
      {
        title: '常温马尿，冰冻国窖',
        url: 'https://aiqicha.baidu.com/m/corpmarket?query=5bc264961a6ef24490a2a56c6ff80b87&type=20',
        site: '爱企查',
        date: '2026-11-04',
      },
    ],
  },
  {
    id: 'dongbai',
    name: '东百往事',
    moment: '夜市摊塑料凳边，瓶身被烟头烫出一个小点',
    kind: '有出处',
    sticker: {
      style: 'print',
      line1: '这瓶 留给懂的人',
      line2: '别劝 劝就是老铁',
    },
    stage: 'night',
    palette: P.night,
    suggestion: '人工复核',
    why: '梗来自直播圈的亚文化，懂得人一眼就懂。品牌自己下场容易显得生硬，交给店主更稳。',
    links: [
      {
        title: '属于年轻人的冰红茶玩梗大赏：一句「冰镇如国窖」，他们玩了三年多',
        url: 'https://post.smzdm.com/p/a3m464xn/',
        site: '什么值得买',
        date: '2026-10-30',
      },
    ],
  },
  {
    id: 'pain',
    name: '冰红茶痛宇宙',
    moment: '漫展摊位，瓶身挂满挂件和贴纸',
    kind: '有出处',
    sticker: {
      style: 'tape',
      line1: '痛就痛 别动它',
      line2: '挂件比瓶子贵',
      tag: '同好自制 非卖品',
    },
    stage: 'shelf',
    palette: P.shelf,
    suggestion: '不需跟',
    why: '这是品牌自己搭的场子，用户二创围绕官方周边展开。平台要看的是外部机会，不是自家回声。',
    links: [
      {
        title: '冰红茶也有自己的「痛宇宙」了？康师傅这波年轻化很会玩',
        url: 'https://www.xhby.net/content/s6afd5ef7e4b079b9eba7fbd0.html',
        site: '新华报业网',
        date: '2026-11-19',
      },
    ],
  },
  {
    id: 'faceswap',
    name: '瓶身换脸',
    moment: '便利店冷柜前，店主拿贴纸把包装上的代言人头像盖住',
    kind: '设计稿',
    sticker: {
      style: 'eyes',
      line1: '',
      tag: '人脸已下线 味道还在',
    },
    stage: 'fridge',
    palette: P.cold,
    suggestion: '人工复核',
    why: '这是把 2026-11 补水啦换脸事件的玩法搬到冰红茶上。前提是包装上真有代言人肖像，没有肖像就没有这个场景。',
    links: [],
  },
  {
    id: 'court',
    name: '球场边的战神',
    moment: '篮球场边线外的水泥台，瓶身挂着水珠',
    kind: '有出处',
    sticker: {
      style: 'paper',
      line1: '上场前 先干半瓶',
      line2: '输了算我的',
      tag: '球场自取 记得给钱',
    },
    stage: 'court',
    palette: P.court,
    suggestion: '内容响应',
    why: '球场是冰红茶已有的消费时刻，梗只负责把这一刻变成一句台词，不需要额外解释。',
    links: [
      {
        title: '被网友戏称「国窖」之后，康师傅冰红茶在玩一种很新的行为艺术大赏',
        url: 'https://china.qianlong.com/2026/1120/8753665.shtml',
        site: '千龙网',
        date: '2026-11-20',
      },
    ],
  },
  {
    id: 'supper',
    name: '宵夜摊的固定搭档',
    moment: '夜宵摊折叠桌，油渍和签子把瓶身挡了一半',
    kind: '有出处',
    sticker: {
      style: 'hand',
      line1: '辣到冒烟 才想起它',
      line2: '先冰的 后辣的',
      tag: '老板自己贴的',
    },
    stage: 'night',
    palette: P.night,
    suggestion: '内容响应',
    why: '配餐是冰红茶最高频的时刻，贴纸不改产品只改说法，落地成本比包装改造低得多。',
    links: [
      {
        title: '被网友戏称「国窖」之后，康师傅冰红茶在玩一种很新的行为艺术大赏',
        url: 'https://china.qianlong.com/2026/1120/8753665.shtml',
        site: '千龙网',
        date: '2026-11-20',
      },
    ],
  },
  {
    id: 'naked',
    name: '无标签瓶',
    moment: '仓库整箱堆头，箱子上写着「无标签版」',
    kind: '有出处',
    sticker: {
      style: 'print',
      line1: '标签撕了 味道没变',
      line2: '认出靠瓶盖',
    },
    stage: 'office',
    palette: P.office,
    suggestion: '人工复核',
    why: '这是真实在售的包装形态，不是玩梗。拿它当梗底容易被读成清库存，需要品牌部先定调。',
    links: [
      {
        title: '无标签 PET 瓶包装产品（康师傅 2022 年 3 月推出）',
        url: 'https://baike.baidu.com/item/%E6%97%A0%E6%A0%87%E7%AD%BEPET%E7%93%B6%E5%8C%85%E8%A3%85%E4%BA%A7%E5%93%81/60208528',
        site: '百度百科',
        date: '2026-07-29',
      },
    ],
  },
  {
    id: 'netbar',
    name: '网吧通宵',
    moment: '网吧机位，显示器边角露出一截瓶身',
    kind: '设计稿',
    sticker: {
      style: 'hand',
      line1: '通宵五小时 续命用',
      line2: '别动 动了我没法打',
      tag: '3 号机 常客留',
    },
    stage: 'office',
    palette: P.night,
    suggestion: '观察',
    why: '场景真实但没有检索到对应的梗，先作为设计方向的候选，不进机会清单。',
    links: [],
  },
  {
    id: 'camp',
    name: '露营',
    moment: '帐篷边的折叠桌上，瓶子和冰袋挨在一起',
    kind: '设计稿',
    sticker: {
      style: 'tape',
      line1: '山里有风 瓶里有冰',
      line2: '喝完记得带走',
      tag: '无痕露营 谢谢',
    },
    stage: 'camp',
    palette: P.camp,
    suggestion: '观察',
    why: '露营是冰红茶还没占住的场景，但缺少可引用的梗，只能算场景提案。',
    links: [],
  },
  {
    id: 'dorm',
    name: '宿舍偷喝',
    moment: '宿舍上铺的桌板，瓶子被推到最里面',
    kind: '设计稿',
    sticker: {
      style: 'scribble',
      line1: '偷喝的 脚趾撞床脚',
      line2: '',
      tag: '写名字了 别装看不见',
    },
    stage: 'dorm',
    palette: P.dorm,
    suggestion: '观察',
    why: '这条只有情绪没有事实支撑，贴纸能逗笑人，但不构成可验证的机会。',
    links: [],
  },
  {
    id: 'army',
    name: '军训',
    moment: '操场边台阶，帽子下面压着一瓶',
    kind: '设计稿',
    sticker: {
      style: 'paper',
      line1: '军训第三天 靠它活',
      line2: '教官看不见',
      tag: '休息十分钟 喝完这瓶',
    },
    stage: 'court',
    palette: P.court,
    suggestion: '观察',
    why: '校园场景与品牌已有动作重叠，贴纸设计能做，但算不上新机会。',
    links: [],
  },
  {
    id: 'overtime',
    name: '加班',
    moment: '工位隔断上，瓶身贴着便利贴',
    kind: '设计稿',
    sticker: {
      style: 'print',
      line1: '今晚的班 明天再上',
      line2: '这瓶算加班费',
      tag: '行政部 冰箱自取',
    },
    stage: 'office',
    palette: P.office,
    suggestion: '观察',
    why: '加班是可乐和咖啡的地盘，冰红茶挤进去需要新说法，现在只有一句玩笑。',
    links: [],
  },
]

export const stageNames: Record<StageKind, string> = {
  fridge: '冷柜',
  shelf: '货架',
  desk: '课桌',
  court: '球场',
  night: '夜宵摊',
  camp: '营地',
  office: '办公区',
  dorm: '宿舍',
}
