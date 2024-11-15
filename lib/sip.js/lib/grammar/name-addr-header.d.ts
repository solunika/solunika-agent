import { Parameters } from "./parameters.js";
import { URI } from "./uri.js";
/**
 * Name Address SIP header.
 * @public
 */
export declare class NameAddrHeader extends Parameters {
    uri: URI;
    private _displayName;
    /**
     * Constructor
     * @param uri -
     * @param displayName -
     * @param parameters -
     */
    constructor(uri: URI, displayName: string, parameters: {
        [name: string]: string;
    });
    get friendlyName(): string;
    get displayName(): string;
    set displayName(value: string);
    clone(): NameAddrHeader;
    toString(): string;
}
