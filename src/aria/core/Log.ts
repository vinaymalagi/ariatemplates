import { substitute } from "../utils/String.js";
import { Appender, LogLevel } from "./log/log.types.js";

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
// var Aria = require("../Aria");
// var ariaCoreLogDefaultAppender = require("./log/DefaultAppender");
// var ariaUtilsString = require("../utils/String");
// var ariaCoreJsObject = require("./JsObject");

// var afterDisposeLog = function (logType) {
//     var console = Aria.$window.console;
//     if (!console) {
//         return Aria.empty;
//     }
//     var consoleFn = console[logType] || console.log;
//     return function (msg, msgArgs, err) {
//         consoleFn.call(console, [logType, " after aria.core.Log is disposed:\nin:", this.$classpath, "\nmsg:", msg].join(''));
//     };
// };

/**
 * Singleton to be used to log messages from any class. This object should probably not be used
 * directly since any class in AriaTemplates inherits from JsObject and as such has the $log() method. Using the $log()
 * method makes it easier because it doesn't require you to pass your current classname.
 *
 * <pre>
 * aria.core.Log.warn('my.class.Name', 'Warning!!');
 * aria.core.Log.info('my.class.Name', 'Something was processed ...');
 * </pre>
 *
 * Additionally, this object can be used when debugging, to set the level of log you want to see per package/class. By
 * default, levels are already set, but you may use your own custom levels for debugging purposes
 *
 * <pre>
 * aria.core.Log.resetLoggingLevels();
 * aria.core.Log.setLoggingLevel('modules.*', aria.core.Log.LEVEL_DEBUG);
 * aria.core.Log.setLoggingLevel('my.class.Name', aria.core.Log.LEVEL_WARN);
 * </pre>
 *
 * When logging messages to the logger, appenders are used to actually print out the messages. By default, the only
 * appender used is the one printing results in the window.console object (Firebug, FirebugLite). It is however possible
 * to add appenders for debugging purposes:
 *
 * <pre>
 * aria.core.Log.clearAppenders();
 * aria.core.Log.addAppender(new aria.core.log.WindowAppender());
 * </pre>
 *
 * @singleton
 */
// TODO:ModernAria: Figureout a way to not be able to create instances of Log even when using JS without TS
export class Log {

  /**
   * Singleton Instance
   * @type {Log}
   */
  private static _instance: Log;

  // /**
  //  * The list of loggers already created so far, per className
  //  * @type Array
  //  * @private
  //  */
  // Benefit:ModernAria: Unused Private property
  // private _loggers = [];

  /**
   * The logging configuration telling the logger which messages will make it to the console for each className
   * @type Array
   * @private
   */
  private _loggingLevels: Record<string, LogLevel> = {};

  /**
   * List of all the appenders configured in the logging system. By default, only one is present, the
   * DefaultAppender (outputting in the firebug console)
   * @private
   * @type Array
   */
  _appenders: Appender[] = [];


  // /**
  //  * Debug log level
  //  * @type {number}
  //  */
  // public static readonly LEVEL_DEBUG: number = 1;

  // /**
  //  * Info log level
  //  * @type {number}
  //  */
  // public static readonly LEVEL_INFO: number = 2;

  // /**
  //  * Warning log level
  //  * @type {number}
  //  */
  // public static readonly LEVEL_WARN: number = 3;

  // /**
  //  * Error log level
  //  * @type {number}
  //  */
  // public static readonly LEVEL_ERROR: number = 4;

  public static getInstance(): Log {
      if (!Log._instance) {
          Log._instance = new Log();
      }
      return Log._instance;
  }


  private constructor() {

        // var oSelf = this;
        // var jsObjectProto = ariaCoreJsObject.prototype;
        // // map function on JsObject prototype and Aria

        // jsObjectProto.$logDebug = function (msg, msgArgs, obj) {
        //     oSelf.debug(this.$classpath, msg, msgArgs, obj);
        //     // return empty string to be used easily in templates
        //     return "";
        // };
        // Aria.$logDebug = jsObjectProto.$logDebug;

        // jsObjectProto.$logInfo = function (msg, msgArgs, obj) {
        //     oSelf.info(this.$classpath, msg, msgArgs, obj);
        //     // return empty string to be used easily in templates
        //     return "";
        // };
        // Aria.$logInfo = jsObjectProto.$logInfo;

        // jsObjectProto.$logWarn = function (msg, msgArgs, obj) {
        //     oSelf.warn(this.$classpath, msg, msgArgs, obj);
        //     // return empty string to be used easily in templates
        //     return "";
        // };
        // Aria.$logWarn = jsObjectProto.$logWarn;

        // jsObjectProto.$logError = function (msg, msgArgs, err) {
        //     oSelf.error(this.$classpath, msg, msgArgs, err);
        //     // return empty string to be used easily in templates
        //     return "";
        // };
        // Aria.$logError = jsObjectProto.$logError;

        this.resetLoggingLevels();
        // TODO: ModernAria Add logging levels functionality and config in root aria config
        // this.setLoggingLevel("*", Aria.debug ? this.LEVEL_DEBUG : this.LEVEL_ERROR);
        this.setLoggingLevel("*", LogLevel.DEBUG);
        // this.addAppender(new ariaCoreLogDefaultAppender());
  }

  $destructor () {
      this.resetLoggingLevels();
      // this.clearAppenders();

      // remove functions on JsObject and Aria (added in the constructor):

      // var jsObjectProto = ariaCoreJsObject.prototype;
      // Aria.$logError = jsObjectProto.$logError = afterDisposeLog("error");
      // Aria.$logDebug = jsObjectProto.$logDebug = afterDisposeLog("debug");
      // Aria.$logInfo = jsObjectProto.$logInfo = afterDisposeLog("info");
      // Aria.$logWarn = jsObjectProto.$logWarn = afterDisposeLog("warn");
  }

  /**
   * Used to verify if a given level is within the known list of levels
   * @param {Number} level The level to test
   * @return {Boolean}
   */
  isValidLevel(level: LogLevel | unknown): boolean {

    return (level ===  LogLevel.DEBUG || level ===  LogLevel.INFO || level ===  LogLevel.WARN || level ===  LogLevel.ERROR);
  }

  /**
   * Static method that is used to set the logging configuration for a specific className or part of a className.
   * By default, the Aria logger is already set with default values. This method is intended to be used during
   * debugging only to filter what you want to see printed in the console.
   *
   * <pre>
   * aria.core.Log.setLoggingLevel(&quot;a.*&quot;, aria.core.Log.LEVEL_ERROR);
   * aria.core.Log.setLoggingLevel(&quot;util.*&quot;, aria.core.Log.LEVEL_INFO);
   * aria.core.Log.setLoggingLevel(&quot;util.layouts.CardLayout&quot;, aria.core.Log.LEVEL_DEBUG);
   * </pre>
   *
   * @param {String} className The className to assign the level to
   * @param {Number} level The level of logging to allow
   */
  public setLoggingLevel(className: string, level: LogLevel) {
      if (!this.isValidLevel(level)) {
          this.error('aria.core.Log', "Invalid level passed to setLoggingLevel");
      } else {
          // TODO: Add here a check for the validity of a className:
          // possible values are a.b.c, or a.b.*
          this._loggingLevels[className] = level;
      }
  }

  /**
   * Reset all logging level configuration
   */
  private resetLoggingLevels() {
      this._loggingLevels = {};
  }

  /**
   * Get the currently allowed logging level for a particular className
   * @param {String} className
   * @return {Number} level or false if no logging level is defined
   */
  getLoggingLevel(className: string) {
      const loggingLevel = this._loggingLevels[className];
      if (loggingLevel) {
          // If there is a logging level stored for the exact classname passed in parameter
          return loggingLevel;
      } else {
          // Else, look for package names
          let str = className;

          while (str.indexOf(".") != -1) {
              str = str.substring(0, str.lastIndexOf("."));
              if (this._loggingLevels[str]) {
                  return this._loggingLevels[str];
              } else if (this._loggingLevels[str + ".*"]) {
                  return this._loggingLevels[str + ".*"];
              }
          }

          return this._loggingLevels["*"] || false;
      }
  }

  /**
   * Is a specific level loggable for a given classname. Depending on the configuration of the logger sub-system,
   * we need to check if our current className supports at least this level of logging.
   * @param {String} level The level to test
   * @param {String} className The className to check
   * @return {Boolean}
   */
  isLogEnabled(level: LogLevel, className: string) {
      const minimumLevel = this.getLoggingLevel(className);

      // If we could find a minimum level authorized for this className
      // (or a best match)
      if (minimumLevel) {
          return level >= minimumLevel;
      } else {
          // If nothing was found in the conf for this class, no logging
          // is possible
          return false;
      }
  }

  /**
   * Add a new appender to the logging system
   * @param {aria.core.log.DefaultAppender} appender An instance of appender (must implement the same methods as
   * aria.core.log.DefaultAppender)
   */
  public addAppender(appender: Appender) {
      this._appenders.push(appender);
      return appender;
  }

  /**
   * Removes an appender from the logging system
   * @param {aria.core.log.DefaultAppender} appender An instance of appender to be removed (must implement the
   * same methods as aria.core.log.DefaultAppender)
   */
  public removeAppender(appender: Appender) {
      if (appender) {
          this._clearAppenders(appender);
      }
  }

  /**
   * Remove all appenders in the logging system, if an appender is passed then will remove just a specific
   * appender instance
   * @param {aria.core.log.DefaultAppender} appender An instance of appender to be removed (must implement the
   * same methods as aria.core.log.DefaultAppender)
   */
  private _clearAppenders(appender?: Appender) {

      if (appender) {
        // TODO: Solution for implementing dispose method in appenders
        // appender.$dispose();

        this._appenders = this._appenders.filter(app => app !== appender);
      } else {
        // clear all appenders
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this._appenders.forEach((_appender) => {
          // TODO: Solution for implementing dispose method in appenders
          // appender.$dispose();
        });
        this._appenders = [];
      }
  }

  /**
   * Remove all appenders in the logging system
   */
  public clearAppenders() {
      this._clearAppenders();
  }

  /**
   * Get the list of current appenders
   * @param {String} classpath Optional argument, if passed, only the appenders of the given classpath will be
   * returned
   * @return {Array} The list of appenders
   */
  getAppenders(classpath?: string): Appender[] {

      if (classpath) {
          // TODO: ModernAria: Fix this usage of any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return this._appenders.filter((appender) => (appender as any).$classpath === classpath);
      }

      return this._appenders;
  }

  /**
   * Prepare a message to be logged from a message text and an optional array of arguments
   * @param {String} msg Message text (which may contain %n)
   * @param {Array} msgArgs optional list of arguments to be replaced in the message with %n
   * @param {Object} errorContext Optional object passed in case of template parsing error only
   * @return {String} The message
   */
  prepareLoggedMessage(msg: string, msgArgs?: string[], errorContext?: object) {
      if (msgArgs) {
          msg = substitute(msg, ...msgArgs);
      }
      for (const error in errorContext) {
          // eslint-disable-next-line no-prototype-builtins
          if (errorContext.hasOwnProperty(error)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              msg += "\n" + error + " : " + (errorContext as any)[error] + "\n";
          }
      }
      return msg;
  }

  /**
   * Log a debug message.
   * @param {String} className The classname for which the log is to be done
   * @param {String} msg the message text
   * @param {Array} msgArgs An array of arguments to be used for string replacement in the message text
   * @param {Object} o An optional object to inspect
   */
  debug(className: string, msg: string, msgArgs?: string[], o?: object) {
      this.log(className, LogLevel.DEBUG, msg, msgArgs, o);
  }

  /**
   * Log an info message
   * @param {String} className The classname for which the log is to be done
   * @param {String} msg the message text
   * @param {Array} msgArgs An array of arguments to be used for string replacement in the message text
   * @param {Object} o An optional object to inspect
   */
  info(className: string, msg: string, msgArgs?: string[], o?: object) {
      this.log(className, LogLevel.INFO, msg,  msgArgs, o);
  }

  /**
   * Log a warning message
   * @param {String} className The classname for which the log is to be done
   * @param {String} msg the message text
   * @param {Array} msgArgs An array of arguments to be used for string replacement in the message text
   * @param {Object} o An optional object to inspect
   */
  warn(className: string, msg: string, msgArgs?: string[], o?: object) {
      this.log(className, LogLevel.WARN, msg, msgArgs, o);
  }

  /**
   * Log an error message
   * @param {String} className The classname for which the log is to be done
   * @param {String} msg the message text
   * @param {Array} msgArgs An array of arguments to be used for string replacement in the message text
   * @param {Object} e A JavaScript exception object or a object to inspect
   */
  error(className: string, msg: string, msgArgs?: string[], e?: object) {
      this.log(className, LogLevel.ERROR, msg, msgArgs, e);
  }

  /**
   * Actually do the logging to the current appenders
   * @param {String} className The className that is logging
   * @param {String} level The level to log the message
   * @param {Array} msgArgs An array of arguments to be used for string replacement in the message text
   * @param {String} msg The message text
   * @param {Object} objOrErr Either an option object to be logged or an error message in case of error or fatal
   * levels
   */
  log(className: string, level: LogLevel, msgText: string, msgArgs?: string[] | undefined, objOrErr?: object | undefined) {
      if (!this.isValidLevel(level)) {
          this.error('aria.core.Log', "Invalid level passed for logging the message");
      } else {
          if (this.isLogEnabled(level, className)) {
              const msg = this.prepareLoggedMessage(msgText, msgArgs);

              this.getAppenders().forEach((app) => {
                if (level == LogLevel.DEBUG) {
                  app.debug(className, msg, msgText, objOrErr);
                }
                if (level == LogLevel.INFO) {
                    app.info(className, msg, msgText, objOrErr);
                }
                if (level == LogLevel.WARN) {
                    app.warn(className, msg, msgText, objOrErr);
                }
                if (level == LogLevel.ERROR) {
                    app.error(className, msg, msgText, objOrErr);
                }
              });
          }
      }
  }
}

export const log = Log.getInstance();
