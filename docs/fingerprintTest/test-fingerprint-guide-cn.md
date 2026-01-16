# 指纹伪装功能测试指南

## 功能概述

Pager 应用的指纹伪装功能已经实现并集成到 WebView 容器中。该功能支持三种模式：

- **基础模式 (Basic)**: 只修改基本指纹信息（屏幕分辨率、时区、语言）
- **平衡模式 (Balanced)**: 修改基本指纹 + Canvas + 硬件信息（默认模式）
- **高级模式 (Advanced)**: 全面修改所有指纹信息（包括 WebGL 和音频指纹）

## 测试步骤

### 1. 启动应用并添加网站

1. 启动 Pager 应用
2. 添加一个新网站（例如 https://browserleaks.com/webgl）
3. 在网站设置中启用指纹伪装
4. 选择不同的伪装模式

### 2. 验证指纹伪装效果

在 WebView 中打开网站后，按 F12 打开开发者工具，在控制台中运行测试脚本：

```javascript
// 加载测试脚本
fetch('file:///e:/System/Documents/GitHub/pager/test-fingerprint.js')
  .then((response) => response.text())
  .then((code) => eval(code))
  .catch(() => {
    // 如果无法加载文件，直接复制粘贴脚本内容到控制台
    console.log('请手动复制 test-fingerprint.js 的内容到控制台运行')
  })
```

### 3. 检查不同模式的效果

#### 基础模式测试

- ✅ User-Agent 应该被修改
- ✅ 屏幕分辨率应该是随机值
- ✅ 时区应该是随机值
- ✅ 语言设置应该是随机组合
- ❌ Canvas 指纹应该保持原始值
- ❌ WebGL 指纹应该保持原始值
- ❌ 硬件信息应该保持原始值

#### 平衡模式测试

- ✅ 包含基础模式的所有功能
- ✅ Canvas 指纹应该被修改
- ✅ 硬件信息（CPU 核心数、内存等）应该是随机值
- ❌ WebGL 指纹应该保持原始值
- ❌ 音频指纹应该保持原始值

#### 高级模式测试

- ✅ 包含平衡模式的所有功能
- ✅ WebGL 指纹应该被修改
- ✅ 音频指纹应该被修改

### 4. 验证指纹属性保护

检查以下属性是否被正确保护（不可写、不可配置）：

```javascript
// 检查属性描述符
const userAgentDesc = Object.getOwnPropertyDescriptor(navigator, 'userAgent')
console.log('User-Agent writable:', userAgentDesc?.writable) // 应该是 false
console.log('User-Agent configurable:', userAgentDesc?.configurable) // 应该是 false
```

## 技术实现细节

### 1. 指纹生成服务 (`src/main/services/fingerprint.ts`)

- 使用 `fingerprint-generator` 库生成基础指纹
- 根据模式添加不同的随机化参数
- 实现指纹缓存机制（24小时有效期）
- 支持指纹刷新和缓存清理

### 2. WebView 集成 (`src/renderer/components/features/WebViewContainer.tsx`)

- 在 DOM 准备就绪后自动应用指纹伪装
- 通过 JavaScript 注入方式修改浏览器属性
- 支持网站级别的指纹设置

### 3. IPC 通信 (`src/main/ipc/enhancedHandlers.ts`)

- 提供指纹生成、应用、刷新等 API
- 支持缓存统计和管理
- 错误处理和回退机制

## 预期结果

### 成功指标

1. **指纹生成**: 不同模式生成不同复杂度的指纹
2. **属性保护**: 修改的属性不可被网站检测到修改痕迹
3. **缓存机制**: 相同配置下复用指纹，提高性能
4. **网站兼容性**: 指纹伪装不影响网站正常功能

### 常见问题排查

1. **指纹未生效**: 检查控制台是否有错误日志
2. **网站功能异常**: 尝试降低指纹伪装模式（从高级改为平衡）
3. **性能问题**: 检查指纹缓存是否正常工作

## 测试网站推荐

- https://browserleaks.com/webgl - WebGL 指纹检测
- https://fingerprintjs.github.io/fingerprintjs/ - 综合指纹检测
- https://abrahamjuliot.github.io/creepjs/ - 详细指纹分析
- https://www.deviceinfo.me - 设备信息检测

## 注意事项

1. 指纹伪装主要针对 JavaScript 检测，无法完全防止网络层面的指纹追踪
2. 某些网站可能检测到指纹不一致性，需要平衡隐私保护和功能兼容性
3. 建议根据实际需求选择合适的伪装模式
