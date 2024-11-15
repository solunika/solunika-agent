import { SessionDialog } from "../dialogs/session-dialog.js";
import { OutgoingByeRequest } from "../messages/methods/bye.js";
import { OutgoingRequestDelegate, RequestOptions } from "../messages/outgoing-request.js";
import { UserAgentClient } from "./user-agent-client.js";
/**
 * BYE UAC.
 * @public
 */
export declare class ByeUserAgentClient extends UserAgentClient implements OutgoingByeRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}
