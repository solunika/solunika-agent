import { OutgoingCancelRequest } from "../messages/methods/cancel.js";
import { OutgoingRequestDelegate } from "../messages/outgoing-request.js";
import { OutgoingRequestMessage } from "../messages/outgoing-request-message.js";
import { UserAgentCore } from "../user-agent-core/user-agent-core.js";
import { UserAgentClient } from "./user-agent-client.js";
/**
 * CANCEL UAC.
 * @public
 */
export declare class CancelUserAgentClient extends UserAgentClient implements OutgoingCancelRequest {
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate);
}
