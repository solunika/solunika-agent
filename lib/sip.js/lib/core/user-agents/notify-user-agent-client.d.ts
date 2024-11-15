import { SessionDialog } from "../dialogs/session-dialog.js";
import { OutgoingNotifyRequest } from "../messages/methods/notify.js";
import { OutgoingRequestDelegate, RequestOptions } from "../messages/outgoing-request.js";
import { UserAgentClient } from "./user-agent-client.js";
/**
 * NOTIFY UAS.
 * @public
 */
export declare class NotifyUserAgentClient extends UserAgentClient implements OutgoingNotifyRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}
