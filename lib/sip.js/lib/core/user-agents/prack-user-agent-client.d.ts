import { SessionDialog } from "../dialogs/session-dialog.js";
import { OutgoingPrackRequest } from "../messages/methods/prack.js";
import { OutgoingRequestDelegate, RequestOptions } from "../messages/outgoing-request.js";
import { UserAgentClient } from "./user-agent-client.js";
/**
 * PRACK UAC.
 * @public
 */
export declare class PrackUserAgentClient extends UserAgentClient implements OutgoingPrackRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}
