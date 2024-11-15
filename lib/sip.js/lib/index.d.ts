declare const version = "0.21.1";
declare const name = "sip.js";
export { name, version };
export * from "./api/index.js";
export * from "./grammar/index.js";
import * as Core from "./core/index.js";
export { Core };
import * as Web from "./platform/web/index.js";
export { Web };
