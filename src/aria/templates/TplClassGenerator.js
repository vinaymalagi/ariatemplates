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
import { classDefinition } from "../core/class-definition.js";
import { TplParser as ariaTemplatesTplParser } from "./TplParser.js";
// import { WidgetLibsSettings as ariaWidgetLibsEnvironmentWidgetLibsSettings } from "../widgetLibs/environment/WidgetLibsSettings.js";
import { ClassGenerator as ariaTemplatesClassGenerator } from "./ClassGenerator.js";
import {dirname, resolve, sep} from 'path';
import { convertInternalImportToRelativePath } from "./class-generator-utils.js";


/**
 * Generate the class definition for an HTML Template
 * @class aria.templates.TplClassGenerator
 */
export const TplClassGenerator = classDefinition({
  $classpath: 'aria.templates.TplClassGenerator',
  $extends: ariaTemplatesClassGenerator,
  $singleton: true,
  $constructor: function () {
    this.$ClassGenerator.constructor.call(this);

    // Load the Template specific statements
    this._loadStatements(["Template", "id", "on", "createView", "section", "@", "repeater"]);

    // Redefine the protected parser
    this._parser = ariaTemplatesTplParser;

    // Redefine the import spec for the parent class
    this._superClassImportSpec = { importType: 'Named', modulePath: 'ariatemplates/aria/templates/Template.js', name: 'Template', alias: 'ariaTemplatesTemplate', classpath: 'aria.templates.Template' };

    this._classType = "TPL";
    this._rootStatement = "Template";
    this._templateParamBean = "aria.templates.CfgBeans.TemplateCfg";

    /**
     * Name of the modifier to be used to escape the output for safety
     * @type String
     */
    this.escapeModifier = "escapeForHTML";
  },
  $prototype: {

    /**
     * Write to the current block of the class writer the $init method which is used both to import the script
     * prototype (if any) and to handle inheritance for macrolibs and for width and height constraints.
     * @param {aria.templates.ClassWriter} out
     * @protected
     */
    _writeClassInit: function (out) {
      var tplParam = out.templateParam;
      out.enterBlock("classInit");
      this._writeMapInheritance(out, "__$macrolibs", out.templateParam.$macrolibs, "{}");
      this._writeValueInheritance(out, "__$width", tplParam.$width, "{}");
      this._writeValueInheritance(out, "__$height", tplParam.$height, "{}");
      out.leaveBlock();
      this.$ClassGenerator._writeClassInit.call(this, out);
    },

    /**
     * Process template content. This method is called from _processRootStatement.
     * @param {Object} Process template content properties (contains out and statement objects).
     * @protected
     */
    _processTemplateContent: function (args) {
      // Note that this method is copied to TmlClassGenerator (cf its $init function)
      var out = args.out;
      var tplParam = out.templateParam;
      var wlibs = tplParam.$wlibs;
      // var classes = [];
      var defaultLibs = out.defaultWidgetLibsImportSpecs || {};
      // add all default widget libraries if they are not overridden:
      for (const libName in defaultLibs) {
          if (Object.prototype.hasOwnProperty.call(defaultLibs, libName)) {
              if (wlibs[libName] == null) {
                  wlibs[libName] = defaultLibs[libName];
              }
          }
      }
      const wlibPromises = [];
      for (const libName in wlibs) {
        if (Object.prototype.hasOwnProperty.call(wlibs, libName)) {
          // if (out.allDependencies) {
            // out.addDependency(wlibs[libName]); Will add the import dependency on widget access
          // }
          const wlibImportSpec = wlibs[libName];
          const normalizedWlibImportPath = out.isInternalAriatemplatesBuild ? convertInternalImportToRelativePath(wlibImportSpec.modulePath, out.sourceFilePath, out.sourcesRootDirectory) : wlibImportSpec.modulePath;
          const resolvedPath = resolve(dirname(out.sourceFilePath), normalizedWlibImportPath);
          const resolvedWlibPath = 'file:///' + resolvedPath.split(sep).join('/');

          const importPromise = import(resolvedWlibPath).then((wlib) => {

            // Load the wlib class reference to the
            let classRef = null;
            if (wlibImportSpec.importType === 'Default') {
              classRef = wlib.default;
            } else if (wlibImportSpec.importType === 'Named') {
              classRef = wlib[wlibImportSpec.name];
            }

            if (classRef) {
              out.wlibs[libName] = classRef;
            }
          });

          wlibPromises.push(importPromise);
        }
      }
      if (wlibPromises.length > 0) {
        Promise.all(wlibPromises).then(() => {

          // Everything should be loaded.
          this.$ClassGenerator._processTemplateContent.call(this, args);
        });
      } else {
        this.$ClassGenerator._processTemplateContent.call(this, args);
      }
      return;
    }
  }
});
