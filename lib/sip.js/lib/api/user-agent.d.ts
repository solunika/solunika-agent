import { URI } from "../grammar/uri.js";
import { Contact } from "../core/user-agent-core/user-agent-core-configuration.js";
import { Logger } from "../core/log/logger.js";
import { LoggerFactory } from "../core/log/logger-factory.js";
import { UserAgentCore } from "../core/user-agent-core/user-agent-core.js";
import { Emitter } from "./emitter.js";
import { Inviter } from "./inviter.js";
import { InviterOptions } from "./inviter-options.js";
import { Publisher } from "./publisher.js";
import { Registerer } from "./registerer.js";
import { Session } from "./session.js";
import { Subscription } from "./subscription.js";
import { Transport } from "./transport.js";
import { UserAgentDelegate } from "./user-agent-delegate.js";
import { UserAgentOptions } from "./user-agent-options.js";
import { UserAgentState } from "./user-agent-state.js";
/**
 * A user agent sends and receives requests using a `Transport`.
 *
 * @remarks
 * A user agent (UA) is associated with a user via the user's SIP address of record (AOR)
 * and acts on behalf of that user to send and receive SIP requests. The user agent can
 * register to receive incoming requests, as well as create and send outbound messages.
 * The user agent also maintains the Transport over which its signaling travels.
 *
 * @public
 */
export declare class UserAgent {
    /**
     * Property reserved for use by instance owner.
     * @defaultValue `undefined`
     */
    data: unknown;
    /**
     * Delegate.
     */
    delegate: UserAgentDelegate | undefined;
    /** @internal */
    _publishers: {
        [id: string]: Publisher;
    };
    /** @internal */
    _registerers: {
        [id: string]: Registerer;
    };
    /** @internal */
    _sessions: {
        [id: string]: Session;
    };
    /** @internal */
    _subscriptions: {
        [id: string]: Subscription;
    };
    private _contact;
    private _instanceId;
    private _state;
    private _stateEventEmitter;
    private _transport;
    private _userAgentCore;
    /** Logger. */
    private logger;
    /** LoggerFactory. */
    private loggerFactory;
    /** Options. */
    private options;
    /**
     * Constructs a new instance of the `UserAgent` class.
     * @param options - Options bucket. See {@link UserAgentOptions} for details.
     */
    constructor(options?: Partial<UserAgentOptions>);
    /**
     * Create a URI instance from a string.
     * @param uri - The string to parse.
     *
     * @remarks
     * Returns undefined if the syntax of the URI is invalid.
     * The syntax must conform to a SIP URI as defined in the RFC.
     * 25 Augmented BNF for the SIP Protocol
     * https://tools.ietf.org/html/rfc3261#section-25
     *
     * @example
     * ```ts
     * const uri = UserAgent.makeURI("sip:edgar@example.com");
     * ```
     */
    static makeURI(uri: string): URI | undefined;
    /** Default user agent options. */
    private static defaultOptions;
    private static newUUID;
    /**
     * Strip properties with undefined values from options.
     * This is a work around while waiting for missing vs undefined to be addressed (or not)...
     * https://github.com/Microsoft/TypeScript/issues/13195
     * @param options - Options to reduce
     */
    private static stripUndefinedProperties;
    /**
     * User agent configuration.
     */
    get configuration(): Required<UserAgentOptions>;
    /**
     * User agent contact.
     */
    get contact(): Contact;
    /**
     * User agent instance id.
     */
    get instanceId(): string;
    /**
     * User agent state.
     */
    get state(): UserAgentState;
    /**
     * User agent state change emitter.
     */
    get stateChange(): Emitter<UserAgentState>;
    /**
     * User agent transport.
     */
    get transport(): Transport;
    /**
     * User agent core.
     */
    get userAgentCore(): UserAgentCore;
    /**
     * The logger.
     */
    getLogger(category: string, label?: string): Logger;
    /**
     * The logger factory.
     */
    getLoggerFactory(): LoggerFactory;
    /**
     * True if transport is connected.
     */
    isConnected(): boolean;
    /**
     * Reconnect the transport.
     */
    reconnect(): Promise<void>;
    /**
     * Start the user agent.
     *
     * @remarks
     * Resolves if transport connects, otherwise rejects.
     * Calling `start()` after calling `stop()` will fail if `stop()` has yet to resolve.
     *
     * @example
     * ```ts
     * userAgent.start()
     *   .then(() => {
     *     // userAgent.isConnected() === true
     *   })
     *   .catch((error: Error) => {
     *     // userAgent.isConnected() === false
     *   });
     * ```
     */
    start(): Promise<void>;
    /**
     * Stop the user agent.
     *
     * @remarks
     * Resolves when the user agent has completed a graceful shutdown.
     * ```txt
     * 1) Sessions terminate.
     * 2) Registerers unregister.
     * 3) Subscribers unsubscribe.
     * 4) Publishers unpublish.
     * 5) Transport disconnects.
     * 6) User Agent Core resets.
     * ```
     * The user agent state transistions to stopped once these steps have been completed.
     * Calling `start()` after calling `stop()` will fail if `stop()` has yet to resolve.
     *
     * NOTE: While this is a "graceful shutdown", it can also be very slow one if you
     * are waiting for the returned Promise to resolve. The disposal of the clients and
     * dialogs is done serially - waiting on one to finish before moving on to the next.
     * This can be slow if there are lot of subscriptions to unsubscribe for example.
     *
     * THE SLOW PACE IS INTENTIONAL!
     * While one could spin them all down in parallel, this could slam the remote server.
     * It is bad practice to denial of service attack (DoS attack) servers!!!
     * Moreover, production servers will automatically blacklist clients which send too
     * many requests in too short a period of time - dropping any additional requests.
     *
     * If a different approach to disposing is needed, one can implement whatever is
     * needed and execute that prior to calling `stop()`. Alternatively one may simply
     * not wait for the Promise returned by `stop()` to complete.
     */
    stop(): Promise<void>;
    /**
     * Used to avoid circular references.
     * @internal
     */
    _makeInviter(targetURI: URI, options?: InviterOptions): Inviter;
    /**
     * Attempt reconnection up to `maxReconnectionAttempts` times.
     * @param reconnectionAttempt - Current attempt number.
     */
    private attemptReconnection;
    /**
     * Initialize contact.
     */
    private initContact;
    /**
     * Initialize user agent core.
     */
    private initCore;
    private initTransportCallbacks;
    private onTransportConnect;
    private onTransportDisconnect;
    private onTransportMessage;
    /**
     * Transition state.
     */
    private transitionState;
}
