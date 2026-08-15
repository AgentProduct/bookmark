---
name: bookmark-project-conventions
description: 在 bookmark（书签导航）项目里写代码、改组件、加功能时必读。这个项目有若干反直觉的约定（运行时配置注入、双套资源引用、Vite 而非 Umi、锁屏密码机制、拖拽与动画的特定实现），踩中任一就会引入隐蔽 bug 或破坏既有行为。
---

# bookmark 项目开发约定

本 skill 记录在 `D:\fep\bookmark` 项目工作时**必须注意**的非常规约定。这些点大多反直觉或与全局 CLAUDE.md 冲突，忽略会导致隐蔽 bug。

## 1. 这是 Vite 项目，不是 Umi

全局 CLAUDE.md 描述的是 Umi Max 技术栈与目录结构（`config/`、`src/commonComponents` submodule、`src/services` 等）。**本项目不适用**。

- 实际技术栈：**Vite 7 + React 19 + TypeScript**（见 `package.json`）。
- 没有 `src/commonComponents` submodule，没有 `config/` 目录，没有 Umi 的 `.umirc`。
- 命令：`npm run dev` / `npm run build`（build = `tsc -b && vite build`，会先做类型检查）。
- 不要按 CLAUDE.md 的 Umi 目录结构去创建/查找文件。本项目结构见 `doc/重构说明-App组件化.md`。

## 2. `config` 是运行时注入的全局变量，不是 import

应用的所有书签数据、分类图标、锁屏背景都来自 `config` 全局对象。

- 来源：`public/config.js` 在运行时挂到 `window`（或全局作用域）。
- 类型：由 `src/global.d.ts` 统一声明 `declare const config: any`，所有组件直接用 `config?.xxx`，**不要 import，也不要在组件里重复 declare**。
- 要改书签/分类数据 → 编辑 `public/config.js`，而不是改 React 代码。
- 读 `config` 字段务必加可选链 `config?.`，因为首次渲染前它可能未注入。

## 3. 资源引用有两套方式，不能混用

- `src/assets/` 下的资源（`bg.webp`、`default-favicon.svg`、`google-favicon.ico`、`youdao-favicon.png`）：**必须用 import** 引入，由 Vite 处理哈希。
  ```ts
  import lockBg from "../../assets/bg.webp";
  ```
- `public/icons/` 下的图标（大量 favicon，如 `chatgpt-eex17e9e.ico`、`grok-favicon-light.png`、`gemini-favicon.svg`）：用**绝对路径字符串**引用：
  ```ts
  import chatgptIcon from "/public/icons/chatgpt-eex17e9e.ico";
  ```
- 新增图标时先确认放在哪个目录，再选对应引用方式。

## 4. 锁屏密码机制

- 默认密码：`123456`（localStorage 无 `app_password` 时使用）。
- 状态键：`app_locked`（`"true"/"false"`，默认锁定）、`app_password`。
- 默认锁定：初始 `isLocked` 在 `localStorage.app_locked` 为 `null` 或 `"true"` 时均为锁定态。
- 逻辑封装在 `src/hooks/useLock.ts`，UI 在 `src/components/LockScreen/`。改动锁屏行为去这两处。

## 5. React StrictMode 下的重复调用

`main.tsx` 用了 `<StrictMode>`，开发模式下 effect 会执行两次。GitHub 侧边栏用 `hasFetchedHotRepos` ref 保证初始热门仓库只请求一次。新增带副作用的初始化逻辑时，注意同样的双调用问题。

## 6. 弹框拖拽与定位

- 翻译弹框、AI 弹框可拖拽，逻辑统一在 `src/hooks/useDraggable.ts`。
- 实现方式：弹框容器用 **fixed 定位**，拖拽时**直接操作 DOM** 的 `style.left/top`（带视口边界裁剪 + 边缘 8px 最小间距），不是 React state 驱动。
- **居中**：传 `{ centerOnMount: true, visible }`，弹框每次显示时由 `useLayoutEffect` 计算上下左右居中的 `left/top`，在浏览器绘制前定位，避免首帧闪烁。
- **必须同时传 `visible`**：弹框用 `if(!visible) return null`，组件实例始终存在，hooks 一直在跑。若居中 effect 只依赖 `modalRef`（稳定引用）和 `centerOnMount`（常量），visible 从 false→true 时两者都不变，effect 不重跑，弹框会停在 CSS 默认 `left/top` 永远不居中。把 `visible` 纳入依赖才能在弹框出现时触发居中。
- **响应式尺寸**：`.translate-modal` 宽高用 `min()`（`min(1600px, calc(100vw - 80px))` / `min(960px, calc(100vh - 80px))`），大屏不超过 1600x960，小屏自动收缩并四周保留约 40px 边距。**不要改回固定 px**，也不要用 `transform: translate()` 居中（会与拖拽的 left/top 冲突）。
- 新增可拖拽弹框：`const modalRef = useRef(null); const { onDragStart } = useDraggable(modalRef, { centerOnMount: true, visible });`，把 `onDragStart` 绑到拖拽手柄（header）的 `onMouseDown`。

## 7. d3 背景动画

- 在 `src/components/BackgroundAnimation/`，依赖空数组的 `useEffect` 内一次性创建。
- 三波浪 + 120 粒子，`requestAnimationFrame` 循环，`ResizeObserver` 跟随内容容器尺寸。
- **必须保存 rAF id 并在 cleanup 中 `cancelAnimationFrame`**，否则组件卸载 / StrictMode 重挂时旧动画循环继续运行，造成内存与资源泄漏。
- 接收父级 `contentRef` 作为 prop（用于读取尺寸），自身持有 svg ref。

## 8. 不要改 CSS 类名 / DOM 结构

`src/App.css` 的样式与组件 DOM 结构强耦合。重构时**保持所有 className 和层级不变**，否则样式会错乱。纯结构重构应做到功能、样式、行为三不变。

## 9. 提交规范

按全局 CLAUDE.md：改动**不要自行 git commit**，由用户 review 后手动提交。

## 相关文档
- `doc/重构说明-App组件化.md`：组件拆分细节与各文件职责对照。
