import { capitalize } from '../utils/String.js';
import { isArray, isCallback, isObject, isString } from '../utils/Type.js';
import { isJsReservedWord } from '../utils/js-name-checks.js';
import { applyInterface, disposeInterfaces, getInterface } from './Interfaces.js';
import { $classDefinitions, $classOrInterfaceRefRegistry, getClassRef } from './class-registry.js';
import { __mergeEvents, copyObject } from './definition-utils.js';
import { BASE_CLASS_UNDEFINED, CANNOT_EXTEND_SINGLETON, DUPLICATE_CLASSNAME, EXPECT_CLASS_DEFINITION, FUNCTION_PROTOTYPE_RETURN_NULL, INCOHERENT_CLASSPATH, INVALID_CLASSNAME_FORMAT, INVALID_CLASSNAME_RESERVED, INVALID_DEFCLASSPATH, INVALID_INTERFACES, INVALID_PACKAGENAME_FORMAT, INVALID_PACKAGENAME_RESERVED, NULL_CLASSPATH, NULL_PARAMETER, PARENT_NOTCALLED, RESOURCES_HANDLE_CONFLICT, TEXT_TEMPLATE_HANDLE_CONFLICT, WRONG_BASE_CLASS, WRONGPARENT_CALLED } from './error-messages.js';
import { $global, $logError, $logInfo, FRAMEWORK_GLOBALS, FRAMEWORK_LOGGER, FRAMEWORK_PREFIX, memCheckMode } from './framework-bootstrap.js';


/**
 * Load class definition
 * @param {aria.core.CfgBeans:ClassDefinitionCfg} def
 * @returns {}
 *
 */
export function classDefinition(def) {

  if (!def) {
    return __classLoadError(def, NULL_PARAMETER, ["classDefinition"]);
  }

  normalizeClassDefinition(def);

  // MUST_DO: ModernAria: check class definition dependency validation ($resources, $text, $css etc.).

  // // check dependencies
  // var missingDependencies = [];

  // appendMissingDependencies(missingDependencies, def.$dependencies, '.js', loadedOldSyntaxDeps);
  // appendMissingDependencies(missingDependencies, def.$templates, '.tpl', loadedOldSyntaxDeps);
  // appendMissingDependencies(missingDependencies, def.$css, '.tpl.css', loadedOldSyntaxDeps);
  // appendMissingDependencies(missingDependencies, def.$macrolibs, '.tml', loadedOldSyntaxDeps);
  // appendMissingDependencies(missingDependencies, def.$csslibs, '.cml', loadedOldSyntaxDeps);

  // // add implemented interfaces to dependencies map
  // appendMissingDependencies(missingDependencies, def.$implements, '.js', loadedOldSyntaxDeps);

  // // add resources file to dependencies map
  // if (def.$resources) {
  //     for (var itm in def.$resources) {
  //         if (Object.prototype.hasOwnProperty.call(def.$resources, itm)) {
  //             var itmValue = def.$resources[itm];
  //             if (Object.prototype.hasOwnProperty.call(itmValue, "provider") && typeof itmValue.provider == 'string') {
  //                 var resProviderInfo = itmValue["aria:resProviderInfo"] = ["",
  //                         getLogicalPath(itmValue.provider, ".js"), clsPath, itmValue.onLoad];

  //                 var itmValueResources = itmValue.resources;
  //                 if (itmValue.handler || itmValueResources) {
  //                     resProviderInfo.push(itmValue.handler);
  //                 }
  //                 if (itmValueResources) {
  //                     for (var j = 0; j < itmValueResources.length; j++) {
  //                         resProviderInfo.push(itmValueResources[j]);
  //                     }
  //                 }
  //                 missingDependencies.push({
  //                     module : resourcesProvidersModulePath,
  //                     method : "fetch",
  //                     args : resProviderInfo
  //                 });
  //             } else {
  //                 appendMissingResDependencies(missingDependencies, [itmValue], loadedOldSyntaxDeps);
  //             }
  //         }
  //     }
  // }
  // // add text template files to dependencies map
  // if (def.$texts) {
  //     appendMissingDependencies(missingDependencies, require('./utils/Array').extractValuesFromMap(def.$texts), '.tpl.txt', loadedOldSyntaxDeps);
  // }

  // $classDefinitions[def.$classpath] = def;



  return loadClass(def);
}

const navigator = $global.navigator;

/**
 * @private There is a IE only check in the loadClass function aria.core.Browser cannot be used at this stage, so
 * we have to manually check for IE here. The logic is used is however the same as in aria.core.Browser
 * // TODO: ModernAria: Maybe not needed
 */
const __temporaryIsIE = navigator ? navigator.userAgent.toLowerCase().indexOf("msie") !== -1 : false;

/**
 * Load a class definition and expose it on a public path. These 2 paths may be different to support class
 * overloading (for unit testing for intance).<br/> Note: this method is automatically called by classDefinition() -
 * with the 2 same arguments in this case
 * @param {String|aria.core.CfgBeans:ClassDefinitionCfg} definitionClassPath  the internal classpath associated to the class definition - e.g.
 * 'mypkg.MyClass2'
 * @param {String} publicClassPath the public class path to give to this definition - e.g. 'mypkg.MyClass'
 *
 * TODO: ModernAria: "publicClassPath" should no longer be needed, will not be able to replace, and support class overloading
 * TODO: ModernAria: Do not expose loadClass
 */
export function loadClass(defOrClassPath, publicClassPath) {
  let definitionClassPath;
  let def;
  if (isString(defOrClassPath)) {
    // retrieve definition.
    // MUST_DO: ModernAria: This should not be required anymore, check and remove later
    __classLoadError(def, EXPECT_CLASS_DEFINITION, [defOrClassPath, 'loadClass: ']);
    return;

    // if (!publicClassPath) {
    //   publicClassPath = definitionClassPath;
    // }
    // if (!__checkClasspath(publicClassPath, "loadClass: ")) {
    //   return;
    // }

    // def = $classDefinitions[definitionClassPath];
    // if (!def) {
    //   $logError(INVALID_DEFCLASSPATH, [definitionClassPath]);
    //   return;
    // }
  } else if (isObject(defOrClassPath)) {
    // NOTE: ModernAria: Not validating class def here as so far expecting this to be called only from classDefinition above.
    // TODO: ModernAria: Refactor: Maybe move the classpath check to classDefinition??
    def = defOrClassPath;
    definitionClassPath = defOrClassPath.$classpath;
    if (!publicClassPath) {
      publicClassPath = definitionClassPath;
    }
    __checkClasspath(publicClassPath, "loadClass: ");
  } else {
    $logError(INVALID_DEFCLASSPATH, [defOrClassPath]);
    throw new Error(`Invalid class definition passed: ${defOrClassPath}`);
  }

  var defPrototype = def.$prototype, defStatics = def.$statics, defEvents = def.$events, defBeans = def.$beans, defResources = def.$resources, defTexts = def.$texts;
  var defImplements = def.$implements;

  // Create public ns
  // var clsNs = '';
  // var clsName = publicClassPath;
  // var idx = publicClassPath.lastIndexOf('.');
  // if (idx > -1) {
  //   clsNs = publicClassPath.slice(0, idx);
  //   clsName = publicClassPath.slice(idx + 1);
  // }

  // get namespace object
  // var ns = nspace(clsNs);

  // manage inheritance
  var superclass = null;
  if (def.$extends) {
    if (typeof def.$extends == "string") {
      if (!__checkClasspath(def.$extends, "parentClass: ")) {
        return __classLoadError(def);
      }
      superclass = getClassRef(def.$extends);
    } else {
      superclass = def.$extends;
    }

    if (!superclass) {
      return __classLoadError(def, BASE_CLASS_UNDEFINED, [def.$classpath, def.$extends]);
    } else {
      // check that superclass has been properly loaded
      if (!superclass.classDefinition) {
        return __classLoadError(def, WRONG_BASE_CLASS, [def.$classpath, def.$extends]);
      }
      // check that superclass is not singleton
      if (superclass.classDefinition.$singleton) {
        // MUST_DO: With new implementation Singletons are handled by class implementer. How to identify whether superclass is a singleton??
        return __classLoadError(def, CANNOT_EXTEND_SINGLETON, [def.$classpath, def.$extends]);
      }

    }
  }

  // define class prototype
  var p; // new prototype
  if (superclass) {
    p = new superclass.classDefinition.$noargConstructor();
    // won't work, something else needs to be provided
    // p.$super = superclass.prototype;
  } else {
    p = {};
  }

  p.$classpath = def.$classpath;
  p.$class = def.$class;
  p.$package = def.$package;
  var parentResources = {};
  if (p.$resources) {
    parentResources = p.$resources;
    p.$resources = {};
    copyObject(parentResources, p.$resources);
    copyObject(defResources, p.$resources);
  } else {
    p.$resources = def.$resources;
  }
  var parentTexts = {};
  if (p.$texts) {
    parentTexts = p.$texts;
    p.$texts = {};
    copyObject(parentTexts, p.$texts);
    copyObject(defTexts, p.$texts);
  } else {
    p.$texts = def.$texts;
  }

  // css templates
  if (def.$css) {
    // TODO: ModernAria: Validate $css should be class references
    p.$css = def.$css;
  }
  if (defPrototype) {
    if (typeof defPrototype === "function") {
      defPrototype = defPrototype.apply({});
      if (!defPrototype) {
        $logError(FUNCTION_PROTOTYPE_RETURN_NULL, [publicClassPath]);
        defPrototype = {};
      }
      copyObject(defPrototype, def.$prototype);
    }
    for (const k in defPrototype) {
      if (Object.prototype.hasOwnProperty.call(defPrototype, k) && k !== '$init') {
        if (typeof defPrototype[k] === "function") {
          // enable naming of anonymous functions in the stack trace in Firebug and Safari
          defPrototype[k].displayName = "#" + k;
        }
        // TODO: check method names?
        p[k] = defPrototype[k];
      }
    }
    // Internet Explorer fix only for toString and valueOf properties
    // cannot use aria.core.Browser at this stage,
    // __temporaryIsIE is defined right before loadClass and is only accessible inside the closure
    if (__temporaryIsIE) {
      if (Object.prototype.hasOwnProperty.call(defPrototype, "toString")) {
        p.toString = defPrototype.toString;
      }
      if (Object.prototype.hasOwnProperty.call(defPrototype, "valueOf")) {
        p.valueOf = defPrototype.valueOf;
      }
    }
  }

  // if resources were defined for a class add them to the prototype
  if (defResources) {
    for (const k in defResources) {
      if (Object.prototype.hasOwnProperty.call(defResources, k)) {
        if (p[k] && !parentResources[k]) {
          $logError(RESOURCES_HANDLE_CONFLICT, [k, publicClassPath]);
        } else if (Object.prototype.hasOwnProperty.call(defResources[k], "provider")) {
          // TODO: ModernAria: Handle non-static resource loading, when working on Aria JSP
          // if (typeof defResources[k].provider == "string") {
          //     var resProviderInfo = defResources[k]["aria:resProviderInfo"];
          //     var resourcesProvidersModule = require(resourcesProvidersModulePath);
          //     p[k] = resourcesProvidersModule.fetch.apply(resourcesProvidersModule, resProviderInfo).provider;
          // } else {
          //     p[k] = defResources[k].provider;
          // }
        } else {
          // TODO: ModernAria: Validate defResources[k] to be a class ref
          p[k] = getClassRef(defResources[k]);
        }
      }
    }
  }
  /*
   * if text templates were defined for a class add them to the prototype make sure that the handle provided does
   * not already exist. If it refers to a parent text template, tghen we still want to override it
   */
  if (defTexts) {
    for (var k in defTexts) {
      if (Object.prototype.hasOwnProperty.call(defTexts, k)) {
        if (p[k] && !parentTexts[k]) {
          $logError(TEXT_TEMPLATE_HANDLE_CONFLICT, [k, publicClassPath]);
        } else {
          // TODO: ModernAria: Validate defTexts[k] to be a class ref
          p[k] = getClassRef(defTexts[k]);
        }
      }
    }
  }

  if (defStatics) {
    // publish statics on the prototype so that they are available
    // as object properties
    copyObject(defStatics, p);
  }
  if (defBeans) {
    // FIXME: WHAT TO DO ? WHAT. TO. DO !!
  }

  // Inclusion of events:
  // 1: the events of the super class (including those from its interfaces and its superclass)
  // 2: the events from the interfaces of the current class (added through applyInterface)
  // 3: the events of the current class (in the class definition)
  // In this second step, there is a check that an interface is not applied twice
  // Events cannot be redefined. If they are, an error is raised.

  p.$events = {};
  if (superclass) {
    __mergeEvents(p.$events, superclass.prototype.$events, p.$classpath);
  }
  if (defImplements) {
    if (isArray(defImplements)) {
        for (let k = 0, l = defImplements.length; k < l; k++) {
            if (!applyInterface(defImplements[k], p)) {
                // the error has already been logged from applyInterface
                return __classLoadError(def);
            }
        }
    } else {
        return __classLoadError(def, INVALID_INTERFACES, [def.$classpath]);
    }
  }
  if (!p.$interfaces) {
    p.$interfaces = {};
  }
  __mergeEvents(p.$events, defEvents, p.$classpath);
  var dstrctr = __createDestructor(def, superclass);
  if (dstrctr) {
    // only create the destructor if needed
    p.$destructor = dstrctr;
  }

  // create ref to current prototype (usefull for subclasses)
  var protoRef = '$' + def.$class;
  // if base class ref already exists, log error
  if (p[protoRef] != null) {
    return __classLoadError(def, DUPLICATE_CLASSNAME, def.$class);
  } else {
    p[protoRef] = p;
  }

  if (!def.$constructor) {
    def.$constructor = __createDefaultConstructor(superclass);
  }
  var constructor = __createConstructor(def, superclass);

  constructor.prototype = p;
  if (superclass) {
    constructor.superclass = superclass.prototype;
  }
  p.$constructor = p.constructor = constructor;
  def.$noargConstructor.prototype = p;

  /**
   * Is either instance of class if singleton or the constructor
   */
  let result;
  if (def.$singleton) {
    result = new constructor();
  } else {
    if (defStatics) {
      // publish statics reference on the contstructor
      // note: already the case for singleton as statics are also
      // available in the prototype
      copyObject(defStatics, constructor);
    }
    result = constructor;
  }
  result.classDefinition = def;
  // $classes.push(ns[clsName]);
  $classOrInterfaceRefRegistry.set(publicClassPath, result);
  $classDefinitions[publicClassPath] = def;


  // MAYBE_DO: ModernAria: A way to create self destroying singleton instances (when nothing refers to the instance), using WeakRefs and Finalization Registry
  // let instance = null;
  // if(def.$singleton) {
  //   if (isFunction(def.$singleton)) {
  //     cnstrctr.getInstance = def.$singleton;
  //   } else {
  //     instance = new cnstrctr();
  //     cnstrctr.getInstance =
  //   }
  // }


  // if prototype init exist
  if (defPrototype && defPrototype.$init) {
    // MUST_DO: ModernAria: Maybe $init is not required.
    defPrototype.$init(p, def);
  }

  if (def.$onload) {
    // MUST_DO: $onload should no longer be needed. Must change classes for the same.
    // MUST_DO: But in case of singleton $onload gets the singleton instance instead of constructor, handle behavior differently.
    // __classLoadError(def, `$onload should no longer be needed as there is no dynamic loading anymore. (${def.classpath})`);
    // call the onload method
    // TODO: try/catch
    def.$onload.call(p, result);
  }

  if (def.$css) {
    const cssManager = getClassRef('aria.templates.CSSMgr');
    if (!cssManager) {
      // $css should be only in template definitions and CSS manager should be loaded in templates / css definitions.
      __classLoadError(def, 'loadClass: CSS Manager (aria.template.CssMgr) not loaded.');
      return;
    }
    // MUST_DO: ModernAria: Figure out how to handle this, CSSMgr is a singleton using classDefinition
    cssManager.registerDependencies(def.$classpath, def.$css);
  }

  return result;
}



/**
 * Classpath validation method
 * @param {String} path class path to validate - e.g. 'aria.jsunit.TestSuite'
 * @param {String} context additional context information
 * @return {Boolean} true if class path is OK
 */
function __checkClasspath(path, context) {
  if (!path || typeof (path) != 'string') {
    $logError(NULL_CLASSPATH);
    return false;
  }
  var classpathParts = path.split('.'), nbParts = classpathParts.length;
  for (var index = 0; index < nbParts - 1; index++) {
    if (!__checkPackageName(classpathParts[index], context)) {
      return false;
    }
  }
  if (!__checkClassName(classpathParts[nbParts - 1], context)) {
    return false;
  }
  return true;
};

function __classLoadError(definition, errorID, errorArgs) {
  if (errorID) {
    $logError(errorID, errorArgs);
  }
  if (!definition) {
    definition = {};
  }
  throw new Error("Error while loading " + (definition.$classpath || "a class"));
  // TODO: ModernAria: Do we handle $oldModuleLoader??? Removed for now
  // var oldModuleLoader = definition.$oldModuleLoader;
  // if (oldModuleLoader) {
  //   oldModuleLoader.error(error);
  //   return null;
  // } else {
  //   throw error;
  // }
};

const disposeTag = FRAMEWORK_PREFIX + 'isDisposed';

/**
 * Private method to remove interceptors.
 * @param {Object} allInterceptors obj.__$interceptors
 * @param {String} name [mandatory] name interface name
 * @param {Object} scope [optional] if specified, only interceptors with that scope will be removed
 * @param {Function} fn [optional] if specified, only interceptors with that function will be removed
 */
function __removeInterceptorCallback(allInterceptors, name, scope, fn) {
  for (var i in allInterceptors[name]) {
    if (Object.prototype.hasOwnProperty.call(allInterceptors[name], i)) {
      __removeCallback(allInterceptors[name], i, scope, fn);
    }
  }
};

/**
 * Private method used to remove callbacks from a map of callbacks associated to a given scope and function
 * @param {Object} callbacksMap map of callbacks, which can be currently: obj._listeners
 * @param {String} name [mandatory] name in the map, may be the event name (if callbacksMap == _listeners)
 * @param {Object} scope [optional] if specified, only callbacks with that scope will be removed
 * @param {Function} fn [optional] if specified, only callbacks with that function will be removed
 * @param {Object} src [optional] if the method is called from an interface wrapper, must be the reference of the
 * interface wrapper. It is used to restrict the callbacks which can be removed from the map.
 * @param {Boolean} firstOnly. if true, remove only first occurence.
 * @private
 */
function __removeCallback(callbacksMap, name, scope, fn, src, firstOnly) {
  if (callbacksMap == null) {
    return; // nothing to remove
  }

  var arr = callbacksMap[name];

  if (arr) {
    var length = arr.length, removeThis = false, cb;
    for (var i = 0; i < length; i++) {
      cb = arr[i];

      // determine if callback should be removed, start with
      // removeThis = true and then set to false if
      // conditions are not met

      // check the interface from which we remove the listener
      removeThis = (!src || cb.src === src)
        // scope does not match
        && (!scope || scope === cb.scope)
        // fn does not match
        && (!fn || fn === cb.fn);

      if (removeThis) {
        // mark the callback as being removed, so that it can either
        // still be called (in case of CallEnd in
        // interceptors, if CallBegin has been called) or not called
        // at all (in other cases)
        cb.removed = true;
        arr.splice(i, 1);
        if (firstOnly) {
          break;
        } else {
          i--;
          length--;
        }
      }
    }
    if (arr.length === 0) {
      // no listener anymore for this event/interface
      callbacksMap[name] = null;
      delete callbacksMap[name];
    }
  }
};

/**
 * Interceptor dispatch function.
 * @param {Object} interc interceptor instance
 * @param {Object} info interceptor parameters
 */
function __callInterceptorMethod(info) {
  var methodName = capitalize(info.method);
  // eslint-disable-next-line no-invalid-this
  var fctRef = this["on" + methodName + info.step];
  if (fctRef) {
    // eslint-disable-next-line no-invalid-this
    return fctRef.call(this, info);
  }
  // eslint-disable-next-line no-invalid-this
  fctRef = this["on" + info.method + info.step];
  if (fctRef) {
    // eslint-disable-next-line no-invalid-this
    return fctRef.call(this, info);
  }
};

/**
 * Recursive method to call wrappers. This method should be called with "this" refering to the object whose method
 * is called.
 */
function __callWrapper(args, commonInfo, interceptorIndex) {
  if (interceptorIndex >= commonInfo.nbInterceptors) {
    // end of recursion: call the real method:
    // eslint-disable-next-line no-invalid-this
    return this[commonInfo.method].apply(this, args);
  }
  var interc = commonInfo.interceptors[interceptorIndex];
  if (interc.removed) {
    // interceptor was removed in the mean time, skip it.
    // eslint-disable-next-line no-invalid-this
    return __callWrapper.call(this, info.args, commonInfo, interceptorIndex + 1);
  }
  var info = {
    step: "CallBegin",
    method: commonInfo.method,
    args: args,
    cancelDefault: false,
    returnValue: null
  };
  var asyncCbParam = commonInfo.asyncCbParam;
  if (asyncCbParam != null) {
    var callback = {
      fn: __callbackWrapper,
      // eslint-disable-next-line no-invalid-this
      scope: this,
      args: {
        info: info,
        interc: interc,
        // save previous callback:
        origCb: args[asyncCbParam]
      }
    };
    args[asyncCbParam] = callback;
    if (args.length <= asyncCbParam) {
      // We do this check and set the length property because the
      // "args" object comes
      // from the JavaScript arguments object, which is not a real
      // array so that the
      // length property is not updated automatically by the previous
      // assignation: args[asyncCbParam] = callback;
      args.length = asyncCbParam + 1;
    }
    info.callback = callback;
  }
  // eslint-disable-next-line no-invalid-this
  this.$callback(interc, info);
  if (!info.cancelDefault) {
    // call next wrapper or real method:
    try {
      // eslint-disable-next-line no-invalid-this
      info.returnValue = __callWrapper.call(this, info.args, commonInfo, interceptorIndex + 1);
    } catch (e) {
      info.exception = e;
    }
    info.step = "CallEnd";
    delete info.cancelDefault; // no longer useful in CallEnd
    // call the interceptor, even if it was removed in the mean time (so
    // that CallEnd is always called when
    // CallBegin has been called):
    // eslint-disable-next-line no-invalid-this
    this.$callback(interc, info);
    if ("exception" in info) {
      throw info.exception;
    }
  }
  return info.returnValue;
};

/**
 * Callback wrapper.
 */
var __callbackWrapper = function (res, args) {
  var interc = args.interc;
  if (interc.removed) {
    // the interceptor was removed in the mean time, call the original callback directly
    // eslint-disable-next-line no-invalid-this
    return this.$callback(args.origCb, res);
  }
  var info = args.info;
  info.step = "Callback";
  info.callback = args.origCb;
  info.callbackResult = res;
  info.cancelDefault = false;
  info.returnValue = null;
  // eslint-disable-next-line no-invalid-this
  this.$callback(interc, info);
  if (info.cancelDefault) {
    return info.returnValue;
  }
  // eslint-disable-next-line no-invalid-this
  return this.$callback(args.origCb, info.callbackResult);
};

/**
 * Determines if a method has been intercepted: the interceptor contains on[methodName]CallBegin,
 * on[methodName]Callback, on[methodName]CallEnd.
 * @param {String} methodName the method name that could be intercepted.
 * @param {Object} interceptor contains an intercepting method for the methodName.
 * @return {Boolean} true if method has been intercepted
 */
var __hasBeenIntercepted = function (methodName, interceptor) {
  var capitalizedMethodName = "on" + capitalize(methodName);
  if ((interceptor[capitalizedMethodName + "CallBegin"] || interceptor[capitalizedMethodName + "Callback"] || interceptor[capitalizedMethodName
    + "CallEnd"])
    || (interceptor["on" + methodName + "CallBegin"] || interceptor["on" + methodName + "Callback"] || interceptor["on"
      + methodName + "CallEnd"])) {
    return true;
  }
  return false;
};

/**
 * Adds an interceptor to all methods.
 * @param {Object} interfaceMethods all methods for the interface
 * @param {aria.core.CfgBeans:Callback} interceptor a callback which will receive notifications
 * @return {Object} interceptedMethods
 */
var __interceptCallback = function (interfaceMethods, interceptor, allInterceptors) {
  var interceptedMethods = allInterceptors || {};
  // for a callback, intercept all methods of an interface
  for (var i in interfaceMethods) {
    if (Object.prototype.hasOwnProperty.call(interfaceMethods, i)) {
      (interceptedMethods[i] || (interceptedMethods[i] = [])).push(interceptor);
    }
  }
  return interceptedMethods;
};

/**
 * Targets specific methods to be intercepted.
 * @param {Object} interfaceMethods all methods for the interface
 * @param {Object} interceptor an object/class which will receive notifications
 * @return {Object} interceptedMethods
 */
var __interceptObject = function (interfaceMethods, interceptor, allInterceptors) {
  var interceptedMethods = allInterceptors || {};
  // for a class object, intercept specific methods
  for (var m in interfaceMethods) {
    if (Object.prototype.hasOwnProperty.call(interfaceMethods, m) && __hasBeenIntercepted(m, interceptor)) {
      (interceptedMethods[m] || (interceptedMethods[m] = [])).push({
        fn: __callInterceptorMethod,
        scope: interceptor
      });
    }
  }
  return interceptedMethods;
};

/**
 * Base class from which derive all JS classes defined through Aria.classDefinition()
 * @dependencies ["aria.utils.String", "aria.core.Interfaces", "aria.utils.Type"]
 */
export const JsObject = classDefinition({
  $classpath: "aria.core.JsObject",
  // JsObject is an exception regarding $constructor and $destructor:
  // it is not necessary to call these methods when extending JsObject
  $constructor: function () { },
  $destructor: function () {
    // tag this instance as disposed.
    this[disposeTag] = true;
  },
  $statics: {
    // ERROR MESSAGES:
    UNDECLARED_EVENT: "undeclared event name: %1",
    MISSING_SCOPE: "scope property is mandatory when adding or removing a listener (event: %1)",
    INTERFACE_NOT_SUPPORTED: "The '%1' interface is not supported on this object (of type '%2').",
    ASSERT_FAILURE: "Assert #%1 failed in %2",
    CALLBACK_ERROR: "An error occurred while processing a callback function: \ncalling class: %1\ncalled class: %2"
  },
  $prototype: {
    /**
     * Prototype init method called at prototype creation time Allows to store class-level objects that are
     * shared by all instances
     * @param {Object} p the prototype object being built
     * @param {Object} def the class definition
     * @param {Object} sdef the superclass class definition
     */
    // eslint-disable-next-line no-unused-vars
    $init: function (p, def, sdef) {
      p.$on = p.$addListeners; // shortcut
    },

    /**
     * Check that a statement is true - if not an error is raised sample: this.@assert(12,myvar=='XYZ')
     * @param {Integer} id unique id that must be created and passed by the developer to easily track the assert
     * in case of failure
     * @param {Boolean} value value to assert - if not true an error is raised note: doesn't need to be a
     * boolean - as for an if() statement: e.g. this.$assert(1,{}) will return true
     * @return {Boolean} true if assert is OK
     */
    $assert: function (id, value) {
      if (value) {
        return true;
      }
      this.$logError(this.ASSERT_FAILURE, [id, this.$classpath]);
      return false;
    },

    /**
     * Method to call on any object prior to deletion
     */
    $dispose: function () {
      this.$destructor(); // call $destructor
      // TODO - cleanup object
      if (this._listeners) {
        this._listeners = null;
        delete this._listeners;
      }
      if (this.__$interceptors) {
        this.__$interceptors = null;
        delete this.__$interceptors;
      }
      if (this.__$interfaces) {
        disposeInterfaces(this);
      }
    },

    // /**
    //  * If profiling util is loaded, save the current timestamp associated to the given message in the
    //  * Aria.profilingData array. The classpath of this class will also be included in the record.
    //  * @param {String} message associated to the timestamp
    //  */
    // $logTimestamp: Aria.empty,

    // /**
    //  * Starts a time measure. Returns the id used to stop the measure.
    //  * @param {String} msg
    //  * @return {Number} profilingId
    //  */
    // $startMeasure: Aria.empty,

    // /**
    //  * Stops a time measure. If the id is not specified, stop the last measure with this classpath.
    //  * @param {String} classpath
    //  * @param {String} id
    //  */
    // $stopMeasure: Aria.empty,

    /**
     * Log a debug message to the logger
     * @param {String} msg the message text
     * @param {Array} msgArgs An array of arguments to be used for string replacement in the message text
     * @param {Object} obj An optional object to be inspected in the logged message
     */
    $logDebug: function (msg, msgArgs, obj) {
      FRAMEWORK_LOGGER?.debug(this.$classpath, msg, msgArgs, obj);
    },

    /**
     * Log an info message to the logger
     * @param {String} msg the message text
     * @param {Array} msgArgs An array of arguments to be used for string replacement in the message text
     * @param {Object} obj An optional object to be inspected in the logged message
     */
    $logInfo: function (msg, msgArgs, obj) {
      FRAMEWORK_LOGGER?.info(this.$classpath, msg, msgArgs, obj);
    },

    /**
     * Log a warning message to the logger
     * @param {String} msg the message text
     * @param {Array} msgArgs An array of arguments to be used for string replacement in the message text
     * @param {Object} obj An optional object to be inspected in the logged message
     */
    $logWarn: function (msg, msgArgs, obj) {
      FRAMEWORK_LOGGER?.warn(this.$classpath, msg, msgArgs, obj);
    },

    /**
     * Log an error message to the logger
     * @param {String} msg the message text
     * @param {Array} msgArgs An array of arguments to be used for string replacement in the message text
     * @param {Object} err The actual JS error object that was created or an object to be inspected in the
     * logged message
     */
    $logError: function (msg, msgArgs, err) {
      // replaced by the true logging function when
      // aria.core.Log is loaded
      // If it's not replaced because the log is never
      // downloaded, at least there will be errors in the
      // console.
      // if (Aria.$global.console) {
      //   if (typeof msgArgs === "string")
      //     msgArgs = [msgArgs];
      //   Aria.$global.console.error(msg.replace(/%[0-9]+/g, function (token) {
      //     return msgArgs[parseInt(token.substring(1), 10) - 1];
      //   }), err);
      // }
      // return "";
      // TODO: ModernAria: Figure out handling of error logs in case of FRAMEWORK_LOGGER is made not mandatory for laoding
      FRAMEWORK_LOGGER?.error(this.$classpath, msg, msgArgs, err);
    },

    /**
     * Generic method allowing to call-back a caller in asynchronous processes
     * @param {aria.core.CfgBeans:Callback} cb callback description
     * @param {MultiTypes} res first result argument to pass to cb.fn (second argument will be cb.args)
     * @param {String} errorId error raised if an exception occurs in the callback
     * @return {MultiTypes} the value returned by the callback, or undefined if the callback could not be
     * called.
     */
    $callback: function (cb, res, errorId) {
      try {
        if (!cb) {
          return; // callback is sometimes not used
        }

        if (cb.$Callback) {
          return cb.call(res);
        }

        // perf optimisation : duplicated code on purpose
        var scope = cb.scope, callback;
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
        this.$logError(errorId || this.CALLBACK_ERROR, [this.$classpath, (scope) ? scope.$classpath : ""], ex);
      }
    },

    /**
     * Gets a proper signature callback from description given in argument
     * @param {Object|String} cn callback signature
     * @return {Object} callback object with fn and scope
     */
    $normCallback: function (cb) {
      var scope = cb.scope, callback;
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
    },

    /**
     * Display all internal values in a message box (debug and test purpose - usefull on low-end browsers)
     */
    $alert: function () {
      var msg = [], tp;
      msg.push('## ' + this.$classpath + ' ## ');
      for (var k in this) {
        if (Object.prototype.hasOwnProperty.call(this, k)) {
          tp = typeof (this[k]);
          if (tp === 'object' || tp === 'function')
            msg.push(k += ':[' + tp + ']');
          else if (tp === 'string')
            msg.push(k += ':"' + this[k] + '"');
          else
            msg.push(k += ':' + this[k]);
        }
      }
      FRAMEWORK_GLOBALS.$window.alert(msg.join('\n'));
      msg = null;
    },

    /**
     * toString override to ease debugging
     */
    toString: function () {
      return "[" + this.$classpath + "]";
    },

    /**
     * Returns a wrapper containing only the methods of the given interface.
     * @param {String|Function} itf Classpath of the interface or reference to the interface constructor.
     */
    $interface: function (itf) {
      return getInterface(this, itf);
    },

    /**
     * Add an interceptor callback on an interface specified by its classpath.
     * @param {String} itf [mandatory] interface which will be intercepted - TODO: ModernAria: Must change to use classref instead of classpath string for Itf
     * @param {Object|aria.core.CfgBeans:Callback} interceptor either a callback or an object/class which will
     * receive notifications
     */
    // TODO: ModernAria: Must change to use classref instead of classpath string for Itf
    $addInterceptor: function (itf, interceptor) {
      // get the interface constructor:
      var itfCstr = this.$interfaces[itf];
      if (!itfCstr) {
        this.$logError(this.INTERFACE_NOT_SUPPORTED, [itf, this.$classpath]);
        return;
      }
      var allInterceptors = this.__$interceptors;
      if (allInterceptors == null) {
        allInterceptors = {};
        this.__$interceptors = allInterceptors;
      }
      var interceptMethods = isCallback(interceptor) ? __interceptCallback : __interceptObject;

      var itfs = itfCstr.prototype.$interfaces;
      for (var i in itfs) {
        if (Object.prototype.hasOwnProperty.call(itfs, i)) {
          var interceptedMethods = interceptMethods(itfs[i].interfaceDefinition.$interface, interceptor, allInterceptors[i]);
          allInterceptors[i] = interceptedMethods;
        }
      }
    },

    /**
     * Remove interceptor callbacks or interceptor objects on an interface.
     * @param {String} itf [mandatory] interface which is intercepted
     * @param {Object} scope [optional] scope of the callbacks/objects to remove
     * @param {Function} fn [optional] function in the callbacks to remove
     */
    $removeInterceptors: function (itf, scope, fn) {
      var itfCstr = this.$interfaces[itf];
      var allInterceptors = this.__$interceptors;
      if (!itfCstr || !allInterceptors) {
        return;
      }
      var itfs = itfCstr.prototype.$interfaces;
      // also remove the interceptor on all base interfaces of the interface
      for (var i in itfs) {
        if (Object.prototype.hasOwnProperty.call(itfs, i)) {
          __removeInterceptorCallback(allInterceptors, i, scope, fn);
        }
      }
    },

    /**
     * Call a method from this class, taking into account any registered interceptor.
     * @param {String} interfaceName Classpath of the interface in which the method is declared (directly). The
     * actual interface from which this method is called maybe an interface which extends this one.
     * @param {String} methodName Method name.
     * @param {Array} args Array of parameters to send to the method.
     * @param {Number} asyncCbParam [optional] if the method is asynchronous, must contain the index in args of
     * the callback parameter. Should be null if the method is not asynchronous.
     */
    // TODO: ModerAria: Should not be a string but a reference to the object
    $call: function (interfaceName, methodName, args, asyncCbParam) {
      var interceptors;
      if (this.__$interceptors == null || this.__$interceptors[interfaceName] == null
        || (interceptors = this.__$interceptors[interfaceName][methodName]) == null) {
        // no interceptor for that interface: call the method directly:
        return this[methodName].apply(this, args);
      }
      return __callWrapper.call(this, args, {
        interceptors: interceptors,
        nbInterceptors: interceptors.length,
        method: methodName,
        asyncCbParam: asyncCbParam
      }, 0);
    },

    /**
     * Adds a listener to the current object
     * @param {Object} lstCfg list of events that are listen to. For each event a config object with the
     * following arguments should be provided:<br/>
     *
     * <pre>
     * fn: {Function} [mandatory] callback function
     * scope: {Object} [mandatory] object on wich the callback will be called
     * args: {Object} [optional] argument object that will be passed to the callback as 2nd argument (1st argument is the event object)
     *      Note: as a shortcut, the function only can be provided (in this case, the scope property has to be used - as in the example below for the 'error' event
     *      Note: if a scope property is defined in the map, it will be used as default for all events. A '*' event name can also be used to listen to all events.
     * </pre>
     *
     * @example
     * Sample call:
     * <pre>
     * <code>
     * o.$addListeners({
     *     'start' : {
     *         fn : this.onStart
     *     },
     *     'end' : {
     *         fn : this.onEnd,
     *         args : {
     *             description : &quot;Sample Callback Argument&quot;
     *         }
     *     },
     *     'error' : this.onError,
     *     scope : this
     * })
     * </code>
     * </pre>
     */
    $addListeners: function (lstCfg, itfWrap) {

      var defaultScope = (lstCfg.scope) ? lstCfg.scope : null;
      var src = itfWrap ? itfWrap : this;
      var lsn;
      for (var evt in lstCfg) {
        if (!Object.prototype.hasOwnProperty.call(lstCfg, evt)) {
          continue;
        }
        lsn = lstCfg[evt];
        if (evt === 'scope') {
          continue;
        }
        // The comparison with null below is important, as
        // an empty string is a valid event description.
        if (evt !== '*' && src.$events[evt] == null) {
          // invalid event
          this.$logError(this.UNDECLARED_EVENT, evt, src.$classpath);
          continue;
        }
        if (lsn.$Callback) {
          lsn = {
            fn: function (evt, cb) {
              cb.call(evt);
            },
            scope: this,
            args: lsn
          };
        } else if (!lsn.fn) {
          // shortcut as in 'error' sample
          if (!defaultScope) {
            this.$logError(this.MISSING_SCOPE, evt);
            continue;
          }
          lsn = {
            fn: lsn,
            scope: defaultScope,
            once: lstCfg[evt].listenOnce
            // we keep track of listeners which are meant to be called just once
          };
        } else {
          // make a copy of lsn before changing it
          lsn = {
            fn: lsn.fn,
            scope: lsn.scope,
            args: lsn.args,
            once: lstCfg[evt].listenOnce,
            apply: lsn.apply,
            resIndex: lsn.resIndex
            // we keep track of listeners which are meant to be called just once
          };
          // lsn is an object as in 'start' or 'end' samples set default scope
          if (!lsn.scope) {
            lsn.scope = defaultScope;
          }
          if (!lsn.scope) {
            this.$logError(this.MISSING_SCOPE, evt);
            continue;
          }
        }

        // add listener to _listeners
        if (this._listeners == null) {
          this._listeners = {};
          this._listeners[evt] = [];
        } else {
          if (this._listeners[evt] == null) {
            this._listeners[evt] = [];
          }
        }
        // keep the interface under which the listener was registered:
        lsn.src = src;
        this._listeners[evt].push(lsn);
      }
      defaultScope = lsn = evt = null;
    },

    /**
     * Remove a listener from the listener list
     * @param {Object} lstCfg list of events to disconnect - same as for addListener(), except that scope is
     * mandatory Note: if fn is not provided, all listeners associated to the scope will be removed
     * @param {Object} itfWrap
     */
    $removeListeners: function (lstCfg, itfWrap) {
      if (this._listeners == null) {
        return;
      }
      var defaultScope = (lstCfg.scope) ? lstCfg.scope : null;
      for (var evt in lstCfg) {
        if (!Object.prototype.hasOwnProperty.call(lstCfg, evt)) {
          continue;
        }
        if (evt === 'scope') {
          continue;
        }
        if (this._listeners[evt]) {
          var lsnRm = lstCfg[evt];
          if (typeof (lsnRm) == 'function') {
            if (defaultScope == null) {
              this.$logError(this.MISSING_SCOPE, evt);
              continue;
            }
            __removeCallback(this._listeners, evt, defaultScope, lsnRm, itfWrap);
          } else {
            if (lsnRm.scope == null) {
              lsnRm.scope = defaultScope;
            }
            if (lsnRm.scope == null) {
              this.$logError(this.MISSING_SCOPE, evt);
              continue;
            }
            __removeCallback(this._listeners, evt, lsnRm.scope, lsnRm.fn, itfWrap, lsnRm.firstOnly);
          }

        }
      }
      defaultScope = lsnRm = null;
    },

    /**
     * Remove all listeners associated to a given scope - if no scope is provided all listeneres will be removed
     * @param {Object} scope the scope of the listeners to remove
     * @param {Object} itfWrap
     */
    $unregisterListeners: function (scope, itfWrap) {
      if (this._listeners == null) {
        return;
      }
      // We must check itfWrap == null, so that it is not possible to unregister all the events of an object
      // from its interface, if they have not been registered through that interface
      if (scope == null && itfWrap == null) {
        // remove all events
        for (const evt in this._listeners) {
          if (!Object.prototype.hasOwnProperty.call(this._listeners, evt)) {
            continue;
          }
          this._listeners[evt] = null; // remove array
          delete this._listeners[evt];
        }
      } else {
        // note that here, scope can be null (if itfWrap != null) we need to filter all events in this case
        for (const evt in this._listeners) {
          if (!Object.prototype.hasOwnProperty.call(this._listeners, evt)) {
            continue;
          }
          __removeCallback(this._listeners, evt, scope, null, itfWrap);
        }
      }
    },

    /**
     * Adds a listener to an event, and removes it right after the event has been raised. Please refer to
     * $addListeners() for parameters description
     * @param {Object} lstCfg
     * @param {Object} itfWrap
     */
    $onOnce: function (lstCfg, itfWrap) {
      for (var evt in lstCfg) {
        if (Object.prototype.hasOwnProperty.call(lstCfg, evt)) {
          lstCfg[evt].listenOnce = true;
        }
      }
      this.$addListeners(lstCfg, itfWrap);
    },

    /**
     * Internal method used by sub-classes to raise an event to the object listeners. The event object that will
     * be passed to the listener function will have the following structure:
     *
     * <pre>
     * {
     *      name: evtName,
     *      src: observableObject[someArg1:'xx', ...]
     * }
     * </pre>
     *
     * NOTE: All properties except name and src are specific to the event.
     * @param {String|Object} evtDesc The event description.
     * <p>
     * If provided as a String - evtDesc is the name of the event as specified by the object in
     * <code>$events</code>
     * </p>
     * <p>
     * If provided as a Map - evtDesc is expected to have a name property (for the event name) - all other
     * properties will be considered as event arguments
     * </p>
     * Sample calls:
     *
     * <pre>
     * this.$raiseEvent('load');
     * this.$raiseEvent({
     *     name : 'load',
     *     someProperty : 123
     * });
     * </pre>
     */
    $raiseEvent: function (evtDesc) {
      if (this._listeners == null) {
        return;
      }
      var nm = '', hasArgs = false;
      if (typeof (evtDesc) == 'string') {
        nm = evtDesc;
      } else {
        nm = evtDesc.name;
        hasArgs = true;
      }
      // The comparison with null below is important, as an empty string is a valid event description.
      if (nm == null || this.$events[nm] == null) {
        this.$logError(this.UNDECLARED_EVENT, [nm, this.$classpath]);
      } else {
        // loop on evtName + '*'
        var evtNames = [nm, '*'], evt = null;
        var listeners = this._listeners;
        for (var idx = 0; idx < 2; idx++) {
          // warning this can be disposed during this call as some events (like 'complete') may be caught
          // for this purpose also make a copy because a callback could modify this list
          var lsnList = listeners[evtNames[idx]];
          if (lsnList) {
            if (!evt) {
              // create the event object if we have an event description object, we use it directly to
              // be able to pass back parameters to the function which called $raiseEvent
              evt = (hasArgs ? evtDesc : {});
              evt.name = nm;
              // the src property of the event is now set differently for each listener, because when
              // interfaces have events, we do not want the event object to be used to access the
              // whole object instead of only the interface
            }
            // also make a copy because a callback could modify this list
            lsnList = lsnList.slice(0);

            var sz = lsnList.length, lsn, src;
            for (var i = 0; sz > i; i++) {
              // call listener
              lsn = lsnList[i];
              src = lsn.src;
              // Check lsn.removed because it is possible that the listener is removed while
              // $raiseEvent is running.
              // In this case, lsnList still contains the listener, but __removeListeners sets lsn.src
              // to null
              // Also check that the event is in src.$events in case idx == 1 because when registering
              // a listener on '*' from an interface wrapper, the listener must only be called for
              // events of the interface (not for all the events of the object).
              // The comparison with null below is important, as an empty string is a valid event
              // description.
              if (!lsn.removed && (idx === 0 || src.$events[nm] != null)) {
                // update the source of the event (useful if registering an event from an interface)
                evt.src = src;

                if (lsn.once) {
                  delete lsn.once;
                  var rmvCfg = {};
                  rmvCfg[evt.name] = lsn;

                  // we must remove the listener before calling it (otherwise there can be
                  // infinite loops in the framework...)
                  this.$removeListeners(rmvCfg);
                }
                this.$callback(lsn, evt);
              }
            }
            // set src to null so that storing the evt object does not grant access to the whole object
            evt.src = null;
          }
        }
        listeners = lsnList = sz = null;
      }
    }
  }
});


/**
 * Class name validation method
 * @param {String} className class name to validate - e.g. 'TestSuite'
 * @param {String} context additional context information
 * @return {Boolean} true if class path is OK
 */
function __checkClassName (className, context) {
  context = context || '';
  if (!className || !className.match(/^[_A-Z]\w*$/)) {
    $logError(INVALID_CLASSNAME_FORMAT, [className, context]);
    return false;
  }
  if (isJsReservedWord(className)) {
    $logError(INVALID_CLASSNAME_RESERVED, [className, context]);
    return false;
  }
  return true;
};

/**
 * Package name validation method
 * @param {String} packageName package name to validate - e.g. 'TestSuite'
 * @param {String} context additional context information
 * @return {Boolean} true if class path is OK
 */
function __checkPackageName(packageName, context) {
  context = context || '';
  if (!packageName) {
    $logError(INVALID_PACKAGENAME_FORMAT, [packageName, context]);
    return false;
  }
  if (isJsReservedWord(packageName)) {
    $logError(INVALID_PACKAGENAME_RESERVED, [packageName, context]);
    return false;
  }
  if (!packageName.match(/^[a-z]\w*$/)) {
    $logInfo(INVALID_PACKAGENAME_FORMAT, [packageName, context]);
  }
  return true;
};

// MUST_DO: Handle dispose
// /**
//  * Unload Aria cleanly, so that there is no memory leak. In memCheckMode, for debug purposes, return an object with
//  * information about not properly disposed objects.
//  * @param {String|Object} classpath optional parameters to dispose only a target classpath
//  *
//  * @public
//  */
// export const dispose = function (classpathOrRef) {
//   if (classpathOrRef) {
//       var classpath;
//       var classRef;
//       var def;
//       if (typeof classpathOrRef == "string") {
//           classpath = classpathOrRef;
//           classRef = getClassRef(classpath);
//           if (!classRef) {
//               return;
//           }
//           def = classRef.classDefinition || classRef.interfaceDefinition;
//           if (!def) {
//               return;
//           }
//       } else {
//           classRef = classpathOrRef;
//           def = classRef.classDefinition || classRef.interfaceDefinition;
//           if (!def) {
//               return;
//           }
//           classpath = def.$classpath;
//           if (!classpath) {
//               return;
//           }
//       }
//       // remove from object
//       var parent = classpath.split('.');
//       var child = parent[parent.length - 1];
//       parent.splice(parent.length - 1, 1);
//       parent = nspace(parent.join("."));

//       // check if the class is the same as the one loaded at the specified classpath
//       // before removing it
//       if (classRef === parent[child]) {
//           if (def.$singleton) {
//               classRef.$dispose();
//           }
//           if (def.$onunload) {
//               def.$onunload.call(def.$noargConstructor.prototype, classRef);
//           }
//           // Remove resources providers instances
//           var defResources = def.$resources;
//           var p = def.$singleton ? classRef : classRef.prototype;
//           if (defResources) {
//               for (var k in defResources) {
//                   if (Object.prototype.hasOwnProperty.call(defResources, k) && (defResources[k].provider != null)) {
//                       p[k].$dispose();
//                       p[k] = null;
//                   }
//               }
//           }

//           delete parent[child];

//           // clean Aria object
//           delete $classDefinitions[classpath];

//           for (let i = 0; i < $classes[i].length; i++) {
//               const className = $classes[i];
//               if (className === classRef) {
//                   $classes.splice(i, 1);
//                   break;
//               }
//           }
//       }
//   } else {
//       // disposing and/or unloading classes:
//       var classes = $classes.slice(0);
//       for (let i = classes.length - 1; i >= 0; i--) {
//           var elt = classes[i];
//           dispose(elt);
//       }
//       classes = null;
//       var memcheck = memCheckMode;
//       // Aria = null;
//       // aria = null; // must not be done, as we still need to be able to log errors through
//       // aria.core.Log.error
//       // delete window.Aria; // not supported under IE
//       if (memcheck) {
//           return {
//               nbConstructions : __nbConstructions,
//               nbDestructions : __nbDestructions,
//               nbNotDisposed : __nbConstructions - __nbDestructions,
//               notDisposed : __objects
//           };
//       }
//   }
// };

/**
 * Number of object creations (used only when Aria.memCheckMode==true).
 * @private
 * @type Number
 */
let __nbConstructions = 0;

/**
 * Number of object destructions (used only when Aria.memCheckMode==true).
 * @private
 * @type Number
 */
// MUST_DO: ModernAria: Remove this comment and eslint-disable below, once we figure out dispose.
// eslint-disable-next-line no-unused-vars
let __nbDestructions = 0;

/**
 * List of objects that were created but not disposed (used only when Aria.memCheckMode==true).
 * @private
 * @type Object
 */
const __objects = {};

/**
 * Wrapper function for constructors or destructors on an object. It is used only when Aria.memCheckMode==true. When
 * the constructor or destructor of an object is called, this function is called, and this function calls the
 * corresponding constructor or destructor in the object definition and check that it calls its parent constructor
 * or destructor.
 * @private
 * @param {Object} object
 * @param {Object} definition object definition whose constructor should be called
 * @param {Object} superclass superclass
 * @param {String} fn May be "$constructor" or "$destructor".
 * @param {Array} params Array of parameters to be given to the $constructor; should be empty when fn=="$destructor"
 * return true if it was the first call
 */
function __checkInheritanceCalls(obj, def, superclass, fn, params) {
  var newcall = (!obj["aria:nextCall"]);
  if (!newcall && obj["aria:nextCall"] !== def.$classpath) {
    $logError(WRONGPARENT_CALLED, [fn, def.$classpath, obj["aria:nextCall"], obj.$classpath]);
  }
  obj["aria:nextCall"] = (superclass ? superclass.classDefinition.$classpath : null);
  if (def[fn]) {
    def[fn].apply(obj, params);
  } else if (superclass && fn === "$destructor") {
    // no destructor: must call the parent destructor, by default
    superclass.prototype.$destructor.apply(obj, params);
  }
  if (obj["aria:nextCall"] && obj["aria:nextCall"] !== "aria.core.JsObject") {
    $logError(PARENT_NOTCALLED, [fn, obj["aria:nextCall"], def.$classpath]);
  }
  if (newcall) {
    obj["aria:nextCall"] = undefined;
  }
  return newcall;
};

/**
 * Returns the constructor of the given class definition. When Aria.memCheckMode==true, it returns a wrapper.
 * Otherwise, it directly returns the $constructor defined in the class definition.
 * @private
 * @param {Object} def
 * @param {Object} superclass
 */
function __createConstructor(def, superclass) {
  if (!memCheckMode) {
    return def.$constructor;
  }
  return function () {
    try {
      // eslint-disable-next-line no-invalid-this
      if (!this['aria:objnumber']) {
        __nbConstructions++;
        // eslint-disable-next-line no-invalid-this
        this['aria:objnumber'] = __nbConstructions;
        // eslint-disable-next-line no-invalid-this
        __objects[__nbConstructions] = this;
      }
      // check that parent constructors are correctly called
      // eslint-disable-next-line no-invalid-this
      __checkInheritanceCalls(this, def, superclass, "$constructor", arguments);
    } catch (e) {
      // if an exception occurs while creating the object,
      // we do not need to call dispose on it and we don't want to decrease the counter
      // more than once (in case the exception is in a grandchild constructor)
      // eslint-disable-next-line no-invalid-this
      if (this['aria:objnumber']) {
        __nbDestructions++;
        // eslint-disable-next-line no-invalid-this
        __objects[this['aria:objnumber']] = null;
        // eslint-disable-next-line no-invalid-this
        delete __objects[this['aria:objnumber']];
        // eslint-disable-next-line no-invalid-this
        this['aria:objnumber'] = null;
      }
      throw e;
    }
  };
};

/**
     * Returns the destructor of the given class definition. When Aria.memCheckMode==true, it returns a wrapper.
     * Otherwise, it directly returns the $destructor defined in the class definition.
     * @private
     * @param {Object} def
     * @param {Object} superclass
     */
function __createDestructor(def, superclass) {
  if (!memCheckMode) {
    return def.$destructor;
  }
  return function () {
    // check that parent destructors are correctly called
    // eslint-disable-next-line no-invalid-this
    if (__checkInheritanceCalls(this, def, superclass, "$destructor", arguments)) {
      // Erase everything in the object, so that it is possible
      // to see when it is no longer used
      /*
       * for (var i in this) { this[i] = null; }
       */
    }
    // eslint-disable-next-line no-invalid-this
    if (this['aria:objnumber']) {
      __nbDestructions++;
      // eslint-disable-next-line no-invalid-this
      __objects[this['aria:objnumber']] = null;
      // eslint-disable-next-line no-invalid-this
      delete __objects[this['aria:objnumber']];
      // eslint-disable-next-line no-invalid-this
      this['aria:objnumber'] = null;
    }
  };
};

/**
* TODOC
* @private
*/
function __createDefaultConstructor(superclass) {
  return function () {
    // eslint-disable-next-line no-invalid-this
    superclass.apply(this, arguments);
  };
};

/**
 *
 * @param {string} classpath - The fully qualified classpath
 * @returns {[string, string]} - A tuple with package name and class name
 *
 * @private
 */
function __getClassNameAndPackageFromClasspath(classpath) {
  const index = classpath.lastIndexOf('.');
  if (index > -1) {
    const packageName = classpath.slice(0, index);
    const classname = classpath.slice(index + 1);
    return [packageName, classname];
  } else {
    return ['', classpath];
  }
}

/**
 * Normalizes the class definition object in place
 * @param {object} def - The class definition object
 * @returns void
 */
function normalizeClassDefinition(def) {
  // Normalize classpath, class name and package
  // There are two ways to define the classpath: either by $classpath
  // or by both $class and $package
  // if both ways are used, check that they define the same classpath
  // var defClasspath = def.$classpath, defClassname = def.$class, defPackage = def.$package, defExtends = def.$extends;
  // check if classpath is correct
  if (!def.$classpath && !(def.$class != null && def.$package != null)) {
    return __classLoadError(def, NULL_CLASSPATH);
  }
  if (def.$classpath) {
    const [packageName, className] = __getClassNameAndPackageFromClasspath(def.$classpath);

    if ((def.$classname && def.$classname !== className) || (def.$package && def.$package !== packageName)) {
      return __classLoadError(def, INCOHERENT_CLASSPATH);
    }

    def.$class = className;
    def.$package = packageName;
  } else {
    def.$classpath = `${def.$package}.${def.$class}`;
  }

  if (!def.$events) {
    def.$events = {};
  }



  if (!def.$extends && def.$classpath !== 'aria.core.JsObject') {
    def.$extends = JsObject;
  }

  def.$noargConstructor = new Function();

}
