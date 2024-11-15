import { URI } from "../grammar/uri.js";
import { MessagerMessageOptions } from "./messager-message-options.js";
import { MessagerOptions } from "./messager-options.js";
import { UserAgent } from "./user-agent.js";
/**
 * A messager sends a {@link Message} (outgoing MESSAGE).
 * @public
 */
export declare class Messager {
    private logger;
    private request;
    private userAgent;
    /**
     * Constructs a new instance of the `Messager` class.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - Request URI identifying the target of the message.
     * @param content - Content for the body of the message.
     * @param contentType - Content type of the body of the message.
     * @param options - Options bucket. See {@link MessagerOptions} for details.
     */
    constructor(userAgent: UserAgent, targetURI: URI, content: string, contentType?: string, options?: MessagerOptions);
    /**
     * Send the message.
     */
    message(options?: MessagerMessageOptions): Promise<void>;
}
