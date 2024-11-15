/**
 * A request to reject an {@link Invitation} (incoming CANCEL).
 * @public
 */
export class Cancel {
    /** @internal */
    constructor(incomingCancelRequest) {
        this.incomingCancelRequest = incomingCancelRequest;
    }
    /** Incoming CANCEL request message. */
    get request() {
        return this.incomingCancelRequest;
    }
}
