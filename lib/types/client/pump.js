/** Served path of the pump file (dist-root static file, same origin). */
export const REDTEAM_DATA_URL = '/redteam-data.json';
/** Poll cadence of the apply-world pump loop. */
export const REDTEAM_PUMP_INTERVAL_MS = 5000;
/** Member-by-member wire-shape guard: arrays of rows, nothing deeper. */
function isDataset(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const candidate = value;
    return Array.isArray(candidate.targets)
        && Array.isArray(candidate.jobs)
        && Array.isArray(candidate.sessions)
        && Array.isArray(candidate.credentials)
        && Array.isArray(candidate.activity)
        && Array.isArray(candidate.coverage);
}
/**
 * One pump instance owns the last-good-dataset memory.
 */
export class RedteamDataPump {
    last;
    /**
     * Fetch and validate the current dataset.
     * @returns the parsed dataset, the last good one on failure, or undefined before any success.
     */
    async fetchDataset() {
        try {
            const response = await fetch(REDTEAM_DATA_URL, { cache: 'no-store' });
            if (!response.ok)
                return this.last;
            const data = await response.json();
            if (!isDataset(data))
                return this.last;
            this.last = data;
            return data;
        }
        catch {
            return this.last;
        }
    }
}
//# sourceMappingURL=pump.js.map