import { Levels } from "./levels.js";
import { Logger } from "./logger.js";
/**
 * Logger.
 * @public
 */
export declare class LoggerFactory {
    builtinEnabled: boolean;
    private _level;
    private _connector;
    private loggers;
    private logger;
    constructor();
    get level(): Levels;
    set level(newLevel: Levels);
    get connector(): ((level: string, category: string, label: string | undefined, content: any) => void) | undefined;
    set connector(value: ((level: string, category: string, label: string | undefined, content: any) => void) | undefined);
    getLogger(category: string, label?: string): Logger;
    genericLog(levelToLog: Levels, category: string, label: string | undefined, content: any): void;
    private print;
}
