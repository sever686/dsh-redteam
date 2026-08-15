---
name: redteam-console-sync
description: 红队作战回路的同步操作手册——扫描/枚举等工具执行后，把结构化结果合并并发布到红队控制台数据泵文件的标准流程。
---

# 红队控制台同步手册

目标：工具（Kali/Burp MCP）执行后的真实结果，5 秒内出现在 DSH Web GUI 的红队控制台。

## 数据流

```
Kali/Burp MCP 执行
   ↓ 解析输出
正本 C:\Users\jie\redteam-data.json（RedteamDataset 形状，增量合并）
   ↓ redteam publish
D:\27656\Documents\deepseek-harness\apps\web\dist\redteam-data.json
   ↓ 插件每 5s 轮询（校验失败保留上次数据）
红队控制台六个分区
```

## 数据集形状（RedteamDataset）

六个数组，行类型见 `C:\Users\jie\dsh-redteam\src\client\demo.ts`：

- `targets`: `{ id, address, kind, os, ports, rights, state, inScope, owner }`
  - `kind` ∈ `targets.kind.host|domain|web|cloud`；`state` ∈ `targets.state.queued|recon|breached|dropped`；`rights` ∈ `targets.rights.none|user|admin|system|domain-admin`（词典 key，界面按当前语言渲染）
- `jobs`: `{ id, task, target, progress, state, elapsed, owner }`；`task` 用 `activity.action.*` key；`state` ∈ `jobs.state.queued|running|success|failed|cancelled`
- `sessions`: `{ id, implant, host, user, rights, os, heartbeat, heartbeatTone, uptime, type }`；`heartbeat` ∈ `sessions.heartbeat.ok|late|lost`，`heartbeatTone` 与之一致
- `credentials`: `{ id, username, secret, type, source, hosts, updated }`；`type` ∈ `creds.type.ntlm|kerberoast|plain|ticket`——写入前确认脱敏策略
- `activity`: `{ id, time, severity, action, target }`；`severity` ∈ `critical|high|medium|low|info`；`action` ∈ `activity.action.scan|breach|cred|recon|report`
- `coverage`: `{ tactic, techniques, count }`；`tactic` 用 `reports.tactic.*` 键（14 个战术阶段）

## 标准流程

1. **范围确认**：目标在授权范围内（当前：192.168.98.0/24、Kali 本机 127.0.0.1/192.168.98.131）。范围外拒绝。
2. **执行工具**：Kali MCP 的 `nmap_scan`/`gobuster_scan`/`sqlmap_scan` 等，或 `execute_command` 任意工具。
3. **解析 + 增量合并**（保留既有数据，勿全量覆盖）：
   ```powershell
   node D:\27656\Documents\deepseek-harness\packages\client\ui-redteam\lib\bin\redteam.js merge <片段.json> C:\Users\jie\redteam-data.json
   ```
   `merge` 语义：targets/jobs/sessions/credentials 按 `id` upsert；activity 按 `id` upsert 后按 id 倒序；coverage 按 `tactic` upsert。片段可只含部分数组（缺省键保留正本原值）。
4. **发布**：
   ```powershell
   node D:\27656\Documents\deepseek-harness\packages\client\ui-redteam\lib\bin\redteam.js publish C:\Users\jie\redteam-data.json D:\27656\Documents\deepseek-harness\apps\web\dist
   ```
5. **反馈用户**：报告发现摘要 + 说明控制台已同步（≤5s）。
6. **例外**：`pnpm run build:web` 会抹掉 dist 中的发布文件，之后重新 publish。

## 注意事项

- 状态字段务必用词典 key 字面量（上表枚举），界面才能正确着色与本地化。
- `activity.time` 用本地时间 `HH:mm`；`activity.id` 用自增数字（其余数组的 `id` 用字符串标识即可）。
- 坏数据不会上屏（插件逐成员校验），但发布前仍应自查 JSON 合法。
