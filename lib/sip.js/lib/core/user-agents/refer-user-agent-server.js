import { NonInviteServerTransaction } from "../transactions/non-invite-server-transaction.js";
import { UserAgentServer } from "./user-agent-server.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function instanceOfSessionDialog(object) {
    return object.userAgentCore !== undefined;
}
/**
 * REFER UAS.
 * @public
 */
export class ReferUserAgentServer extends UserAgentServer {
    /**
     * REFER UAS constructor.
     * @param dialogOrCore - Dialog for in dialog REFER, UserAgentCore for out of dialog REFER.
     * @param message - Incoming REFER request message.
     */
    constructor(dialogOrCore, message, delegate) {
        const userAgentCore = instanceOfSessionDialog(dialogOrCore) ? dialogOrCore.userAgentCore : dialogOrCore;
        super(NonInviteServerTransaction, userAgentCore, message, delegate);
    }
}
