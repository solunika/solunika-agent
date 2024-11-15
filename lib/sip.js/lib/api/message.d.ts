import { IncomingMessageRequest } from "../core/messages/methods/message.js";
import { IncomingRequestMessage } from "../core/messages/incoming-request-message.js";
import { ResponseOptions } from "../core/messages/outgoing-response.js";
/**
 * A received message (incoming MESSAGE).
 * @public
 */
export declare class Message {
    private incomingMessageRequest;
    /** @internal */
    constructor(incomingMessageRequest: IncomingMessageRequest);
    /** Incoming MESSAGE request message. */
    get request(): IncomingRequestMessage;
    /** Accept the request. */
    accept(options?: ResponseOptions): Promise<void>;
    /** Reject the request. */
    reject(options?: ResponseOptions): Promise<void>;
}
