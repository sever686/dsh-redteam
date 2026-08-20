import { readFile, writeFile } from "node:fs/promises";
//#region lib/types/index.js
/**
* Red-team operations console plugin, node half: the target-deletion route
* POST /redteam-target-delete. Removes one target row and every row that
* references its address (jobs, sessions, credentials, activity) from BOTH
* the deployment source file (REDTEAM_DATA_FILE) and the published dist copy
* the data pump serves (REDTEAM_DATA_DIST), so a later `redteam publish`
* cannot resurrect deleted rows.
* @module @deepseek-ai/dsh-client-ui-redteam
*/
const name = "client-ui-redteam";
const inject = ["webServer"];
/** Deployment-local file paths, env-overridable. */
const SOURCE_FILE = process.env.REDTEAM_DATA_FILE ?? "C:\\Users\\jie\\redteam-data.json";
const DIST_FILE = process.env.REDTEAM_DATA_DIST ?? "D:\\27656\\Documents\\deepseek-harness\\apps\\web\\dist\\redteam-data.json";
function isDataset(value) {
	if (typeof value !== "object" || value === null) return false;
	const candidate = value;
	return Array.isArray(candidate.targets) && Array.isArray(candidate.jobs) && Array.isArray(candidate.sessions) && Array.isArray(candidate.credentials) && Array.isArray(candidate.activity) && Array.isArray(candidate.coverage);
}
function removeTargetRows(dataset, id) {
	const target = dataset.targets.find((row) => row.id === id);
	if (target === void 0) return void 0;
	const address = target.address;
	const next = {
		...dataset,
		targets: dataset.targets.filter((row) => row.id !== id),
		jobs: dataset.jobs.filter((row) => row.target !== address),
		sessions: dataset.sessions.filter((row) => row.host !== address),
		credentials: dataset.credentials.filter((row) => row.hosts !== address),
		activity: dataset.activity.filter((row) => row.target !== address)
	};
	return {
		dataset: next,
		counts: {
			targets: 1,
			jobs: dataset.jobs.length - next.jobs.length,
			sessions: dataset.sessions.length - next.sessions.length,
			credentials: dataset.credentials.length - next.credentials.length,
			activity: dataset.activity.length - next.activity.length
		}
	};
}
async function readBody(req) {
	const chunks = [];
	for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	return Buffer.concat(chunks).toString("utf8");
}
async function loadDataset() {
	for (const path of [SOURCE_FILE, DIST_FILE]) try {
		const text = await readFile(path, "utf8");
		const parsed = JSON.parse(text);
		if (!isDataset(parsed)) continue;
		return path === SOURCE_FILE ? {
			dataset: parsed,
			sourcePath: SOURCE_FILE,
			distPath: DIST_FILE
		} : {
			dataset: parsed,
			distPath: DIST_FILE
		};
	} catch {}
}
function respond(res, status, value) {
	res.writeHead(status, {
		"content-type": "application/json",
		"cache-control": "no-store"
	});
	res.end(JSON.stringify(value));
}
const TARGET_KINDS = new Set([
	"targets.kind.host",
	"targets.kind.domain",
	"targets.kind.web",
	"targets.kind.cloud"
]);
const TARGET_STATES = new Set([
	"targets.state.queued",
	"targets.state.recon",
	"targets.state.breached",
	"targets.state.dropped"
]);
const TARGET_RIGHTS = new Set([
	"targets.rights.none",
	"targets.rights.user",
	"targets.rights.admin",
	"targets.rights.system",
	"targets.rights.domain-admin"
]);
/**
* Register the deletion route on the composed webServer.
* @param ctx - host context carrying the webServer service.
*/
function apply(ctx) {
	const host = ctx;
	ctx.effect(() => host.webServer.register({
		kind: "exact",
		path: "/redteam-target-delete",
		handler: async (req, res) => {
			if (req.method !== "POST") {
				respond(res, 405, { error: "method-not-allowed" });
				return;
			}
			try {
				const raw = await readBody(req);
				const payload = JSON.parse(raw);
				const id = typeof payload.id === "string" ? payload.id : "";
				if (id === "") {
					respond(res, 400, { error: "missing target id" });
					return;
				}
				const loaded = await loadDataset();
				if (loaded === void 0) {
					respond(res, 404, { error: "dataset file not found or invalid" });
					return;
				}
				const result = removeTargetRows(loaded.dataset, id);
				if (result === void 0) {
					respond(res, 404, { error: "target not found" });
					return;
				}
				const files = [];
				if (loaded.sourcePath !== void 0) {
					await writeFile(loaded.sourcePath, JSON.stringify(result.dataset, null, 2));
					files.push("source");
				}
				await writeFile(loaded.distPath, JSON.stringify(result.dataset, null, 2));
				files.push("dist");
				respond(res, 200, {
					ok: true,
					removed: result.counts,
					files
				});
			} catch (error) {
				respond(res, 500, { error: String(error) });
			}
		}
	}), "ui-redteam: target-delete route");
	ctx.effect(() => host.webServer.register({
		kind: "exact",
		path: "/redteam-target-add",
		handler: async (req, res) => {
			if (req.method !== "POST") {
				respond(res, 405, { error: "method-not-allowed" });
				return;
			}
			try {
				const raw = await readBody(req);
				const payload = JSON.parse(raw);
				const address = typeof payload.address === "string" ? payload.address.trim() : "";
				if (address === "") {
					respond(res, 400, { error: "missing address" });
					return;
				}
				const loaded = await loadDataset();
				if (loaded === void 0) {
					respond(res, 404, { error: "dataset file not found or invalid" });
					return;
				}
				if (loaded.dataset.targets.some((row) => row.address.toLowerCase() === address.toLowerCase())) {
					respond(res, 409, { error: "duplicate address" });
					return;
				}
				let id = `manual-${address}`;
				let suffix = 2;
				while (loaded.dataset.targets.some((row) => row.id === id)) id = `manual-${address}-${suffix++}`;
				const target = {
					id,
					address,
					kind: typeof payload.kind === "string" && TARGET_KINDS.has(payload.kind) ? payload.kind : "targets.kind.host",
					os: typeof payload.os === "string" && payload.os.trim() !== "" ? payload.os.trim() : null,
					ports: typeof payload.ports === "string" ? payload.ports.trim() : "",
					rights: typeof payload.rights === "string" && TARGET_RIGHTS.has(payload.rights) ? payload.rights : "targets.rights.none",
					state: typeof payload.state === "string" && TARGET_STATES.has(payload.state) ? payload.state : "targets.state.queued",
					inScope: payload.inScope !== false,
					owner: typeof payload.owner === "string" && payload.owner.trim() !== "" ? payload.owner.trim() : "manual"
				};
				const next = {
					...loaded.dataset,
					targets: [...loaded.dataset.targets, target]
				};
				const files = [];
				if (loaded.sourcePath !== void 0) {
					await writeFile(loaded.sourcePath, JSON.stringify(next, null, 2));
					files.push("source");
				}
				await writeFile(loaded.distPath, JSON.stringify(next, null, 2));
				files.push("dist");
				respond(res, 200, {
					ok: true,
					target,
					files
				});
			} catch (error) {
				respond(res, 500, { error: String(error) });
			}
		}
	}), "ui-redteam: target-add route");
}
//#endregion
export { apply, inject, name };
