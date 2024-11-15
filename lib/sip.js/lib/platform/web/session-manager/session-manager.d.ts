import { InvitationAcceptOptions } from "../../../api/invitation-accept-options.js";
import { Inviter } from "../../../api/inviter.js";
import { InviterInviteOptions } from "../../../api/inviter-invite-options.js";
import { InviterOptions } from "../../../api/inviter-options.js";
import { RegistererRegisterOptions } from "../../../api/registerer-register-options.js";
import { RegistererUnregisterOptions } from "../../../api/registerer-unregister-options.js";
import { Session } from "../../../api/session.js";
import { SessionReferOptions } from "../../../api/session-refer-options.js";
import { UserAgent } from "../../../api/user-agent.js";
import { ManagedSession } from "./managed-session.js";
import { SessionManagerDelegate } from "./session-manager-delegate.js";
import { SessionManagerOptions } from "./session-manager-options.js";
/**
 * A session manager for SIP.js sessions.
 * @public
 */
export declare class SessionManager {
    /** Delegate. */
    delegate: SessionManagerDelegate | undefined;
    /** Sessions being managed. */
    managedSessions: Array<ManagedSession>;
    /** User agent which created sessions being managed. */
    userAgent: UserAgent;
    private attemptingReconnection;
    private logger;
    private options;
    private optionsPingFailure;
    private optionsPingRequest?;
    private optionsPingRunning;
    private optionsPingTimeout?;
    private registrationAttemptTimeout?;
    private registerer?;
    private registererOptions?;
    private registererRegisterOptions;
    private shouldBeConnected;
    private shouldBeRegistered;
    /**
     * Constructs a new instance of the `SessionManager` class.
     * @param server - SIP WebSocket Server URL.
     * @param options - Options bucket. See {@link SessionManagerOptions} for details.
     */
    constructor(server: string, options?: SessionManagerOptions);
    /**
     * Strip properties with undefined values from options.
     * This is a work around while waiting for missing vs undefined to be addressed (or not)...
     * https://github.com/Microsoft/TypeScript/issues/13195
     * @param options - Options to reduce
     */
    private static stripUndefinedProperties;
    /**
     * The local media stream. Undefined if call not answered.
     * @param session - Session to get the media stream from.
     */
    getLocalMediaStream(session: Session): MediaStream | undefined;
    /**
     * The remote media stream. Undefined if call not answered.
     * @param session - Session to get the media stream from.
     */
    getRemoteMediaStream(session: Session): MediaStream | undefined;
    /**
     * The local audio track, if available.
     * @param session - Session to get track from.
     * @deprecated Use localMediaStream and get track from the stream.
     */
    getLocalAudioTrack(session: Session): MediaStreamTrack | undefined;
    /**
     * The local video track, if available.
     * @param session - Session to get track from.
     * @deprecated Use localMediaStream and get track from the stream.
     */
    getLocalVideoTrack(session: Session): MediaStreamTrack | undefined;
    /**
     * The remote audio track, if available.
     * @param session - Session to get track from.
     * @deprecated Use remoteMediaStream and get track from the stream.
     */
    getRemoteAudioTrack(session: Session): MediaStreamTrack | undefined;
    /**
     * The remote video track, if available.
     * @param session - Session to get track from.
     * @deprecated Use remoteMediaStream and get track from the stream.
     */
    getRemoteVideoTrack(session: Session): MediaStreamTrack | undefined;
    /**
     * Connect.
     * @remarks
     * If not started, starts the UserAgent connecting the WebSocket Transport.
     * Otherwise reconnects the UserAgent's WebSocket Transport.
     * Attempts will be made to reconnect as needed.
     */
    connect(): Promise<void>;
    /**
     * Disconnect.
     * @remarks
     * If not stopped, stops the UserAgent disconnecting the WebSocket Transport.
     */
    disconnect(): Promise<void>;
    /**
     * Return true if transport is connected.
     */
    isConnected(): boolean;
    /**
     * Start receiving incoming calls.
     * @remarks
     * Send a REGISTER request for the UserAgent's AOR.
     * Resolves when the REGISTER request is sent, otherwise rejects.
     * Attempts will be made to re-register as needed.
     */
    register(registererRegisterOptions?: RegistererRegisterOptions): Promise<void>;
    /**
     * Stop receiving incoming calls.
     * @remarks
     * Send an un-REGISTER request for the UserAgent's AOR.
     * Resolves when the un-REGISTER request is sent, otherwise rejects.
     */
    unregister(registererUnregisterOptions?: RegistererUnregisterOptions): Promise<void>;
    /**
     * Make an outgoing call.
     * @remarks
     * Send an INVITE request to create a new Session.
     * Resolves when the INVITE request is sent, otherwise rejects.
     * Use `onCallAnswered` delegate method to determine if Session is established.
     * @param destination - The target destination to call. A SIP address to send the INVITE to.
     * @param inviterOptions - Optional options for Inviter constructor.
     * @param inviterInviteOptions - Optional options for Inviter.invite().
     */
    call(destination: string, inviterOptions?: InviterOptions, inviterInviteOptions?: InviterInviteOptions): Promise<Inviter>;
    /**
     * Hangup a call.
     * @param session - Session to hangup.
     * @remarks
     * Send a BYE request, CANCEL request or reject response to end the current Session.
     * Resolves when the request/response is sent, otherwise rejects.
     * Use `onCallHangup` delegate method to determine if and when call is ended.
     */
    hangup(session: Session): Promise<void>;
    /**
     * Answer an incoming call.
     * @param session - Session to answer.
     * @remarks
     * Accept an incoming INVITE request creating a new Session.
     * Resolves with the response is sent, otherwise rejects.
     * Use `onCallAnswered` delegate method to determine if and when call is established.
     * @param invitationAcceptOptions - Optional options for Inviter.accept().
     */
    answer(session: Session, invitationAcceptOptions?: InvitationAcceptOptions): Promise<void>;
    /**
     * Decline an incoming call.
     * @param session - Session to decline.
     * @remarks
     * Reject an incoming INVITE request.
     * Resolves with the response is sent, otherwise rejects.
     * Use `onCallHangup` delegate method to determine if and when call is ended.
     */
    decline(session: Session): Promise<void>;
    /**
     * Hold call
     * @param session - Session to hold.
     * @remarks
     * Send a re-INVITE with new offer indicating "hold".
     * Resolves when the re-INVITE request is sent, otherwise rejects.
     * Use `onCallHold` delegate method to determine if request is accepted or rejected.
     * See: https://tools.ietf.org/html/rfc6337
     */
    hold(session: Session): Promise<void>;
    /**
     * Unhold call.
     * @param session - Session to unhold.
     * @remarks
     * Send a re-INVITE with new offer indicating "unhold".
     * Resolves when the re-INVITE request is sent, otherwise rejects.
     * Use `onCallHold` delegate method to determine if request is accepted or rejected.
     * See: https://tools.ietf.org/html/rfc6337
     */
    unhold(session: Session): Promise<void>;
    /**
     * Hold state.
     * @param session - Session to check.
     * @remarks
     * True if session is on hold.
     */
    isHeld(session: Session): boolean;
    /**
     * Mute call.
     * @param session - Session to mute.
     * @remarks
     * Disable sender's media tracks.
     */
    mute(session: Session): void;
    /**
     * Unmute call.
     * @param session - Session to unmute.
     * @remarks
     * Enable sender's media tracks.
     */
    unmute(session: Session): void;
    /**
     * Mute state.
     * @param session - Session to check.
     * @remarks
     * True if sender's media track is disabled.
     */
    isMuted(session: Session): boolean;
    /**
     * Send DTMF.
     * @param session - Session to send on.
     * @remarks
     * Send an INFO request with content type application/dtmf-relay.
     * @param tone - Tone to send.
     */
    sendDTMF(session: Session, tone: string): Promise<void>;
    /**
     * Transfer.
     * @param session - Session with the transferee to transfer.
     * @param target - The referral target.
     * @remarks
     * If target is a Session this is an attended transfer completion (REFER with Replaces),
     * otherwise this is a blind transfer (REFER). Attempting an attended transfer
     * completion on a call that has not been answered will be rejected. To implement
     * an attended transfer with early completion, hangup the call with the target
     * and execute a blind transfer to the target.
     */
    transfer(session: Session, target: Session | string, options?: SessionReferOptions): Promise<void>;
    /**
     * Send a message.
     * @remarks
     * Send a MESSAGE request.
     * @param destination - The target destination for the message. A SIP address to send the MESSAGE to.
     */
    message(destination: string, message: string): Promise<void>;
    /** Media constraints. */
    private get constraints();
    /**
     * Attempt reconnection up to `reconnectionAttempts` times.
     * @param reconnectionAttempt - Current attempt number.
     */
    private attemptReconnection;
    /**
     * Register to receive calls.
     * @param withoutDelay - If true attempt immediately, otherwise wait `registrationRetryInterval`.
     */
    private attemptRegistration;
    /** Helper function to remove media from html elements. */
    private cleanupMedia;
    /** Helper function to enable/disable media tracks. */
    private enableReceiverTracks;
    /** Helper function to enable/disable media tracks. */
    private enableSenderTracks;
    /**
     * Setup session delegate and state change handler.
     * @param session - Session to setup.
     * @param referralInviterOptions - Options for any Inviter created as result of a REFER.
     */
    private initSession;
    /**
     * Periodically send OPTIONS pings and disconnect when a ping fails.
     * @param requestURI - Request URI to target
     * @param fromURI - From URI
     * @param toURI - To URI
     */
    private optionsPingRun;
    /**
     * Start sending OPTIONS pings.
     */
    private optionsPingStart;
    /**
     * Stop sending OPTIONS pings.
     */
    private optionsPingStop;
    /** Helper function to init send then send invite. */
    private sendInvite;
    /** Helper function to add a session to the ones we are managing. */
    private sessionAdd;
    /** Helper function to check if the session is one we are managing. */
    private sessionExists;
    /** Helper function to check if the session is one we are managing. */
    private sessionManaged;
    /** Helper function to remoce a session from the ones we are managing. */
    private sessionRemove;
    /**
     * Puts Session on hold.
     * @param session - The session to set.
     * @param hold - Hold on if true, off if false.
     */
    private setHold;
    /**
     * Puts Session on mute.
     * @param session - The session to mute.
     * @param mute - Mute on if true, off if false.
     */
    private setMute;
    /** Helper function to attach local media to html elements. */
    private setupLocalMedia;
    /** Helper function to attach remote media to html elements. */
    private setupRemoteMedia;
    /**
     * End a session.
     * @param session - The session to terminate.
     * @remarks
     * Send a BYE request, CANCEL request or reject response to end the current Session.
     * Resolves when the request/response is sent, otherwise rejects.
     * Use `onCallHangup` delegate method to determine if and when Session is terminated.
     */
    private terminate;
}
