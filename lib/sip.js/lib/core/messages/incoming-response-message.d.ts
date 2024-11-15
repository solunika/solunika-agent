import { IncomingMessage } from "./incoming-message.js";
/**
 * Incoming response message.
 * @public
 */
export declare class IncomingResponseMessage extends IncomingMessage {
    statusCode: number | undefined;
    reasonPhrase: string | undefined;
    constructor();
}
