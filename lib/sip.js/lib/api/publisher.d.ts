import { URI } from "../grammar/uri.js";
import { IncomingResponseMessage } from "../core/messages/incoming-response-message.js";
import { OutgoingPublishRequest } from "../core/messages/methods/publish.js";
import { Emitter } from "./emitter.js";
import { PublisherOptions } from "./publisher-options.js";
import { PublisherPublishOptions } from "./publisher-publish-options.js";
import { PublisherState } from "./publisher-state.js";
import { PublisherUnpublishOptions } from "./publisher-unpublish-options.js";
import { UserAgent } from "./user-agent.js";
/**
 * A publisher publishes a publication (outgoing PUBLISH).
 * @public
 */
export declare class Publisher {
    private event;
    private options;
    private target;
    private pubRequestBody;
    private pubRequestExpires;
    private pubRequestEtag;
    private publishRefreshTimer;
    private disposed;
    private id;
    private logger;
    private request;
    private userAgent;
    /** The publication state. */
    private _state;
    /** Emits when the registration state changes. */
    private _stateEventEmitter;
    /**
     * Constructs a new instance of the `Publisher` class.
     *
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - Request URI identifying the target of the message.
     * @param eventType - The event type identifying the published document.
     * @param options - Options bucket. See {@link PublisherOptions} for details.
     */
    constructor(userAgent: UserAgent, targetURI: URI, eventType: string, options?: PublisherOptions);
    /**
     * Destructor.
     */
    dispose(): Promise<void>;
    /** The publication state. */
    get state(): PublisherState;
    /** Emits when the publisher state changes. */
    get stateChange(): Emitter<PublisherState>;
    /**
     * Publish.
     * @param content - Body to publish
     */
    publish(content: string, options?: PublisherPublishOptions): Promise<void>;
    /**
     * Unpublish.
     */
    unpublish(options?: PublisherUnpublishOptions): Promise<void>;
    /** @internal */
    protected receiveResponse(response: IncomingResponseMessage): void;
    /** @internal */
    protected send(): OutgoingPublishRequest;
    private refreshRequest;
    private sendPublishRequest;
    /**
     * Transition publication state.
     */
    private stateTransition;
}
