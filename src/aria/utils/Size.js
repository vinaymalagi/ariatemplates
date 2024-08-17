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
import { FRAMEWORK_GLOBALS } from '../core/framework-bootstrap.js';
import { normalize } from "./Math.js";
import { isHTMLElement } from './html-helpers.js';
import { Layout as ariaTemplatesLayout } from "../templates/Layout";


/**
 * Handles sizes measurements and application for DOM elements
 * TODO: ModernAria: Add module JS Doc.
 */



/**
 * Get size of a DOM element
 * @param {HTMLElement} element
 * @return {{width: number, height: number}} width and height of the HTML element
 */
export function getSize(element) {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight
  };
};

/**
 * Create a simple hidden DIV to be used by functions requiring to compute sizes for hidden elements
 * @return {HTMLElement}
 * @private
 */
function __createDomContainer() {
  var document = FRAMEWORK_GLOBALS.$window.document;
  var domContainer = document.createElement("div");
  domContainer.style.cssText = "position:absolute;top:0px;left:0px;visibility:hidden;display:block;width:0px;height:0px;";
  return document.body.appendChild(domContainer);
};

/**
 * Measure the size of an element without constrains
 * @param {HTMLElement} element
 * @return {{width: number, height: number}} JSON object like { height : {Number}, width : {Number} }
 */
export function getFreeSize(element) {
  // Note: as of 8/02/2012, getFreeSize doesn't seem to be used in the framework
  var domContainer = __createDomContainer();
  var parentNode = element.parentNode;
  domContainer.appendChild(element);

  var width = element.offsetWidth;
  var height = element.offsetHeight;

  var size = /** @type aria.utils.DomBeans:Size */
  {
    'width': width,
    'height': height
  };

  if (isHTMLElement(parentNode)) {
    parentNode.appendChild(element);
  }

  // remove dom container:
  domContainer.parentNode.removeChild(domContainer);

  return size;
};

/**
 * Set the size of a given DOM element with contrains (min and max)
 * @param {HTMLElement} element
 * @param {{min: number, max: number}} widthConf
 *
 * <pre>
 * {
 *     min : Integer
 *     max : Integer
 * }
 * </pre>
 *
 * @param {{min: number, max: number}} heightConf
 *
 * <pre>
 * {
 *     min : Integer
 *     max : Integer
 * }
 * </pre>
 *
 * @return {{width: number, height: number} | null} new width and height if one of them have changed
 */
export function setContrains(element, widthConf, heightConf) {
  // PROFILING // var profilingId = this.$startMeasure("setContrains");
  var measured, newValue, result = {}, changedWidth = false, changedHeight = false;
  var changedOverflowY = false;

  // for width
  if (widthConf) {
    measured = element.offsetWidth;
    newValue = normalize(measured, widthConf.min, widthConf.max);
    if (newValue != measured) {
      element.style.width = newValue + "px";
      changedWidth = true;
    }
    result.width = newValue;
  }

  // for height
  if (heightConf) {
    measured = element.offsetHeight;
    newValue = normalize(measured, heightConf.min, heightConf.max);
    if (newValue != measured) {
      element.style.height = newValue + "px";
      changedHeight = true;
      changedOverflowY = (newValue < measured);
      if (changedOverflowY) {
        var additionalWidth = ariaTemplatesLayout.getScrollbarsMeasuredWidth() + 1;
        // recalculate the width
        var newWidth = normalize(element.offsetWidth + additionalWidth, widthConf.min, widthConf.max);

        element.style.width = newWidth + "px";
        changedWidth = true;
        result.width = newWidth;
      }
    }
    result.height = newValue;
  }

  if (changedWidth || changedHeight) {
    // update missing value
    if (!widthConf) {
      result.width = element.offsetWidth;
    }
    if (!heightConf) {
      result.height = element.offsetHeight;
    }
    // PROFILING // this.$stopMeasure(profilingId);
    return result;
  }
  // PROFILING // this.$stopMeasure(profilingId);
  return null;
}
