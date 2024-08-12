import { $logError, $logWarn } from './framework-bootstrap.js';

// /**
//  * Messages for logging
//  *
//  */
// const INVALID_NAMESPACE = "Invalid namespace: %1";

// /**
//  * Make sure the JavaScript namespace object exists and create it if necessary. Does not check for syntax.
//  * @param {String} nspace the namespace string - e.g. 'abc.x.y.z'
//  * @param {Boolean} createIfNull [optional, default: true] if false, the namespace is not created if it does not
//  * exist (in this case the function returns null)
//  * @param {Object} parent [optional, default: Aria.$global] parent object in which to search for the namespace
//  * @return {Object}
//  */
// export const nspace = function (nspace, createIfNull, parent) {
//   // normalize parent
//   if (parent == null) {
//     parent = $global;

//   }

//   // normalize createIfNull
//   createIfNull = createIfNull !== false;

//   // edge case
//   if (nspace === "") {
//     return parent;
//   }

//   if (!nspace || typeof (nspace) != 'string') {
//     return nspace;
//     /*Aria.$logError(Aria.INVALID_NAMESPACE, [nspace]);
//     return null;*/
//   }

//   var parts = nspace.split('.'), nbParts = parts.length, current;
//   for (var i = 0; i < nbParts; i++) {
//     current = parts[i];
//     if (!current || isJsReservedWord(current)) {
//       $logError(INVALID_NAMESPACE, [nspace]);
//       return null;
//     }
//     if (!parent[current]) {
//       if (!createIfNull) {
//         return null;
//       }
//       parent[current] = {};
//     }
//     parent = parent[current];
//   }
//   return parent;
// };



/**
 * List of all class definitions that have been defined through Aria.classDefinition Some definitions may not
 * published though - cf. loadClass and class override (unit tests)
 * @private
 * @type Map
 * @see loadClass()
 * @name Aria.$classDefinitions
 */
export const $classDefinitions = {};

// /**
//  * List of all classes in the order of their loading
//  * @type Array
//  * @name Aria.$classes
//  */
// export const $classes = [];

/**
 * Map of classpath to class ref
 */
export const $classOrInterfaceRefRegistry = new Map();

export const $templateToTplScriptMap = new Map();

/**
 * Map of classpath to singleton instances
 */
export const $singletonInstanceFactoryRegistry = new Map();


/**
 * Return a reference to the class or its singleton instance when class is a singleton given by its classpath.
 * @param {String} classpath the string - e.g. 'abc.x.y.z.ClassName'
 * @return {Object}
 */
export function getClassRef(classpath) {
  if (typeof classpath === "string") {
    return $classOrInterfaceRefRegistry.get($classOrInterfaceRefRegistry);
  } else {
    if (!classpath.classDefinition && !classpath.interfaceDefinition) {
      // Note: ModernAria: classpath has classDefinition or interfaceDefinition hence must be a constructor
      $logWarn(`ModernAria: getClassRef: called with a value that does not appear to be a class/interface defintion`);
    }
    return classpath;
  }
};

/**
 * This function is useful when either a classpath or a reference to a class is expected, to convert such a value to
 * a classpath. If the parameter is a reference to an Aria Templates class or interface, its classpath is returned.
 * Otherwise, the parameter is returned as is.
 * @param {String|Object|Function} classpathOrCstr Classpath or reference to a class.
 * @return {String} Classpath corresponding to classpathOrCstr
 */
export const getClasspath = function (classpathOrCstr) {
  if (classpathOrCstr && typeof classpathOrCstr != "string") {
      if (classpathOrCstr.classDefinition) {
          return classpathOrCstr.classDefinition.$classpath;
      } else if (classpathOrCstr.interfaceDefinition) {
          return classpathOrCstr.interfaceDefinition.$classpath;
      }
  }
  return classpathOrCstr;
};

/**
 * Return an instance of the given class, initialized with the parameter given as argument
 * @param {String} className the string - e.g. 'abc.x.y.z'
 * @param {Array} args, optional arguments given as an object to the constructor
 * @return {Object}
 */
export const getClassInstance = function (className, args) {
  var ClassRef = getClassRef(className);
  if (ClassRef) {
      return new ClassRef(args);
  } else {
      const INSTANCE_OF_UNKNOWN_CLASS = "Cannot create instance of class '%1'";
      $logError(INSTANCE_OF_UNKNOWN_CLASS, [className]);
  }
};
