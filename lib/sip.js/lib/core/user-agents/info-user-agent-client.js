import { C } from "../messages/methods/constants.js";
import { NonInviteClientTransaction } from "../transactions/non-invite-client-transaction.js";
import { UserAgentClient } from "./user-agent-client.js";
/**
 * INFO UAC.
 * @public
 */
export class InfoUserAgentClient extends UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(C.INFO, options);
        super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
    }
}
