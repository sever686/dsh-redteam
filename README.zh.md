# dsh-redteam

[English](README.md) | 中文

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）Web GUI 的红队作战控制台插件：侧边栏底部触发器 + 全屏控制台（仪表盘 / 目标 / 任务 / 会话与植入体 / 凭据 / 报告六个分区）、可扩展的分区槽位、基于文件的数据泵通道，以及配套的 `redteam` CLI。本仓库是 monorepo 中 `packages/client/ui-redteam` 工作区包的独立快照。

## 特性

- **零侵入组合** —— 注册进侧边栏的 `sidebar.footer.action` 座位与布局的可加装 `shell.overlay` 层；关闭时渲染为空，绝不遮挡下层应用。
- **内容可扩展** —— 控制台声明 `redteam.section` 槽位；六个内置分区与第三方分区注册方式完全一致，新增分区只需一次 `ctx.slots.inject('redteam.section', ...)`。
- **数据泵** —— 每 5 秒轮询同源 `/redteam-data.json`（前端 dist 根目录下的文件），逐成员校验载荷，失败时保留上一次成功数据集；坏数据永远不上屏。
- **暗色终端美学** —— 全部基于 `--dsw-*` 语义令牌（无字面色值）、严重级别/状态的颜色+文字双重编码、等宽字段、zh/en 双语词典。
- **`redteam` CLI** —— 零依赖 bin：`init` 生成与契约同源的空白模板，`publish` 校验并把数据集复制进 dist 根目录。

## 安装

包自带自启用的 bundle patch，发布后一条命令启用：

```sh
dsh plugin --profile web add @deepseek-ai/dsh-client-ui-redteam
# 重启 dsh web —— 侧边栏底部出现「红队控制台」入口
```

替代路径：每次启动传 `dsh web --patch <路径>/redteam.patch.yml`，或把该行一次性追加到 `$DSH_HOME/cordis.patch.yml`。

安装前提：peer 包（`@deepseek-ai/dsh-client-runtime`、`-locale`、`-ui-layout`、`-ui-sidebar`、`-ui-primitives`、`-ui-slots`、`@deepseek-ai/cordis`、`@deepseek-ai/dsh-invariants`）需可解析——由 monorepo 以转换后的版本范围发布，或由 monorepo 本身满足。本仓库已提交构建产物 `lib/`，git/文件方式安装无需构建。

## 数据泵

```sh
redteam init                          # redteam-data.json —— 空数据集模板
# ... 扫描流水线填充文件（targets / jobs / sessions / credentials / activity / coverage）
redteam merge <fragment.json> redteam-data.json   # 工具结果增量 upsert（按 id；coverage 按 tactic；activity 最新在前）
redteam publish redteam-data.json <dsh检出版本>/apps/web/dist
```

控制台在一个轮询周期（5 秒）内拾取文件。注意：`build:web` 会重写 dist 并抹掉已发布文件——前端构建后需重新 `publish`。载荷形状为 `RedteamDataset`（[src/client/demo.ts](src/client/demo.ts)）；行类型是生产契约，将来 `redteam` Host Remote 域按同形填充即可，分区零改动。

### Agent 回路（harness 原生编排）

在 dsh 里的自然回路是：人下命令 → agent 自主选工具（如 Kali/Burp MCP）执行 → 结果 merge/publish 进控制台。仓库附带的 [skill](skills/redteam-console-sync/SKILL.md) 固化了这套流程（范围确认、数据集 schema、merge 语义、发布路径）；复制到 `$DSH_HOME/skills/` 后即进入 agent 的 skill 目录，按需加载。

## 构建与测试（monorepo 上下文）

`src/` 与 monorepo 包逐字节一致，在 monorepo 内构建：

```sh
# 在 deepseek-harness 内，把本目录链接为 packages/client/ui-redteam：
pnpm install
pnpm exec tsc -b packages/client/ui-redteam/tsconfig.json
pnpm --filter @deepseek-ai/dsh-client-ui-redteam bundle   # lib/index.js、lib/invariant.js、lib/client.js、lib/bin/redteam.js
pnpm exec vitest run packages/client/ui-redteam
pnpm exec oxlint packages/client/ui-redteam
```

构建依赖 monorepo 的共享 tsdown 预设（`packages/client/tsdown.client.ts`）与 tsconfig 基座，刻意不随本仓库分发——已提交的 `lib/` 产物即独立消费路径。

## 扩展契约

```ts
ctx.slots.inject('redteam.section', () => ctx.slots.register({
  name: 'redteam.section',
  id: 'my-domain',            // 导航 key
  order: 100,                 // 导航位置
  label: () => t('my.nav'),   // 跟随语言的 thunk
  locale: 'my-namespace',
}, MySectionComponent))
```

控制台把账本条目投影（按 slots 版本 × locale 版本缓存）成导航栏，并用 `only` 过滤渲染当前分区。

## 已知限制

- 数据泵的文件通道是临时方案；生产路径是 `redteam` Host Remote 域（SSE/推送）——替换时分区无需改动。
- 暂无交互式 C2 终端（会话分区只是清单）；报告生成未接线。
- 测试与构建需要 monorepo 上下文（见上）。

## 许可证

MIT。派生自 [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)（MIT）。
