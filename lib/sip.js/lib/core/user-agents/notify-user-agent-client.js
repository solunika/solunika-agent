import { C } from "../messages/methods/constants.js";
import { NonInviteClientTransaction } from "../transactions/non-invite-client-transaction.js";
import { UserAgentClient } from "./user-agent-client.js";
/**
 * NOTIFY UAS.
 * @public
 */
export class NotifyUserAgentClient extends UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(C.NOTIFY, options);
        super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
    }
}
