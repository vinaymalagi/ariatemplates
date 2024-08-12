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
import { returnArg, returnArray, returnNull, returnObject } from '../common/fixed-return-value-functions.js';
import { checkJsVarName, isJsReservedWord } from '../utils/js-name-checks.js';
import { Json as jsonUtils } from '../utils/Json.js';
import { isArray, isNumber, isObject, isString } from '../utils/Type.js';
import { classDefinition } from './class-definition.js';
import { isInstanceOf } from './core-utils/Type.js';
import { FRAMEWORK_GLOBALS, FRAMEWORK_LOGGER, FRAMEWORK_PREFIX } from './framework-bootstrap.js';


var registerBean = function (packageName) {
  return function (name, parentType, bean) {
    var fullName = packageName + "." + name;
    bean = bean || {};
    bean[JsonValidator._MD_TYPENAME] = fullName;
    bean[JsonValidator._MD_PARENTDEF] = parentType;
    bean[JsonValidator._MD_BASETYPE] = parentType[JsonValidator._MD_BASETYPE];
    JsonValidator.__processedBeans[fullName] = bean;
    return bean;
  };
};

var getBean = function (strType) {
  return JsonValidator.__processedBeans[strType] || null;
};

var commonGetDefault = {
  "null": returnNull,
  "{}": returnObject,
  "[]": returnArray
};

/**
 * The JSON Validator does two main operations:
 * <ul>
 * <li> a preprocessing operation is done when loading a bean package (BP) definition. <br />
 * During this operation, every bean definition in the package is annotated, so that it contains a reference to the
 * bean definition of its immediate super bean and its base built-in type, and bean inheritance is processed
 * (propagation of object properties of a bean to the beans which extend it). After the preprocessing of a bean, its
 * default value, if provided, is checked so that it matches the definition.</li>
 * <li> the processing is done when validating an instance of a JSON object against the bean definition it is
 * supposed to comply with. </li>
 * </ul>
 * Note: this class is tightly linked with JsonTypesCheck, to keep files with a reasonable size. Be carefull if
 * changing something: any protected method in this class (method whose name starts with one underscore) may be
 * called from JsonTypesCheck. Private methods (starting with two underscores) are not called from JsonTypesCheck.
 * @dependencies ["aria.utils.Type", "aria.utils.Json", "aria.core.JsonTypesCheck"]
 */
export const JsonValidator = classDefinition({
  $classpath: "aria.core.JsonValidator",
  $singleton: true,

  $constructor: function () {
    /**
     * Map of bean packages whose dependencies are not yet loaded. The key in the map is the package name
     * @type Object
     * @private
     */
    this.__waitingBeans = {};

    /**
     * Map of all loaded bean packages (already preprocessed). The key in the map is the package name
     * @type Object
     * @private
     */
    this.__loadedBeans = {};

    /**
     * Map of processed beans, for direct access
     * @type Object
     * @private
     */
    this.__processedBeans = {};

    /**
     * Queue of beans waiting for their fast normalization functions to be created.
     */
    this.__toGenerateFastNorm = [];

    /**
     * Map of all base types. The key in the map is the short type name (e.g.: String, does not include package
     * name).
     * @type Object
     * @private
     */
    this.__baseTypes = {};

    /**
     * Options for current preprocessing and/or processing. All these options are boolean values.
     * @type Object
     * @protected
     */
    this._options = {
      /**
       * addDefaults: When processing, if true, add default values when they are missing.
       */
      addDefaults: true, // Be aware that this will be changed when calling check or normalize
      /**
       * checkEnabled: When false, check is disabled, so that calls to check are ignored and normalizing do
       * only minimal checking to add default values.
       */
      checkEnabled: FRAMEWORK_GLOBALS.debug,
      /**
       * checkDefaults: When preprocessing, if true, also do processing to check that default values are
       * valid.
       */
      checkDefaults: true,
      /**
       * checkMultiTypes: when processing, if false, does not check validity of instances of multitypes
       * (multitypes can be ambiguous to validate)
       */
      checkMultiTypes: false,
      /**
       * checkInheritance: when preprocessing, if true, when a bean inherits from another bean, its properties
       * (if the bean's type is an object) or its content type (if the bean's type is a map or array) must
       * inherit (either directly or through several beans) from the corresponding parent properties or
       * content type
       */
      checkInheritance: true,
      /**
       * checkBeans: when true, use aria.core.BaseTypes to validate bean definitions when they are
       * preprocessed.
       */
      checkBeans: true,
      /**
       * Throws errors instead of logging them
       * @type Boolean
       */
      throwsErrors: false
    };

    /**
     * Array of error objects. This array of errors may be sent to this.$log at the end of the processing if
     * they are not discarded (they may be discarded, for example, in the case of the MultiTypes which may fail
     * for several types before succeeding, so errors are discarded) Error objects structure:
     * @type Array
     * @protected
     *
     * <pre>
     *  {
     *    msgId: {String} the message key in the resource file
     *    msgArgs: {Array} the arguments provided with the message
     *  }
     * </pre>
     */
    this._errors = [];

    /**
     * Name of the Bean being preprocessed. Used in error reporting.
     * @protected
     * @type String
     */
    this._currentBeanName = "JSON root";

    // reference object to tag the type being computed
    this._typeBeingComputed = {
      typeName: 'typeBeingComputed'
    };

    /**
     * Fake typeRef used as a generic error typeRed
     * @protected
     * @type Object
     */
    this._typeError = {
      typeName: 'typeError'
    };

    this._typeRefError = {};
    this._typeRefError[this._MD_BUILTIN] = true;
    this._typeRefError[this._MD_BASETYPE] = this._typeError;

  },
  $destructor: function () {
    this.__waitingBeans = null;
    this.__loadedBeans = null;
  },
  $statics: {
    // ERROR MESSAGES:

    /* Pre-processing errors (errors in bean definition): */
    INVALID_TYPE_NAME: "Invalid or missing $type in %1: %2",
    ONLY_FASTNORM_PARENT: "Type %1 is not precompiled and extends %2 which was precompiled with the onlyFastNorm option. This is not supported.",
    INVALID_TYPE_REF: "Type %1, found in %2, is not defined in package %3",
    UNDEFINED_PREFIX: "Prefix %1, found in %2, is not defined",
    MISSING_BEANSPACKAGE: "Beans package %1, referenced in %2, was not found",
    RECURSIVE_BEAN: "Recursive bean definition in %1",
    BOTH_MANDATORY_DEFAULT: "$mandatory=true and $default should not be specified at the same time in %1",
    INHERITANCE_EXPECTED: "Type %1 should inherit from %2",
    MISSING_CONTENTTYPE: "Missing $contentType in the %1 definition in %2",
    ENUM_DUPLICATED_VALUE: "Duplicated value '%1' in enum definition %2",
    ENUM_INVALID_INHERITANCE: "Value '%1', from %2, is not present in parent enum definition %3",
    INVALID_DEFAULTVALUE: "Default value %1 in %2 is invalid: %3",
    BEANCHECK_FAILED: "Checking bean definition %1 with beans schema failed: %2",
    MISSING_ENUMVALUES: "$enumValues must be defined and non-empty in the Enum definition in %1",
    INVALID_NAME: "Invalid name for a bean: %1 in %2",
    NUMBER_INVALID_INHERITANCE: "Invalid inheritance: %1 in %2 should respect its parent range",
    NUMBER_INVALID_RANGE: "Invalid range in %1: %2-%3",

    /* Processing errors (errors in the JSON checked) */
    BEAN_NOT_FOUND: "Bean %1 was not found",
    INVALID_CONFIGURATION: "%1 configuration is not valid.",
    INVALID_TYPE_VALUE: "Invalid type: expected type %1 (from %2), found incorrect value '%3' in %4",
    INVALID_MULTITYPES_VALUE: "The value found in %1 is not valid for all the types defined in %2: %3",
    ENUM_UNKNOWN_VALUE: "Value '%1' in %2 is not in the enum definition %3",
    UNDEFINED_PROPERTY: "Property '%1', used in %2, is not defined in %3",
    MISSING_MANDATORY: "Missing mandatory attribute in %1 for definition %2",
    REGEXP_FAILED: "Value '%1' in %2 does not comply with RegExp %3 in %4",
    NUMBER_RANGE: "Number '%1' in %2 is not in the accepted range (%3=%4)",
    NOT_OF_SPECIFIED_CLASSPATH: "Invalid class instance: expected instance of class %1 (from %2), found incorrect value '%3' in %4"
  },
  $prototype: {

    // Meta-data names used to annotate beans definitions for preprocessing and processing:
    _MD_TYPENAME: FRAMEWORK_PREFIX + 'typeName', // the complete string path to the current bean
    _MD_BASETYPE: FRAMEWORK_PREFIX + 'baseType', // an object reference to one of the base types
    _MD_PARENTDEF: FRAMEWORK_PREFIX + 'parentType', // an object reference to the parent bean definition
    _MD_BUILTIN: FRAMEWORK_PREFIX + 'builtIn', // true if the bean is a base bean
    _MD_ENUMVALUESMAP: FRAMEWORK_PREFIX + 'enumValuesMap', // for a bean of type Array, a map with the
    // accepted values

    _MD_STRDEFAULT: FRAMEWORK_PREFIX + 'strDefault', // string that evaluates to default value

    _BASE_TYPES_PACKAGE: 'aria.core.JsonTypes', // the beans package which contains base types
    // (this special package does not completely respect the general grammar,
    // because base types do not have a parent type)
    _BEANS_SCHEMA_PACKAGE: 'aria.core.BaseTypes', // the beans package used to check beans during
    // preprocessing

    /**
     * Add an error to the local logs array, which may be sent later to this.$log or discarded.
     * @param {String} msgId
     * @param {Object} msgArgs
     */
    _logError: function (msgId, msgArgs) {
      this._errors.push({
        msgId: msgId,
        msgArgs: msgArgs
      });
    },

    /**
     * Log all errors.
     * @param {Array} array of errors
     * @param {Boolean} throwsErrors (default false)
     * @return {Boolean} True if there were no error, false otherwise.
     */
    __logAllErrors: function (errors, throwsErrors) {
      if (errors.length === 0) {
        return true;
      }
      if (!throwsErrors) {
        for (let i = 0; i < errors.length; i++) {
          this.$logError(errors[i].msgId, errors[i].msgArgs);
        }
      } else {
        var error, logs = FRAMEWORK_LOGGER;
        // aria.core.Log may not be available
        if (logs) {
          var messages = [];
          for (let i = 0; i < errors.length; i++) {
            errors[i].message = logs.prepareLoggedMessage(errors[i].msgId, errors[i].msgArgs);
            messages.push(errors[i].message);
          }
          error = new Error(messages.join('\n'));
        } else {
          error = new Error();
        }
        error.errors = errors;
        throw error;
      }
      return false;
    },

    /**
     * Find the given type in the given bean package.
     * @param {aria.core.BaseTypes:Package} packageDef bean package
     * @param {String} typeName type name. May not contain ':'. Contains the path to the bean inside the package
     * bp.
     * @return {aria.core.BaseTypes:Bean} definition of the requested bean, or this._typeRefError if it could
     * not be found
     */
    __findTypeInBP: function (packageDef, typeName) {
      var path = {
        '$properties': packageDef.$beans
      };
      var typeParts = typeName.split('.');
      for (var i = 0; i < typeParts.length; i++) {
        var elt = typeParts[i];
        if (elt == '$contentType' && path.$contentType) {
          // the content type of an Array or a Map can be used
          // as a type elsewhere
          path = path.$contentType;
        } else if (typeof (path.$properties) == 'object' && path.$properties != null) {
          path = path.$properties[elt];
        } else {
          path = null;
        }
        if (typeof (path) != 'object' || path == null) {
          this._logError(this.INVALID_TYPE_REF, [typeName, this._currentBeanName, packageDef.$package]);
          return this._typeRefError;
        }
      }
      return path;
    },

    /**
     * Find a bean definition by its type name. It relies on the bean package currently being processed.
     * @param {String} typeName A string composed of two parts: 'namespace:value' where the namespace is
     * optional if the value refers a type defined in the package currently being processed.
     * @param {aria.core.BaseTypes:Package} packageDef reference package
     * @return {aria.core.BaseTypes:Bean} definition of the requested bean, or this._typeRefError if it could
     * not be found
     */
    __getTypeRef: function (typeName, packageDef) {
      var packageName, otherBP;
      var i = typeName.indexOf(':');
      // if no semicolumn, type is defined inside this package
      if (i == -1) {
        packageName = packageDef.$package;
        otherBP = packageDef;
      } else {
        var ns = typeName.substr(0, i);
        typeName = typeName.substr(i + 1);
        packageName = (packageDef.$namespaces == null ? null : packageDef.$namespaces[ns]);
        if (isObject(packageName)) {
          packageName = packageName.$package;
        }
        if (!packageName) {
          this._logError(this.UNDEFINED_PREFIX, [ns, this._currentBeanName]);
          return this._typeRefError;
        }
      }

      var fullName = packageName + "." + typeName;
      var typeRef = this.__processedBeans[fullName];
      if (typeRef) {
        return typeRef;
      }

      if (!otherBP) {
        otherBP = this.__loadedBeans[packageName];
        if (!otherBP) {
          this._logError(this.MISSING_BEANSPACKAGE, [packageName, this._currentBeanName]);
          return this._typeRefError;
        }
      }

      typeRef = this.__findTypeInBP(otherBP, typeName);

      // update this type name with fully qualified name
      if (typeRef != this._typeError && !typeRef[this._MD_TYPENAME]) {
        typeRef[this._MD_TYPENAME] = fullName;
      }

      return typeRef;
    },

    /**
     * Preprocess the given bean definition (if not already done) and return its base type.
     * @param {aria.core.BaseTypes:Bean} beanDef bean to be preprocessed
     * @param {String} beanName fully qualified name for this bean
     * @param {aria.core.BaseTypes:Package} packageDef reference package
     */
    _preprocessBean: function (beanDef, beanName, packageDef) {

      // used for error reporting
      this._currentBeanName = beanName;

      var baseType = beanDef[this._MD_BASETYPE];

      // check if base type is already defined for this bean definition (already preprocessed)
      if (baseType) {
        return baseType;
      }

      beanDef[this._MD_TYPENAME] = beanName;

      // temporary value to avoid an infinite loop in case of a recursive type definition:
      beanDef[this._MD_BASETYPE] = this._typeBeingComputed;

      var typeName = beanDef.$type;
      var typeRef = this._typeRefError;

      // check if this is valid declared type
      if (typeof (typeName) != "string" || !typeName) {
        this._logError(this.INVALID_TYPE_NAME, [beanDef[this._MD_TYPENAME], typeName]);
      } else {
        // retrieve type reference
        typeRef = this.__getTypeRef(typeName, packageDef);
        if (typeRef[this._MD_BASETYPE] !== this._typeError && !typeRef.$type) {
          this._logError(this.ONLY_FASTNORM_PARENT, [typeRef[this._MD_TYPENAME], beanDef[this._MD_TYPENAME]]);
          typeRef = this._typeRefError;
        }
      }

      // store parent type
      beanDef[this._MD_PARENTDEF] = typeRef;
      // update typeName with fully qualified typeName
      typeName = typeRef[this._MD_TYPENAME];

      // preprocess reference type if not done yet
      baseType = this._preprocessBean(typeRef, typeName, packageDef);
      if (baseType == this._typeBeingComputed) {
        // a recursive definition is normal for base types
        if (packageDef.$package == this._BASE_TYPES_PACKAGE) {
          return this._getBuiltInBaseType(beanDef);
        }
        // there was a recursive type definition
        this._logError(this.RECURSIVE_BEAN, beanDef[this._MD_TYPENAME]);
        return this._typeError;
      }

      beanDef[this._MD_BASETYPE] = baseType;

      // check this bean definition with given base type
      if (!this.__checkBean(beanDef)) {
        beanDef[this._MD_BASETYPE] = this._typeError;
      }

      // description inheritance
      if (!beanDef.$description && !typeRef[this._MD_BUILTIN]) {
        beanDef.$description = typeRef.$description;
      }

      var hasNoDefault = !("$default" in beanDef), hasNoMandatory = !("$mandatory" in beanDef);

      // mandatory and default value inheritance
      if (hasNoDefault && hasNoMandatory) {
        beanDef.$mandatory = false;
        hasNoMandatory = false;
      }
      if (hasNoMandatory) {
        beanDef.$mandatory = typeRef.$mandatory;
      }
      if (hasNoDefault && ("$default" in typeRef) && !beanDef.$mandatory) {
        beanDef.$default = jsonUtils.copy(typeRef.$default);
        beanDef.$simpleCopyType = typeRef.$simpleCopyType;
        beanDef.$strDefault = typeRef.$strDefault;
        if (typeRef.$getDefault) {
          beanDef.$getDefault = typeRef.$getDefault;
        }
      }

      if (baseType && baseType.makeFastNorm && !beanDef.$fastNorm) {
        // the order in which fast normalization is done is important:
        // a parent bean should be done before its children (so that the parent $fastNorm can be reused when possible),
        // and so even when properties reference a parent bean (e.g. to describe a recursive structure)
        this.__toGenerateFastNorm.push(beanDef);
      }

      // apply baseType preprocessing if any
      if (baseType && baseType.preprocess) {
        baseType.preprocess(beanDef, beanName, packageDef);
      }

      // if an error occur during preprocessing, return error type
      if (beanDef[this._MD_BASETYPE] == this._typeError) {
        return this._typeError;
      }

      // apply default configuration.
      if ("$default" in beanDef) {

        // there cannot be default and mandatory at the same time
        if (beanDef.$mandatory === true) {
          this._logError(this.BOTH_MANDATORY_DEFAULT, beanDef[this._MD_TYPENAME]);
          return this._typeError;
        }

        var defaultValue = beanDef.$default;

        // check the default value, this will not change it
        // (as addDefaults is false when preprocessing beans)
        if (this._options.checkDefaults) {

          // save error state as normalization will erase it
          var currentErrors = this._errors;
          this._errors = [];

          var errors = this._processJsonValidation({
            beanDef: beanDef,
            json: defaultValue
          });

          // restore errors
          this._errors = currentErrors;

          if (errors.length > 0) {
            this._logError(this.INVALID_DEFAULTVALUE, [defaultValue, beanDef[this._MD_TYPENAME],
              errors]);

            return this._typeError;
          }
        }

        // simpleCopyType help to fasten copy of element
        if (!("$simpleCopyType" in beanDef)) {
          beanDef.$simpleCopyType = !defaultValue || isString(defaultValue)
            || isNumber(defaultValue) || defaultValue === true;
        }

        // strDefault is a string representation of the default value, used in fast normalization
        // it is not normalized yet, so that the output of beans pre-compilation does not take too much space
        if (!beanDef.$strDefault) {
          // make a string with "reversible" set to true, or null if cannot convert
          beanDef.$strDefault = jsonUtils.convertToJsonString(defaultValue, {
            reversible: true
          });
        }

        var strDefault = beanDef.$strDefault;
        if (strDefault && !beanDef.$getDefault && baseType.makeFastNorm) {
          beanDef.$getDefault = Object.prototype.hasOwnProperty.call(commonGetDefault, strDefault) ? commonGetDefault[strDefault] : new Function("return " + strDefault + ";");
        }
      }

      // store processed bean definition
      this.__processedBeans[beanName] = beanDef;

      return baseType;
    },

    /**
     * Main function to preprocess a bean package definition. All dependencies should have already bean loaded.
     * @param {aria.core.BaseTypes:Package} def
     */
    __preprocessBP: function (def) {

      // prepare error stack
      this._errors = [];

      var beans = def.$beans;
      for (var beanName in beans) {
        if (!Object.prototype.hasOwnProperty.call(beans, beanName) || beanName.indexOf(':') != -1) {
          continue;
        }
        // check that keys for beans are valid
        if (!checkJsVarName(beanName)) {
          this._logError(this.INVALID_NAME, [beanName, this._currentBeanName]);
        }
        this._preprocessBean(beans[beanName], def.$package + "." + beanName, def);
      }

      // Generate fast normalization functions at the end:
      var toGenerateFastNorm = this.__toGenerateFastNorm;
      while (toGenerateFastNorm.length > 0) {
        var beanDef = toGenerateFastNorm.shift();
        var baseType = beanDef[this._MD_BASETYPE];

        if (baseType.makeFastNorm) {
          // generate fast normalizer
          baseType.makeFastNorm(beanDef);
        }
      }

      return this._errors;
    },

    /**
     * Preprocessing function for base types of package aria.core.JsonTypes
     * @param {aria.core.BaseTypes:Bean} beanDef
     */
    _getBuiltInBaseType: function (beanDef) {
      var typeDef = this.__baseTypes[beanDef.$type];
      this.$assert(298, typeDef != null);
      beanDef[this._MD_BUILTIN] = true;
      beanDef[this._MD_BASETYPE] = typeDef;
      var beanName = beanDef[this._MD_TYPENAME] = [this._BASE_TYPES_PACKAGE, typeDef.typeName].join('.');
      this.__processedBeans[beanName] = beanDef;
      return typeDef;
    },

    /**
     * Add the given base type to the list of errors. It is called from JsonTypesCheck.js.
     * @param {Object} typeDef [typeDef] { typeName: {String} name of the base type preprocess(beanDef):
     * (Function) executed during preprocessing process(args): (Function) executed during processing dontSkip:
     * {Boolean} if true, preprocess and process will still be called even when check is disabled
     */
    _addBaseType: function (typeDef) {
      this.__baseTypes[typeDef.typeName] = typeDef;
      if (!(typeDef.dontSkip || this._options.checkEnabled)) {
        typeDef.process = null;
        typeDef.preprocess = null;
      }
    },

    /**
     * Check that the given json complies with the given bean (recursive function).
     * @param {Object} args
     *
     * <pre>
     *  {
     *    dataHolder: //, container
     *    dataName: //, name of the property in the container
     *    value: //, current value
     *    beanDef: // bean definition used to check the value
     *    path : // Path in the current object being check
     *  }
     * </pre>
     */
    _checkType: function (args) {
      var beanDef = args.beanDef;
      var baseType = beanDef[this._MD_BASETYPE];
      // $type can be missing if the bean was precompiled, with the onlyFastNorm option set to true
      if (!this._options.checkEnabled || !beanDef.$type) {
        if (this._options.addDefaults && beanDef.$fastNorm) {
          args.dataHolder[args.dataName] = args.value = beanDef.$fastNorm(args.value);
        }
        return;
      }
      // default slow behaviour
      if (args.value == null) {
        if (beanDef.$mandatory) {
          this._logError(this.MISSING_MANDATORY, [args.path, beanDef[this._MD_TYPENAME]]);
        } else if ("$default" in beanDef && this._options.addDefaults) {
          if (beanDef.$simpleCopyType) {
            args.value = beanDef.$default;
          } else {
            args.value = jsonUtils.copy(beanDef.$default);
          }
          args.dataHolder[args.dataName] = args.value;
        }
      }
      if (args.value != null && baseType.process) {
        baseType.process(args);
      }
    },

    /**
     * Get a bean from its string reference.
     * @param {String} strType The fully qualified bean name, ex:
     * aria.widgets.calendar.CfgBeans.CalendarSettings
     * @return {aria.core.BaseTypes:Bean} The bean definition if strType is valid, or null otherwise.
     */
    _getBean: getBean,

    /**
     * Process the validation of a Json object with the given bean definition.
     * @param args [args] { beanName/beanDef: beanName or beanDef json: structure to validate } Return the array
     * of errors.
     */
    _processJsonValidation: function (args) {
      var beanDef = (args.beanDef ? args.beanDef : this._getBean(args.beanName));
      if (!beanDef) {
        this._errors = [];
        this._logError(this.BEAN_NOT_FOUND, args.beanName);
        return this._errors;
      }

      this._errors = [];
      // launching the validation process
      this._checkType({
        dataHolder: args,
        dataName: 'json',
        path: 'ROOT',
        value: args.json,
        beanDef: beanDef
      });
      return this._errors;
    },

    /**
     * Called when preprocessing, just after having determined the type of bean. If beans check is enabled and
     * multitypes check is disabled, it checks that the bean is valid according to the corresponding schema in
     * aria.core.BaseTypes
     * @param {aria.core.BaseTypes:Bean} bean to check
     */
    __checkBean: function (beanDef) {
      if (this._options.checkBeans && (!this._options.checkMultiTypes)
        && this.__loadedBeans[this._BEANS_SCHEMA_PACKAGE]) {
        var baseType = beanDef[this._MD_BASETYPE];
        if (baseType == this._typeError) {
          return false;
        }
        var beanChecker = this._getBean(this._BEANS_SCHEMA_PACKAGE + '.' + baseType.typeName);
        this.$assert(402, beanChecker != null); // every type must be defined in the schema

        // make a copy of current errors as normalization will erase them
        var currentErrors = this._errors;
        var errors = this._processJsonValidation({
          beanDef: beanChecker,
          json: beanDef
        });
        // restaure errors
        this._errors = currentErrors;

        if (errors.length > 0) {
          this._logError(this.BEANCHECK_FAILED, [this._currentBeanName, errors]);
          return false;
        }

      }
      return true;
    },

    // PUBLIC API

    /**
     * Base method used to declare beans. You should use Aria. beanDefinitions instead of this method.
     * @param {aria.core.BaseTypes:Package} beans beans package to declare
     */
    beanDefinitions: function (def) {
      var bp = def.$package; // beans package
      // $classes.push({
      //   $classpath: bp
      // });
      // this.__waitingBeans[bp] = def;
      // var dep = [];

      // // load missing dependencies

      // // add $dependencies
      // var dependencies = def.$dependencies || [];
      // if (dependencies.length) {
      //   dep = dep.concat(dependencies);
      // }

      // // add bean definition from namespaces
      // for (var key in def.$namespaces) {
      //   if (Object.prototype.hasOwnProperty.call(def.$namespaces, key)) {
      //     dep.push(def.$namespaces[key]);
      //   }
      // }

      // return loadOldDependencies({
      //   classpaths: {
      //     "JS": dep
      //   },
      //   classDefinition: def,
      //   complete: {
      //     scope: this,
      //     fn: this.__loadBeans,
      //     args: [bp]
      //   }
      // });
      var noerrors = true;

      // bean definition will be available in the waiting beans
      // var def = this.__waitingBeans[bp];
      // delete this.__waitingBeans[bp];

      this.$assert(58, def);

      var compiled = def.$compiled;
      if (compiled) {
        def.$beans = compiled(registerBean(def.$package), getBean, fastNormalizers);
      } else {
        // validate incoming definition
        if (this._options.checkBeans && this.__loadedBeans[this._BEANS_SCHEMA_PACKAGE]) {
          var bean = this._getBean(this._BEANS_SCHEMA_PACKAGE + '.Package');
          this.$assert(428, bean != null);
          noerrors = noerrors && this.__logAllErrors(this._processJsonValidation({
            beanDef: bean,
            json: def
          }));
        }

        // do not add defaults to default values (to be consistent with fast normalization)
        this._options.addDefaults = false;
        noerrors = noerrors && this.__logAllErrors(this.__preprocessBP(def));
      }
      if (noerrors) {
        this.__loadedBeans[bp] = def;
        return def;
      } else {
        throw new Error("BeanDefinition: Error while loading " + bp);
      }
    },

    /**
     * Check that the json structure complies with the given bean and add default values. All errors are logged.
     * @param {Object} args
     *
     * <pre>
     *  {
     *    json: json to check.
     *    beanName: bean to use
     *  }
     * </pre>
     *
     * @param {Boolean} throwsErrors (default false)
     * @return {Boolean} true if the json structure complies with the given bean, false otherwise
     */
    normalize: function (args, throwsErrors) {
      this._options.addDefaults = true;
      // publicly allowing the user to give the bean definition without it
      // being loaded is not supported:
      args.beanDef = null;
      return this.__logAllErrors(this._processJsonValidation(args), throwsErrors);
    },

    /**
     * Check that the json structure complies with the given bean. All errors are logged.
     * @param {Object} json json to check;
     * @param {String} bean bean to use
     * @param {Boolean} throwsErrors (default false)
     * @return {Boolean} true if the json structure complies with the given bean, false otherwise
     */
    check: function (json, beanName, throwsErrors) {
      if (!this._options.checkEnabled) {
        return true;
      }
      this._options.addDefaults = false;
      return this.__logAllErrors(this._processJsonValidation({
        json: json,
        beanName: beanName
      }), throwsErrors);
    },

    /**
     * Validate a configuration object compared to its definition. All errors are logged.
     * @param {String} cfgBeanName The configuration classpath;
     * @param {Object} cfg The configuration bean to validate
     * @param {Object} errorToLog Optional json. By default, the INVALID_CONFIGURATION message is used with the
     * conrfiguration bean name.
     *
     * <pre>
     * {
     *      msg : {String} log message used with $logError,
     *      params : {Array} parameters used with $logError,
     * }
     * </pre>
     *
     * @return {Boolean} true if the configuration is valid.
     */
    validateCfg: function (cfgBeanName, cfg, errorToLog) {
      var cfgOk = false;
      try {
        cfgOk = this.normalize({
          json: cfg,
          beanName: cfgBeanName
        }, true);
      } catch (e) {
        errorToLog = errorToLog || {
          msg: this.INVALID_CONFIGURATION,
          params: [cfgBeanName]
        };
        this.$logError(errorToLog.msg, errorToLog.params, e);
      }
      return cfgOk;
    },

    /**
     * Get a bean from its string reference.
     * @param {String} The fully qualified bean name, ex: aria.widgets.calendar.CfgBeans.CalendarSettings
     * @return {MultiTypes} The bean definition if it exists and is loaded, or null otherwise.
     */
    getBean: getBean
  }
});

// ---------------------------------------------------------
// NOTE: ModernAria: Moved contents of JsonTypesCheck.js here to resolve circular dependency
// BEGIN JsonTypesCheck
// ---------------------------------------------------------
/**
 * Utility function which logs a bad type error.
 * @private
 * @param {Object} baseType
 * @param {Object} args
 */
var __badTypeError = function (baseType, args) {
  JsonValidator._logError(JsonValidator.INVALID_TYPE_VALUE, [baseType.typeName, args.beanDef[JsonValidator._MD_TYPENAME], args.value, args.path]);
};

/**
 * Check that childType inherits from parentType and log any error.
 * @private
 */
var __checkInheritance = function (parentType, childType) {
  if (!JsonValidator._options.checkInheritance) {
    return true;
  }
  var typeRef = childType;
  while (!typeRef[JsonValidator._MD_BUILTIN]) {
    if (parentType == typeRef) {
      return true;
    }
    typeRef = typeRef[JsonValidator._MD_PARENTDEF];
  }
  JsonValidator._logError(JsonValidator.INHERITANCE_EXPECTED, [childType[JsonValidator._MD_TYPENAME], parentType[JsonValidator._MD_TYPENAME]]);
  return false;
};

/**
 * Preprocess the content type of the given bean definition
 * @private
 * @param {aria.core.BaseTypes:Bean} beanDef bean to be preprocessed
 * @param {String} beanName fully qualified name for this bean
 * @param {aria.core.BaseTypes:Package} packageDef reference package
 */
var __checkContentType = function (beanDef, beanName, packageDef) {
  var contentType = beanDef.$contentType;
  var parentContentType = null;
  var parent = beanDef[JsonValidator._MD_PARENTDEF];
  if (!parent[JsonValidator._MD_BUILTIN]) {
    parentContentType = parent.$contentType;
    if (contentType == null) {
      beanDef.$contentType = parentContentType;
      return;
    }
  } else if (contentType == null) {
    JsonValidator._logError(JsonValidator.MISSING_CONTENTTYPE, [beanDef[JsonValidator._MD_BASETYPE].typeName, beanDef[JsonValidator._MD_TYPENAME]]);
    beanDef[JsonValidator._MD_BASETYPE] = JsonValidator._typeError;
    return;
  }
  JsonValidator._preprocessBean(contentType, beanName + ".$contentType", packageDef);
  if (parentContentType != null) {
    __checkInheritance(parentContentType, contentType);
  }
};

/**
 * Preprocess the key type of the given bean definition
 * @private
 * @param {aria.core.BaseTypes:Bean} beanDef bean to be preprocessed
 * @param {String} beanName fully qualified name for this bean
 * @param {aria.core.BaseTypes:Package} packageDef reference package
 */
var __checkKeyType = function (beanDef, beanName, packageDef) {
  var keyType = beanDef.$keyType;
  var parentKeyType = null;
  var parent = beanDef[JsonValidator._MD_PARENTDEF];
  if (!parent[JsonValidator._MD_BUILTIN]) {
    parentKeyType = parent.$keyType;
    if (keyType == null) {
      beanDef.$keyType = parentKeyType;
      return;
    }
  } else if (keyType == null) {
    // keyType not specified
    return;
  }
  JsonValidator._preprocessBean(keyType, beanName + ".$keyType", packageDef);
  if (parentKeyType != null) {
    __checkInheritance(parentKeyType, keyType);
  }
  // in all cases, keyType must be a sub-type of aria.core.JsonTypes.String
  if (keyType[JsonValidator._MD_BASETYPE].typeName != "String") {
    JsonValidator._logError(JsonValidator.INHERITANCE_EXPECTED, [keyType[JsonValidator._MD_TYPENAME], JsonValidator._BASE_TYPES_PACKAGE + ".String"]);
    return;
  }
};

/**
 * Processing function for regular expressions
 * @private
 */
var __checkRegExp = function (args) {
  if (typeof (args.value) != 'string') {
    // eslint-disable-next-line no-invalid-this
    return __badTypeError(this, args); // this refers to the correct object (a base type)
  }
  var beanDef = args.beanDef;
  while (!beanDef[JsonValidator._MD_BUILTIN]) {
    var regexp = beanDef.$regExp;
    if (regexp != null) {
      if (!regexp.test(args.value)) {
        return JsonValidator._logError(JsonValidator.REGEXP_FAILED, [args.value, args.path, regexp, beanDef[JsonValidator._MD_TYPENAME]]);
      }
    }
    beanDef = beanDef[JsonValidator._MD_PARENTDEF];
  }
};

/**
 * Common preprocessing function for floats and integers.
 * @private
 * @param {aria.core.BaseTypes:Bean} beanDef
 */
var __numberPreprocess = function (beanDef) {
  var parent = beanDef[JsonValidator._MD_PARENTDEF];
  if (typeof (parent.$minValue) != "undefined") {
    if (typeof (beanDef.$minValue) == "undefined") {
      beanDef.$minValue = parent.$minValue;
    } else if (beanDef.$minValue < parent.$minValue) {
      JsonValidator._logError(JsonValidator.NUMBER_INVALID_INHERITANCE, ["$minValue", beanDef[JsonValidator._MD_TYPENAME]]);
    }
  }
  if (typeof (parent.$maxValue) != "undefined") {
    if (typeof (beanDef.$maxValue) == "undefined") {
      beanDef.$maxValue = parent.$maxValue;
    } else if (beanDef.$maxValue > parent.$maxValue) {
      JsonValidator._logError(JsonValidator.NUMBER_INVALID_INHERITANCE, ["$maxValue", beanDef[JsonValidator._MD_TYPENAME]]);
    }
  }
  if (typeof (beanDef.$minValue) != "undefined" && typeof (beanDef.$maxValue) != "undefined"
    && beanDef.$minValue > beanDef.$maxValue) {
    JsonValidator._logError(JsonValidator.NUMBER_INVALID_RANGE, [beanDef[JsonValidator._MD_TYPENAME], beanDef.$minValue, beanDef.$maxValue]);
  }
};

/**
 * Common processing function for floats and integers.
 * @private
 * @param {Object} args
 */
var __numberProcess = function (args) {
  var v = args.value;
  var beanDef = args.beanDef;
  if (typeof (v) != 'number') {
    // eslint-disable-next-line no-invalid-this
    return __badTypeError(this, args);
  }
  if (typeof (beanDef.$minValue) != "undefined" && v < beanDef.$minValue) {
    return JsonValidator._logError(JsonValidator.NUMBER_RANGE, [args.value, args.path, "$minValue", beanDef.$minValue]);
  }
  if (typeof (beanDef.$maxValue) != "undefined" && v > beanDef.$maxValue) {
    return JsonValidator._logError(JsonValidator.NUMBER_RANGE, [args.value, args.path, "$maxValue", beanDef.$maxValue]);
  }
};

/**
 * Return true if the given bean has a fast normalization function.
 * @private
 * @param {aria.core.BaseTypes:Bean} beanDef
 * @return {Boolean}
 */
var hasFastNorm = function (beanDef) {
  return beanDef[JsonValidator._MD_BASETYPE].makeFastNorm;
};

/**
 * List of base types. Contains object like
 * @type Array
 * @private
 *
 * <pre>
 *     {
 *         typeName : // base type name
 *      process : // processing method for value checking and normalization
 *      dontSkip : // specifies that this bean have to be preprocessed in any case
 *      preprocess : // prepocessing function, used during bean preprocessing
 *     }
 * </pre>
 */
export const baseTypes = [{
  typeName: "String",
  process: __checkRegExp
}, {
  typeName: "Boolean",
  process: function (args) {
    if (typeof (args.value) != 'boolean') {
      return __badTypeError(this, args);
    }
  }
}, {
  typeName: "JsonProperty",
  process: function (args) {
    if (typeof (args.value) == 'string') {
      if (isJsReservedWord(args.value)
        || !/^([a-zA-Z_$][\w$]*(:[\w$]*)?)|(\d+)$/.test(args.value)) {
        return __badTypeError(this, args);
      }
    } else if (typeof (args.value) != 'number' || parseInt(args.value, 10) != args.value) {
      return __badTypeError(this, args);
    }
  }
}, {
  typeName: "FunctionRef",
  process: function (args) {
    if (typeof (args.value) != 'function') {
      return __badTypeError(this, args);
    }
  }
}, {
  typeName: "Date",
  process: function (args) {
    if (isNaN(Date.parse(args.value))) {
      return __badTypeError(this, args);
    }

  }
}, {
  typeName: "RegExp",
  process: function (args) {
    var v = args.value;
    // In FireFox and IE: typeof(regexp)=='object'
    // whereas with Safari, typeof(regexp)=='function'
    if ((typeof (v) != 'object' && typeof (v) != 'function') || v == null || v.constructor != RegExp) {
      return __badTypeError(this, args);
    }
  }
}, {
  typeName: "ObjectRef",
  process: function (args) {
    if (typeof (args.value) != 'object' || args.value == null) {
      return __badTypeError(this, args);
    }
    var classpath = args.beanDef.$classpath;
    if (classpath && !isInstanceOf(args.value, classpath)) {
      JsonValidator._logError(JsonValidator.NOT_OF_SPECIFIED_CLASSPATH, [classpath, args.beanDef[JsonValidator._MD_TYPENAME],
        args.value, args.path]);
      return;
    }
  }
},

// base type with preprocessing

{
  typeName: "Integer",
  preprocess: __numberPreprocess,
  process: function (args) {
    if (parseInt(args.value, 10) !== args.value) {
      return __badTypeError(this, args);
    }
    __numberProcess.call(this, args);
  }
}, {
  typeName: "Float",
  preprocess: __numberPreprocess,
  process: __numberProcess
}, {
  typeName: "Enum",
  preprocess: function (beanDef) {
    var ev = beanDef.$enumValues;
    var parent = beanDef[JsonValidator._MD_PARENTDEF];
    var pmap = null;
    if (!parent[JsonValidator._MD_BUILTIN]) {
      pmap = parent[JsonValidator._MD_ENUMVALUESMAP];
      if (ev == null) {
        beanDef[JsonValidator._MD_ENUMVALUESMAP] = pmap;
        return;
      }
    } else if (ev == null || ev.length === 0) {
      ev = [];
      JsonValidator._logError(JsonValidator.MISSING_ENUMVALUES, [beanDef[JsonValidator._MD_TYPENAME]]);
    }
    var map = {};
    for (var i = 0; i < ev.length; i++) {
      var v = ev[i];
      if (map[v] == 1) {
        JsonValidator._logError(JsonValidator.ENUM_DUPLICATED_VALUE, [v, beanDef[JsonValidator._MD_TYPENAME]]);
      } else if (pmap && pmap[v] != 1) {
        JsonValidator._logError(JsonValidator.ENUM_INVALID_INHERITANCE, [v, beanDef[JsonValidator._MD_TYPENAME],
          parent[JsonValidator._MD_TYPENAME]]);
      } else {
        map[v] = 1;
      }
    }
    beanDef[JsonValidator._MD_ENUMVALUESMAP] = map;
  },
  process: function (args) {
    if (typeof (args.value) != 'string') {
      return __badTypeError(this, args);
    }
    var map = args.beanDef[JsonValidator._MD_ENUMVALUESMAP];
    if (map[args.value] != 1) {
      JsonValidator._logError(JsonValidator.ENUM_UNKNOWN_VALUE, [args.value, args.path, args.beanDef[JsonValidator._MD_TYPENAME]]);
    }
  }
}, {
  typeName: "Object",
  dontSkip: true,
  preprocess: function (beanDef, beanName, packageDef) {
    /* this function is used for the inheritance of properties */
    /* at this stage, the parent has already been processed */
    var parentBean = beanDef[JsonValidator._MD_PARENTDEF];

    // normalize properties based on parent properties
    beanDef.$restricted = (beanDef.$restricted === false) ? false : (parentBean.$restricted !== false);
    var parentProp = parentBean.$properties;

    var prop = beanDef.$properties;
    if (!prop) {
      // reuse all properties from parent: no need to preprocess further
      beanDef.$properties = parentProp || {};
      return;
    }

    // apply parent properties on this child properties
    for (var i in parentProp) {
      if (!Object.prototype.hasOwnProperty.call(parentProp, i) || i.indexOf(':') != -1 || i.charAt(0) == '_') {
        continue;
      }
      var propDef = parentProp[i];
      var newDef = prop[i];

      if (!newDef) {
        // copy inherited bean definition (no override)
        prop[i] = propDef;
      } else {
        // override
        JsonValidator._preprocessBean(newDef, beanName + ".$properties." + i, packageDef);
        // if override ans parentDef, check inheritance
        if (propDef) {
          __checkInheritance(propDef, newDef);
        }
      }
    }

    // process all children of object
    for (var key in prop) {
      if (!Object.prototype.hasOwnProperty.call(prop, key) || key.indexOf(':') != -1 || key.charAt(0) == '_') {
        continue;
      }
      // check that keys for beans are valid
      if (!checkJsVarName(key)) {
        JsonValidator._logError(JsonValidator.INVALID_NAME, [key, JsonValidator._currentBeanName]);
      }
      JsonValidator._preprocessBean(prop[key], beanName + ".$properties." + key, packageDef);
    }

  },
  process: function (args) {
    var value = args.value, beanDef = args.beanDef;
    if (typeof (value) != 'object' || value == null) {
      return __badTypeError(this, args);
    }
    var propdef = beanDef.$properties;
    // copying property names (ignoring meta-data):
    var propnames = {};
    if (JsonValidator._options.checkEnabled && beanDef.$restricted) {
      for (const i in value) {
        if (!Object.prototype.hasOwnProperty.call(value, i) || i.indexOf(':') != -1 || i.charAt(0) == '_') {
          continue;
        }
        propnames[i] = 1;
      }
    }
    for (const i in propdef) {
      if (!Object.prototype.hasOwnProperty.call(propdef, i) || i.indexOf(':') != -1 || i.charAt(0) == '_') {
        continue;
      }
      var subBeanDef = propdef[i];
      delete propnames[i];
      JsonValidator._checkType({
        dataHolder: value,
        dataName: i,
        value: value[i],
        beanDef: subBeanDef,
        path: args.path + '["' + i + '"]'
      });
    }
    if (JsonValidator._options.checkEnabled && beanDef.$restricted) {
      for (var i in propnames) {
        if (Object.prototype.hasOwnProperty.call(value, i) && propnames[i] == 1) {
          // properties which stay in propnames after removing all that are in propdef
          // are invalid
          JsonValidator._logError(JsonValidator.UNDEFINED_PROPERTY, [i, args.path, beanDef[JsonValidator._MD_TYPENAME]]);
        }
      }
    }
  },
  makeFastNorm: function (beanDef) {
    var properties = beanDef.$properties;
    var parentBean = beanDef[JsonValidator._MD_PARENTDEF];
    var parentBeanProperties = parentBean.$properties;
    if (properties === parentBeanProperties) {
      // shortcut: reuse parent $fastNorm when possible
      beanDef.$fastNorm = parentBean.$fastNorm;
      if (parentBean.$fastNormParent) {
        beanDef.$fastNormParent = parentBean.$fastNormParent;
      }
      return;
    }
    var strBuffer = ["var beanProperties = this.$properties, value;"];
    strBuffer.push("if (!obj && this.$getDefault) { obj = this.$getDefault(); }");
    strBuffer.push("if (obj) {");

    var hasParentProperties = false;
    var hasParentIncompatibleProperties = false;
    var parentPropertiesBuffer = [];

    // loop over properties to generate normalizers
    var hasProperties = false;
    for (var propertyName in properties) {
      if (!Object.prototype.hasOwnProperty.call(properties, propertyName) || propertyName.indexOf(':') != -1
        || propertyName.charAt(0) == '_') {
        continue;
      }
      var property = properties[propertyName];
      var parentProperty = parentBeanProperties ? parentBeanProperties[propertyName] : null;
      var strDefault = property.$strDefault;
      var propertyHasFastNorm = hasFastNorm(property);
      var codeForProperty;
      var canUseParent = false;
      if (parentProperty) {
        if (parentProperty === property || (!propertyHasFastNorm && parentProperty.$strDefault === property.$strDefault)) {
          canUseParent = true;
        } else {
          hasParentIncompatibleProperties = true;
        }
      }
      if (propertyHasFastNorm) {
        // PTR 04546401 : Even if they have no default values, Objects might have subproperties with
        // default values, these properties should be normalized as well
        if (strDefault) {
          codeForProperty = "obj['" + propertyName + "'] = beanProperties['" + propertyName + "'].$fastNorm(obj['" + propertyName + "']);";
        } else {
          codeForProperty = "value = obj['" + propertyName + "']; if (value != null) { beanProperties['" + propertyName + "'].$fastNorm(value); }";
        }
      } else if (strDefault) {
        codeForProperty = "if (obj['" + propertyName + "'] == null) { obj['" + propertyName + "'] = " + strDefault + "; }";
      } else {
        continue;
      }
      if (canUseParent) {
        hasParentProperties = true;
        parentPropertiesBuffer.push(codeForProperty);
      } else {
        hasProperties = true;
        strBuffer.push(codeForProperty);
      }
    }
    if (hasParentIncompatibleProperties || !hasParentProperties) {
      if (hasParentProperties) {
        hasProperties = true;
        strBuffer = strBuffer.concat(parentPropertiesBuffer);
      }
      if (!hasProperties) {
        beanDef.$fastNorm = fastNormalizers.emptyObject;
        return;
      }
    } else {
      if (hasProperties) {
        strBuffer.push("this.$fastNormParent.$fastNorm(obj);");
        beanDef.$fastNormParent = parentBean;
      } else {
        // shortcut: reuse parent $fastNorm as there is no new property
        beanDef.$fastNorm = parentBean.$fastNorm;
        if (parentBean.$fastNormParent) {
          beanDef.$fastNormParent = parentBean.$fastNormParent;
        }
        return;
      }
    }
    strBuffer.push("}");
    strBuffer.push("return obj;");

    beanDef.$fastNorm = new Function("obj", strBuffer.join("\n"));
  }
}, {
  typeName: "Array",
  dontSkip: true,
  preprocess: __checkContentType,
  process: function (args) {
    var v = args.value;
    if (!isArray(v)) {
      return __badTypeError(this, args);
    }
    var ct = args.beanDef.$contentType;
    for (var i = 0; i < v.length; i++) {
      JsonValidator._checkType({
        dataHolder: v,
        dataName: i,
        value: v[i],
        beanDef: ct,
        path: args.path + '["' + i + '"]'
      });
    }
  },
  makeFastNorm: function (beanDef) {
    beanDef.$fastNorm = hasFastNorm(beanDef.$contentType) ? fastNormalizers.array : (beanDef.$strDefault ? fastNormalizers.emptyObject : returnArg);
  }
}, {
  typeName: "Map",
  dontSkip: true,
  preprocess: function (beanDef, beanName, packageDef) {
    __checkContentType(beanDef, beanName, packageDef);
    __checkKeyType(beanDef, beanName, packageDef);
  },
  process: function (args) {
    var v = args.value;
    if (typeof (v) != 'object' || v == null) {
      return __badTypeError(this, args);
    }
    var ct = args.beanDef.$contentType;
    var keyType = args.beanDef.$keyType;
    for (var i in v) {
      if (!Object.prototype.hasOwnProperty.call(v, i)) {
        continue;
      }
      if (keyType) {
        JsonValidator._checkType({
          dataHolder: v,
          dataName: null,
          value: i,
          beanDef: keyType,
          path: args.path
        });
      }
      JsonValidator._checkType({
        dataHolder: v,
        dataName: i,
        value: v[i],
        beanDef: ct,
        path: args.path + '["' + i + '"]'
      });
    }
  },
  makeFastNorm: function (beanDef) {
    beanDef.$fastNorm = hasFastNorm(beanDef.$contentType) ? fastNormalizers.map : (beanDef.$strDefault ? fastNormalizers.emptyObject : returnArg);
  }
}, {
  typeName: "MultiTypes",
  preprocess: function (beanDef, beanName, packageDef) {
    /* A MultiTypes does not check inheritance */
    var contentTypes = beanDef.$contentTypes;
    var parent = beanDef[JsonValidator._MD_PARENTDEF];
    if (!parent[JsonValidator._MD_BUILTIN]) {
      if (contentTypes == null) {
        beanDef.$contentTypes = parent.$contentTypes;
        return;
      }
    }
    if (contentTypes == null) {
      // no content type: no check should be done in this case
      return;
    }
    for (var i = 0; i < contentTypes.length; i++) {
      JsonValidator._preprocessBean(contentTypes[i], beanName + ".$contentTypes[" + i + "]", packageDef);
    }
  },
  process: function (args) {
    if (!JsonValidator._options.checkMultiTypes) {
      return;
    }
    var contentTypes = args.beanDef.$contentTypes;
    if (contentTypes == null) {
      // no content types: no check should be done in this case
      return;
    }
    var saveErrors = JsonValidator._errors;
    var errors = []; // array of {beanDef: /* one of the content types */, errors: [ /* array of
    // errors */]}
    for (var i = 0; i < contentTypes.length; i++) {
      var beanDef = contentTypes[i];
      // save current stack of error
      JsonValidator._errors = [];
      JsonValidator._checkType({
        dataHolder: args.dataHolder,
        dataName: args.dataName,
        value: args.value,
        beanDef: beanDef,
        path: args.path
      });
      if (JsonValidator._errors.length === 0) {
        // no error for this type, we forget about any error for other types
        JsonValidator._errors = saveErrors;
        return;
      }
      errors.push({
        beanDef: beanDef,
        errors: JsonValidator._errors
      });
    }
    JsonValidator._errors = saveErrors;
    JsonValidator._logError(JsonValidator.INVALID_MULTITYPES_VALUE, [args.path, args.beanDef[JsonValidator._MD_TYPENAME], errors]);
  }
}];

/**
 * List of fast normalizers functions used by makeFastNorm functions. These are the common functions for simple
 * beans. Having them once here reduces the memory needed to create a new Function for every bean property
 * @type Object
 * @private
 */
export const fastNormalizers = {
  emptyObject: function (obj) {
    return obj || this.$getDefault();
  },

  array: function (obj) {
    if (!obj && this.$getDefault) {
      obj = this.$getDefault();
    }
    for (var i = 0, l = obj ? obj.length : 0; i < l; i++) {
      this.$contentType.$fastNorm(obj[i]);
    }
    return obj;
  },

  map: function (obj) {
    if (!obj && this.$getDefault) {
      obj = this.$getDefault();
    }
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        this.$contentType.$fastNorm(obj[key]);
      }
    }
    return obj;
  }
};
// ---------------------------------------------------------
// END JsonTypesCheck
// NOTE: ModernAria: Moved contents of JsonTypesCheck.js here to resolve circular dependency
// ---------------------------------------------------------


// augment JsonValidator with base types from JsonTypesCheck
// var baseTypes = require("./JsonTypesCheck").baseTypes;
for (var i = 0, length = baseTypes.length; i < length; i++) {
  JsonValidator._addBaseType(baseTypes[i]);
}
