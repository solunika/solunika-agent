import { Exception } from "../../core/exceptions/exception.js";
/**
 * An exception indicating an unsupported content type prevented execution.
 * @public
 */
export class ContentTypeUnsupportedError extends Exception {
    constructor(message) {
        super(message ? message : "Unsupported content type.");
    }
}
