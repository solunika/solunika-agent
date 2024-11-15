import { Exception } from "../../core/exceptions/exception.js";
/**
 * An exception indicating an invalid state transition error occured.
 * @public
 */
export class StateTransitionError extends Exception {
    constructor(message) {
        super(message ? message : "An error occurred during state transition.");
    }
}
