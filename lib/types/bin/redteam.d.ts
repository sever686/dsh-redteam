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
/** `redteam init [file]` — write the empty dataset template. */
export declare function initDataset(target: string): number;
/** `redteam merge <fragment.json> <file>` — upsert a fragment into the dataset file. */
export declare function mergeIntoDataset(fragmentPath: string, targetPath: string): number;
/** `redteam publish <file> <distDir>` — validate and copy into the dist root. */
export declare function publishDataset(source: string, distDir: string): number;
/** Dispatch one CLI invocation. */
export declare function runRedteam(args: readonly string[]): number;
//# sourceMappingURL=redteam.d.ts.map