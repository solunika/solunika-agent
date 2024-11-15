import { C } from "../messages/methods/constants.js";
import { NonInviteClientTransaction } from "../transactions/non-invite-client-transaction.js";
import { UserAgentClient } from "./user-agent-client.js";
/**
 * BYE UAC.
 * @public
 */
export class ByeUserAgentClient extends UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(C.BYE, options);
        super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
        dialog.dispose();
    }
}
