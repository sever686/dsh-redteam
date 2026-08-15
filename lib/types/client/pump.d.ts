/**
 * Data pump: fetches the red-team dataset from the frontend-static-served
 * `/redteam-data.json` (a file under the frontend dist root, written by the
 * scanning pipeline — see README "Data pump" section). Failures keep the
 * last good dataset; a failed FIRST fetch yields undefined and leaves the
 * store at its empty state. This is the interim channel until a host Remote
 * domain replaces the file; the validation below pins the wire shape.
 */
import type { RedteamDataset } from './demo.ts';
/** Served path of the pump file (dist-root static file, same origin). */
export declare const REDTEAM_DATA_URL = "/redteam-data.json";
/** Poll cadence of the apply-world pump loop. */
export declare const REDTEAM_PUMP_INTERVAL_MS = 5000;
/**
 * One pump instance owns the last-good-dataset memory.
 */
export declare class RedteamDataPump {
    private last;
    /**
     * Fetch and validate the current dataset.
     * @returns the parsed dataset, the last good one on failure, or undefined before any success.
     */
    fetchDataset(): Promise<RedteamDataset | undefined>;
}
//# sourceMappingURL=pump.d.ts.map