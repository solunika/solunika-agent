import { Subscription as SubscriptionDialog } from "../core/subscription/subscription.js";
import { Emitter } from "./emitter.js";
import { SubscriptionDelegate } from "./subscription-delegate.js";
import { SubscriptionOptions } from "./subscription-options.js";
import { SubscriptionState } from "./subscription-state.js";
import { SubscriptionSubscribeOptions } from "./subscription-subscribe-options.js";
import { SubscriptionUnsubscribeOptions } from "./subscription-unsubscribe-options.js";
import { UserAgent } from "./user-agent.js";
/**
 * A subscription provides {@link Notification} of events.
 *
 * @remarks
 * See {@link Subscriber} for details on establishing a subscription.
 *
 * @public
 */
export declare abstract class Subscription {
    /**
     * Property reserved for use by instance owner.
     * @defaultValue `undefined`
     */
    data: unknown;
    /**
     * Subscription delegate. See {@link SubscriptionDelegate} for details.
     * @defaultValue `undefined`
     */
    delegate: SubscriptionDelegate | undefined;
    /**
     * If the subscription state is SubscriptionState.Subscribed, the associated subscription dialog. Otherwise undefined.
     * @internal
     */
    protected _dialog: SubscriptionDialog | undefined;
    /**
     * Our user agent.
     * @internal
     */
    protected _userAgent: UserAgent;
    private _disposed;
    private _logger;
    private _state;
    private _stateEventEmitter;
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @internal
     */
    protected constructor(userAgent: UserAgent, options?: SubscriptionOptions);
    /**
     * Destructor.
     */
    dispose(): Promise<void>;
    /**
     * The subscribed subscription dialog.
     */
    get dialog(): SubscriptionDialog | undefined;
    /**
     * True if disposed.
     * @internal
     */
    get disposed(): boolean;
    /**
     * Subscription state. See {@link SubscriptionState} for details.
     */
    get state(): SubscriptionState;
    /**
     * Emits when the subscription `state` property changes.
     */
    get stateChange(): Emitter<SubscriptionState>;
    /** @internal */
    protected stateTransition(newState: SubscriptionState): void;
    /**
     * Sends a re-SUBSCRIBE request if the subscription is "active".
     */
    abstract subscribe(options?: SubscriptionSubscribeOptions): Promise<void>;
    /**
     * Unsubscribe from event notifications.
     *
     * @remarks
     * If the subscription state is SubscriptionState.Subscribed, sends an in dialog SUBSCRIBE request
     * with expires time of zero (an un-subscribe) and terminates the subscription.
     * Otherwise a noop.
     */
    abstract unsubscribe(options?: SubscriptionUnsubscribeOptions): Promise<void>;
}
