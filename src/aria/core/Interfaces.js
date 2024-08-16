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
import { $classOrInterfaceRefRegistry, getClassRef } from './class-registry.js';
import { __mergeEvents } from './definition-utils.js';
import { $global, $logError, getLogicalPath, resolveUrl } from './framework-bootstrap.js';
// import { ItfMemberCfgSchema } from './cfg-beans-zod.js';
import { ariaEval } from './js-eval.js';
import { isArray, isFunction, isNumber, isObject, isString } from '../utils/Type.js';
import { checkJsVarName } from '../utils/js-name-checks.js';


var __cpt = -1; // last used number to store the key inside the interface
var __getNextCpt = function () {
  __cpt++;
  return __cpt;
};



let __weakMap;
(function() {
  __weakMap = $global.WeakMap || (function () {
    // mini weak map implementation for our needs
    var WeakMap = function () {
      this._key = "__iid" + __getNextCpt();
    };
    var defFn = function () { };
    WeakMap.prototype = {
      'get': function (obj) {
        return (obj[this._key] || defFn)();
      },
      'set': function (obj, value) {
        obj[this._key] = function () {
          return value;
        };
      },
      'delete': function (obj) {
        delete obj[this._key];
      }
    };
    return WeakMap;
  })();
})();


/**
 * Map of accepted types for interface members.
 * @type Object
 * @private
 */
var __acceptedMemberTypes = {
  // When changing a type here, remember to also change aria.core.CfgBeans.ItfMemberXXXCfg
  "Function": 1,
  "Object": 1,
  "Interface": 1
};

/**
 * Contains the definition for a function defined in the interface by: function(){}
 * @type Object
 * @private
 */
var __simpleFunctionDefinition = {
  $type: "Function"
};

/**
 * Contains the definition for an array defined in the interface by: []
 * @type Object
 * @private
 */
var __simpleArrayDefinition = {
  $type: "Object"
};

/**
 * Normalize interface member definition in the interface.
 * @param {String|Function|Object|Array} Interface member definition.
 * @return {Object} json object containing at least the $type property.
 * @private
 */
// eslint-disable-next-line no-unused-vars
var __normalizeMember = function (def, classpath, member) {
  let res;
  if (isFunction(def)) {
    // should already be normalized:
    return __simpleFunctionDefinition;
  } else if (isString(def)) {
    res = {
      $type: def
    };
  } else if (isArray(def)) {
    return __simpleArrayDefinition;
  } else if (isObject(def)) {
    res = def;
  } else {
    return null;
  }
  var memberType = res.$type;
  if (!__acceptedMemberTypes[memberType]) {
    // the error is logged later
    return null;
  }

  let isValid = false;
  switch (res.$type) {
    case 'Function':
      isValid = normalizeItfMemberFunction(res);
      break;
    case 'Object':
      isValid = normalizeItfMemberObject(res);
      break;
    case 'Interface':
      isValid = normalizeItfMemberInterface(res);
      break;
  }

  if (!isValid) {
    return null;
  }
  // if (!(require("./JsonValidator")).normalize({
  //   json : res,
  //   beanName : "aria.core.CfgBeans.ItfMember" + memberType + "Cfg"
  // })) {

  // try {
  //   res = ItfMemberCfgSchema.passthrough().parse(res);
  // } catch {
  //   return null;
  // }
  return res;
};

//---------------------------------------------
// MUST_DO: ModernAria: Cannot use JsonValidator here as that causes cyclic dependencies.
// Zod is an option. Has better and vaster API, but does not enforce inheritance checks.
// The inheritance checks for shape can be somewhat mitigated if we use typescript, but still there will be gaps.
// E.g. With bean defs, if Parent bean sets $minValue on an Integer, There is a check in bean validation to ensure that child cannot lower that value.
// This is not posssible with Zod. Will have to search for other libs.
function normalizeItfMemberFunction(res) {
  let isValid = true;
  if (res.$type !== 'Function') {
    isValid = false;
  }
  if(!res.$callbackParam) {
    res.$callbackParam = undefined;
  }

  if (res.$callbackParam && !isNumber(res.$callbackParam)) {
    isValid = false;
    $logError('For interface member of type Function "$callbackParam" should be a number', undefined, undefined, CLASSPATH_FOR_LOGGING);
  }
  return isValid;
}

function normalizeItfMemberObject(res) {
  let isValid = true;
  if (res.$type !== 'Object') {
    isValid = false;
  }
  return isValid;
}

function normalizeItfMemberInterface(res) {
  let isValid = true;
  if (res.$type !== 'Interface') {
    isValid = false;
  }

  const msg = 'For interface member of type Interface "$classpath" is mandatory and should be valid package name string in format "aria.core.JsonTypes"';
  const packageNameRegex = /^([a-zA-Z_$][\w$]*($|\.(?=.)))+$/;
  if (!res.$classpath) {
    isValid = false;
    $logError(msg, undefined, undefined, CLASSPATH_FOR_LOGGING);
  } else if (!isString(res.$classpath) || !packageNameRegex.test(res.$classpath)) {
    isValid = false;
    $logError(msg, undefined, undefined, CLASSPATH_FOR_LOGGING);
  }
  return isValid;
}

/**
 * Simple 1 level copy of a map.
 * @param {Object}
 * @return {Object}
 */
var __copyMap = function (src) {
  var res = {};
  for (var k in src) {
    if (Object.prototype.hasOwnProperty.call(src, k)) {
      res[k] = src[k];
    }
  }
  return res;
};

/**
 * Prototype inherited by all interface wrappers.
 * @private
 */
var __superInterfacePrototype = {
  // To be automatically overriden in sub-interfaces:
  $interface: function () { },
  $destructor: function () { },

  // Event handling functions are implemented (overriden in sub-interfaces) only if events are declared in the
  // interface. Otherwise, calling one of these methods is simply ignored.
  $addListeners: function () { },
  $removeListeners: function () { },
  $unregisterListeners: function () { },
  $on: function () { },

  // Function to automatically show the classpath of the interface (useful when debugging with Firebug):
  toString: function () {
    return "[" + this.$classpath + "]";
  }
};

/**
 * Base constructor for interface wrappers.
 * @private
 */
var __superInterfaceConstructor = function () { };
__superInterfaceConstructor.prototype = __superInterfacePrototype;

/*
 * Test whether the __proto__ property is supported, and depending on the result, choose the right implementation of
 * interface wrapper links.
 */
let is__proto__supported_fn = function () {
  const __testProtoParent = {
    protoProperty: true
  };
  const __testProtoChild = {};
  __testProtoChild.__proto__ = __testProtoParent;

  return !!__testProtoChild.protoProperty;
};
const is__proto__supported = is__proto__supported_fn();
is__proto__supported_fn = null;

const __linkItfWrappers = is__proto__supported ? function (pointFrom, pointTo) {
  // pointFrom becomes transparent: set its prototype to be pointTo and remove all properties
  pointFrom.__proto__ = pointTo;
  for (const i in pointFrom) {
    if (Object.prototype.hasOwnProperty.call(pointFrom, i)) {
      delete pointFrom[i];
    }
  }
} : function (pointFrom, pointTo) {
  // browser does not have __proto__
  // we manually have to implement the same
  var pointFromLinkItfWrappers = pointFrom.__$linkItfWrappers;
  if (pointFromLinkItfWrappers && Object.prototype.hasOwnProperty.call(pointFrom, "__$linkItfWrappers")) {
    for (var i = 0, l = pointFromLinkItfWrappers.length; i < l; i++) {
      // make each object directly point to the last object
      // eslint-disable-next-line no-invalid-this
      __linkItfWrappers.call(this, pointFromLinkItfWrappers[i], pointTo);
    }
  }

  // copy the whole object
  for (const i in pointFrom) {
    if (Object.prototype.hasOwnProperty.call(pointFrom, i)) {
      delete pointFrom[i];
    }
    // if the property is still there (inherited from the parent), override it to be equal to the
    // corresponding property in pointTo:
    if (i in pointFrom) {
      // it is on purpose that there is no hasOwnProperty here, we want to copy
      // the whole prototype
      pointFrom[i] = pointTo[i];
    }
  }
  for (const i in pointTo) {
    // it is on purpose that there is no hasOwnProperty here, we want to copy
    // the whole prototype
    pointFrom[i] = pointTo[i];
  }

  delete pointFrom.__$linkItfWrappers;

  // save inside pointTo that pointFrom is a link to it
  if (!Object.prototype.hasOwnProperty.call(pointTo, "__$linkItfWrappers")) {
    pointTo.__$linkItfWrappers = [pointFrom];
  } else {
    pointTo.__$linkItfWrappers.push(pointFrom);
  }
};

/**
 * Singleton in charge of interface-related operations. It contains internal methods of the framework which should
 * not be called directly by the application developer.
 * @private
 * @dependencies ["aria.utils.Type", "aria.core.JsonValidator"]
 */

// ERROR MESSAGES:
const INVALID_INTERFACE_MEMBER = "The '%1' interface has a '%2' member, which does not respect the constraints on interface member names. This member will be ignored.";
const INVALID_INTERFACE_MEMBER_DEF = "Invalid definition for the '%2' member on the '%1' interface. This member will be ignored.";
const BASE_INTERFACE_UNDEFINED = "Super interface for %1 is undefined (%2)";
const WRONG_BASE_INTERFACE = "Super interface for %1 is not properly defined: base interfaces (%2) must be defined through Aria.interfaceDefinition.";
const METHOD_NOT_IMPLEMENTED = "Class '%1' has no implementation of method '%2', required by interface '%3'.";
const WRONG_INTERFACE = "Interface '%1' declared in the $implements section of class '%2' was not properly defined through Aria.interfaceDefinition.";
const INTERFACE_NOT_SUPPORTED = "The '%1' interface is not supported on this object (of type '%2').";

/**
 * Utility function which generates a key that does not exist in the given object.
 * @param {Object} instances Object for which a non-existent key must be generated.
 * @return {String|Number} key which does not exist in instances.
 * @private
 */
export function generateKey(instances) {
  var r = 10000000 * Math.random(); // todo: could be replaced with algo generating keys with numbers and
  // letters
  var key = '' + (r | r); // r|r = equivalent to Math.floor - but faster in old browsers
  while (instances[key]) {
    key += 'x';
  }
  return key;
};

/**
 * Links an object to an interface wrapper. Transform the pointFrom object so that calling methods on it is
 * equivalent to calling methods on pointTo. Note that it is possible to call linkItfWrappers in chain, and
 * links are preserved, for example:
 *
 * <pre>
 * linkItfWrappers(objA, objB); // this changes objA to be like objB
 * linkItfWrappers(objB, objC); // this changes both objB and objA so that they are like objC
 * linkItfWrappers(objC, objD); // this changes objC, objB and objA so that they are like objD
 * </pre>
 *
 * It is implemented by changing the __proto__ property on browsers that support it. Otherwise, it is
 * implemented by copying the prototype and keeping a link on the pointFrom object in pointTo.
 * @param {Object} pointFrom object that will be modified to look like pointTo
 * @param {Object} pointTo interface wrapper
 */
export const linkItfWrappers = __linkItfWrappers;

const CLASSPATH_FOR_LOGGING = 'aria.core.Interfaces';
/**
 * Load an interface after its dependencies have been loaded. This method is intended to be called only from
 * Aria.interfaceDefinition. Use Aria.interfaceDefinition to declare an interface.
 * @param {Object} def definition of the interface
 */
export function loadInterface(def) {
  var classpath = def.$classpath;
  // Initialize the prototype
  var proto; // prototype being created
  var superInterface = null;
  if (def.$extends) {
    // the prototype must be created from the super interface
    superInterface = getClassRef(def.$extends);
    if (!superInterface) {
      $logError(BASE_INTERFACE_UNDEFINED, [classpath, def.$extends], undefined, CLASSPATH_FOR_LOGGING);
      throw new Error(BASE_INTERFACE_UNDEFINED);
    }
    const parentDefinition = superInterface ? superInterface.interfaceDefinition : null;
    const parentCstr = parentDefinition ? parentDefinition.$noargConstructor : null;
    if (!parentCstr) {
      $logError(WRONG_BASE_INTERFACE, [classpath, def.$extends], undefined, CLASSPATH_FOR_LOGGING);
      throw new Error(WRONG_BASE_INTERFACE);
    }
    proto = new parentCstr();
    proto.$interfaces = __copyMap(superInterface.prototype.$interfaces);
  } else {
    proto = new __superInterfaceConstructor();
    proto.$interfaces = {};
  }
  proto.$classpath = classpath; // classpath of the interface
  // Look into the members of the interface, and divide them into functions or properties
  var itf = def.$interface;
  var methods = []; // builds the string containing the methods of the interface
  var initProperties = []; // builds the string to initialize properties of the interface (objects and
  // arrays)
  var deleteProperties = []; // builds the string to delete properties of the interface (in $destructor)
  for (var member in itf) {
    if (Object.prototype.hasOwnProperty.call(itf, member)) {
      if (!checkJsVarName(member) || __superInterfacePrototype[member]) {
        $logError(INVALID_INTERFACE_MEMBER, [classpath, member], undefined, CLASSPATH_FOR_LOGGING);
        // remove and ignore that member:
        itf[member] = null;
        delete itf[member];
        continue;
      }

      //  TODO: ModernAria: Check is the "call" with this needed ever. __normalize does not use 'this'.
      // Maybe copy of function and then chaining is hapenning in aria-jsp or APF??
      // eslint-disable-next-line no-invalid-this
      var memberValue = __normalizeMember.call(this, itf[member], classpath, member);
      itf[member] = memberValue;
      if (memberValue != null) {
        if (memberValue.$type === "Function") {
          var asyncParam = memberValue.$callbackParam;
          if (asyncParam == null) {
            asyncParam = "null";
          }
          methods.push("p.", member, "=function(){\nreturn i.get(this.__$me).$call('", classpath, "','", member, "',arguments,", asyncParam, ");\n}\n");
        } else if (memberValue.$type === "Interface") {
          // TODO: ModernAria: use the classRef instead of memberValue.$classpath below
          initProperties.push("this.", member, "=obj.", member, "? obj.", member, ".$interface('", memberValue.$classpath, "'):null;\n");
          deleteProperties.push("this.", member, "=null;\n");
        } else if (memberValue.$type === "Object") {
          initProperties.push("this.", member, "=obj.", member, ";\n");
          deleteProperties.push("this.", member, "=null;\n");
        }
      } else {
        $logError(INVALID_INTERFACE_MEMBER_DEF, [classpath, member], undefined, CLASSPATH_FOR_LOGGING);
        delete itf[member];
      }
    }
  }
  // management of events
  // events in the prototype of the interface
  proto.$events = {};
  let parentHasEvents = false;
  if (superInterface) {
    parentHasEvents = __mergeEvents(proto.$events, superInterface.prototype.$events, classpath);
  } else {
    // MUST_DO: ModernAria: create window exposed Aria.getInterface, and use below
    methods.push("p.$interface=function(a){\nreturn aria.core.Interfaces.getInterface(i.get(this.__$me),a,this);\n};\n");
  }
  if (__mergeEvents(proto.$events, def.$events, classpath) && !parentHasEvents) {
    // The parent interface has no event but this interface has events!
    // We have to add special wrappers for event handling
    methods.push("p.$addListeners=function(a){\nreturn i.get(this.__$me).$addListeners(a,this);\n};\n");
    methods.push("p.$onOnce=function(a){\nreturn i.get(this.__$me).$onOnce(a,this);\n};\n");
    methods.push("p.$removeListeners=function(a){\nreturn i.get(this.__$me).$removeListeners(a,this);\n};\n");
    methods.push("p.$unregisterListeners=function(a){\nreturn i.get(this.__$me).$unregisterListeners(a,this);\n};\n");
    methods.push("p.$on=p.$addListeners;\n");
  }
  methods.push("p.$destructor=function(){\n", deleteProperties.join(''), "if(this.__$me){\ni['delete'](this.__$me);\n}\nthis.__$me=null;\n", superInterface
    ? "e.prototype.$destructor.call(this);\n" /* call super interface at the end of the destructor */
    : "", "};\n");
  var srcContent = [];
  var evalContext = {
    i: new __weakMap(),
    p: proto, // prototype
    c: null, // constructor (will be set by the evaluated code)
    e: superInterface
  };
  // nspace(classpath, true);
  srcContent.push(
    "var evalContext=arguments[2];\nvar i=evalContext.i;\nvar p=evalContext.p;\nvar e=evalContext.e;\nevalContext.c=function(obj){\n",
    (superInterface ? 'e.call(this,obj);\n': ''),
    'this.__$me=this.__$me||this;\ni.set(this.__$me,obj);\n',
    initProperties.join(''), '};\n',
    methods.join(''),
    // MUST_DO: Check if below line to expose the interface in global path is needed
    /*'Aria.$global.', classpath, '=evalContext.c;\n', */
    'p=null;\nevalContext=null;\n'
  );
  srcContent = srcContent.join('');

  // Get original sourceURL of the interface
  var interfaceSrcURL = resolveUrl(getLogicalPath(classpath, ".js"), true);
  // Remove extension and add wrapper extension
  var indexOfExtension = interfaceSrcURL.lastIndexOf(".");
  var srcURL = interfaceSrcURL.substring(0, indexOfExtension) + "-wrapper.js";
  // Generate the interface wrapper
  ariaEval(srcContent, srcURL, evalContext);
  var constructor = evalContext.c;
  proto.$interfaces[classpath] = constructor;
  constructor.prototype = proto;
  constructor.interfaceDefinition = def;
  constructor.superInterface = superInterface;
  def.$noargConstructor = new Function();
  def.$noargConstructor.prototype = proto;
  // $classes.push(constructor);
  $classOrInterfaceRefRegistry.set(classpath, constructor);
  return constructor;
}

/**
 * This method is intended to be called only from Aria.loadClass for each interface declared in $implements.
 * @param {String|Object} interfaceOrClasspath Classpath or reference of the interface to apply to the class
 * definition. This interface must already be completely loaded.
 * @param {Object} classPrototype Prototype of the class being loaded.
 * @return {Boolean} false if a fatal error occured, true otherwise
 */
export function applyInterface(interfaceOrClasspath, classPrototype) {
  if ( typeof interfaceOrClasspath === 'string') {
    $logError(`Expect interface class ref not the classpath string (${interfaceClasspath})`);
    return false;
  }
  var itf = interfaceOrClasspath;
  if (!itf.interfaceDefinition) {
    $logError(WRONG_INTERFACE, [interfaceOrClasspath, classPrototype.$classpath], undefined, CLASSPATH_FOR_LOGGING);
    return false;
  }
  var interfaceClasspath = itf.interfaceDefinition.$classpath;
  var interfaces = classPrototype.$interfaces;
  if (interfaces && interfaces[interfaceClasspath]) {
    // the interface was already applied
    return true;
  }
  if (itf.superInterface) {
    // apply the parent interface before this interface
    if (!applyInterface(itf.interfaceDefinition.$extends, classPrototype)) {
      return false;
    }
    // by calling this function, interfaces may have changed, update the variable:
    interfaces = classPrototype.$interfaces;
  }
  if (!Object.prototype.hasOwnProperty.call(classPrototype, "$interfaces")) {
    // copies the parent map of interfaces before adding this one
    interfaces = __copyMap(interfaces);
    classPrototype.$interfaces = interfaces;
  }
  // set on the prototype that the interface is supported:
  interfaces[interfaceClasspath] = itf;
  // copies the events:
  __mergeEvents(classPrototype.$events, itf.interfaceDefinition.$events, classPrototype.$classpath);
  // check that methods of the interface are correctly implemented in the class prototype:
  var itfMembers = itf.interfaceDefinition.$interface;
  for (var member in itfMembers) {
    if (Object.prototype.hasOwnProperty.call(itfMembers, member) && itfMembers[member].$type === "Function"
      && !isFunction(classPrototype[member])) {
      $logError(METHOD_NOT_IMPLEMENTED, [classPrototype.$classpath, member, interfaceClasspath], undefined, CLASSPATH_FOR_LOGGING);
      return false;
    }
  }
  return true;
}

/**
 * This method is intended to be called only from $interface (either in aria.core.JsObject or in interface
 * wrappers) Use the $interface method instead of this method. This method retrieves a wrapper object on the
 * given object which only contains the methods and properties defined in the interface.
 * @param {aria.core.JsObject} object Object on which an interface wrapper should be returned.
 * @param {String|Function} itf Classpath of the interface, or constructor of the interface whose wrapper is
 * requested.
 * @param {Object} object Interface wrapper from which the $interface method is called, or null if the
 * method is called from the whole object.
 * @return {Object} interface wrapper on the given object or null if an error occurred. In this case, the
 * error is logged. Especially an error can occur if the object does not support the interface.
 */
export function getInterface(object, itf, itfWrapper) {
  var classpath;
  var itfConstructor;
  if (isFunction(itf)) {
    // interface given by its constructor
    itfConstructor = itf;
    classpath = itf.interfaceDefinition.$classpath;
  } else if (isString(itf)) {
    // $logError(`getInterface: Expect the interface constructor not the classpath ${classpath}`);
    // return null;
    // interface given by its classpath (constructor retrieved later if needed)
    classpath = itf;
  }
  var interfaces = object.__$interfaces;
  var res;
  // first check if the interface is supported by the interface wrapper, if any:
  if (itfWrapper != null && !itfWrapper.$interfaces[classpath]) {
    $logError(INTERFACE_NOT_SUPPORTED, [classpath, itfWrapper.$classpath], undefined, CLASSPATH_FOR_LOGGING);
    return null;
  }
  // first check if an instance of the interface already exists
  if (interfaces) {
    res = interfaces[classpath];
    if (res) {
      return res;
    }
  }
  // check if the interface is supported:
  if (!object.$interfaces[classpath]) {
    $logError(INTERFACE_NOT_SUPPORTED, [classpath, object.$classpath], undefined, CLASSPATH_FOR_LOGGING);
    return null;
  }

  if (!itfConstructor) {
    itfConstructor = getClassRef(classpath);
    if (!itfConstructor) {
      // error is already logged in Aria.getClassRef
      return null;
    }
  }
  if (!interfaces) {
    interfaces = {};
    object.__$interfaces = interfaces;
  }
  res = new itfConstructor(object);
  interfaces[classpath] = res;
  return res;
}


/**
 * This method is intended to be called only from aria.core.JsObject.$dispose. It disposes all the interface
 * wrapper instances created on the given object through getInterface.
 * @param {aria.core.JsObject} object object whose interfaces must be disposed of.
 */
export function disposeInterfaces(object) {
  // dispose all the interfaces of the given object
  var interfaces = object.__$interfaces;
  if (!interfaces) {
    // no interface to destroy
    return;
  }
  for (var i in interfaces) {
    if (Object.prototype.hasOwnProperty.call(interfaces, i) && interfaces[i].$destructor) {
      interfaces[i].$destructor();
      interfaces[i] = null;
    }
  }
  object.__$interfaces = null;
}
