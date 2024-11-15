import { IncomingNotifyRequest } from "../core/messages/methods/notify.js";
import { IncomingRequestMessage } from "../core/messages/incoming-request-message.js";
import { ResponseOptions } from "../core/messages/outgoing-response.js";
/**
 * A notification of an event (incoming NOTIFY).
 * @public
 */
export declare class Notification {
    private incomingNotifyRequest;
    /** @internal */
    constructor(incomingNotifyRequest: IncomingNotifyRequest);
    /** Incoming NOTIFY request message. */
    get request(): IncomingRequestMessage;
    /** Accept the request. */
    accept(options?: ResponseOptions): Promise<void>;
    /** Reject the request. */
    reject(options?: ResponseOptions): Promise<void>;
}
