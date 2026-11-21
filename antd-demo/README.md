# 冰红茶机会台

康师傅冰红茶的热梗机会判定台。一个梗一张判定卡，卡上给一个可执行动作，动作旁边是能点开的原文，卡底记放行人和回填结果。第三个视图把判定结果做成能转的 3D 瓶身贴纸模型，看一个梗贴到瓶身正面是什么样。页面上所有数据都是**示例数据**，标注为「示例数据，非实测投放」。

## 一、怎么跑

```
cd antd-demo
npm run dev      # 开发服务器，改代码自动刷新
npm run build    # 打包到 dist/
node server.mjs  # 静态服务，默认端口 19052，读 dist/
```

2026-11-20 实测：`npm run build` 成功；`node server.mjs` 起在 19052，首页与全部 assets 返回 HTTP 200，gzip 生效；外网 `http://49.232.197.22:19052/` 返回 200。改完前端只要重新 `npm run build`，正在跑的 server.mjs 会直接读到新的 dist，不用重启。

## 二、四个视图

1. 候选梗清单。四个梗的命中条数、站点数、最近命中与建议动作，顶部四个数字是自己算出来的，不写死。点任意一行进判定卡，手机上不显示操作列，靠点行进入。
2. 判定卡。结论带给建议动作、窗口档位、置信、放行状态；四项判定逐项给值、依据和原文链接；两项只能靠人的留在卡片上由人点选；底部是验收阈值与回填。
3. 包装整活台。把判定结果做成 3D 瓶身贴纸模型，14 个场景里 8 个挂在检索到的梗上，可拖动旋转、左右切换，贴纸做法有白纸打印、手写、胶带、黑条涂改、热敏标签、手绘表情六种。
4. 方法与边界。写清六项判定怎么算、裁决规则、每梗每日的检索动作、这一版没做什么。

## 三、数据从哪来

1. 判定卡里的每一条依据都来自腾讯云元宝搜索 `MCP` 通道的实际返回，2026-11-20 实检。脚本在 `../tools/mcp_search.py`。
2. 仓库自带的 `scripts/yuanbao_search.py` 走 HTTP 的 `/SearchPro`，同一把密钥返回 `UnauthorizedOperation`；`/Mcp` 的 JSON-RPC 正常。所以本项目只走 MCP。
3. 实测细节记在 `../实测记录-2026-11-20.md`，包括内容农场重发老梗、单日覆盖只有 1 条、竞品同名混淆三条。

## 四、判定怎么算

代码算票，模型只把摘要读成标签，人做放行。裁决规则是：

1. 内容响应，讨论仍在持续、场景挂靠、风险可接受三项通过即可。
2. 现有产品改造，再加窗口覆盖交付周期、增量价值不是存量重复。
3. 新品探索，再加窗口覆盖 180 天、该梗二次升温或跨季复现。
4. 任一项未知，不进自动建议，走人工放行并记录放行人。

窗口档位在没有量级数据源之前恒为未知，所以改造与新品全走人工。示例里四个梗没有一个四项全绿，清单页把这件事写在顶部说明里，不构造机会。

## 五、无障碍与系统设置

1. 深色模式。跟随系统 `prefers-color-scheme`，页头有按钮可手动覆盖，选择记在 `localStorage` 的 `iced-tea-theme`。`index.html` 里有一段首帧脚本，先定 `data-theme` 再渲染，避免先亮后暗的闪烁。
2. 系统文字缩放。`index.html` 带 `meta name="text-scale" content="scale"`，页面字号与间距用 `rem`，根字号不写死，交给浏览器按系统设置缩放。
3. 键盘可达。页面第一个焦点是「跳到主内容」。列表与判定卡切换后，焦点分别落到 `#card-heading` 或列表标题，读屏用户不会丢上下文。
4. 手机导航。窄屏是抽屉，带遮罩、Escape 关闭、打开时锁页面滚动、把主内容设为 `inert`、关闭后焦点回到菜单按钮，按钮带 `aria-expanded` 与 `aria-controls`。
5. 视图切换。列表进判定卡用 View Transitions 做标题的位移动画，系统开了「减少动态效果」时不播放。
6. 表单校验。必填项用 antd Form 规则校验，错误提示带 `aria-describedby` 与 `aria-invalid`，同时写入 `aria-live` 区域播报。
7. 表格。桌面上是可滚动区域 `role="region"`，带 `aria-label` 与 `tabindex="0"`；手机上换成带标签的列表，不再横向滚动。
8. 对比度。正文与次要文字对背景的对比度都在 4.5 以上，浅色与深色两套各自算过。
9. 包装整活台。场景列表是 `role="listbox"`，上下方向键切换、Home 与 End 跳首尾，切换结果写入 `aria-live`；瓶子用拖拽旋转，画布标为 `role="img"` 并带当前场景的文字描述，系统开了「减少动态效果」时停止自动旋转与贴纸弹动。
10. WebGL 不可用时。`createStage` 会在拿不到上下文时抛错，页面其余三块仍然可用；这一版的渲染没有加兜底图。

## 六、交互与存储

1. 放行、否决会记下放行人名字和理由。
2. 增量价值在新场景、新客、存量重复、未知之间四选一。
3. 回填要填实际结果、勾选同期其他变化（促销、天气、铺货、竞品动作）、给结论。勾选竞争解释是为了让判断能被证伪。
4. 上面三样存在浏览器 localStorage，键名 `iced-tea-console-v1`，刷新不丢。换浏览器或清缓存会重置。

## 七、已知限制

1. antd 6 里弹窗内容节点是 `.ant-modal-container`，不再是 `.ant-modal-content`，写自动化脚本要按新名字找。
2. 构建体积：antd 约 972 kB（gzip 309 kB），three 约 556 kB（gzip 139 kB），业务代码约 70 kB（gzip 24 kB）。构建会提示超过 900 kB，演示场景可接受，要优化就把包装整活台拆成动态导入。
3. 页面不含后端，判定数字来自 `src/data/memes.ts`，贴纸场景来自 `src/data/stickerScenes.ts`，瓶身尺寸来自 `src/data/bottle-profile.json`。换真实数据改这三个文件。
4. 示例数据只覆盖 4 个梗、1 个站点维度，不代表康师傅真实决策。
5. 瓶身、瓶盖、标签是通用 500 mL PET 瓶比例，不是康师傅官方图纸。贴纸文案与配色都是设计稿，14 个场景里 6 个没有检索出处。
6. 3D 场景在无 GPU 的服务器上靠 SwiftShader 软件渲染，实测能出图但帧率没有测。

## 八、这次按哪些外部规范改的

改动参照 Google Chrome 团队开源、由 Chrome、Edge、Firefox、MDN 联合维护的 Modern Web Guidance。仓库通过 GitCode 镜像拉到 `/tmp/mwg`（GitHub 直连被中途断开），技能说明装到 `~/.pi/agent/skills/modern-web-guidance/`。用到的指南有 `dark-mode`、`respect-os-text-scale`、`same-document-transitions`、`navigation-drawer`、`responsive-table`。

## 九、目录

```
antd-demo/
├── src/
│   ├── App.tsx                # 四个视图与交互
│   ├── components/StickerBoard.tsx  # 包装整活台：3D 舞台加场景列表
│   ├── scene/bottleStage.ts   # three 场景：瓶身、液体、标签、贴纸、背景插画
│   ├── data/memes.ts          # 判定数据、规则文案、查询模板
│   ├── data/stickerScenes.ts  # 14 个贴纸场景与出处
│   ├── data/bottle-profile.json  # build123d 算出的瓶身轮廓
│   ├── index.css              # 设计变量与局部排版
│   └── main.tsx               # antd 主题与语言
├── server.mjs                 # 静态服务，19052
└── dist/                      # 构建产物

../cad/
├── bottle.py                  # build123d 脚本：旋转成瓶，算容量与液面
└── out/
    ├── profile.json           # 轮廓点列，前端直接读
    ├── bottle.step            # 可继续加工的三维文件
    ├── bottle.stl             # 打印用网格
    └── 尺寸.md                # 成形尺寸表
```

## 十、瓶身怎么来的

1. `cad/bottle.py` 用 build123d 画外轮廓和壁厚，绕 Z 轴旋转成实体，再布尔减去内腔，切掉瓶口延长段。
2. 容量不是估的：代码按内腔剖面点逐层旋转求体积，二分找出装 500 mL 时的液面高度。当前结果：内腔到瓶口平面 519.9 mL，500 mL 液面在 160.35 mm，标签带 51 到 126 mm，实体体积 32.9 cm³。
3. 前端只读 `profile.json` 的点列生成 `LatheGeometry`，没有另填尺寸。改瓶型只需要重跑一遍脚本并覆盖 `src/data/bottle-profile.json`。
4. 脚本运行环境：`python3 -m pip install build123d`，另需 `libgl1` 与 `libglu1-mesa`。
