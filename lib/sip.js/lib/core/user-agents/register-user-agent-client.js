import { NonInviteClientTransaction } from "../transactions/non-invite-client-transaction.js";
import { UserAgentClient } from "./user-agent-client.js";
/**
 * REGISTER UAC.
 * @public
 */
export class RegisterUserAgentClient extends UserAgentClient {
    constructor(core, message, delegate) {
        super(NonInviteClientTransaction, core, message, delegate);
    }
}
