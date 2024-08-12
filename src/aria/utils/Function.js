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

import { $logError } from '../core/framework-bootstrap.js';
import { normCallback } from './Type.js';

/**
 * Utils for javascript functions
 */


/**
 * Bind a function to a particular context. As a consequence, in the function 'this' will correspond to the
 * context. Additional arguments will be prepend to the arguments of the binded function
 * @param {Function} fn
 * @param {Object} context
 * @param {any} additionalArgs - additional arguments to be prepended to the arguments of the binded function
 * @return {Function}
 *
 */
export function bind(fn, context, ...additionalArgs) {
    // NOTE: ModernAria: Used destructuring to get remaining arguments instead of building the array manually
    // var args = [];
    // for (var i = 2; i < arguments.length; i++) {
    //     args.push(arguments[i]);
    // }
    return function () {
        // need to make a copy each time
        var finalArgs = additionalArgs.slice(0);
        // concat won't work, as arguments is a special array
        for (var i = 0; i < arguments.length; i++) {
            finalArgs.push(arguments[i]);
        }
        return fn.apply(context, finalArgs);
    };
}

/**
 * Put on destination object functions from source object, keeping the source object as scope for these
 * functions
 * @param {Object} src source object
 * @param {Object} dest destination object
 * @param {Array} fnNames list of function names
 * @param {String} optional string prefix for functions on the target object
 *
 */
export function wrapObjectFn(src, dest, fnNames, prefix) {
    if (!prefix) {
        prefix = '';
    }
    for (var index = 0, l = fnNames.length; index < l; index++) {
        var key = fnNames[index];
        dest[prefix + key] = bind(src[key], src);
    }
}

/**
 * Create a function from a callback object. When the function is called, the callback is called. The first
 * parameter in the callback is the argument array given to the function.
 * @param {aria.core.CfgBeans:Callback} cb
 * @return {Function}
 */
export function bindCallback(cb) {
    cb = normCallback(cb);
    return function () {
        return $callback(cb, arguments);
    };
}

/**
 * Generic method allowing to call-back a caller in asynchronous processes
 * @param {aria.core.CfgBeans:Callback} cb callback description
 * @param {MultiTypes} res first result argument to pass to cb.fn (second argument will be cb.args)
 * @param {String} errorId error raised if an exception occurs in the callback
 * @return {MultiTypes} the value returned by the callback, or undefined if the callback could not becalled.
 *
 * Copy of $callback in JSObject
 * MUST_DO: ModernAria: Resolve this duplication and remove copy either here or in JsObject
 */
function $callback(cb, res, errorId) {
  try {
    if (!cb) {
      return; // callback is sometimes not used
    }

    if (cb.$Callback) {
      return cb.call(res);
    }

    // perf optimisation : duplicated code on purpose
    var scope = cb.scope, callback;
    // MUST_DO: When scope is not provided: does it matter what the value of 'this' is??
    // eslint-disable-next-line no-invalid-this
    scope = scope ? scope : this;
    if (!cb.fn) {
      callback = cb;
    } else {
      callback = cb.fn;
    }

    if (typeof (callback) == 'string') {
      callback = scope[callback];
    }

    var args = (cb.apply === true && cb.args && Object.prototype.toString.apply(cb.args) === "[object Array]")
      ? cb.args.slice()
      : [cb.args];
    var resIndex = (cb.resIndex === undefined) ? 0 : cb.resIndex;

    if (resIndex > -1) {
      args.splice(resIndex, 0, res);
    }

    return Function.prototype.apply.call(callback, scope, args);
  } catch (ex) {
    // MUST_DO: ModernAria: copied the string from JsObject see how to resolve.
    const CALLBACK_ERROR = "An error occurred while processing a callback function: \ncalling class: %1\ncalled class: %2";
    const classPath = 'aria.utils.Function';
    $logError(errorId || CALLBACK_ERROR, [classPath, (scope) ? scope.$classpath : ""], ex, classPath);
  }
}

/**
 * Calls the given function. This is mainly useful for functional programming.
 *
 * @param callback {Function} The function to call
 *
 * @return {Any} The return value of the callback
 */
export function call(callback) {
    return callback();
}
