/**
 * Client-side re-export shim: the dataset contract lives in the
 * host-neutral src/dataset.ts (both faces import it). Keep importing from
 * './demo.ts' in client code — this module preserves the historical path.
 */
export * from '../dataset.ts'
