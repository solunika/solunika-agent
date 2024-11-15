import { IncomingInfoRequest } from "../core/messages/methods/info.js";
import { IncomingRequestMessage } from "../core/messages/incoming-request-message.js";
import { ResponseOptions } from "../core/messages/outgoing-response.js";
/**
 * An exchange of information (incoming INFO).
 * @public
 */
export declare class Info {
    private incomingInfoRequest;
    /** @internal */
    constructor(incomingInfoRequest: IncomingInfoRequest);
    /** Incoming MESSAGE request message. */
    get request(): IncomingRequestMessage;
    /** Accept the request. */
    accept(options?: ResponseOptions): Promise<void>;
    /** Reject the request. */
    reject(options?: ResponseOptions): Promise<void>;
}
