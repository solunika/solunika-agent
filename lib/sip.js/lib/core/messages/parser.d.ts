import { Logger } from "../log/logger.js";
import { IncomingRequestMessage } from "./incoming-request-message.js";
import { IncomingResponseMessage } from "./incoming-response-message.js";
/**
 * Extract and parse every header of a SIP message.
 * @internal
 */
export declare namespace Parser {
    function getHeader(data: any, headerStart: number): number;
    function parseHeader(message: IncomingRequestMessage | IncomingResponseMessage, data: any, headerStart: number, headerEnd: number): boolean | {
        error: string;
    };
    function parseMessage(data: string, logger: Logger): IncomingRequestMessage | IncomingResponseMessage | undefined;
}
