import { IncomingMessageRequest } from "../messages/methods/message.js";
import { IncomingRequestDelegate } from "../messages/incoming-request.js";
import { IncomingRequestMessage } from "../messages/incoming-request-message.js";
import { UserAgentCore } from "../user-agent-core/user-agent-core.js";
import { UserAgentServer } from "./user-agent-server.js";
/**
 * MESSAGE UAS.
 * @public
 */
export declare class MessageUserAgentServer extends UserAgentServer implements IncomingMessageRequest {
    constructor(core: UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
