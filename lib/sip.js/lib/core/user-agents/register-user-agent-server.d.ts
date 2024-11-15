import { IncomingRegisterRequest } from "../messages/methods/register.js";
import { IncomingRequestDelegate } from "../messages/incoming-request.js";
import { IncomingRequestMessage } from "../messages/incoming-request-message.js";
import { UserAgentCore } from "../user-agent-core/user-agent-core.js";
import { UserAgentServer } from "./user-agent-server.js";
/**
 * REGISTER UAS.
 * @public
 */
export declare class RegisterUserAgentServer extends UserAgentServer implements IncomingRegisterRequest {
    protected core: UserAgentCore;
    constructor(core: UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
