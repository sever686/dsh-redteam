import { type RedteamDataset } from '../client/demo.ts';
/** Dataset filename the console polls inside the dist root. */
export declare const PUMP_FILENAME = "redteam-data.json";
/** Default output path of `redteam init`. */
export declare const DEFAULT_INIT_FILE = "redteam-data.json";
/**
 * Merge a fragment into a base dataset: targets/jobs/sessions/credentials
 * upsert by id, activity upserts by id then re-orders newest-first, coverage
 * upserts by tactic. Absent fragment keys keep the base arrays.
 * @param base - the current dataset.
 * @param fragment - the tool-result fragment (partial allowed).
 * @returns the merged dataset.
 */
export declare function mergeDatasets(base: RedteamDataset, fragment: Partial<RedteamDataset>): RedteamDataset;
/**
 * Convert `nmap -oX` output into fragment rows: one target per scanned host
 * (open ports as a `proto/port` list, first osmatch as the OS hint) plus one
 * info scan event per host. Host ids are `nmap:<ip>`, so re-importing the
 * same scan upserts instead of duplicating. Regex-scoped to nmap's flat,
 * stable host/port structure — no XML dependency is pulled in.
 */
export declare function parseNmapXml(text: string): Partial<RedteamDataset>;
/**
 * Convert nuclei JSONL (`nuclei -j`) output into activity rows: one recon
 * event per unique template/host hit, severity passed through nuclei's own
 * five levels. Malformed lines are skipped rather than failing the file.
 */
export declare function parseNucleiJsonl(text: string): Partial<RedteamDataset>;
/**
 * Convert Burp scanner issues (an array, or `{ issues: [...] }`) into
 * activity rows: one breach event per unique name/target, mapping Burp's
 * severity scale (informational → info). Field names are matched
 * defensively so both the MCP tool output and Burp exports parse. Returns
 * undefined when the file is not JSON — imports fail loudly, not silently.
 */
export declare function parseBurpIssues(text: string): Partial<RedteamDataset> | undefined;
/** `redteam init [file]` — write the empty dataset template. */
export declare function initDataset(target: string): number;
/** `redteam merge <fragment.json> <file>` — upsert a fragment into the dataset file. */
export declare function mergeIntoDataset(fragmentPath: string, targetPath: string): number;
/** `redteam publish <file> <distDir>` — validate and copy into the dist root. */
export declare function publishDataset(source: string, distDir: string): number;
/** Dispatch one CLI invocation. */
export declare function runRedteam(args: readonly string[]): number;
//# sourceMappingURL=redteam.d.ts.map