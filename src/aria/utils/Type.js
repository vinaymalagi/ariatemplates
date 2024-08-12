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
/**
 * aria.utils.Type Utilities for comparing types
 */

/**
 * Check if the value is an array
 * @param {Object} value
 * @return {Boolean} isArray
 */
export function isArray(value) {
  return Object.prototype.toString.apply(value) === "[object Array]";
}

/**
 * Check if the value is a string (for example, typeof(new String("my String")) is "object")
 * @param {Object} value
 * @return {Boolean} isString
 */
export function isString(value) {
  if (typeof (value) === 'string') {
    return true;
  }
  return Object.prototype.toString.apply(value) === "[object String]";
}

/**
 * Check if the value is a RegularExpression
 * @param {Object} value
 * @return {Boolean} isRegExp
 */
export function isRegExp(value) {
  return Object.prototype.toString.apply(value) === "[object RegExp]";
}

/**
 * Check if the value is a number
 * @param {Object} value
 * @return {Boolean} isNumber
 */
export function isNumber(value) {
  // to handle the NaN bug
  if (isNaN(value)) {
    return false;
  }

  if (typeof (value) === 'number') {
    return true;
  }

  return Object.prototype.toString.apply(value) === "[object Number]";
}

/**
 * Check if the value is an integer.
 * @param {Object} value
 * @return {Boolean} isInteger
 */
export function isInteger(value) {
  return isNumber(value) &&
    (Math.floor(value) === value) &&
    (value + 1) !== value; // is finite and precise
}

/**
 * Check if the value is a js Date
 * @param {Object} value
 * @return {Boolean} isDate
 */
export function isDate(value) {
  return Object.prototype.toString.apply(value) === "[object Date]";
}

/**
 * Check if the value is a valid js Date
 * @param {Object} value
 * @param {Boolean} isValidDate
 */
export function isValidDate(date) {
  return isDate(date) && isInteger(date.valueOf());
}

/**
 * Check if the value is a boolean
 * @param {Object} value
 * @return {Boolean} isBoolean
 */
export function isBoolean(value) {
  return (value === true || value === false);
}

/**
 * Check if the value is an object
 * @param {Object} value
 * @return {Boolean} isObject return false if value is null or undefined.
 */
export function isObject(value) {
  // check that the value is not null or undefined, because otherwise,
  // in IE, if value is undefined or null, the toString method returns Object anyway
  if (value) {
    return Object.prototype.toString.apply(value) === "[object Object]";
  } else {
    return false;
  }
}

/**
 * Check if the object is a function
 * @param {Object} value
 * @return {Boolean} isFunction
 */
export function isFunction(value) {
  return Object.prototype.toString.apply(value) === "[object Function]";
}

// /**
//  * Return true if value is an Object or an Array. It will however return false if the value is an instance of
//  * aria.core.JsObject
//  * @param {Object} value
//  * @return {Boolean} isContainer
//  */
// MUST_DO: ModernAria: Potential Circular Dependency: Figure out access to Aria.$window and Aria.$framework window without violating circular dependency
// export function isContainer(value) {
//     return (isObject(value) || isArray(value)) && !(value instanceof ariaCoreJsObject);
// }

/**
 * Gets a proper signature callback from description given in argument
 *
 * Copy of $normCallback in JSObject to prevent circular dependency
 * MUST_DO: ModernAria: Resolve this circular dependency and remove copy either here or in JsObject
 *
 * @param {Object|String} cn callback signature
 * @return {Object} callback object with fn and scope
 */
//
export function normCallback(cb) {
  var scope = cb.scope, callback;

  // MUST_DO: Check if the use of 'this' when scope is not passed affects the callback
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
  return {
    fn: callback,
    scope: scope,
    args: cb.args,
    resIndex: cb.resIndex,
    apply: cb.apply
  };
}

/**
 * Check if the object is a callback
 * @param {Object} value
 * @return {Boolean}
 */
// MUST_DO: ModernAria: Potential Circular Dependency: Figure out access to Aria.$window and Aria.$framework window without violating circular dependency
export function isCallback(value) {
    if (value == null) {
        return false;
    }
    if (value.$Callback) {
        return true;
    }
    if (value.$classpath) {
        return false;
    }
    // TODO: ModernAria: Potential bug in original code, ideally normcallback ???
    var normCb = normCallback(value);
    return typeof(normCb.fn) == "function";
}
