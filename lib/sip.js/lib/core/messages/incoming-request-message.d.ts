import { URI } from "../../grammar/uri.js";
import { IncomingMessage } from "./incoming-message.js";
/**
 * Incoming request message.
 * @public
 */
export declare class IncomingRequestMessage extends IncomingMessage {
    ruri: URI | undefined;
    constructor();
}
