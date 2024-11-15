import { SessionDialog } from "../dialogs/session-dialog.js";
import { RequestOptions } from "../messages/outgoing-request.js";
import { IncomingResponseMessage } from "../messages/incoming-response-message.js";
import { OutgoingInviteRequest, OutgoingInviteRequestDelegate } from "../messages/methods/invite.js";
import { UserAgentClient } from "./user-agent-client.js";
/**
 * Re-INVITE UAC.
 * @remarks
 * 14 Modifying an Existing Session
 * https://tools.ietf.org/html/rfc3261#section-14
 * 14.1 UAC Behavior
 * https://tools.ietf.org/html/rfc3261#section-14.1
 * @public
 */
export declare class ReInviteUserAgentClient extends UserAgentClient implements OutgoingInviteRequest {
    delegate: OutgoingInviteRequestDelegate | undefined;
    private dialog;
    constructor(dialog: SessionDialog, delegate?: OutgoingInviteRequestDelegate, options?: RequestOptions);
    protected receiveResponse(message: IncomingResponseMessage): void;
}
