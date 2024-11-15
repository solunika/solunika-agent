import { IncomingRequest } from "../incoming-request.js";
import { IncomingResponse } from "../incoming-response.js";
import { OutgoingRequest } from "../outgoing-request.js";
/**
 * Incoming CANCEL request.
 * @public
 */
export interface IncomingCancelRequest extends IncomingRequest {
}
/**
 * Incoming CANCEL response.
 * @public
 */
export interface IncomingCancelResponse extends IncomingResponse {
}
/**
 * Outgoing CANCEL request.
 * @public
 */
export interface OutgoingCancelRequest extends OutgoingRequest {
}
