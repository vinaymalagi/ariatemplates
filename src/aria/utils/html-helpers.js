import { $frameworkWindow, FRAMEWORK_GLOBALS } from '../core/framework-bootstrap.js';
import { isString } from './Type.js';

/**
 * Check if the value is a HTML element
 * @param {Object} object
 * @return {Boolean} isHTMLElement
 */
export function isHTMLElement(object) {
  // http://www.quirksmode.org/dom/w3c_core.html#nodeinformation
  if (object) {
      var nodeName = object.nodeName;
      return object === FRAMEWORK_GLOBALS.$window || isString(nodeName)
              || object === $frameworkWindow;
  } else {
      return false;
  }
}
