import { Exception } from "../../core/exceptions/exception.js";
/**
 * An exception indicating an unsupported content type prevented execution.
 * @public
 */
export declare class ContentTypeUnsupportedError extends Exception {
    constructor(message?: string);
}
