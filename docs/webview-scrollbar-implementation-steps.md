# 网页区滚动条策略

## 当前决策

右侧 `webview` 内部页面不再替换滚动条，保持 Chromium / 网站自身的原生表现。

## 保留范围

1. 应用自身可控区域继续使用自绘滚动条：
   - 侧边栏
   - 设置页
   - 扩展管理相关弹窗

2. `webview` 内部只保留必要脚本注入：
   - 用户脚本注入
   - GM polyfill
   - 鼠标侧键前进/后退
   - 指纹伪装

3. `webview` 内部不再注入：
   - `::-webkit-scrollbar` 样式
   - OverlayScrollbars 脚本
   - OverlayScrollbars CSS
   - 页面导航后的滚动条补注入逻辑

## 原因

网页内容属于第三方页面上下文。强制替换会带来闪烁、站点样式冲突、iframe/Shadow DOM 覆盖不完整，以及和原生滚动行为不一致的问题。

## 验收标准

1. 浏览 GitHub 等长页面时，右侧页面滚动条保持原生样式。
2. 页面加载过程中不再出现从原生滚动条切换到 Pager 自定义滚动条的过程。
3. 左侧边栏、设置页、扩展页仍保持当前悬浮透明、不占位的自绘滚动条。
4. `WebViewContainer` 不再依赖 `overlayscrollbars` 或 `src/renderer/vendor`。
