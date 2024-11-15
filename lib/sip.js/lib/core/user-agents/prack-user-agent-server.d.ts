import { SessionDialog } from "../dialogs/session-dialog.js";
import { IncomingPrackRequest } from "../messages/methods/prack.js";
import { IncomingRequestDelegate } from "../messages/incoming-request.js";
import { IncomingRequestMessage } from "../messages/incoming-request-message.js";
import { OutgoingResponse, ResponseOptions } from "../messages/outgoing-response.js";
import { UserAgentServer } from "./user-agent-server.js";
/**
 * PRACK UAS.
 * @public
 */
export declare class PrackUserAgentServer extends UserAgentServer implements IncomingPrackRequest {
    private dialog;
    constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
    /**
     * Update the dialog signaling state on a 2xx response.
     * @param options - Options bucket.
     */
    accept(options?: ResponseOptions): OutgoingResponse;
}
