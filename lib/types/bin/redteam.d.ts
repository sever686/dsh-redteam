/** Dataset filename the console polls inside the dist root. */
export declare const PUMP_FILENAME = "redteam-data.json";
/** Default output path of `redteam init`. */
export declare const DEFAULT_INIT_FILE = "redteam-data.json";
/** `redteam init [file]` — write the empty dataset template. */
export declare function initDataset(target: string): number;
/** `redteam publish <file> <distDir>` — validate and copy into the dist root. */
export declare function publishDataset(source: string, distDir: string): number;
/** Dispatch one CLI invocation. */
export declare function runRedteam(args: readonly string[]): number;
//# sourceMappingURL=redteam.d.ts.map