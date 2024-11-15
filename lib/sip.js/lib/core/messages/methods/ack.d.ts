import { IncomingRequestMessage } from "../incoming-request-message.js";
import { OutgoingRequestMessage } from "../outgoing-request-message.js";
/**
 * Incoming ACK request.
 * @public
 */
export interface IncomingAckRequest {
    /** The incoming message. */
    readonly message: IncomingRequestMessage;
}
/**
 * Outgoing ACK request.
 * @public
 */
export interface OutgoingAckRequest {
    /** The outgoing message. */
    readonly message: OutgoingRequestMessage;
}
