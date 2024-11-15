import { SessionDialog } from "../dialogs/session-dialog.js";
import { OutgoingInfoRequest } from "../messages/methods/info.js";
import { OutgoingRequestDelegate, RequestOptions } from "../messages/outgoing-request.js";
import { UserAgentClient } from "./user-agent-client.js";
/**
 * INFO UAC.
 * @public
 */
export declare class InfoUserAgentClient extends UserAgentClient implements OutgoingInfoRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}
