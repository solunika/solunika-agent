import { C } from "../messages/methods/constants.js";
import { NonInviteClientTransaction } from "../transactions/non-invite-client-transaction.js";
import { UserAgentClient } from "./user-agent-client.js";
/**
 * REFER UAC.
 * @public
 */
export class ReferUserAgentClient extends UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(C.REFER, options);
        super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
    }
}
