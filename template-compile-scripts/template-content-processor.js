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

import { log } from "../src/aria/core/Log.js";

// Creates a preprocessor for a specific class generator

/**
 *
 * @param {string} content - Template content to be parsed.
 * @param {*} classGenerator - Class generator to use.
 * @param {*} classGeneratorOptions - Options to pass to the class generator.
 *
 * @returns Promise - Rejects with an Error on failure, or the classDefinition compilation result as a string on success.
 */
export function processTemplateContent(content, classGenerator, classGeneratorOptions) {
  return new Promise(function (resolve, reject) {
    classGenerator.parseTemplate(content, classGeneratorOptions, function (result) {
      if (result.classDef) {
        resolve(result.classDef);
      } else {
        var errorDetails;
        if (log && result.errors && result.errors.length > 0) {
            var errors = result.errors;
            errorDetails = [];
            for (var i = 0, l = errors.length; i < l; i++) {
                var curError = errors[i];
                errorDetails[i] = log.prepareLoggedMessage(curError.msgId, curError.msgArgs);
            }
            errorDetails = ":\n - " + errorDetails.join("\n - ");
        } else {
            errorDetails = ".";
        }
        var error = new Error("Template '" + classGeneratorOptions.sourceFilePath + "' could not be compiled to javascript"+ errorDetails);
        reject(error);
      }
    });
  });
}
