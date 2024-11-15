import { Exception } from "../../core/exceptions/exception.js";
/**
 * An exception indicating an invalid state transition error occured.
 * @public
 */
export declare class StateTransitionError extends Exception {
    constructor(message?: string);
}
