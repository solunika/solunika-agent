import { SessionDialog } from "../dialogs/session-dialog.js";
import { OutgoingReferRequest } from "../messages/methods/refer.js";
import { OutgoingRequestDelegate, RequestOptions } from "../messages/outgoing-request.js";
import { UserAgentClient } from "./user-agent-client.js";
/**
 * REFER UAC.
 * @public
 */
export declare class ReferUserAgentClient extends UserAgentClient implements OutgoingReferRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}
