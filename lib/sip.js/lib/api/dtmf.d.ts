import { IncomingInfoRequest } from "../core/messages/methods/info.js";
import { Info } from "./info.js";
/**
 * A DTMF signal (incoming INFO).
 * @deprecated Use `Info`.
 * @internal
 */
export declare class DTMF extends Info {
    private _tone;
    private _duration;
    /** @internal */
    constructor(incomingInfoRequest: IncomingInfoRequest, tone: string, duration: number);
    get tone(): string;
    get duration(): number;
}
