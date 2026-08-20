window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-redteam",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_ui_slots = require("@deepseek-ai/dsh-client-ui-slots");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		//#region src/client/demo.ts
		/** Live activity: empty until the host activity stream is wired. */
		const ACTIVITY = [];
		/** Target inventory: empty until the targets Remote / scope engine feeds it. */
		const TARGETS = [];
		/** Job queue: empty until the jobs Remote feeds it. */
		const JOBS = [];
		/** Implant/session inventory: empty until the sessions projection feeds it. */
		const SESSIONS = [];
		/** Credential vault: empty until the credentials Remote feeds it. */
		const CREDENTIALS = [];
		/** ATT&CK coverage: the tactic template is structure; technique rows fill from reports. */
		const COVERAGE = [
			{
				tactic: "reports.tactic.recon",
				techniques: "—",
				count: 0
			},
			{
				tactic: "reports.tactic.resource",
				techniques: "—",
				count: 0
			},
			{
				tactic: "reports.tactic.initial",
				techniques: "—",
				count: 0
			},
			{
				tactic: "reports.tactic.execution",
				techniques: "—",
				count: 0
			},
			{
				tactic: "reports.tactic.persistence",
				techniques: "—",
				count: 0
			},
			{
				tactic: "reports.tactic.privilege",
				techniques: "—",
				count: 0
			},
			{
				tactic: "reports.tactic.defense",
				techniques: "—",
				count: 0
			},
			{
				tactic: "reports.tactic.credential",
				techniques: "—",
				count: 0
			},
			{
				tactic: "reports.tactic.discovery",
				techniques: "—",
				count: 0
			},
			{
				tactic: "reports.tactic.lateral",
				techniques: "—",
				count: 0
			},
			{
				tactic: "reports.tactic.collection",
				techniques: "—",
				count: 0
			},
			{
				tactic: "reports.tactic.c2",
				techniques: "—",
				count: 0
			},
			{
				tactic: "reports.tactic.exfil",
				techniques: "—",
				count: 0
			},
			{
				tactic: "reports.tactic.impact",
				techniques: "—",
				count: 0
			}
		];
		/** Console status-bar facts: zero until host telemetry arrives. */
		const CONSOLE_STATUS = {
			queue: 0,
			sessions: 0
		};
		/** The shipped empty dataset — the store's initial state until the pump lands. */
		const EMPTY_DATASET = {
			targets: TARGETS,
			jobs: JOBS,
			sessions: SESSIONS,
			credentials: CREDENTIALS,
			activity: ACTIVITY,
			coverage: COVERAGE
		};
		//#endregion
		//#region src/client/store.ts
		/**
		* Red-team console store: the shared viewing state between the sidebar-foot
		* trigger, the full-screen console entry, and every section entry. One handle
		* constructed in the apply world is mounted under ALL registrations (all are
		* root scope), so the trigger's `open`, the console's `close`/`selectSection`,
		* and the data pump's `setDataset` write the same instance — the sanctioned
		* cross-entry sharing path.
		*
		* The `dataset` member is the data-pump product (redteam-data.json served by
		* the frontend-static fallback); it lives here until a host Remote domain
		* replaces the file channel — then the pump writes the same action with
		* Remote-fetched rows and nothing downstream changes.
		*/
		/** The built-in id set, for narrowing projected entry ids at the nav site. */
		const REDTEAM_SECTION_IDS = [
			"dashboard",
			"targets",
			"jobs",
			"sessions",
			"credentials",
			"reports"
		];
		/** Narrow a projected entry id to a built-in section id. */
		function isRedteamSectionId(id) {
			return REDTEAM_SECTION_IDS.includes(id);
		}
		/**
		* Declares the console state and its write surface.
		* @returns the store handle (mount it under the trigger, console, and section entries).
		*/
		function createRedteamStore() {
			return (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					open: false,
					section: "dashboard",
					dataset: EMPTY_DATASET
				}),
				actions: {
					open: (d) => {
						d.open = true;
					},
					close: (d) => {
						d.open = false;
					},
					selectSection: (d, section) => {
						d.section = section;
					},
					setDataset: (d, dataset) => {
						d.dataset = dataset;
					},
					removeTarget: (d, id) => {
						const target = d.dataset.targets.find((row) => row.id === id);
						if (target === void 0) return;
						const address = target.address;
						d.dataset = {
							...d.dataset,
							targets: d.dataset.targets.filter((row) => row.id !== id),
							jobs: d.dataset.jobs.filter((row) => row.target !== address),
							sessions: d.dataset.sessions.filter((row) => row.host !== address),
							credentials: d.dataset.credentials.filter((row) => row.hosts !== address),
							activity: d.dataset.activity.filter((row) => row.target !== address)
						};
					},
					addTarget: (d, target) => {
						d.dataset = {
							...d.dataset,
							targets: [...d.dataset.targets, target]
						};
					}
				}
			});
		}
		//#endregion
		//#region src/client/pump.ts
		/** Served path of the pump file (dist-root static file, same origin). */
		const REDTEAM_DATA_URL = "/redteam-data.json";
		/** Poll cadence of the apply-world pump loop. */
		const REDTEAM_PUMP_INTERVAL_MS = 5e3;
		/** Member-by-member wire-shape guard: arrays of rows, nothing deeper. */
		function isDataset(value) {
			if (typeof value !== "object" || value === null) return false;
			const candidate = value;
			return Array.isArray(candidate.targets) && Array.isArray(candidate.jobs) && Array.isArray(candidate.sessions) && Array.isArray(candidate.credentials) && Array.isArray(candidate.activity) && Array.isArray(candidate.coverage);
		}
		/**
		* One pump instance owns the last-good-dataset memory.
		*/
		var RedteamDataPump = class {
			last;
			/**
			* Fetch and validate the current dataset.
			* @returns the parsed dataset, the last good one on failure, or undefined before any success.
			*/
			async fetchDataset() {
				try {
					const response = await fetch(REDTEAM_DATA_URL, { cache: "no-store" });
					if (!response.ok) return this.last;
					const data = await response.json();
					if (!isDataset(data)) return this.last;
					this.last = data;
					return data;
				} catch {
					return this.last;
				}
			}
		};
		//#endregion
		//#region src/client/locales.ts
		/** `redteam` namespace dictionaries (product copy in Chinese). */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"trigger.label": "红队控制台",
			"trigger.aria": "打开红队渗透测试控制台",
			"console.aria": "红队渗透测试控制台",
			"console.title": "红队作战平台",
			"console.nav": "控制台导航",
			"console.scope": "范围内",
			"console.close.aria": "关闭红队控制台",
			"footer.engine": "引擎在线",
			"footer.queue": "队列 {count}",
			"footer.sessions": "会话 {count}",
			"nav.dashboard": "作战仪表盘",
			"nav.targets": "目标管理",
			"nav.jobs": "任务中心",
			"nav.sessions": "会话与植入体",
			"nav.credentials": "凭据库",
			"nav.reports": "报告中心",
			"dash.stats.tasks": "进行中任务",
			"dash.stats.sessions": "活跃会话",
			"dash.stats.hosts": "已控主机",
			"dash.stats.findings": "待处理发现",
			"dash.stats.credentials": "凭据",
			"dash.stats.runtime": "任务时长",
			"dash.activity.title": "实时活动",
			"dash.activity.empty": "暂无活动事件",
			"dash.findings.title": "高危发现",
			"dash.findings.empty": "无待处理发现（breach/cred）",
			"dash.findings.more": "还有 {count} 项未显示（见上方统计卡）",
			"dash.scope.title": "范围合规",
			"dash.scope.in": "范围内目标 {count}",
			"dash.scope.out": "范围外拦截 {count}",
			"dash.scope.hint": "所有目标输入均通过 Scope 引擎硬校验，范围外操作被拦截并留审计。",
			"activity.action.scan": "对 {target} 发起扫描",
			"activity.action.breach": "确认 {target} 存在安全问题",
			"activity.action.cred": "在 {target} 采集到凭据",
			"activity.action.recon": "在 {target} 记录侦察发现",
			"activity.action.report": "生成 {target} 的利用报告",
			"sev.critical": "严重",
			"sev.high": "高危",
			"sev.medium": "中危",
			"sev.low": "低危",
			"sev.info": "信息",
			"targets.title": "资产清单",
			"targets.search": "搜索目标（IP / 域名 / URL）",
			"targets.empty": "没有匹配的目标",
			"targets.col.address": "目标",
			"targets.col.kind": "类型",
			"targets.col.os": "操作系统",
			"targets.col.ports": "开放端口",
			"targets.col.rights": "权限",
			"targets.col.state": "状态",
			"targets.col.scope": "范围",
			"targets.col.owner": "负责人",
			"targets.kind.host": "主机",
			"targets.kind.domain": "域名",
			"targets.kind.web": "Web 应用",
			"targets.kind.cloud": "云资源",
			"targets.state.queued": "待侦察",
			"targets.state.recon": "侦察中",
			"targets.state.breached": "已突破",
			"targets.state.dropped": "已放弃",
			"targets.rights.none": "无",
			"targets.rights.user": "user",
			"targets.rights.admin": "admin",
			"targets.rights.system": "SYSTEM",
			"targets.rights.domain-admin": "域管",
			"targets.scope.in": "在范围内",
			"targets.scope.out": "范围外",
			"targets.delete": "删除",
			"targets.delete.aria": "删除目标 {address}",
			"targets.delete.confirmTitle": "确认删除",
			"targets.delete.confirmBody": "删除后该目标相关内容（任务、会话、凭据、活动记录）会一并删除，是否确认删除？",
			"targets.delete.address": "目标：{address}",
			"targets.delete.cancel": "取消",
			"targets.delete.confirm": "确认删除",
			"targets.delete.failed": "删除失败：{error}",
			"targets.add": "添加目标",
			"targets.add.title": "添加目标",
			"targets.add.field.address": "目标地址",
			"targets.add.field.kind": "类型",
			"targets.add.field.os": "操作系统",
			"targets.add.field.ports": "开放端口",
			"targets.add.field.rights": "权限",
			"targets.add.field.state": "状态",
			"targets.add.field.owner": "负责人",
			"targets.add.field.inScope": "在范围内",
			"targets.add.placeholder.address": "例如 192.168.1.10 或 example.com",
			"targets.add.placeholder.os": "例如 Windows Server 2022",
			"targets.add.placeholder.ports": "例如 80/tcp http, 443/tcp https",
			"targets.add.placeholder.owner": "例如 manual",
			"targets.add.submit": "添加",
			"targets.add.cancel": "取消",
			"targets.add.failed": "添加失败：{error}",
			"targets.add.errorAddress": "目标地址不能为空",
			"jobs.title": "任务队列",
			"jobs.empty": "队列为空",
			"jobs.col.task": "任务",
			"jobs.col.target": "目标",
			"jobs.col.progress": "进度",
			"jobs.col.state": "状态",
			"jobs.col.elapsed": "耗时",
			"jobs.col.owner": "负责人",
			"jobs.state.queued": "排队",
			"jobs.state.running": "运行中",
			"jobs.state.success": "成功",
			"jobs.state.failed": "失败",
			"jobs.state.cancelled": "已取消",
			"sessions.title": "会话与植入体",
			"sessions.empty": "暂无活跃会话",
			"sessions.col.implants": "植入体",
			"sessions.col.host": "主机",
			"sessions.col.user": "用户",
			"sessions.col.rights": "权限",
			"sessions.col.os": "操作系统",
			"sessions.col.heartbeat": "心跳",
			"sessions.col.uptime": "存活时长",
			"sessions.col.type": "类型",
			"sessions.heartbeat.ok": "正常",
			"sessions.heartbeat.late": "超时",
			"sessions.heartbeat.lost": "失联",
			"creds.title": "凭据库",
			"creds.empty": "凭据库为空",
			"creds.col.username": "用户名",
			"creds.col.secret": "凭据",
			"creds.col.type": "类型",
			"creds.col.source": "来源",
			"creds.col.hosts": "关联主机",
			"creds.col.updated": "更新时间",
			"creds.masked": "••••••••",
			"creds.reveal": "显示",
			"creds.hide": "隐藏",
			"creds.reveal.hint": "显示操作将写入审计日志",
			"creds.type.ntlm": "NTLM 哈希",
			"creds.type.kerberoast": "Kerberoast",
			"creds.type.plain": "明文",
			"creds.type.ticket": "票据",
			"reports.title": "报告中心",
			"reports.templates": "报告模板",
			"reports.generate": "生成报告",
			"reports.template.standard": "标准渗透测试报告",
			"reports.template.standard.desc": "按目标组织的完整发现与修复建议，支持 PDF / DOCX / Markdown 导出。",
			"reports.template.redteam": "红队行动总结（MITRE ATT&CK）",
			"reports.template.redteam.desc": "按战术阶段组织的攻击叙事时间线，自动映射 ATT&CK 技法矩阵。",
			"reports.coverage": "ATT&CK 覆盖",
			"reports.col.tactic": "战术阶段",
			"reports.col.techniques": "已覆盖技法",
			"reports.col.count": "技法数",
			"reports.tactic.recon": "侦察",
			"reports.tactic.resource": "资源开发",
			"reports.tactic.initial": "初始访问",
			"reports.tactic.execution": "执行",
			"reports.tactic.persistence": "持久化",
			"reports.tactic.privilege": "权限提升",
			"reports.tactic.defense": "防御规避",
			"reports.tactic.credential": "凭据访问",
			"reports.tactic.discovery": "发现",
			"reports.tactic.lateral": "横向移动",
			"reports.tactic.collection": "收集",
			"reports.tactic.c2": "命令与控制",
			"reports.tactic.exfil": "数据渗出",
			"reports.tactic.impact": "影响"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"trigger.label": "Red Team Console",
			"trigger.aria": "Open the red-team penetration testing console",
			"console.aria": "Red-team penetration testing console",
			"console.title": "Red Team Operations",
			"console.nav": "Console navigation",
			"console.scope": "In scope",
			"console.close.aria": "Close red-team console",
			"footer.engine": "Engine online",
			"footer.queue": "{count} queued",
			"footer.sessions": "{count} sessions",
			"nav.dashboard": "Dashboard",
			"nav.targets": "Targets",
			"nav.jobs": "Jobs",
			"nav.sessions": "Sessions & Implants",
			"nav.credentials": "Credentials",
			"nav.reports": "Reports",
			"dash.stats.tasks": "Running tasks",
			"dash.stats.sessions": "Active sessions",
			"dash.stats.hosts": "Compromised hosts",
			"dash.stats.findings": "Pending findings",
			"dash.stats.credentials": "Credentials",
			"dash.stats.runtime": "Engagement time",
			"dash.activity.title": "Live activity",
			"dash.activity.empty": "No activity events",
			"dash.findings.title": "Findings",
			"dash.findings.empty": "No pending findings (breach/cred)",
			"dash.findings.more": "{count} more not shown (see the stat card above)",
			"dash.scope.title": "Scope compliance",
			"dash.scope.in": "{count} targets in scope",
			"dash.scope.out": "{count} out-of-scope blocked",
			"dash.scope.hint": "Every target input is hard-checked by the Scope engine; out-of-scope actions are blocked and audited.",
			"activity.action.scan": "Scan started against {target}",
			"activity.action.breach": "Security issue confirmed on {target}",
			"activity.action.cred": "Credentials collected from {target}",
			"activity.action.recon": "Reconnaissance findings recorded on {target}",
			"activity.action.report": "Exploitation report generated for {target}",
			"sev.critical": "Critical",
			"sev.high": "High",
			"sev.medium": "Medium",
			"sev.low": "Low",
			"sev.info": "Info",
			"targets.title": "Asset inventory",
			"targets.search": "Search targets (IP / domain / URL)",
			"targets.empty": "No matching targets",
			"targets.col.address": "Target",
			"targets.col.kind": "Type",
			"targets.col.os": "OS",
			"targets.col.ports": "Open ports",
			"targets.col.rights": "Rights",
			"targets.col.state": "State",
			"targets.col.scope": "Scope",
			"targets.col.owner": "Owner",
			"targets.kind.host": "Host",
			"targets.kind.domain": "Domain",
			"targets.kind.web": "Web app",
			"targets.kind.cloud": "Cloud",
			"targets.state.queued": "Queued",
			"targets.state.recon": "Reconning",
			"targets.state.breached": "Breached",
			"targets.state.dropped": "Dropped",
			"targets.rights.none": "none",
			"targets.rights.user": "user",
			"targets.rights.admin": "admin",
			"targets.rights.system": "SYSTEM",
			"targets.rights.domain-admin": "Domain Admin",
			"targets.scope.in": "In scope",
			"targets.scope.out": "Out of scope",
			"targets.delete": "Delete",
			"targets.delete.aria": "Delete target {address}",
			"targets.delete.confirmTitle": "Confirm deletion",
			"targets.delete.confirmBody": "Deleting this target also removes its related jobs, sessions, credentials, and activity records. Confirm deletion?",
			"targets.delete.address": "Target: {address}",
			"targets.delete.cancel": "Cancel",
			"targets.delete.confirm": "Delete",
			"targets.delete.failed": "Delete failed: {error}",
			"targets.add": "Add target",
			"targets.add.title": "Add target",
			"targets.add.field.address": "Address",
			"targets.add.field.kind": "Type",
			"targets.add.field.os": "OS",
			"targets.add.field.ports": "Open ports",
			"targets.add.field.rights": "Rights",
			"targets.add.field.state": "State",
			"targets.add.field.owner": "Owner",
			"targets.add.field.inScope": "In scope",
			"targets.add.placeholder.address": "e.g. 192.168.1.10 or example.com",
			"targets.add.placeholder.os": "e.g. Windows Server 2022",
			"targets.add.placeholder.ports": "e.g. 80/tcp http, 443/tcp https",
			"targets.add.placeholder.owner": "e.g. manual",
			"targets.add.submit": "Add",
			"targets.add.cancel": "Cancel",
			"targets.add.failed": "Add failed: {error}",
			"targets.add.errorAddress": "Address must not be empty",
			"jobs.title": "Job queue",
			"jobs.empty": "Queue is empty",
			"jobs.col.task": "Task",
			"jobs.col.target": "Target",
			"jobs.col.progress": "Progress",
			"jobs.col.state": "State",
			"jobs.col.elapsed": "Elapsed",
			"jobs.col.owner": "Owner",
			"jobs.state.queued": "Queued",
			"jobs.state.running": "Running",
			"jobs.state.success": "Success",
			"jobs.state.failed": "Failed",
			"jobs.state.cancelled": "Cancelled",
			"sessions.title": "Sessions & implants",
			"sessions.empty": "No active sessions",
			"sessions.col.implants": "Implant",
			"sessions.col.host": "Host",
			"sessions.col.user": "User",
			"sessions.col.rights": "Rights",
			"sessions.col.os": "OS",
			"sessions.col.heartbeat": "Heartbeat",
			"sessions.col.uptime": "Uptime",
			"sessions.col.type": "Type",
			"sessions.heartbeat.ok": "Healthy",
			"sessions.heartbeat.late": "Late",
			"sessions.heartbeat.lost": "Lost",
			"creds.title": "Credential vault",
			"creds.empty": "Vault is empty",
			"creds.col.username": "Username",
			"creds.col.secret": "Secret",
			"creds.col.type": "Type",
			"creds.col.source": "Source",
			"creds.col.hosts": "Linked hosts",
			"creds.col.updated": "Updated",
			"creds.masked": "••••••••",
			"creds.reveal": "Reveal",
			"creds.hide": "Hide",
			"creds.reveal.hint": "Revealing writes an audit entry",
			"creds.type.ntlm": "NTLM hash",
			"creds.type.kerberoast": "Kerberoast",
			"creds.type.plain": "Plaintext",
			"creds.type.ticket": "Ticket",
			"reports.title": "Report center",
			"reports.templates": "Report templates",
			"reports.generate": "Generate report",
			"reports.template.standard": "Standard penetration test report",
			"reports.template.standard.desc": "Findings and remediation organized per target, exported as PDF / DOCX / Markdown.",
			"reports.template.redteam": "Red-team summary (MITRE ATT&CK)",
			"reports.template.redteam.desc": "An attack-narrative timeline per tactic phase, auto-mapped onto the ATT&CK matrix.",
			"reports.coverage": "ATT&CK coverage",
			"reports.col.tactic": "Tactic",
			"reports.col.techniques": "Covered techniques",
			"reports.col.count": "Techniques",
			"reports.tactic.recon": "Reconnaissance",
			"reports.tactic.resource": "Resource Development",
			"reports.tactic.initial": "Initial Access",
			"reports.tactic.execution": "Execution",
			"reports.tactic.persistence": "Persistence",
			"reports.tactic.privilege": "Privilege Escalation",
			"reports.tactic.defense": "Defense Evasion",
			"reports.tactic.credential": "Credential Access",
			"reports.tactic.discovery": "Discovery",
			"reports.tactic.lateral": "Lateral Movement",
			"reports.tactic.collection": "Collection",
			"reports.tactic.c2": "Command and Control",
			"reports.tactic.exfil": "Exfiltration",
			"reports.tactic.impact": "Impact"
		};
		//#endregion
		//#region ../../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
		function r(e) {
			var t, f, n = "";
			if ("string" == typeof e || "number" == typeof e) n += e;
			else if ("object" == typeof e) if (Array.isArray(e)) {
				var o = e.length;
				for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
			} else for (f in e) e[f] && (n && (n += " "), n += f);
			return n;
		}
		function clsx() {
			for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
			return n;
		}
		//#endregion
		//#region \0dsh-css:D:\27656\Documents\deepseek-harness\packages\client\ui-redteam\src\client\RedteamTrigger.module.css.mjs
		const css$2 = ".v2izNa_trigger{color:var(--dsw-alias-label-secondary);font-family:var(--dsw-font-family);cursor:pointer;transition:background var(--ds-transition-duration-fast) var(--ds-ease-in-out), color var(--ds-transition-duration-fast) var(--ds-ease-in-out);background:0 0;border:none;border-radius:6px;align-items:center;gap:8px;display:flex}.v2izNa_trigger:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.v2izNa_trigger[aria-pressed=true]{color:var(--dsw-alias-state-error-primary)}.v2izNa_wide{width:100%;padding:8px 12px;font-size:13px}.v2izNa_rail{justify-content:center;width:32px;height:32px}.v2izNa_icon{flex:none}.v2izNa_label{text-align:left;flex:1}";
		const tagId$2 = "@deepseek-ai/dsh-client-ui-redteam/RedteamTrigger.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-redteam";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var RedteamTrigger_module_css_default = {
			"rail": "v2izNa_rail",
			"trigger": "v2izNa_trigger",
			"icon": "v2izNa_icon",
			"label": "v2izNa_label",
			"wide": "v2izNa_wide"
		};
		//#endregion
		//#region src/client/RedteamTrigger.tsx
		/**
		* Sidebar-foot trigger for the red-team console. The entry draws its own
		* button chrome (the sidebar supplies only the column state, mirroring the
		* settings trigger seat): a rail icon while collapsed, icon + label while
		* wide. The shared store's open action toggles the console; aria-pressed
		* reflects the console's open state.
		*/
		/**
		* Render the sidebar-foot trigger.
		* @param props - composed slot props (contract/slots.ts).
		* @returns the trigger button element tree.
		*/
		function RedteamTrigger({ wide, t, useStore, actions }) {
			const open = useStore((s) => s.open);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: clsx(RedteamTrigger_module_css_default.trigger, wide ? RedteamTrigger_module_css_default.wide : RedteamTrigger_module_css_default.rail),
				"aria-pressed": open,
				"aria-label": t("trigger.aria"),
				onClick: actions.open,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, {
					size: 16,
					className: RedteamTrigger_module_css_default.icon
				}), wide && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: RedteamTrigger_module_css_default.label,
					children: t("trigger.label")
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\27656\Documents\deepseek-harness\packages\client\ui-redteam\src\client\RedteamConsole.module.css.mjs
		const css$1 = ".gVO1dq_console{z-index:1;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);pointer-events:auto;font-family:var(--dsw-font-family);grid-template:\"gVO1dq_header gVO1dq_header\"56px\"gVO1dq_nav gVO1dq_main\"1fr\"gVO1dq_footer gVO1dq_footer\"28px/216px 1fr;font-size:13px;display:grid;position:fixed;inset:0}.gVO1dq_header{border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);grid-area:gVO1dq_header;justify-content:space-between;align-items:center;padding:0 16px;display:flex}.gVO1dq_titleGroup{align-items:center;gap:10px;display:flex}.gVO1dq_brandMark{background:var(--dsw-alias-state-error-primary);border-radius:2px;width:10px;height:10px}.gVO1dq_title{color:var(--dsw-alias-label-primary);margin:0;font-size:15px;font-weight:600}.gVO1dq_scopePill{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-state-success-primary);border-radius:999px;align-items:center;gap:6px;padding:2px 8px;font-size:12px;display:inline-flex}.gVO1dq_scopeDot{background:var(--dsw-alias-state-success-primary);border-radius:50%;width:6px;height:6px}.gVO1dq_close{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;transition:background var(--ds-transition-duration-fast) var(--ds-ease-in-out);background:0 0;border:none;border-radius:6px;justify-content:center;align-items:center;display:flex}.gVO1dq_close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.gVO1dq_nav{border-right:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);flex-direction:column;grid-area:gVO1dq_nav;gap:2px;padding:12px 8px;display:flex;overflow-y:auto}.gVO1dq_navCell{color:var(--dsw-alias-label-secondary);font-family:var(--dsw-font-family);text-align:left;cursor:pointer;transition:background var(--ds-transition-duration-fast) var(--ds-ease-in-out);background:0 0;border:none;border-radius:6px;padding:8px 12px;font-size:13px;display:block}.gVO1dq_navCell:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.gVO1dq_navCell.gVO1dq_active{background:var(--dsw-alias-interactive-bg-hover-accent);color:var(--dsw-alias-label-primary);font-weight:600}.gVO1dq_main{grid-area:gVO1dq_main;padding:16px;overflow:auto}.gVO1dq_footer{border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-tertiary);grid-area:gVO1dq_footer;align-items:center;gap:16px;padding:0 12px;font-size:12px;display:flex}.gVO1dq_footerGroup{align-items:center;gap:6px;display:inline-flex}.gVO1dq_engineDot{background:var(--dsw-alias-state-success-primary);border-radius:50%;width:6px;height:6px}.gVO1dq_footerSpacer{flex:1}.gVO1dq_clock{font-family:var(--ds-font-family-code)}";
		const tagId$1 = "@deepseek-ai/dsh-client-ui-redteam/RedteamConsole.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-redteam";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var RedteamConsole_module_css_default = {
			"footerGroup": "gVO1dq_footerGroup",
			"nav": "gVO1dq_nav",
			"brandMark": "gVO1dq_brandMark",
			"scopeDot": "gVO1dq_scopeDot",
			"clock": "gVO1dq_clock",
			"footer": "gVO1dq_footer",
			"console": "gVO1dq_console",
			"close": "gVO1dq_close",
			"main": "gVO1dq_main",
			"footerSpacer": "gVO1dq_footerSpacer",
			"engineDot": "gVO1dq_engineDot",
			"active": "gVO1dq_active",
			"header": "gVO1dq_header",
			"navCell": "gVO1dq_navCell",
			"titleGroup": "gVO1dq_titleGroup",
			"title": "gVO1dq_title",
			"scopePill": "gVO1dq_scopePill"
		};
		//#endregion
		//#region src/client/RedteamConsole.tsx
		/**
		* Red-team console shell: the full-screen surface riding the layout's
		* additive `shell.overlay` seat. Renders nothing while closed (the overlay
		* layer stays click-through for the app underneath); while open it paints
		* header chrome, the projected section nav rail, the active `redteam.section`
		* content, and the telemetry status bar. Close paths: the header button and
		* document-level Escape (the listener's lifetime is the open state's).
		*/
		/** Status-bar clock: component-private viewing state, one tick per second. */
		function StatusClock() {
			const [now, setNow] = (0, react.useState)(() => /* @__PURE__ */ new Date());
			(0, react.useEffect)(() => {
				const timer = window.setInterval(() => {
					setNow(/* @__PURE__ */ new Date());
				}, 1e3);
				return () => {
					window.clearInterval(timer);
				};
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: RedteamConsole_module_css_default.clock,
				children: now.toLocaleTimeString()
			});
		}
		/**
		* Render the console shell.
		* @param props - composed slot props (contract/slots.ts).
		* @returns the console element tree, or null while closed.
		*/
		function RedteamConsole(props) {
			const { t, useStore, actions, useSections, renderSlot } = props;
			const open = useStore((s) => s.open);
			const active = useStore((s) => s.section);
			const rows = useSections((s) => s);
			const activeId = rows.some((row) => row.id === active) ? active : rows[0]?.id;
			const closeButton = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (!open) return;
				closeButton.current?.focus();
				const onKeyDown = (event) => {
					if (event.key === "Escape") actions.close();
				};
				document.addEventListener("keydown", onKeyDown);
				return () => {
					document.removeEventListener("keydown", onKeyDown);
				};
			}, [open, actions]);
			if (!open) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: RedteamConsole_module_css_default.console,
				role: "dialog",
				"aria-modal": "true",
				"aria-label": t("console.aria"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: RedteamConsole_module_css_default.header,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: RedteamConsole_module_css_default.titleGroup,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: RedteamConsole_module_css_default.brandMark,
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
									className: RedteamConsole_module_css_default.title,
									children: t("console.title")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: RedteamConsole_module_css_default.scopePill,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: RedteamConsole_module_css_default.scopeDot,
										"aria-hidden": "true"
									}), t("console.scope")]
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							ref: closeButton,
							type: "button",
							className: RedteamConsole_module_css_default.close,
							"aria-label": t("console.close.aria"),
							onClick: actions.close,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, { size: 14 })
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("nav", {
						className: RedteamConsole_module_css_default.nav,
						"aria-label": t("console.nav"),
						children: rows.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: clsx(RedteamConsole_module_css_default.navCell, row.id === activeId && RedteamConsole_module_css_default.active),
							"aria-current": row.id === activeId ? "true" : void 0,
							onClick: () => {
								if (isRedteamSectionId(row.id)) actions.selectSection(row.id);
							},
							children: row.label
						}, row.id))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("main", {
						className: RedteamConsole_module_css_default.main,
						children: activeId !== void 0 && renderSlot("redteam.section", {}, { only: activeId })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: RedteamConsole_module_css_default.footer,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: RedteamConsole_module_css_default.footerGroup,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: RedteamConsole_module_css_default.engineDot,
									"aria-hidden": "true"
								}), t("footer.engine")]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("footer.queue", { count: CONSOLE_STATUS.queue }) }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("footer.sessions", { count: CONSOLE_STATUS.sessions }) }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: RedteamConsole_module_css_default.footerSpacer }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(StatusClock, {})
						]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\27656\Documents\deepseek-harness\packages\client\ui-redteam\src\client\sections\sections.module.css.mjs
		const css = ".KNJWga_section{flex-direction:column;gap:12px;min-width:0;display:flex}.KNJWga_sectionToolbar{justify-content:space-between;align-items:center;gap:12px;display:flex}.KNJWga_sectionTitle{color:var(--dsw-alias-label-primary);margin:0;font-size:15px;font-weight:600}.KNJWga_subTitle{color:var(--dsw-alias-label-secondary);margin:8px 0 0;font-size:13px;font-weight:600}.KNJWga_search{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);width:280px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);border-radius:6px;padding:6px 10px;font-size:13px}.KNJWga_search::placeholder{color:var(--dsw-alias-label-tertiary)}.KNJWga_search:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:0}.KNJWga_empty{color:var(--dsw-alias-label-tertiary);margin:24px 0}.KNJWga_table{border-collapse:collapse;width:100%;font-size:13px}.KNJWga_table th{border-bottom:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);text-align:left;white-space:nowrap;padding:8px 10px;font-weight:500}.KNJWga_table td{border-bottom:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);vertical-align:middle;padding:8px 10px}.KNJWga_table tr:hover td{background:var(--dsw-alias-interactive-bg-hover)}.KNJWga_mono{font-family:var(--ds-font-family-code);font-size:12px}.KNJWga_dashboard{flex-direction:column;gap:16px;min-width:0;display:flex}.KNJWga_statGrid{grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;display:grid}.KNJWga_statCard{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:8px;padding:12px 14px}.KNJWga_statValue{font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-primary);font-size:20px;font-weight:600}.KNJWga_statLabel{color:var(--dsw-alias-label-tertiary);margin-top:4px;font-size:12px}.KNJWga_dashColumns{grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:16px;display:grid}.KNJWga_panel{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:8px;min-width:0;padding:14px}.KNJWga_panelTitle{color:var(--dsw-alias-label-secondary);margin:0 0 12px;font-size:13px;font-weight:600}.KNJWga_activity{flex-direction:column;gap:2px;margin:0;padding:0;list-style:none;display:flex}.KNJWga_activityRow{color:var(--dsw-alias-label-secondary);border-radius:4px;align-items:center;gap:10px;padding:6px 4px;display:flex}.KNJWga_activityRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.KNJWga_activityText{flex:1;min-width:0}.KNJWga_sevBadge{border-radius:999px;flex:none;padding:1px 8px;font-size:11px}.KNJWga_sevCritical{color:var(--dsw-alias-label-primary-foreground);background:var(--dsw-alias-state-error-primary)}.KNJWga_sevHigh{color:var(--dsw-static-amber-900);background:var(--dsw-static-amber-500)}.KNJWga_sevMedium{color:var(--dsw-static-amber-900);background:var(--dsw-alias-state-warn-primary)}.KNJWga_sevLow{color:var(--dsw-alias-label-primary-foreground);background:var(--dsw-alias-state-business-primary)}.KNJWga_sevInfo{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-overlay)}.KNJWga_scopePanel{flex-direction:column;gap:10px;display:flex}.KNJWga_scopeRow{color:var(--dsw-alias-label-secondary);align-items:center;gap:8px;font-size:13px;display:flex}.KNJWga_scopeDot{border-radius:50%;width:8px;height:8px}.KNJWga_scopeOk{background:var(--dsw-alias-state-success-primary)}.KNJWga_scopeBlocked{background:var(--dsw-alias-state-error-primary)}.KNJWga_scopeHint{color:var(--dsw-alias-label-tertiary);margin:8px 0 0;font-size:12px;line-height:1.6}.KNJWga_badge{white-space:nowrap;border-radius:999px;padding:1px 8px;font-size:11px;display:inline-block}.KNJWga_stateBreached{color:var(--dsw-alias-label-primary-foreground);background:var(--dsw-alias-state-error-primary)}.KNJWga_stateActive{color:var(--dsw-alias-label-primary-foreground);background:var(--dsw-alias-state-business-primary)}.KNJWga_stateSuccess{color:var(--dsw-alias-label-primary-foreground);background:var(--dsw-alias-state-success-primary)}.KNJWga_stateFailed{color:var(--dsw-static-red-900);background:var(--dsw-alias-state-error-secondary)}.KNJWga_stateQueued{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-overlay)}.KNJWga_stateDropped{color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-skeleton)}.KNJWga_scopePill{white-space:nowrap;border-radius:999px;align-items:center;gap:6px;padding:1px 8px;font-size:11px;display:inline-flex}.KNJWga_scopePill.KNJWga_scopeOk{color:var(--dsw-alias-state-success-primary);background:var(--dsw-alias-state-success-tertiary)}.KNJWga_scopePill.KNJWga_scopeBad{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover-danger)}.KNJWga_progress{background:var(--dsw-alias-bg-overlay);border-radius:999px;width:160px;height:8px;overflow:hidden}.KNJWga_progressFill{height:100%;transition:width var(--ds-transition-duration) var(--ds-ease-in-out);border-radius:999px}.KNJWga_progressActive{background:var(--dsw-alias-state-business-primary)}.KNJWga_progressSuccess{background:var(--dsw-alias-state-success-primary)}.KNJWga_progressFailed{background:var(--dsw-alias-state-error-primary)}.KNJWga_progressQueued{background:var(--dsw-alias-label-dimmed)}.KNJWga_heartbeatCell{white-space:nowrap;align-items:center;gap:8px;display:inline-flex}.KNJWga_dot{border-radius:50%;width:8px;height:8px}.KNJWga_dotOk{background:var(--dsw-alias-state-success-primary)}.KNJWga_dotLate{background:var(--dsw-alias-state-warn-primary)}.KNJWga_dotLost{background:var(--dsw-alias-state-error-primary)}.KNJWga_secretCell{align-items:center;gap:10px;max-width:420px;display:inline-flex}.KNJWga_secretCell .KNJWga_mono{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.KNJWga_reveal{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font-family:var(--dsw-font-family);cursor:pointer;background:0 0;border-radius:4px;flex:none;padding:2px 8px;font-size:11px}.KNJWga_reveal:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.KNJWga_cardGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;display:grid}.KNJWga_card{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:8px;padding:14px}.KNJWga_cardTitle{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}.KNJWga_cardDesc{color:var(--dsw-alias-label-tertiary);margin:6px 0 0;font-size:12px;line-height:1.6}.KNJWga_deleteCell{white-space:nowrap;text-align:right;width:1%}.KNJWga_deleteButton{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-state-error-primary);font-family:var(--dsw-font-family);cursor:pointer;background:0 0;border-radius:6px;padding:3px 10px;font-size:12px}.KNJWga_deleteButton:hover{background:var(--dsw-alias-interactive-bg-hover-danger)}.KNJWga_deleteButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:0}.KNJWga_modalBackdrop{z-index:200;background:#00000080;justify-content:center;align-items:center;display:flex;position:fixed;inset:0}.KNJWga_modal{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:10px;width:440px;max-width:calc(100vw - 48px);padding:18px;box-shadow:0 12px 40px #0000004d}.KNJWga_modalTitle{color:var(--dsw-alias-label-primary);margin:0 0 10px;font-size:15px;font-weight:600}.KNJWga_modalBody{color:var(--dsw-alias-label-secondary);margin:0 0 8px;font-size:13px;line-height:1.6}.KNJWga_modalAddress{color:var(--dsw-alias-state-error-primary);margin:0 0 14px;font-size:13px}.KNJWga_modalError{color:var(--dsw-alias-state-error-primary);margin:0 0 12px;font-size:12px}.KNJWga_modalActions{justify-content:flex-end;gap:10px;display:flex}.KNJWga_modalCancel{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font-family:var(--dsw-font-family);cursor:pointer;background:0 0;border-radius:6px;padding:6px 14px;font-size:13px}.KNJWga_modalConfirm{background:var(--dsw-alias-state-error-primary);color:#fff;font-family:var(--dsw-font-family);cursor:pointer;border:none;border-radius:6px;padding:6px 14px;font-size:13px}.KNJWga_modalCancel:disabled,.KNJWga_modalConfirm:disabled{opacity:.5;cursor:default}.KNJWga_toolbarGroup{align-items:center;gap:10px;display:flex}.KNJWga_addButton{border:1px solid var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary);font-family:var(--dsw-font-family);cursor:pointer;background:0 0;border-radius:6px;padding:6px 14px;font-size:13px}.KNJWga_addButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.KNJWga_addButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:0}.KNJWga_formGrid{grid-template-columns:1fr 1fr;gap:12px 14px;display:grid}.KNJWga_field{flex-direction:column;gap:4px;display:flex}.KNJWga_fieldLabel{color:var(--dsw-alias-label-tertiary);font-size:12px}.KNJWga_fieldInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);border-radius:6px;padding:6px 10px;font-size:13px}.KNJWga_fieldInput:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:0}.KNJWga_fieldCheck{color:var(--dsw-alias-label-secondary);align-items:center;gap:8px;font-size:13px;display:flex}.KNJWga_findingsHeader{justify-content:space-between;align-items:baseline;gap:8px;margin:0 0 12px;display:flex}.KNJWga_findingsHeader h2{color:var(--dsw-alias-label-secondary);margin:0;font-size:13px;font-weight:600}.KNJWga_findingsHint{color:var(--dsw-alias-label-tertiary);font-size:11px}.KNJWga_findingsMore{text-align:center;color:var(--dsw-alias-label-tertiary);margin:8px 0 0;font-size:12px}.KNJWga_outOfScopeRow{opacity:.65;background:var(--dsw-alias-interactive-bg-hover-danger)}.KNJWga_outOfScopeRow td:first-child{border-left:3px solid var(--dsw-alias-state-error-primary)}";
		const tagId = "@deepseek-ai/dsh-client-ui-redteam/sections.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-redteam";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var sections_module_css_default = {
			"progress": "KNJWga_progress",
			"reveal": "KNJWga_reveal",
			"findingsMore": "KNJWga_findingsMore",
			"statGrid": "KNJWga_statGrid",
			"activityRow": "KNJWga_activityRow",
			"modalConfirm": "KNJWga_modalConfirm",
			"progressQueued": "KNJWga_progressQueued",
			"progressFill": "KNJWga_progressFill",
			"card": "KNJWga_card",
			"search": "KNJWga_search",
			"cardDesc": "KNJWga_cardDesc",
			"toolbarGroup": "KNJWga_toolbarGroup",
			"scopeDot": "KNJWga_scopeDot",
			"modalCancel": "KNJWga_modalCancel",
			"panel": "KNJWga_panel",
			"badge": "KNJWga_badge",
			"sevMedium": "KNJWga_sevMedium",
			"findingsHeader": "KNJWga_findingsHeader",
			"outOfScopeRow": "KNJWga_outOfScopeRow",
			"scopeRow": "KNJWga_scopeRow",
			"heartbeatCell": "KNJWga_heartbeatCell",
			"dotLost": "KNJWga_dotLost",
			"modalBackdrop": "KNJWga_modalBackdrop",
			"modalTitle": "KNJWga_modalTitle",
			"progressFailed": "KNJWga_progressFailed",
			"modalAddress": "KNJWga_modalAddress",
			"fieldInput": "KNJWga_fieldInput",
			"subTitle": "KNJWga_subTitle",
			"stateFailed": "KNJWga_stateFailed",
			"sevCritical": "KNJWga_sevCritical",
			"scopePanel": "KNJWga_scopePanel",
			"scopeOk": "KNJWga_scopeOk",
			"table": "KNJWga_table",
			"stateBreached": "KNJWga_stateBreached",
			"sevLow": "KNJWga_sevLow",
			"deleteButton": "KNJWga_deleteButton",
			"field": "KNJWga_field",
			"cardGrid": "KNJWga_cardGrid",
			"findingsHint": "KNJWga_findingsHint",
			"secretCell": "KNJWga_secretCell",
			"stateDropped": "KNJWga_stateDropped",
			"dot": "KNJWga_dot",
			"scopePill": "KNJWga_scopePill",
			"scopeHint": "KNJWga_scopeHint",
			"deleteCell": "KNJWga_deleteCell",
			"stateActive": "KNJWga_stateActive",
			"stateSuccess": "KNJWga_stateSuccess",
			"progressActive": "KNJWga_progressActive",
			"dotOk": "KNJWga_dotOk",
			"scopeBad": "KNJWga_scopeBad",
			"modal": "KNJWga_modal",
			"activityText": "KNJWga_activityText",
			"panelTitle": "KNJWga_panelTitle",
			"formGrid": "KNJWga_formGrid",
			"mono": "KNJWga_mono",
			"sectionTitle": "KNJWga_sectionTitle",
			"dashColumns": "KNJWga_dashColumns",
			"sevBadge": "KNJWga_sevBadge",
			"modalError": "KNJWga_modalError",
			"modalActions": "KNJWga_modalActions",
			"modalBody": "KNJWga_modalBody",
			"scopeBlocked": "KNJWga_scopeBlocked",
			"stateQueued": "KNJWga_stateQueued",
			"statCard": "KNJWga_statCard",
			"cardTitle": "KNJWga_cardTitle",
			"dashboard": "KNJWga_dashboard",
			"fieldCheck": "KNJWga_fieldCheck",
			"empty": "KNJWga_empty",
			"fieldLabel": "KNJWga_fieldLabel",
			"progressSuccess": "KNJWga_progressSuccess",
			"statValue": "KNJWga_statValue",
			"sevHigh": "KNJWga_sevHigh",
			"addButton": "KNJWga_addButton",
			"dotLate": "KNJWga_dotLate",
			"section": "KNJWga_section",
			"statLabel": "KNJWga_statLabel",
			"sevInfo": "KNJWga_sevInfo",
			"sectionToolbar": "KNJWga_sectionToolbar",
			"activity": "KNJWga_activity"
		};
		//#endregion
		//#region src/client/sections/DashboardSection.tsx
		/**
		* Dashboard section: stat cards derived from the pumped dataset, the
		* high-risk findings panel (focused view of breach/cred events), the
		* live-activity feed, and the scope compliance panel. The cards read the
		* same store every section reads (the data-pump product of redteam-data.json),
		* so the numbers follow the data; only "runtime" stays a placeholder until
		* host telemetry lands.
		*/
		/** Severity → dictionary key (template literals would lose the key union). */
		const SEVERITY_KEY = {
			critical: "sev.critical",
			high: "sev.high",
			medium: "sev.medium",
			low: "sev.low",
			info: "sev.info"
		};
		/** Severity → badge tone class (undefined-safe under noUncheckedIndexedAccess; clsx drops it). */
		const SEVERITY_CLASS = {
			critical: sections_module_css_default.sevCritical,
			high: sections_module_css_default.sevHigh,
			medium: sections_module_css_default.sevMedium,
			low: sections_module_css_default.sevLow,
			info: sections_module_css_default.sevInfo
		};
		/** Sort order: lower rank = more severe. Matches the stat card "待处理发现"口径. */
		const SEVERITY_RANK = {
			critical: 0,
			high: 1,
			medium: 2,
			low: 3,
			info: 4
		};
		/** Cap on the findings panel; the rest is summarized as "+N more". */
		const FINDINGS_VISIBLE_MAX = 10;
		/**
		* Render the dashboard section.
		* @param props - composed slot props (contract/slots.ts).
		* @returns the dashboard element tree.
		*/
		function DashboardSection({ t, useStore }) {
			const targets = useStore((s) => s.dataset.targets);
			const jobs = useStore((s) => s.dataset.jobs);
			const sessions = useStore((s) => s.dataset.sessions);
			const credentials = useStore((s) => s.dataset.credentials);
			const activity = useStore((s) => s.dataset.activity);
			const stats = [
				{
					key: "dash.stats.tasks",
					value: String(jobs.filter((job) => job.state === "jobs.state.queued" || job.state === "jobs.state.running").length)
				},
				{
					key: "dash.stats.sessions",
					value: String(sessions.length)
				},
				{
					key: "dash.stats.hosts",
					value: String(targets.filter((row) => row.state === "targets.state.breached").length)
				},
				{
					key: "dash.stats.findings",
					value: String(activity.filter((event) => event.action === "activity.action.breach" || event.action === "activity.action.cred").length)
				},
				{
					key: "dash.stats.credentials",
					value: String(credentials.length)
				},
				{
					key: "dash.stats.runtime",
					value: "—"
				}
			];
			const inScope = targets.filter((row) => row.inScope).length;
			const outOfScope = targets.length - inScope;
			const findings = (0, react.useMemo)(() => {
				return [...activity.filter((event) => event.action === "activity.action.breach" || event.action === "activity.action.cred")].sort((left, right) => {
					const rank = SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity];
					if (rank !== 0) return rank;
					return right.id - left.id;
				});
			}, [activity]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: sections_module_css_default.dashboard,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: sections_module_css_default.statGrid,
						children: stats.map((stat) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: sections_module_css_default.statCard,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: sections_module_css_default.statValue,
								children: stat.value
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: sections_module_css_default.statLabel,
								children: t(stat.key)
							})]
						}, stat.key))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: sections_module_css_default.panel,
						"aria-label": t("dash.findings.title"),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: sections_module_css_default.findingsHeader,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t("dash.findings.title") }), findings.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: sections_module_css_default.findingsHint,
								children: [String(findings.length), " · breach / cred"]
							})]
						}), findings.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: sections_module_css_default.empty,
							children: t("dash.findings.empty")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
							className: sections_module_css_default.activity,
							children: findings.slice(0, FINDINGS_VISIBLE_MAX).map((event) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
								className: sections_module_css_default.activityRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: sections_module_css_default.mono,
										children: event.time
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: clsx(sections_module_css_default.sevBadge, SEVERITY_CLASS[event.severity]),
										children: t(SEVERITY_KEY[event.severity])
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: sections_module_css_default.activityText,
										children: event.description ?? t(event.action, { target: event.target })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: sections_module_css_default.mono,
										children: event.target
									})
								]
							}, event.id))
						}), findings.length > FINDINGS_VISIBLE_MAX && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: sections_module_css_default.findingsMore,
							children: t("dash.findings.more", { count: findings.length - FINDINGS_VISIBLE_MAX })
						})] })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: sections_module_css_default.dashColumns,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: sections_module_css_default.panel,
							"aria-label": t("dash.activity.title"),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
								className: sections_module_css_default.panelTitle,
								children: t("dash.activity.title")
							}), activity.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: sections_module_css_default.empty,
								children: t("dash.activity.empty")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
								className: sections_module_css_default.activity,
								children: activity.map((event) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
									className: sections_module_css_default.activityRow,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: sections_module_css_default.mono,
											children: event.time
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: clsx(sections_module_css_default.sevBadge, SEVERITY_CLASS[event.severity]),
											children: t(SEVERITY_KEY[event.severity])
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: sections_module_css_default.activityText,
											children: event.description ?? t(event.action, { target: event.target })
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: sections_module_css_default.mono,
											children: event.target
										})
									]
								}, event.id))
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: clsx(sections_module_css_default.panel, sections_module_css_default.scopePanel),
							"aria-label": t("dash.scope.title"),
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
									className: sections_module_css_default.panelTitle,
									children: t("dash.scope.title")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: sections_module_css_default.scopeRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: clsx(sections_module_css_default.scopeDot, sections_module_css_default.scopeOk),
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("dash.scope.in", { count: inScope }) })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: sections_module_css_default.scopeRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: clsx(sections_module_css_default.scopeDot, sections_module_css_default.scopeBlocked),
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("dash.scope.out", { count: outOfScope }) })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: sections_module_css_default.scopeHint,
									children: t("dash.scope.hint")
								})
							]
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/sections/TargetsSection.tsx
		/**
		* Targets section: the scoped asset inventory with a client-side search
		* filter (component-private viewing state), per-row deletion, and a manual
		* add form. Mutations ask for confirmation first, post to the node half's
		* /redteam-target-delete and /redteam-target-add routes, then apply the store
		* action locally so the table updates immediately (the pump confirms from
		* disk on its cadence).
		*/
		/** Mutation routes owned by the package's node half. */
		const DELETE_URL = "/redteam-target-delete";
		const ADD_URL = "/redteam-target-add";
		const KIND_OPTIONS = [
			"targets.kind.host",
			"targets.kind.domain",
			"targets.kind.web",
			"targets.kind.cloud"
		];
		const STATE_OPTIONS = [
			"targets.state.queued",
			"targets.state.recon",
			"targets.state.breached",
			"targets.state.dropped"
		];
		const RIGHTS_OPTIONS = [
			"targets.rights.none",
			"targets.rights.user",
			"targets.rights.admin",
			"targets.rights.system",
			"targets.rights.domain-admin"
		];
		const EMPTY_FORM = {
			address: "",
			kind: "targets.kind.host",
			os: "",
			ports: "",
			rights: "targets.rights.none",
			state: "targets.state.queued",
			inScope: true,
			owner: "manual"
		};
		/** Target state -> row tone class (clsx drops the undefined fallthrough). */
		function targetStateClass(state) {
			switch (state) {
				case "targets.state.breached": return sections_module_css_default.stateBreached;
				case "targets.state.recon": return sections_module_css_default.stateActive;
				case "targets.state.queued": return sections_module_css_default.stateQueued;
				case "targets.state.dropped": return sections_module_css_default.stateDropped;
				default: return;
			}
		}
		/**
		* Render the targets section.
		* @param props - composed slot props (contract/slots.ts).
		* @returns the targets table element tree.
		*/
		function TargetsSection({ t, useStore, actions }) {
			const targets = useStore((s) => s.dataset.targets);
			const [query, setQuery] = (0, react.useState)("");
			const [pending, setPending] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [adding, setAdding] = (0, react.useState)(false);
			const [form, setForm] = (0, react.useState)(EMPTY_FORM);
			const [addBusy, setAddBusy] = (0, react.useState)(false);
			const [addError, setAddError] = (0, react.useState)(null);
			const needle = query.trim().toLowerCase();
			const rows = needle === "" ? targets : targets.filter((row) => row.address.toLowerCase().includes(needle));
			const patchForm = (part) => {
				setForm((current) => ({
					...current,
					...part
				}));
			};
			const openAdd = () => {
				setForm(EMPTY_FORM);
				setAddError(null);
				setAdding(true);
			};
			const cancelAdd = () => {
				if (addBusy) return;
				setAdding(false);
				setAddError(null);
			};
			const submitAdd = async () => {
				if (addBusy) return;
				if (form.address.trim() === "") {
					setAddError(t("targets.add.errorAddress"));
					return;
				}
				setAddBusy(true);
				setAddError(null);
				try {
					const response = await fetch(ADD_URL, {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							...form,
							address: form.address.trim()
						})
					});
					const result = await response.json();
					if (!response.ok || result.ok !== true) {
						setAddError(result.error ?? "HTTP " + String(response.status));
						return;
					}
					if (result.target !== void 0) actions.addTarget(result.target);
					setAdding(false);
				} catch (cause) {
					setAddError(cause instanceof Error ? cause.message : String(cause));
				} finally {
					setAddBusy(false);
				}
			};
			const cancelDelete = () => {
				if (busy) return;
				setPending(null);
				setError(null);
			};
			const confirmDelete = async () => {
				if (pending === null || busy) return;
				setBusy(true);
				setError(null);
				try {
					const response = await fetch(DELETE_URL, {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ id: pending.id })
					});
					const result = await response.json();
					if (!response.ok || result.ok !== true) {
						setError(result.error ?? "HTTP " + String(response.status));
						return;
					}
					actions.removeTarget(pending.id);
					setPending(null);
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				} finally {
					setBusy(false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: sections_module_css_default.section,
				"aria-label": t("targets.title"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: sections_module_css_default.sectionToolbar,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							className: sections_module_css_default.sectionTitle,
							children: t("targets.title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: sections_module_css_default.toolbarGroup,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "search",
								className: sections_module_css_default.search,
								placeholder: t("targets.search"),
								value: query,
								onChange: (event) => {
									setQuery(event.target.value);
								}
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: sections_module_css_default.addButton,
								onClick: openAdd,
								children: t("targets.add")
							})]
						})]
					}),
					rows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: sections_module_css_default.empty,
						children: t("targets.empty")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
						className: sections_module_css_default.table,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("targets.col.address") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("targets.col.kind") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("targets.col.os") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("targets.col.ports") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("targets.col.rights") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("targets.col.state") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("targets.col.scope") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("targets.col.owner") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { "aria-hidden": "true" })
						] }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: rows.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", {
							className: !row.inScope ? sections_module_css_default.outOfScopeRow : void 0,
							title: !row.inScope ? `${t("targets.scope.out")} · ${row.address}` : void 0,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
									className: sections_module_css_default.mono,
									children: row.address
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: t(row.kind) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: row.os ?? "—" }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
									className: sections_module_css_default.mono,
									children: row.ports
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: t(row.rights) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: clsx(sections_module_css_default.badge, targetStateClass(row.state)),
									children: t(row.state)
								}) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: clsx(sections_module_css_default.scopePill, row.inScope ? sections_module_css_default.scopeOk : sections_module_css_default.scopeBad),
									children: t(row.inScope ? "targets.scope.in" : "targets.scope.out")
								}) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
									className: sections_module_css_default.mono,
									children: row.owner
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
									className: sections_module_css_default.deleteCell,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: sections_module_css_default.deleteButton,
										"aria-label": t("targets.delete.aria", { address: row.address }),
										onClick: () => {
											setError(null);
											setPending(row);
										},
										children: t("targets.delete")
									})
								})
							]
						}, row.id)) })]
					}),
					adding && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: sections_module_css_default.modalBackdrop,
						role: "presentation",
						onClick: cancelAdd,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: sections_module_css_default.modal,
							role: "dialog",
							"aria-modal": "true",
							"aria-label": t("targets.add.title"),
							onClick: (event) => {
								event.stopPropagation();
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
									className: sections_module_css_default.modalTitle,
									children: t("targets.add.title")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: sections_module_css_default.formGrid,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: sections_module_css_default.field,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: sections_module_css_default.fieldLabel,
												children: [t("targets.add.field.address"), " *"]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												className: sections_module_css_default.fieldInput,
												value: form.address,
												placeholder: t("targets.add.placeholder.address"),
												autoFocus: true,
												onChange: (event) => {
													patchForm({ address: event.target.value });
												}
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: sections_module_css_default.field,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: sections_module_css_default.fieldLabel,
												children: t("targets.add.field.kind")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
												className: sections_module_css_default.fieldInput,
												value: form.kind,
												onChange: (event) => {
													patchForm({ kind: event.target.value });
												},
												children: KIND_OPTIONS.map((kind) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: kind,
													children: t(kind)
												}, kind))
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: sections_module_css_default.field,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: sections_module_css_default.fieldLabel,
												children: t("targets.add.field.os")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												className: sections_module_css_default.fieldInput,
												value: form.os,
												placeholder: t("targets.add.placeholder.os"),
												onChange: (event) => {
													patchForm({ os: event.target.value });
												}
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: sections_module_css_default.field,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: sections_module_css_default.fieldLabel,
												children: t("targets.add.field.ports")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												className: sections_module_css_default.fieldInput,
												value: form.ports,
												placeholder: t("targets.add.placeholder.ports"),
												onChange: (event) => {
													patchForm({ ports: event.target.value });
												}
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: sections_module_css_default.field,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: sections_module_css_default.fieldLabel,
												children: t("targets.add.field.rights")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
												className: sections_module_css_default.fieldInput,
												value: form.rights,
												onChange: (event) => {
													patchForm({ rights: event.target.value });
												},
												children: RIGHTS_OPTIONS.map((rights) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: rights,
													children: t(rights)
												}, rights))
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: sections_module_css_default.field,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: sections_module_css_default.fieldLabel,
												children: t("targets.add.field.state")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
												className: sections_module_css_default.fieldInput,
												value: form.state,
												onChange: (event) => {
													patchForm({ state: event.target.value });
												},
												children: STATE_OPTIONS.map((state) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: state,
													children: t(state)
												}, state))
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: sections_module_css_default.field,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: sections_module_css_default.fieldLabel,
												children: t("targets.add.field.owner")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												className: sections_module_css_default.fieldInput,
												value: form.owner,
												placeholder: t("targets.add.placeholder.owner"),
												onChange: (event) => {
													patchForm({ owner: event.target.value });
												}
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: sections_module_css_default.fieldCheck,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: form.inScope,
												onChange: (event) => {
													patchForm({ inScope: event.target.checked });
												}
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("targets.add.field.inScope") })]
										})
									]
								}),
								addError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: sections_module_css_default.modalError,
									children: t("targets.add.failed", { error: addError })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: sections_module_css_default.modalActions,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: sections_module_css_default.modalCancel,
										disabled: addBusy,
										onClick: cancelAdd,
										children: t("targets.add.cancel")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: sections_module_css_default.modalConfirm,
										disabled: addBusy,
										onClick: () => {
											submitAdd();
										},
										children: t("targets.add.submit")
									})]
								})
							]
						})
					}),
					pending !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: sections_module_css_default.modalBackdrop,
						role: "presentation",
						onClick: cancelDelete,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: sections_module_css_default.modal,
							role: "alertdialog",
							"aria-modal": "true",
							"aria-label": t("targets.delete.confirmTitle"),
							onClick: (event) => {
								event.stopPropagation();
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
									className: sections_module_css_default.modalTitle,
									children: t("targets.delete.confirmTitle")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: sections_module_css_default.modalBody,
									children: t("targets.delete.confirmBody")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: sections_module_css_default.modalAddress,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: sections_module_css_default.mono,
										children: t("targets.delete.address", { address: pending.address })
									})
								}),
								error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: sections_module_css_default.modalError,
									children: t("targets.delete.failed", { error })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: sections_module_css_default.modalActions,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: sections_module_css_default.modalCancel,
										disabled: busy,
										onClick: cancelDelete,
										children: t("targets.delete.cancel")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: sections_module_css_default.modalConfirm,
										disabled: busy,
										onClick: () => {
											confirmDelete();
										},
										children: t("targets.delete.confirm")
									})]
								})
							]
						})
					})
				]
			});
		}
		//#endregion
		//#region src/client/sections/JobsSection.tsx
		/**
		* Jobs section: the task queue with per-row progress bars. State tones
		* follow the platform tokens; progress width is inline (no color literals).
		*/
		/** Job state → badge tone class (clsx drops the undefined fallthrough). */
		function jobStateClass(state) {
			switch (state) {
				case "jobs.state.running": return sections_module_css_default.stateActive;
				case "jobs.state.success": return sections_module_css_default.stateSuccess;
				case "jobs.state.failed": return sections_module_css_default.stateFailed;
				case "jobs.state.queued": return sections_module_css_default.stateQueued;
				case "jobs.state.cancelled": return sections_module_css_default.stateDropped;
				default: return;
			}
		}
		/** Job state → progress-fill tone class. */
		function progressClass(state) {
			switch (state) {
				case "jobs.state.running": return sections_module_css_default.progressActive;
				case "jobs.state.success": return sections_module_css_default.progressSuccess;
				case "jobs.state.failed": return sections_module_css_default.progressFailed;
				case "jobs.state.queued": return sections_module_css_default.progressQueued;
				case "jobs.state.cancelled": return sections_module_css_default.progressQueued;
				default: return;
			}
		}
		/**
		* Render the jobs section.
		* @param props - composed slot props (contract/slots.ts).
		* @returns the job-queue table element tree.
		*/
		function JobsSection({ t, useStore }) {
			const jobs = useStore((s) => s.dataset.jobs);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: sections_module_css_default.section,
				"aria-label": t("jobs.title"),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: sections_module_css_default.sectionToolbar,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: sections_module_css_default.sectionTitle,
						children: t("jobs.title")
					})
				}), jobs.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: sections_module_css_default.empty,
					children: t("jobs.empty")
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
					className: sections_module_css_default.table,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("jobs.col.task") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("jobs.col.target") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("jobs.col.progress") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("jobs.col.state") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("jobs.col.elapsed") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("jobs.col.owner") })
					] }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: jobs.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: t(row.task, { target: row.target }) }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
							className: sections_module_css_default.mono,
							children: row.target
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: sections_module_css_default.progress,
							role: "progressbar",
							"aria-valuenow": row.progress,
							"aria-valuemin": 0,
							"aria-valuemax": 100,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: clsx(sections_module_css_default.progressFill, progressClass(row.state)),
								style: { width: `${String(row.progress)}%` }
							})
						}) }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: clsx(sections_module_css_default.badge, jobStateClass(row.state)),
							children: t(row.state)
						}) }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
							className: sections_module_css_default.mono,
							children: row.elapsed
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
							className: sections_module_css_default.mono,
							children: row.owner
						})
					] }, row.id)) })]
				})]
			});
		}
		//#endregion
		//#region src/client/sections/SessionsSection.tsx
		/**
		* Sessions section: the implant/session inventory. Heartbeat rows carry a
		* tone dot (ok/late/lost) plus the localized label — color + text double
		* encoding per the design doc, so the state survives color-blind rendering.
		*/
		/** Heartbeat tone → dot class (undefined-safe under noUncheckedIndexedAccess). */
		const TONE_CLASS = {
			ok: sections_module_css_default.dotOk,
			late: sections_module_css_default.dotLate,
			lost: sections_module_css_default.dotLost
		};
		/**
		* Render the sessions section.
		* @param props - composed slot props (contract/slots.ts).
		* @returns the session table element tree.
		*/
		function SessionsSection({ t, useStore }) {
			const sessions = useStore((s) => s.dataset.sessions);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: sections_module_css_default.section,
				"aria-label": t("sessions.title"),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: sections_module_css_default.sectionToolbar,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: sections_module_css_default.sectionTitle,
						children: t("sessions.title")
					})
				}), sessions.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: sections_module_css_default.empty,
					children: t("sessions.empty")
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
					className: sections_module_css_default.table,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("sessions.col.implants") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("sessions.col.host") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("sessions.col.user") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("sessions.col.rights") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("sessions.col.os") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("sessions.col.heartbeat") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("sessions.col.uptime") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("sessions.col.type") })
					] }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: sessions.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
							className: sections_module_css_default.mono,
							children: row.implant
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
							className: sections_module_css_default.mono,
							children: row.host
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
							className: sections_module_css_default.mono,
							children: row.user
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: t(row.rights) }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: row.os }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: sections_module_css_default.heartbeatCell,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: clsx(sections_module_css_default.dot, TONE_CLASS[row.heartbeatTone]),
								"aria-hidden": "true"
							}), t(row.heartbeat)]
						}) }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
							className: sections_module_css_default.mono,
							children: row.uptime
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: row.type })
					] }, row.id)) })]
				})]
			});
		}
		//#endregion
		//#region src/client/sections/CredentialsSection.tsx
		/**
		* Credentials section: the vault rows with masked-by-default secrets. The
		* reveal toggle is component-private viewing state; the production remote
		* would write an audit entry per reveal (the hint says so).
		*/
		/**
		* Render the credentials section.
		* @param props - composed slot props (contract/slots.ts).
		* @returns the vault table element tree.
		*/
		function CredentialsSection({ t, useStore }) {
			const credentials = useStore((s) => s.dataset.credentials);
			const [revealed, setRevealed] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const toggle = (id) => {
				setRevealed((current) => {
					const next = new Set(current);
					if (next.has(id)) next.delete(id);
					else next.add(id);
					return next;
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: sections_module_css_default.section,
				"aria-label": t("creds.title"),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: sections_module_css_default.sectionToolbar,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: sections_module_css_default.sectionTitle,
						children: t("creds.title")
					})
				}), credentials.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: sections_module_css_default.empty,
					children: t("creds.empty")
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
					className: sections_module_css_default.table,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("creds.col.username") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("creds.col.secret") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("creds.col.type") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("creds.col.source") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("creds.col.hosts") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("creds.col.updated") })
					] }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: credentials.map((row) => {
						const shown = revealed.has(row.id);
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
								className: sections_module_css_default.mono,
								children: row.username
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: sections_module_css_default.secretCell,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: sections_module_css_default.mono,
									children: shown ? row.secret : t("creds.masked")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: sections_module_css_default.reveal,
									title: shown ? void 0 : t("creds.reveal.hint"),
									"aria-label": shown ? t("creds.hide") : t("creds.reveal"),
									onClick: () => {
										toggle(row.id);
									},
									children: shown ? t("creds.hide") : t("creds.reveal")
								})]
							}) }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: t(row.type) }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: row.source }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
								className: sections_module_css_default.mono,
								children: row.hosts
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
								className: sections_module_css_default.mono,
								children: row.updated
							})
						] }, row.id);
					}) })]
				})]
			});
		}
		//#endregion
		//#region src/client/sections/ReportsSection.tsx
		/** The two shipped report templates (name/desc dictionary keys). */
		const TEMPLATES = [{
			name: "reports.template.standard",
			desc: "reports.template.standard.desc"
		}, {
			name: "reports.template.redteam",
			desc: "reports.template.redteam.desc"
		}];
		/**
		* Render the reports section.
		* @param props - composed slot props (contract/slots.ts).
		* @returns the templates + coverage element tree.
		*/
		function ReportsSection({ t, useStore }) {
			const coverage = useStore((s) => s.dataset.coverage);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: sections_module_css_default.section,
				"aria-label": t("reports.title"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: sections_module_css_default.sectionToolbar,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							className: sections_module_css_default.sectionTitle,
							children: t("reports.title")
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						className: sections_module_css_default.subTitle,
						children: t("reports.templates")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: sections_module_css_default.cardGrid,
						children: TEMPLATES.map((template) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: sections_module_css_default.card,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: sections_module_css_default.cardTitle,
								children: t(template.name)
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: sections_module_css_default.cardDesc,
								children: t(template.desc)
							})]
						}, template.name))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						className: sections_module_css_default.subTitle,
						children: t("reports.coverage")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
						className: sections_module_css_default.table,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("reports.col.tactic") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("reports.col.techniques") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("reports.col.count") })
						] }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: coverage.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: t(row.tactic) }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
								className: sections_module_css_default.mono,
								children: row.techniques
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
								className: sections_module_css_default.mono,
								children: String(row.count)
							})
						] }, row.tactic)) })]
					})
				]
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Dictionary namespace owned by this plugin. */
		const NS = "redteam";
		/** Required services: the slot system and the locale dictionaries. */
		const inject = ["slots", "locale"];
		/** The built-in console sections, registered exactly like third-party ones. */
		const SECTIONS = [
			{
				id: "dashboard",
				order: 0,
				navKey: "nav.dashboard",
				component: DashboardSection
			},
			{
				id: "targets",
				order: 1,
				navKey: "nav.targets",
				component: TargetsSection
			},
			{
				id: "jobs",
				order: 2,
				navKey: "nav.jobs",
				component: JobsSection
			},
			{
				id: "sessions",
				order: 3,
				navKey: "nav.sessions",
				component: SessionsSection
			},
			{
				id: "credentials",
				order: 4,
				navKey: "nav.credentials",
				component: CredentialsSection
			},
			{
				id: "reports",
				order: 5,
				navKey: "nav.reports",
				component: ReportsSection
			}
		];
		/**
		* Client plugin body: the locale dictionary, the shared store, and the two
		* slot contributions, each installed for the lifetime of its slot's
		* declaration (both seats are declared by shipped entries, so they are live
		* from first boot).
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-redteam: dictionaries");
			const t = ctx.locale.bind(NS);
			const store = createRedteamStore();
			let bakedActions;
			let rowsVersion = -1;
			let localeRevision = -1;
			let sectionRows = [];
			const consoleInjected = (actions) => {
				bakedActions = actions;
				return { hooks: { sections: {
					getSnapshot: () => {
						const version = ctx.slots.getVersion("redteam.section");
						const revision = ctx.locale.getSnapshot().revision;
						if (version !== rowsVersion || revision !== localeRevision) {
							rowsVersion = version;
							localeRevision = revision;
							sectionRows = ctx.slots.entries("redteam.section").map((entry) => ({
								/* v8 ignore next -- list-slot registration requires id (SlotCore rejects an entry without one) */
								id: entry.options.id ?? "",
								order: entry.options.order ?? 0,
								label: (0, _deepseek_ai_dsh_client_ui_slots.resolveSlotLabel)(entry.options.label) ?? ""
							})).sort((a, b) => a.order - b.order);
						}
						return sectionRows;
					},
					subscribe: (listener) => {
						const offLedger = ctx.slots.subscribe("redteam.section", listener);
						const offLocale = ctx.locale.subscribe(listener);
						return () => {
							offLedger();
							offLocale();
						};
					}
				} } };
			};
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "redteam",
				order: 20,
				locale: NS,
				store
			}, RedteamTrigger));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "redteam.console",
				order: 20,
				locale: NS,
				store,
				children: { "redteam.section": {
					kind: "list",
					scope: "root"
				} },
				inject: consoleInjected
			}, RedteamConsole));
			ctx.effect(() => {
				const pump = new RedteamDataPump();
				const timer = setInterval(() => {
					pump.fetchDataset().then((dataset) => {
						if (dataset !== void 0) bakedActions?.setDataset(dataset);
					});
				}, REDTEAM_PUMP_INTERVAL_MS);
				return () => {
					clearInterval(timer);
				};
			}, "ui-redteam: data pump");
			for (const section of SECTIONS) ctx.slots.inject("redteam.section", () => ctx.slots.register({
				name: "redteam.section",
				id: section.id,
				order: section.order,
				label: () => t(section.navKey),
				locale: NS,
				store
			}, section.component));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map