import { URI } from "../grammar/uri.js";
import { IncomingNotifyRequest } from "../core/messages/methods/notify.js";
import { OutgoingSubscribeRequest } from "../core/messages/methods/subscribe.js";
import { IncomingResponse } from "../core/messages/incoming-response.js";
import { SubscriberOptions } from "./subscriber-options.js";
import { SubscriberSubscribeOptions } from "./subscriber-subscribe-options.js";
import { Subscription } from "./subscription.js";
import { SubscriptionUnsubscribeOptions } from "./subscription-unsubscribe-options.js";
import { UserAgent } from "./user-agent.js";
/**
 * A subscriber establishes a {@link Subscription} (outgoing SUBSCRIBE).
 *
 * @remarks
 * This is (more or less) an implementation of a "subscriber" as
 * defined in RFC 6665 "SIP-Specific Event Notifications".
 * https://tools.ietf.org/html/rfc6665
 *
 * @example
 * ```ts
 * // Create a new subscriber.
 * const targetURI = new URI("sip", "alice", "example.com");
 * const eventType = "example-name"; // https://www.iana.org/assignments/sip-events/sip-events.xhtml
 * const subscriber = new Subscriber(userAgent, targetURI, eventType);
 *
 * // Add delegate to handle event notifications.
 * subscriber.delegate = {
 *   onNotify: (notification: Notification) => {
 *     // send a response
 *     notification.accept();
 *     // handle notification here
 *   }
 * };
 *
 * // Monitor subscription state changes.
 * subscriber.stateChange.addListener((newState: SubscriptionState) => {
 *   if (newState === SubscriptionState.Terminated) {
 *     // handle state change here
 *   }
 * });
 *
 * // Attempt to establish the subscription
 * subscriber.subscribe();
 *
 * // Sometime later when done with subscription
 * subscriber.unsubscribe();
 * ```
 *
 * @public
 */
export declare class Subscriber extends Subscription {
    private id;
    private body;
    private event;
    private expires;
    private extraHeaders;
    private logger;
    private outgoingRequestMessage;
    private retryAfterTimer;
    private subscriberRequest;
    private targetURI;
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - The request URI identifying the subscribed event.
     * @param eventType - The event type identifying the subscribed event.
     * @param options - Options bucket. See {@link SubscriberOptions} for details.
     */
    constructor(userAgent: UserAgent, targetURI: URI, eventType: string, options?: SubscriberOptions);
    /**
     * Destructor.
     * @internal
     */
    dispose(): Promise<void>;
    /**
     * Subscribe to event notifications.
     *
     * @remarks
     * Send an initial SUBSCRIBE request if no subscription as been established.
     * Sends a re-SUBSCRIBE request if the subscription is "active".
     */
    subscribe(options?: SubscriberSubscribeOptions): Promise<void>;
    /**
     * {@inheritDoc Subscription.unsubscribe}
     */
    unsubscribe(options?: SubscriptionUnsubscribeOptions): Promise<void>;
    /**
     * Sends a re-SUBSCRIBE request if the subscription is "active".
     * @deprecated Use `subscribe` instead.
     * @internal
     */
    _refresh(): Promise<void>;
    /** @internal */
    protected onAccepted(response: IncomingResponse): void;
    /** @internal */
    protected onNotify(request: IncomingNotifyRequest): void;
    /** @internal */
    protected onRefresh(request: OutgoingSubscribeRequest): void;
    private initSubscriberRequest;
}
