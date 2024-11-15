import { IncomingByeRequest } from "../core/messages/methods/bye.js";
import { IncomingRequestMessage } from "../core/messages/incoming-request-message.js";
import { ResponseOptions } from "../core/messages/outgoing-response.js";
/**
 * A request to end a {@link Session} (incoming BYE).
 * @public
 */
export declare class Bye {
    private incomingByeRequest;
    /** @internal */
    constructor(incomingByeRequest: IncomingByeRequest);
    /** Incoming BYE request message. */
    get request(): IncomingRequestMessage;
    /** Accept the request. */
    accept(options?: ResponseOptions): Promise<void>;
    /** Reject the request. */
    reject(options?: ResponseOptions): Promise<void>;
}
