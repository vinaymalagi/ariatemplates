/**
 * Return true if value is an Object or an Array. It will however return false if the value is an instance of
 * aria.core.JsObject
 *
 * NOTE: ModernAria: copied this function from aria.utils.Type to handle circular dependency
 * @param {Object} value
 * @return {Boolean} isContainer
 */

import { isArray, isObject } from '../../utils/Type.js';
import { JsObject } from '../class-definition.js';
import { getClassRef } from '../class-registry.js';

export function isContainer(value) {
  return (isObject(value) || isArray(value)) && !(value instanceof JsObject);
}

/**
 * Check if the value is an instance object of the given classpath.
 * @param {Object} value
 * @param {String} classpath
 * @return {Boolean} true is value is an instance of the given classpath, false otherwise
 */
export function isInstanceOf(value, classpath) {
    var myClass = getClassRef(classpath);
    if (myClass == null) {
        /* if the classpath is not loaded, the value cannot be an instance of it */
        return false;
    }
    return value instanceof myClass;
}

