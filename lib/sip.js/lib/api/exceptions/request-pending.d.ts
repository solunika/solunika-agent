import { Exception } from "../../core/exceptions/exception.js";
/**
 * An exception indicating an outstanding prior request prevented execution.
 * @public
 */
export declare class RequestPendingError extends Exception {
    /** @internal */
    constructor(message?: string);
}
