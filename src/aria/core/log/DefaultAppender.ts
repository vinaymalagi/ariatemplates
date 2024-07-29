/*
 * Copyright 2012 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// var Aria = require("../../Aria");

import { Appender } from "./log.types.js";

// var console = Aria.$global.console;
/**
 * Default appender used by the logger to output log lines. The default appender is using Firebug/Firebug lite to
 * log (or in fact, any console that defines the window.console object). Other appenders can be written by extending
 * this default class in order to output elsewhere.
 */
// module.exports = Aria.classDefinition({
// $classpath : "aria.core.log.DefaultAppender",
// TODO:ModernAria: Wrap in classDfinition
export class DefaultAppender implements Appender {
    /**
     * Output the first part of the string corresponding to the classname in the log
     * @param {String} className
     * @return {String} The formatted classname
     * @private
     */
    private _formatClassName(className: string) {
        return "[" + className + "] ";
    }

    /**
     * Inspect an object in a log
     * @param {Object} o the object to inspect
     * @private
     */
    private _inspectObject(o?: object) {
        if (o && typeof o == "object" && console.dir) {
            console.dir(o);
        }
    }

    /**
     * Debug
     * @param {String} className
     * @param {String} msg The message text (including arguments)
     * @param {String} msgText The message text (before arguments were replaced)
     * @param {Object} o An optional object to be inspected
     */
    debug(className: string, msg: string, _msgText?: string, o?: object) {
        if (console.debug) {
            console.debug(this._formatClassName(className) + msg);
        } else if (console.log) {
            console.log(this._formatClassName(className) + msg);
        }
        this._inspectObject(o);
    }

    /**
     * Info
     * @param {String} className
     * @param {String} msg The message text (including arguments)
     * @param {String} msgText The message text (before arguments were replaced)
     * @param {Object} o An optional object to be inspected
     */
    info(className: string, msg: string, _msgText?: string, o?: object) {
        if (console.info) {
            console.info(this._formatClassName(className) + msg);
        } else if (console.log) {
            console.log(this._formatClassName(className) + msg);
        }
        this._inspectObject(o);
    }

    /**
     * Warn
     * @param {String} className
     * @param {String} msg The message text (including arguments)
     * @param {String} msgText The message text (before arguments were replaced)
     * @param {Object} o An optional object to be inspected
     */
    warn(className: string, msg: string, _msgText?: string, o?: object) {
        if (console.warn) {
            console.warn(this._formatClassName(className) + msg);
        } else if (console.log) {
            console.log(this._formatClassName(className) + msg);
        }
        this._inspectObject(o);
    }

    /**
     * Error
     * @param {String} className
     * @param {String} msg The message text (including arguments)
     * @param {String} msgText The message text (before arguments were replaced)
     * @param {Object} e The exception to format
     */
    error(className: string, msg: string, _msgText?: string, o?: object) {
        const message = this._formatClassName(className) + msg;
        let extraInfo = "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e: any = o;
        if (e) {
            if (e.logDetails) {
              e.logDetails();
            }
            extraInfo = (e.name && e.message) ? (e.name + ": " + e.message) : e.toString();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const stack: any = e.stack;
            if (stack) {
                // sometimes the stack starts with the name and message, sometimes not
                if (extraInfo === stack.substring(0, extraInfo.length)) {
                    extraInfo = stack;
                } else {
                    extraInfo += "\n" + stack;
                }
            }
            extraInfo = "\n" + extraInfo;
        }
        console.error(message + extraInfo);
    }
}

