import { Exception } from "./exception.js";
/**
 * Transport error.
 * @public
 */
export class TransportError extends Exception {
    constructor(message) {
        super(message ? message : "Unspecified transport error.");
    }
}
