#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
/** The shipped empty dataset — the store's initial state until the pump lands. */
const EMPTY_DATASET = {
	targets: [],
	jobs: [],
	sessions: [],
	credentials: [],
	activity: [],
	coverage: [
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
	]
};
//#endregion
//#region src/bin/redteam.ts
/**
* `redteam` — companion CLI for the red-team console data pump.
*
* The console polls `/redteam-data.json`, a file inside the frontend dist
* root. This CLI manages that file so external users run the whole pump with
* three commands:
*
*   redteam init [file]                        write the empty dataset template
*   redteam merge <fragment.json> <file>       upsert rows into a dataset file
*   redteam publish <file> <distDir>           copy (validating) a dataset into the dist root
*
* Zero runtime dependencies (node builtins only). The dataset template is the
* package's own EMPTY_DATASET, so the schema never drifts from the console's
* contracts. `merge` is the scanning-pipeline primitive: tool results land as
* fragments and are upserted without clobbering existing rows.
*/
/** Dataset filename the console polls inside the dist root. */
const PUMP_FILENAME = "redteam-data.json";
/** Default output path of `redteam init`. */
const DEFAULT_INIT_FILE = PUMP_FILENAME;
/** The six dataset array keys, in canonical order. */
const DATASET_KEYS = [
	"targets",
	"jobs",
	"sessions",
	"credentials",
	"activity",
	"coverage"
];
/** Narrow an unknown JSON value to a dataset with all six arrays. */
function isDataset(value) {
	if (typeof value !== "object" || value === null) return false;
	const candidate = value;
	return DATASET_KEYS.every((key) => Array.isArray(candidate[key]));
}
/**
* Narrow an unknown JSON value to a partial dataset fragment: every PRESENT
* key must be one of the six dataset arrays (absent keys are kept from the
* base). Empty fragments are valid no-ops.
*/
function isFragment(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
	const candidate = value;
	for (const [key, member] of Object.entries(candidate)) {
		if (!DATASET_KEYS.includes(key)) return false;
		if (!Array.isArray(member)) return false;
	}
	return true;
}
/** Upsert rows by their `id` field; fragment rows win over same-id base rows. */
function upsertById(base, fragment) {
	const byId = new Map(base.map((row) => [row.id, row]));
	for (const row of fragment) byId.set(row.id, row);
	return [...byId.values()];
}
/** Descending activity order: numeric ids count down, non-numeric fall back to lexicographic desc. */
function newestFirst(rows) {
	rows.sort((left, right) => {
		const leftN = Number(left.id);
		const rightN = Number(right.id);
		if (!Number.isNaN(leftN) && !Number.isNaN(rightN)) return rightN - leftN;
		return String(right.id).localeCompare(String(left.id));
	});
}
/** Upsert coverage rows by their `tactic` field. */
function upsertByTactic(base, fragment) {
	const byTactic = new Map(base.map((row) => [row.tactic, row]));
	for (const row of fragment) byTactic.set(row.tactic, row);
	return [...byTactic.values()];
}
/**
* Merge a fragment into a base dataset: targets/jobs/sessions/credentials
* upsert by id, activity upserts by id then re-orders newest-first, coverage
* upserts by tactic. Absent fragment keys keep the base arrays.
* @param base - the current dataset.
* @param fragment - the tool-result fragment (partial allowed).
* @returns the merged dataset.
*/
function mergeDatasets(base, fragment) {
	return {
		targets: fragment.targets === void 0 ? base.targets : upsertById(base.targets, fragment.targets),
		jobs: fragment.jobs === void 0 ? base.jobs : upsertById(base.jobs, fragment.jobs),
		sessions: fragment.sessions === void 0 ? base.sessions : upsertById(base.sessions, fragment.sessions),
		credentials: fragment.credentials === void 0 ? base.credentials : upsertById(base.credentials, fragment.credentials),
		activity: fragment.activity === void 0 ? base.activity : (() => {
			const merged = upsertById(base.activity, fragment.activity);
			newestFirst(merged);
			return merged;
		})(),
		coverage: fragment.coverage === void 0 ? base.coverage : upsertByTactic(base.coverage, fragment.coverage)
	};
}
/** Strip a leading UTF-8 BOM: Windows editors/tools commonly prepend one. */
function stripBom(text) {
	return text.charCodeAt(0) === 65279 ? text.slice(1) : text;
}
/** Parse and shape-check one dataset JSON file; writes diagnostics and returns undefined on failure. */
function readDataset(path) {
	let text;
	try {
		text = readFileSync(path, "utf8");
	} catch {
		process.stderr.write(`redteam: cannot read ${path}\n`);
		return;
	}
	let value;
	try {
		value = JSON.parse(stripBom(text));
	} catch (error) {
		process.stderr.write(`redteam: ${path} is not valid JSON: ${String(error)}\n`);
		return;
	}
	if (!isDataset(value)) {
		process.stderr.write(`redteam: ${path} is not a dataset (needs the six array members)\n`);
		return;
	}
	return value;
}
function printHelp() {
	process.stdout.write("redteam — companion CLI for the dsh red-team console data pump\n\n  redteam init [file]                    write the empty dataset template (default: redteam-data.json)\n  redteam merge <fragment.json> <file>   upsert rows from a fragment into a dataset file (in place)\n  redteam publish <file> <distDir>       validate and copy a dataset into the frontend dist root\n  redteam help                           print this help\n\nThe console polls /redteam-data.json every 5s; publish lands the file\nwhere the frontend-static server exposes it. merge semantics: rows\nupsert by id (coverage by tactic); activity re-orders newest-first.\n");
}
/** `redteam init [file]` — write the empty dataset template. */
function initDataset(target) {
	if (existsSync(target)) {
		process.stderr.write(`redteam: ${target} already exists (refusing to overwrite)\n`);
		return 1;
	}
	writeFileSync(target, `${JSON.stringify(EMPTY_DATASET, null, 2)}\n`);
	process.stdout.write(`redteam: wrote empty dataset to ${resolve(target)}\n`);
	return 0;
}
/** `redteam merge <fragment.json> <file>` — upsert a fragment into the dataset file. */
function mergeIntoDataset(fragmentPath, targetPath) {
	let text;
	try {
		text = readFileSync(fragmentPath, "utf8");
	} catch {
		process.stderr.write(`redteam: cannot read fragment ${fragmentPath}\n`);
		return 1;
	}
	let fragment;
	try {
		fragment = JSON.parse(stripBom(text));
	} catch (error) {
		process.stderr.write(`redteam: ${fragmentPath} is not valid JSON: ${String(error)}\n`);
		return 1;
	}
	if (!isFragment(fragment)) {
		process.stderr.write(`redteam: ${fragmentPath} is not a dataset fragment (present members must be the six dataset arrays)\n`);
		return 1;
	}
	const base = readDataset(targetPath);
	if (base === void 0) return 1;
	const merged = mergeDatasets(base, fragment);
	writeFileSync(targetPath, `${JSON.stringify(merged, null, 2)}\n`);
	process.stdout.write(`redteam: merged ${resolve(fragmentPath)} into ${resolve(targetPath)}\n`);
	return 0;
}
/** `redteam publish <file> <distDir>` — validate and copy into the dist root. */
function publishDataset(source, distDir) {
	const dataset = readDataset(source);
	if (dataset === void 0) return 1;
	mkdirSync(distDir, { recursive: true });
	const target = join(distDir, PUMP_FILENAME);
	writeFileSync(target, `${JSON.stringify(dataset, null, 2)}\n`);
	process.stdout.write(`redteam: published ${resolve(source)} -> ${resolve(target)}\n`);
	return 0;
}
/** Dispatch one CLI invocation. */
function runRedteam(args) {
	const [command, ...rest] = args;
	switch (command) {
		case "init": return initDataset(rest[0] ?? "redteam-data.json");
		case "merge": {
			const fragment = rest[0];
			const target = rest[1];
			if (fragment === void 0 || target === void 0) {
				process.stderr.write("redteam: usage: redteam merge <fragment.json> <dataset.json>\n");
				return 1;
			}
			return mergeIntoDataset(fragment, target);
		}
		case "publish": {
			const source = rest[0];
			const distDir = rest[1];
			if (source === void 0 || distDir === void 0) {
				process.stderr.write("redteam: usage: redteam publish <data.json> <distDir>\n");
				return 1;
			}
			return publishDataset(source, distDir);
		}
		case "help":
		case void 0:
			printHelp();
			return 0;
		default:
			process.stderr.write(`redteam: unknown command "${command}"\n`);
			printHelp();
			return 1;
	}
}
const invokedPath = process.argv[1];
if (invokedPath !== void 0 && import.meta.url === pathToFileURL(resolve(invokedPath)).href) process.exit(runRedteam(process.argv.slice(2)));
//#endregion
export { DEFAULT_INIT_FILE, PUMP_FILENAME, initDataset, mergeDatasets, mergeIntoDataset, publishDataset, runRedteam };
