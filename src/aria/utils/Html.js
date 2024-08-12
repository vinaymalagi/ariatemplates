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
import { DomElementWrapper } from "../templates/DomElementWrapper.js";
import { camelToDashed, encodeForQuotedHTMLAttribute } from "./String.js";
import { Json as jsonUtils } from "./Json.js";
import { $logError } from "../core/framework-bootstrap.js";

/**
 * This module contains utilities to manipulate Html elements.
 */

export const datasetRegex = /^\w+$/; /* This is to mainly to forbid dashes. Actually uppercase chars are not allowed by the spec, but they're transparently lowercased by the browser */
export const INVALID_CONFIGURATION = "Invalid attribute %1.";
export const INVALID_DATASET_KEY = "Invalid dataset key %1. Dataset keys can contain only [a-zA-Z0-9_]";

const __classpathForLogging = 'aria.uitls.Html';

/**
 * Build the HTML markup regarding the attributes provided.
 * @param {aria.templates.CfgBeans:HtmlAttribute} attributes Attributes to be parsed
 * @return {String} String which can be used directly in a html tag
 */
export function buildAttributeList(attributes) {
  var result = [], whiteList = DomElementWrapper.attributesWhiteList;

  /*
   * This assumes that white list is performed by config validation, but this is only available in debug mode :
   * FIXME!
   */
  for (var key in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, key) && !jsonUtils.isMetadata(key)) {
      var attribute = attributes[key];
      if (key === "classList") {
        result.push(" class=\"");
        result.push(encodeForQuotedHTMLAttribute(attribute.join(" ")));
        result.push("\"");
      } else if (key === "dataset") {
        for (var dataKey in attribute) {
          if (Object.prototype.hasOwnProperty.call(attribute, dataKey) && !jsonUtils.isMetadata(dataKey)) {
            if (datasetRegex.test(dataKey)) {
              result.push(" data-", camelToDashed(dataKey), "=\"");
              result.push(encodeForQuotedHTMLAttribute(attribute[dataKey]));
              result.push("\"");
            } else {
              $logError(INVALID_DATASET_KEY, dataKey, undefined, __classpathForLogging);
            }
          }
        }
      } else if (key === "aria") {
        for (var ariaKey in attribute) {
          if (Object.prototype.hasOwnProperty.call(attribute, ariaKey) && !jsonUtils.isMetadata(ariaKey)) {
            result.push(" aria-", ariaKey, "=\"");
            result.push(encodeForQuotedHTMLAttribute(attribute[ariaKey]));
            result.push("\"");
          }
        }
      } else if (whiteList.test(key)) {
        attribute = (attribute != null) ? attribute + "" : "";
        result.push(" ", key, "=\"");
        result.push(encodeForQuotedHTMLAttribute(attribute));
        result.push("\"");
      } else {
        $logError(INVALID_CONFIGURATION, key, undefined, __classpathForLogging);
      }
    }
  }
  return result.join('');
}

/**
 * Turn an HTML form element into a string that contains the list of name-value pairs of all relevant elements
 * of the form. For example, the following form
 *
 * <pre>
 * &lt;form id=&quot;myForm&quot;&gt;
 *     &lt;input type=&quot;text&quot; name=&quot;firstname&quot; value=&quot;Colin&quot;&gt;
 *     &lt;input type=&quot;text&quot; name=&quot;lastname&quot; value=&quot;Pitt&quot; disabled&gt;
 *     &lt;input type=&quot;date&quot; name=&quot;birth&quot; value=&quot;2012-04-04&quot;
 *     &lt;input type=&quot;text&quot;&gt;
 *     &lt;input type=&quot;file&quot; name=&quot;picture&quot; /&gt;
 *     &lt;input type=&quot;submit&quot; name=&quot;submit&quot;/&gt;
 *     &lt;input type=&quot;checkbox&quot; name=&quot;vehicle&quot; value=&quot;Bike&quot; checked /&gt;
 * &lt;/form&gt;
 * </pre>
 *
 * yields
 *
 * <pre>
 * firstname
 * =Colin&amp;birth=2012-04-04&amp;vehicle=Bike
 * </pre>
 *
 * This method can be useful when you want to send the form information as data of an ajax call
 * @param {HTMLElement} form
 * @return {String}
 */
export function serializeForm(form) {
  var elements = form.elements, params = [], element, name, value;
  for (var i = 0, len = elements.length; i < len; i++) {
    element = elements[i];
    if (_isSerializable(element)) {
      name = encodeURIComponent(element.name);
      value = encodeURIComponent(element.value.replace(/\r?\n/g, "\r\n"));
      params.push(name + "=" + value);
    }
  }
  return params.join("&").replace(/%20/g, "+");
}

/**
 * Return true if the HTML element is serializable in a form. Serializable elements are input, select, textarea,
 * keygen, which have a name attribute, a certain type, and are not disabled
 * @param {HTMLElement} element
 * @return {Boolean}
 */
function _isSerializable(element) {
  var submittable = /^(?:input|select|textarea|keygen)/i;
  var submitterTypes = /^(?:submit|button|image|reset|file)$/i;
  var type = element.type;
  var checkableTypes = /^(?:checkbox|radio)$/i;

  return element.name && !element.disabled && submittable.test(element.nodeName)
    && !submitterTypes.test(type) && (element.checked || !checkableTypes.test(type));
}

/**
 * Set "data-" attributes
 * @param {HTMLElement} domElement
 * @param {Object} dataset
 */
export function setDataset(domElement, dataset) {
  __setOrRemoveDataset(domElement, dataset);
}

/**
 * Remove "data-" attributes
 * @param {HTMLElement} domElement
 * @param {Object} dataset
 */
export function removeDataset(domElement, dataset) {
  __setOrRemoveDataset(domElement, dataset, true);
}

/**
 * Set or remove "data-" attributes
 * @param {HTMLElement} domElement
 * @param {Object} dataset
 * @param {Boolean} remove if false or undefined, attributes will be set instead
 */
function __setOrRemoveDataset(domElement, dataset, remove) {
  var fullKey;
  for (var dataKey in dataset) {
    if (Object.prototype.hasOwnProperty.call(dataset, dataKey) && !jsonUtils.isMetadata(dataKey)) {
      if (datasetRegex.test(dataKey)) {
        fullKey = "data-" + camelToDashed(dataKey);
        if (remove) {
          domElement.removeAttribute(fullKey);
        } else {
          domElement.setAttribute(fullKey, dataset[dataKey]);
        }
      } else {
        $logError(INVALID_DATASET_KEY, dataKey, undefined, __classpathForLogging);
      }
    }
  }
}
