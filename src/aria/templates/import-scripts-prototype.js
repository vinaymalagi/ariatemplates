import { emptyFn } from "../common/fixed-return-value-functions.js";
import { copyObject } from "../core/definition-utils.js";
import { DUPLICATE_CLASSNAME, RESOURCES_HANDLE_CONFLICT, TEXT_TEMPLATE_HANDLE_CONFLICT } from "../core/error-messages.js";
import { $logError } from "../core/framework-bootstrap.js";


const ImportScriptsClassPathForLogger = 'aria.templates.ImportScriptsPrototype';
const MISSING_TPLSCRIPTDEFINITION = 'The template script associated to template %1 must be defined using Aria.tplScriptDefinition.';

/**
 * Function called from templates to import their template script prototype. This method should not be called
 * from anywhere else than the $init method in the generated templates.
 * @param {Object} scriptClass script class (e.g.: x.y.MyTemplateScript)
 * @param {Object} tplPrototype template prototype (parameter given to the $init method)
 * @private
 */
export function importScriptPrototype(scriptClass, tplPrototype) {
  var scriptDef = scriptClass.tplScriptDefinition;
  if (!scriptDef) {
      return $logError(MISSING_TPLSCRIPTDEFINITION, [tplPrototype.$classpath], undefined, ImportScriptsClassPathForLogger);
  }
  var classpathParts = scriptDef.$classpath.split('.');
  var className = classpathParts[classpathParts.length - 1];
  var refScriptProto = '$' + className;
  var proto = {};
  if (tplPrototype[refScriptProto]) {
      return $logError(DUPLICATE_CLASSNAME, [scriptDef.$classpath], undefined, ImportScriptsClassPathForLogger);
  }
  copyObject(scriptDef.$prototype, proto);
  copyObject(scriptDef.$statics, proto);

  var scriptResources = scriptClass.classDefinition.$resources;
  if (scriptResources) {
      var tplPrototypeRes = {};
      if (tplPrototype.$resources) {
          copyObject(tplPrototype.$resources, tplPrototypeRes);
      }
      tplPrototype.$resources = tplPrototypeRes;
      var scriptTransformedProto = scriptClass.prototype;
      for (const member in scriptResources) {
          if (Object.prototype.hasOwnProperty.call(scriptResources, member)) {
              if (tplPrototype[member] && !tplPrototypeRes[member]) {
                  $logError(RESOURCES_HANDLE_CONFLICT, [member, scriptDef.$classpath], undefined, ImportScriptsClassPathForLogger);
              } else {
                  proto[member] = scriptTransformedProto[member];
                  tplPrototypeRes[member] = scriptResources[member];
              }
          }
      }
  }

  var scriptTexts = scriptClass.classDefinition.$texts;
  if (scriptTexts) {
      var tplPrototypeText = {};
      if (tplPrototype.$texts) {
          copyObject(tplPrototype.$texts, tplPrototypeText);
      }
      tplPrototype.$texts = tplPrototypeText;
      for (const member in scriptTexts) {
          if (Object.prototype.hasOwnProperty.call(scriptTexts, member)) {
              if (tplPrototype[member] && !tplPrototypeText[member]) {
                  $logError(TEXT_TEMPLATE_HANDLE_CONFLICT, [member, scriptDef.$classpath], undefined, ImportScriptsClassPathForLogger);
              } else {
                  proto[member] = scriptClass.prototype[member];
                  tplPrototypeText[member] = scriptTexts[member];
              }
          }
      }
  }

  // copy script prototype to template prototype
  copyObject(proto, tplPrototype);
  proto.constructor = scriptDef.$constructor || emptyFn;
  proto.$destructor = scriptDef.$destructor || emptyFn;
  tplPrototype[refScriptProto] = proto;
}
