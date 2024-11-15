import { IncomingRequestMessage } from "../core/messages/incoming-request-message.js";
/**
 * A request to reject an {@link Invitation} (incoming CANCEL).
 * @public
 */
export declare class Cancel {
    private incomingCancelRequest;
    /** @internal */
    constructor(incomingCancelRequest: IncomingRequestMessage);
    /** Incoming CANCEL request message. */
    get request(): IncomingRequestMessage;
}
