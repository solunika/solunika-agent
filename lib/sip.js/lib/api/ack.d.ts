import { IncomingAckRequest } from "../core/messages/methods/ack.js";
import { IncomingRequestMessage } from "../core/messages/incoming-request-message.js";
/**
 * A request to confirm a {@link Session} (incoming ACK).
 * @public
 */
export declare class Ack {
    private incomingAckRequest;
    /** @internal */
    constructor(incomingAckRequest: IncomingAckRequest);
    /** Incoming ACK request message. */
    get request(): IncomingRequestMessage;
}
