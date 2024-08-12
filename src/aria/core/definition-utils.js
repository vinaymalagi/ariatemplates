import { REDECLARED_EVENT } from './error-messages.js';
import { $logError } from './framework-bootstrap.js';

/**
 * Copy members of object src into dst.
 * @param {Object} src
 * @param {Object} dst
 *
 * @publicApi
 */
export const copyObject = function (src, dst) {
  for (var k in src) {
    if (Object.prototype.hasOwnProperty.call(src, k)) {
      dst[k] = src[k];
    }
  }
};

/**
 * Copies the content of mergeFrom into mergeTo. mergeFrom and mergeTo are maps of event definitions. If an event
 * declared in mergeFrom already exists in mergeTo, the error is logged and the event is not overriden.
 *
 * Making the function available for aria.core.Interfaces. Is not intended for the use by application developers.
 *
 * TODO:ModernAria: Implement Private/Public exports Strategy for separating APIs for internal use from those by users of fraemwork
 * @name Aria.__mergeEvents
 * @private
 * @method
 * @param {Object} mergeTo Destrination object (map of events).
 * @param {Object} mergeFrom Source object (map of events).
 * @param {String} Classpath of the object to which events are copied. Used in case of error.
 * @return {Boolean} false if mergeFrom is empty. True otherwise.
 */
export function __mergeEvents(mergeTo, mergeFrom, classpathTo) {
  var hasEvents = false;
  for (var k in mergeFrom) {
    if (Object.prototype.hasOwnProperty.call(mergeFrom, k)) {
      if (!hasEvents) {
        hasEvents = true;
      }
      // The comparison with null below is important, as an empty string is a valid event description.
      if (mergeTo[k] != null) {
        $logError(REDECLARED_EVENT, [k, classpathTo]);
      } else {
        mergeTo[k] = mergeFrom[k];
      }
    }
  }
  return hasEvents;
}


