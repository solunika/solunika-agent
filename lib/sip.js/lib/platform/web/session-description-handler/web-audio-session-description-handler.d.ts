import { Logger } from "../../../core/log/logger.js";
import { MediaStreamFactory } from "./media-stream-factory.js";
import { Session } from "../../../api/session.js";
import { SessionDescriptionHandler } from "./session-description-handler.js";
import { SessionDescriptionHandlerConfiguration } from "./session-description-handler-configuration.js";
/**
 * Start a conference.
 * @param conferenceSessions - The sessions to conference.
 *
 * @beta
 */
export declare function startLocalConference(conferenceSessions: Array<Session>): void;
/**
 * A WebAudioSessionDescriptionHandler uses the Web Audio API to enable local conferencing of audio streams.
 * @remarks
 * This handler only works for one track of audio per peer connection. While the session description handler
 * being extended supports both audio and video, attempting to utilize video with this handler is not defined.
 *
 * @beta
 */
export declare class WebAudioSessionDescriptionHandler extends SessionDescriptionHandler {
    static audioContext: AudioContext | undefined;
    private localMediaStreamDestinationNode?;
    private localMediaStreamSourceNode?;
    private localMediaStreamReal?;
    constructor(logger: Logger, mediaStreamFactory: MediaStreamFactory, sessionDescriptionHandlerConfiguration?: SessionDescriptionHandlerConfiguration);
    /**
     * Helper function to enable/disable media tracks.
     * @param enable - If true enable tracks.
     */
    enableSenderTracks(enable: boolean): void;
    /**
     * Returns a WebRTC MediaStream proxying the provided audio media stream.
     * This allows additional Web Audio media stream source nodes to be connected
     * to the destination node assoicated with the returned stream so we can mix
     * aditional audio sorces into the local media stream (ie for 3-way conferencing).
     * @param stream - The MediaStream to proxy.
     */
    initLocalMediaStream(stream: MediaStream): MediaStream;
    /**
     * Join (conference) media streams with another party.
     * @param peer - The session description handler of the peer to join with.
     */
    joinWith(peer: WebAudioSessionDescriptionHandler): void;
    /**
     * Sets the original local media stream.
     * @param stream - Media stream containing tracks to be utilized.
     * @remarks
     * Only the first audio and video tracks of the provided MediaStream are utilized.
     * Adds tracks if audio and/or video tracks are not already present, otherwise replaces tracks.
     */
    setRealLocalMediaStream(stream: MediaStream): void;
}
