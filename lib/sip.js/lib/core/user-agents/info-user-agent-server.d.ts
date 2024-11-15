import { SessionDialog } from "../dialogs/session-dialog.js";
import { IncomingInfoRequest } from "../messages/methods/info.js";
import { IncomingRequestDelegate } from "../messages/incoming-request.js";
import { IncomingRequestMessage } from "../messages/incoming-request-message.js";
import { UserAgentServer } from "./user-agent-server.js";
/**
 * INFO UAS.
 * @public
 */
export declare class InfoUserAgentServer extends UserAgentServer implements IncomingInfoRequest {
    constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
