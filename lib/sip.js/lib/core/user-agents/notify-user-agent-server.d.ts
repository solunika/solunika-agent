import { Dialog } from "../dialogs/dialog.js";
import { IncomingNotifyRequest } from "../messages/methods/notify.js";
import { IncomingRequestDelegate } from "../messages/incoming-request.js";
import { IncomingRequestMessage } from "../messages/incoming-request-message.js";
import { UserAgentCore } from "../user-agent-core/user-agent-core.js";
import { UserAgentServer } from "./user-agent-server.js";
/**
 * NOTIFY UAS.
 * @public
 */
export declare class NotifyUserAgentServer extends UserAgentServer implements IncomingNotifyRequest {
    /**
     * NOTIFY UAS constructor.
     * @param dialogOrCore - Dialog for in dialog NOTIFY, UserAgentCore for out of dialog NOTIFY (deprecated).
     * @param message - Incoming NOTIFY request message.
     */
    constructor(dialogOrCore: Dialog | UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
