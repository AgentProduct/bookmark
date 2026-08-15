# App.tsx 组件化重构说明

> 重构日期：2026/07/02
> 范围：将单文件 `src/App.tsx`（约 1165 行）拆分为多组件结构
> 原则：纯结构重构，**保持所有功能、样式、交互行为完全不变**

---

## 一、重构背景

原 `App.tsx` 把整个应用的全部逻辑堆在一个文件里，包含 11 个独立逻辑块：锁屏、分类侧边栏、搜索栏组、书签卡片网格、d3 背景动画、GitHub 仓库侧边栏、翻译弹框、AI 弹框，以及重复的拖拽逻辑。文件臃肿、职责混杂、难以维护。

## 二、重构后目录结构

```
src/
├─ types/index.ts                      # 类型定义：GitHubRepo / Bookmark / Wave / Particle
├─ constants/index.ts                  # 常量：languageColors / getCategoryIcon
├─ global.d.ts                         # 全局 config 类型声明（运行时由 public/config.js 注入）
├─ hooks/
│  ├─ useDraggable.ts                  # 通用拖拽 hook（翻译/AI 弹框复用）
│  └─ useLock.ts                       # 锁屏状态管理（localStorage 同步）
├─ components/
│  ├─ BackgroundAnimation/             # d3 波浪 + 粒子背景动画
│  ├─ LockScreen/                      # 锁屏界面（密码输入 UI 自管理）
│  ├─ CategorySidebar/                 # 左侧分类列表 + 头像 + 锁定按钮
│  ├─ SearchBarGroup/                  # 顶部搜索栏组（书签/百度/Google + 工具按钮）
│  ├─ BookmarkCard/                    # 单个书签卡片（memo）
│  ├─ BookmarkGrid/                    # 书签网格容器（紧凑模式 + 淡入动画）
│  ├─ GitHubRepoSidebar/               # GitHub 仓库侧边栏（搜索/滚动加载）
│  ├─ TranslateModal/                  # 翻译弹框（可拖拽）
│  └─ AIModal/                         # AI 助手弹框（可拖拽）
└─ App.tsx                             # 仅做布局编排与顶层状态串联（约 130 行）
```

## 三、各文件职责对照

| 组件 / 模块 | 职责 | 对应原 App.tsx 行号 |
|-------------|------|---------------------|
| `types/index.ts` | 所有 interface 集中定义 | 16-52 |
| `constants/index.ts` | 语言颜色映射、分类图标工具 | 57-60, 79-88 |
| `useDraggable` | 弹框拖拽（mousedown/move/up + 视口边界） | 538-624（两份合并） |
| `useLock` | isLocked 状态 + lock/unlock + localStorage | 434-459 |
| `BackgroundAnimation` | d3 三波浪 + 120 粒子循环动画 | 633-760 |
| `LockScreen` | 锁屏密码输入、错误提示 | 765-804 |
| `CategorySidebar` | 分类列表渲染、数量统计、头像、锁定入口 | 808-861 |
| `SearchBarGroup` | 书签搜索 + 百度/Google 跳转 + 翻译/AI 入口 + 紧凑切换 | 868-981 |
| `BookmarkCard` | 单卡：favicon、分类标签、访问链接、点击动画 | 333-404 |
| `BookmarkGrid` | 网格容器 + compact 切换 + fade-in 动画 | 983-992 |
| `GitHubRepoSidebar` | 热门仓库随机展示、关键字搜索、下拉加载更多 | 63-331 |
| `TranslateModal` | 百度/有道 iframe、谷歌跳转、可拖拽 | 1000-1055 |
| `AIModal` | 豆包/Kimi/元宝 iframe、其余跳转、可拖拽 | 1058-1159 |
| `App.tsx` | 组合所有组件、持有 activeCategory/searchTerm/弹框显隐等顶层状态 | — |

## 四、重构中做的改进

### 1. 消除重复拖拽代码
翻译弹框和 AI 弹框原本各写一套近乎相同的拖拽逻辑（共约 140 行）。抽取为 `useDraggable(modalRef)` hook，返回 `{ onDragStart }`，两处复用。

### 2. 状态内聚
- 锁屏：状态 + localStorage 逻辑收敛到 `useLock`，密码输入 UI 状态下沉到 `LockScreen` 内部。
- 百度/Google 搜索框：原本是 App 的顶层 state，下沉到 `SearchBarGroup` 自管理（它们只做 `window.open` 跳转，无需上抛）。

### 3. 配置驱动渲染
`TranslateModal` / `AIModal` 原本几十个手写的 `<button>`，改为渠道数据数组 + `map` 渲染。后续增删渠道只需改数据，不再复制粘贴 JSX。`iframe` 内嵌与 `external` 跳转两种类型用字段区分。

### 4. 清理死代码
原 `translateIconRef` / `aiIconRef` 声明并绑定到按钮后，从未在任何地方被读取，属于遗留死代码，已删除。

### 5. 全局类型声明统一
`declare const config` 原本散落在 App.tsx。新增 `src/global.d.ts` 集中声明全局 `config` 变量，所有组件直接可用，无需重复 declare。

## 五、行为一致性保证

以下行为均**原样保留**，未做任何改变：

- 所有 CSS 类名、DOM 结构层级
- 搜索 300ms 防抖、分类切换/搜索的 100ms 淡入动画、卡片点击 150ms 反馈
- GitHub 滚动距底 50px 触发加载更多、`hasFetchedHotRepos` ref 防 StrictMode 重复请求
- 锁屏默认密码 `123456`、初始从 localStorage 读取
- d3 动画的 ResizeObserver、requestAnimationFrame 循环、边界检测
- 资源引用方式（src/assets 走 import，/public/icons 走绝对路径）

## 六、验证

- `npm run build`：通过，`tsc -b` 类型检查零错误，`vite build` 成功打包。
- 仅剩原有的 chunk 体积警告（>500kB，与本次重构无关）。
- 建议手动验证交互：锁屏解锁、分类切换、书签/百度/Google 搜索、翻译/AI 弹框拖拽、GitHub 列表滚动加载、紧凑视图切换。

---

## 七、2026/07/02 质量修复与弹框适配

在纯结构重构基础上，修复若干 bug 并改进弹框适配：

1. 书签 key 与 URL 容错
   - App 读取书签时用 useMemo 按完整列表位置索引补稳定 id，BookmarkGrid 的 key 由数组索引改为 b.id，分类过滤 / 搜索时卡片不再错位，BookmarkCard 的 memo 恢复有效。
   - BookmarkCard 对 new URL(url) 加 try/catch，单条非法 url 不再导致整个网格白屏；favicon onError 改用 dataset.fallback 标记替代失效的 src 比对，真正防止无限重试。

2. 锁屏默认背景
   - LockScreen 无条件渲染背景图，config.lockBackground 为假时回退到内置 bg.webp，默认锁屏不再只剩渐变遮罩。

3. d3 动画泄漏修复
   - BackgroundAnimation 保存 requestAnimationFrame 返回的 id，cleanup 中 cancelAnimationFrame 取消，卸载 / StrictMode 重挂不再泄漏旧循环。

4. 网格动画触发方式
   - App 移除在 effect 内同步 setState 的写法（react-hooks/set-state-in-effect），改为 handleSelectCategory 回调内同时切换分类与触发动画；triggerAnimation 改用 useRef 管理定时器，快速输入不再堆积多个 setTimeout。

5. 弹框响应式与居中
   - .translate-modal 宽高由固定 1600x960 改为 min(1600px, calc(100vw - 80px)) / min(960px, calc(100vh - 80px))，小屏自动收缩并保留边距。
   - useDraggable 新增 centerOnMount 选项，弹框每次打开由 useLayoutEffect 居中定位；删除原 768px 媒体查询中与拖拽冲突的 transform: translate() 居中；拖拽边界增加 8px 最小边缘间距。
