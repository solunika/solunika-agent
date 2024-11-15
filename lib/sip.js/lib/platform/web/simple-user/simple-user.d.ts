import { InvitationAcceptOptions } from "../../../api/invitation-accept-options.js";
import { InviterInviteOptions } from "../../../api/inviter-invite-options.js";
import { InviterOptions } from "../../../api/inviter-options.js";
import { RegistererRegisterOptions } from "../../../api/registerer-register-options.js";
import { RegistererUnregisterOptions } from "../../../api/registerer-unregister-options.js";
import { SimpleUserDelegate } from "./simple-user-delegate.js";
import { SimpleUserOptions } from "./simple-user-options.js";
/**
 * A simple SIP user class.
 * @remarks
 * While this class is completely functional for simple use cases, it is not intended
 * to provide an interface which is suitable for most (must less all) applications.
 * While this class has many limitations (for example, it only handles a single concurrent session),
 * it is, however, intended to serve as a simple example of using the SIP.js API.
 * @public
 */
export declare class SimpleUser {
    /** Delegate. */
    delegate: SimpleUserDelegate | undefined;
    private logger;
    private options;
    private session;
    private sessionManager;
    /**
     * Constructs a new instance of the `SimpleUser` class.
     * @param server - SIP WebSocket Server URL.
     * @param options - Options bucket. See {@link SimpleUserOptions} for details.
     */
    constructor(server: string, options?: SimpleUserOptions);
    /**
     * Instance identifier.
     * @internal
     */
    get id(): string;
    /** The local media stream. Undefined if call not answered. */
    get localMediaStream(): MediaStream | undefined;
    /** The remote media stream. Undefined if call not answered. */
    get remoteMediaStream(): MediaStream | undefined;
    /**
     * The local audio track, if available.
     * @deprecated Use localMediaStream and get track from the stream.
     */
    get localAudioTrack(): MediaStreamTrack | undefined;
    /**
     * The local video track, if available.
     * @deprecated Use localMediaStream and get track from the stream.
     */
    get localVideoTrack(): MediaStreamTrack | undefined;
    /**
     * The remote audio track, if available.
     * @deprecated Use remoteMediaStream and get track from the stream.
     */
    get remoteAudioTrack(): MediaStreamTrack | undefined;
    /**
     * The remote video track, if available.
     * @deprecated Use remoteMediaStream and get track from the stream.
     */
    get remoteVideoTrack(): MediaStreamTrack | undefined;
    /**
     * Connect.
     * @remarks
     * Start the UserAgent's WebSocket Transport.
     */
    connect(): Promise<void>;
    /**
     * Disconnect.
     * @remarks
     * Stop the UserAgent's WebSocket Transport.
     */
    disconnect(): Promise<void>;
    /**
     * Return true if connected.
     */
    isConnected(): boolean;
    /**
     * Start receiving incoming calls.
     * @remarks
     * Send a REGISTER request for the UserAgent's AOR.
     * Resolves when the REGISTER request is sent, otherwise rejects.
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
    call(destination: string, inviterOptions?: InviterOptions, inviterInviteOptions?: InviterInviteOptions): Promise<void>;
    /**
     * Hangup a call.
     * @remarks
     * Send a BYE request, CANCEL request or reject response to end the current Session.
     * Resolves when the request/response is sent, otherwise rejects.
     * Use `onCallHangup` delegate method to determine if and when call is ended.
     */
    hangup(): Promise<void>;
    /**
     * Answer an incoming call.
     * @remarks
     * Accept an incoming INVITE request creating a new Session.
     * Resolves with the response is sent, otherwise rejects.
     * Use `onCallAnswered` delegate method to determine if and when call is established.
     * @param invitationAcceptOptions - Optional options for Inviter.accept().
     */
    answer(invitationAcceptOptions?: InvitationAcceptOptions): Promise<void>;
    /**
     * Decline an incoming call.
     * @remarks
     * Reject an incoming INVITE request.
     * Resolves with the response is sent, otherwise rejects.
     * Use `onCallHangup` delegate method to determine if and when call is ended.
     */
    decline(): Promise<void>;
    /**
     * Hold call
     * @remarks
     * Send a re-INVITE with new offer indicating "hold".
     * Resolves when the re-INVITE request is sent, otherwise rejects.
     * Use `onCallHold` delegate method to determine if request is accepted or rejected.
     * See: https://tools.ietf.org/html/rfc6337
     */
    hold(): Promise<void>;
    /**
     * Unhold call.
     * @remarks
     * Send a re-INVITE with new offer indicating "unhold".
     * Resolves when the re-INVITE request is sent, otherwise rejects.
     * Use `onCallHold` delegate method to determine if request is accepted or rejected.
     * See: https://tools.ietf.org/html/rfc6337
     */
    unhold(): Promise<void>;
    /**
     * Hold state.
     * @remarks
     * True if session is on hold.
     */
    isHeld(): boolean;
    /**
     * Mute call.
     * @remarks
     * Disable sender's media tracks.
     */
    mute(): void;
    /**
     * Unmute call.
     * @remarks
     * Enable sender's media tracks.
     */
    unmute(): void;
    /**
     * Mute state.
     * @remarks
     * True if sender's media track is disabled.
     */
    isMuted(): boolean;
    /**
     * Send DTMF.
     * @remarks
     * Send an INFO request with content type application/dtmf-relay.
     * @param tone - Tone to send.
     */
    sendDTMF(tone: string): Promise<void>;
    /**
     * Send a message.
     * @remarks
     * Send a MESSAGE request.
     * @param destination - The target destination for the message. A SIP address to send the MESSAGE to.
     */
    message(destination: string, message: string): Promise<void>;
}
