import { IncomingSubscribeRequest } from "../messages/methods/subscribe.js";
import { IncomingRequestDelegate } from "../messages/incoming-request.js";
import { IncomingRequestMessage } from "../messages/incoming-request-message.js";
import { UserAgentCore } from "../user-agent-core/user-agent-core.js";
import { UserAgentServer } from "./user-agent-server.js";
/**
 * SUBSCRIBE UAS.
 * @public
 */
export declare class SubscribeUserAgentServer extends UserAgentServer implements IncomingSubscribeRequest {
    protected core: UserAgentCore;
    constructor(core: UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
