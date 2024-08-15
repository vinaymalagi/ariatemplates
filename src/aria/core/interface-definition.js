import { loadInterface } from './Interfaces.js';

/**
 * Base method used to declare interfaces.
 * @param {Object} def Interface definition. The interface definition can contain the following properties:
 *
 * <pre>
 * {
 *     $extends // {String} contain the classpath of the interface this interface inherits from,
 *     $events // {Object} contain event definitions, same syntax as for classDefinition,
 *     $interface // {Object} map of empty methods and properties to be included in the interface
 * }
 * </pre>
 */
export function interfaceDefinition(def) {
  return loadInterface(def);
}
