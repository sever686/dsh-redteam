//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-redteam`.
* @module @deepseek-ai/dsh-client-ui-redteam/invariant
*/
const PACKAGE_NAME = "@deepseek-ai/dsh-client-ui-redteam";
/** Cordis companion plugin name. */
const name = "client-ui-redteam-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: this plugin emits no cordis events, provides no
* services, and keeps its one shared store handle inside the apply closure —
* both slot registrations ride `ctx.slots.inject` effects and die with the
* plugin fiber, which the HMR-safety spec proves by disposal.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
