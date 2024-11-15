import { SubscriptionDialog } from "../dialogs/subscription-dialog.js";
import { OutgoingSubscribeRequest } from "../messages/methods/subscribe.js";
import { IncomingResponseMessage } from "../messages/incoming-response-message.js";
import { OutgoingRequestDelegate, RequestOptions } from "../messages/outgoing-request.js";
import { UserAgentClient } from "./user-agent-client.js";
/**
 * Re-SUBSCRIBE UAC.
 * @public
 */
export declare class ReSubscribeUserAgentClient extends UserAgentClient implements OutgoingSubscribeRequest {
    private dialog;
    constructor(dialog: SubscriptionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
    waitNotifyStop(): void;
    /**
     * Receive a response from the transaction layer.
     * @param message - Incoming response message.
     */
    protected receiveResponse(message: IncomingResponseMessage): void;
}
