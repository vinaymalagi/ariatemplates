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

/**
 * MultiAutoComplete widget
 */
Aria.classDefinition({
    $classpath : "aria.widgets.form.MultiAutoComplete",
    $extends : "aria.widgets.form.AutoComplete",
    $dependencies : ["aria.widgets.controllers.MultiAutoCompleteController", "aria.utils.Event", "aria.utils.Dom",
            "aria.utils.Type", "aria.utils.Array", "aria.utils.Math", "aria.utils.String"],
    $css : ["aria.widgets.form.MultiAutoCompleteStyle", "aria.widgets.form.list.ListStyle",
            "aria.widgets.container.DivStyle"],
    /**
     * MultiAutoComplete constructor
     * @param {aria.widgets.CfgBeans:MultiAutoCompleteCfg} cfg the widget configuration
     * @param {aria.templates.TemplateCtxt} ctxt template context
     * @param {Number} lineNumber Line number corresponding in the .tpl file where the widget is created
     * @param {Number} controller the data controller object
     */
    $constructor : function (cfg, ctxt, lineNumber, controllerInstance) {
        var controller = controllerInstance || new aria.widgets.controllers.MultiAutoCompleteController();

        this.$AutoComplete.constructor.call(this, cfg, ctxt, lineNumber, controller);
        if (!cfg.expandButton) {
            this._hideIconNames = ["dropdown"];
        }
        controller.maxOptions = cfg.maxOptions;
    },

    $statics : {
        // ERROR MESSAGE:
        WIDGET_MULTIAUTOCOMPLETE_INVALID_HANDLER : "%1Could not create resources handler %2: dependency on this handler is missing."
    },
    $prototype : {
        /**
         * Skinnable class to use for this widget.
         * @protected
         * @type String
         */
        _skinnableClass : "MultiAutoComplete",
        /**
         * Override to initialize a widget (e.g. to listen to DOM events)
         * @param {HTMLElement} elt the Input markup DOM elt - never null
         */
        _initInputMarkup : function () {
            this.$AutoComplete._initInputMarkup.apply(this, arguments);
            this._textInputField = this._frame.getChild(0).lastChild;
        },
        /**
         * Override internal method not to update the input width incase of multi autocomplete
         */
        _computeInputWidth : function () {
            return;
        },
        /**
         * Internal method to process the input block markup inside the frame
         * @param {aria.templates.MarkupWriter} out the writer Object to use to output markup
         * @protected
         */
        _inputWithFrameMarkup : function (out) {
            out.write('<div class="xMultiAutoComplete_list">');
            this.$AutoComplete._inputWithFrameMarkup.call(this, out);
            out.write('</div>');
        },
        /**
         * Override $DropDownTextInput._reactToControllerReport
         * @protected
         * @param {aria.widgets.controllers.reports.DropDownControllerReport} report
         * @param {Object} arg Optional parameters
         */
        _reactToControllerReport : function (report, arg) {
            this.$AutoComplete._reactToControllerReport.call(this, report, arg);
            if (report && report.value !== null) {
                this._addMultiselectValues(report, arg);
            }
        },

        /**
         * Internal function to render the content of the dropdown div
         * @protected
         * @param {aria.templates.MarkupWriter} out Markup writer which should receive the content of the popup.
         * @param {Object} arg Optional parameters
         */
        _renderDropdownContent : function (out, options) {
            options = options || {};
            var cfg = this._cfg;
            var controller = this.controller;
            var dm = controller.getDataModel();
            var element = this._domElt.lastChild;
            var domUtil = aria.utils.Dom;
            var geometry = domUtil.getGeometry(element);
            if (geometry === null) {
                return;
            }

            domUtil.scrollIntoView(element);
            var top = geometry.y;
            var viewPort = aria.utils.Dom._getViewportSize();
            var bottom = viewPort.height - top - geometry.height;
            var maxHeight = (top > bottom) ? top : bottom;
            var referenceMaxHeight = options.maxHeight || this.MAX_HEIGHT;
            maxHeight = (maxHeight < this.MIN_HEIGHT) ? this.MIN_HEIGHT : maxHeight;
            maxHeight = (maxHeight > referenceMaxHeight) ? referenceMaxHeight : maxHeight - 2;
            var listObj = {
                id : cfg.id,
                defaultTemplate : "defaultTemplate" in options ? options.defaultTemplate : cfg.listTemplate,
                block : true,
                sclass : cfg.listSclass || this._skinObj.listSclass,
                onmouseover : {
                    fn : this._mouseOverItem,
                    scope : this
                },
                onkeyevent : {
                    fn : this._keyPressed,
                    scope : this
                },
                onclose : {
                    fn : this._closeDropdown,
                    scope : this
                },
                maxHeight : maxHeight,
                minWidth : "minWidth" in options ? options.minWidth : this._inputMarkupWidth + 15,
                width : this.__computeListWidth(cfg.popupWidth, this._inputMarkupWidth + 15),
                preselect : cfg.preselect,
                bind : {
                    items : {
                        to : "listContent",
                        inside : dm
                    },
                    selectedIndex : {
                        to : "selectedIdx",
                        inside : dm
                    },
                    selectedValues : {
                        to : "selectedValues",
                        inside : dm
                    },
                    multipleSelect : {
                        to : "isRangeValue",
                        inside : dm
                    }
                },
                scrollBarX : false
            };
            if (controller._isExpanded) {
                listObj.defaultTemplate = controller.getExpandoTemplate();
                listObj.multipleSelect = true;
                listObj.maxOptions = (this.controller.maxOptions) ? this.__returnMaxCount() : null;
                listObj.onchange = {
                    fn : this._changeOnItem,
                    scope : this
                };
            } else {
                listObj.onclick = {
                    fn : this._clickOnItem,
                    scope : this
                };
            }
            var list = new aria.widgets.form.list.List(listObj, this._context, this._lineNumber);
            list.$on({
                'widgetContentReady' : this._refreshPopup,
                scope : this
            });
            out.registerBehavior(list);
            list.writeMarkup(out);
            this.controller.setListWidget(list);
        },

        /**
         * Internal method to handle the click event to remove suggestion. This event is used to set focus on input
         * field
         * @param {aria.DomEvent} event Event object
         * @protected
         */
        _dom_onclick : function (event) {
            this.$AutoComplete._dom_onclick.call(this, event);
            var element = event.target;
            if (element.className === "closeBtn") {
                this._removeMultiselectValues(element, event);
            }
            if (element.className.indexOf("xMultiAutoComplete_Option_Text") != -1) {
                var highlightedSuggestions = this.getHighlight();
                var index = this._getIndexFromNode(element.parentNode);
                if (this.controller.freeText && aria.utils.Json.equals(highlightedSuggestions, [index])) {
                    this._editMultiselectValue(element);
                } else {
                    this.removeHighlight(this.getHighlight());
                    this.addHighlight(index);
                }
            }
            this.__resizeInput();
            this._textInputField.focus();
        },
        /**
         * Internal method to get the index of suggestion from suggestions container
         * @protected
         * @return {Integer} 1-based indexs
         */
        _getIndexFromNode : function (htmlElement) {
            var i = 1;
            while ((htmlElement = htmlElement.previousSibling) != null) {
                i++;
            }
            return i;
        },
        /**
         * Private method to increase the textInput width on focus
         * @private
         */
        __resizeInput : function () {
            var skinObj = this._skinObj, frame = this._frame, obj = this._textInputField;
            if (obj) {
                var frameWidth = frame.innerWidth - skinObj.innerPaddingLeft - skinObj.innerPaddingRight, inputWidth = obj.offsetLeft;
                obj.style.width = (frameWidth - inputWidth - 4) + "px";// tolerance of 1 character
            }

        },
        /**
         * Initialization method called by the delegate engine when the DOM is loaded
         */
        initWidget : function () {
            this.$AutoComplete.initWidget.call(this);
            var cfg = this._cfg, initWidget = true;
            if (cfg.value) {
                var report = this.controller.checkValue(cfg.value, initWidget);
                this._reactToControllerReport(report);
            }
        },
        /**
         * Add the selected suggestion(s) to widget
         * @protected
         * @param {aria.widgets.form.MultiAutoComplete} ref
         * @param {aria.widgets.controllers.reports.DropDownControllerReport} report
         * @param {Object} arg Optional parameters
         */

        _addMultiselectValues : function (report, arg) {
            var controller = this.controller, suggestionToBeAdded = report.suggestionsToAdd;
            var isValid;
            var typeUtil = aria.utils.Type;
            var domUtil = aria.utils.Dom;
            if (controller.editMode) {
                isValid = typeUtil.isString(suggestionToBeAdded);
            } else {
                isValid = typeUtil.isArray(suggestionToBeAdded) || typeUtil.isObject(suggestionToBeAdded);
            }

            if (controller.freeText && suggestionToBeAdded) {
                isValid = true;
            }
            if (controller.maxOptions && controller.selectedSuggestions.length == controller.maxOptions) {
                this._textInputField.value = "";
            }
            if (isValid && suggestionToBeAdded && !this._dropdownPopup) {
                var suggestionsMarkup = "";
                if (typeUtil.isArray(suggestionToBeAdded)) {
                    var maxOptionsLength = (controller.maxOptions)
                            ? aria.utils.Math.min((controller.maxOptions - controller.selectedSuggestions.length), suggestionToBeAdded.length)
                            : suggestionToBeAdded.length;
                    for (var i = 0; i < maxOptionsLength; i++) {
                        suggestionsMarkup += this._generateSuggestionMarkup(suggestionToBeAdded[i], this);
                    }
                } else {
                    var lessThanMaxOptions = controller.maxOptions
                            ? controller.maxOptions > controller.selectedSuggestions.length
                            : true;
                    if (lessThanMaxOptions) {
                        suggestionsMarkup = this._generateSuggestionMarkup(suggestionToBeAdded);
                    }
                }
                domUtil.insertAdjacentHTML(this._textInputField, "beforeBegin", suggestionsMarkup);
                this.__createEllipsis(this._textInputField);
                this._textInputField.value = "";
                this._makeInputFieldLastChild();
                if (controller.editMode) {
                    controller.editMode = false;
                }
                this._textInputField.style.width = "0px";
                this.__resizeInput();

            }
        },
        /**
         * Generate markup for selected suggestion
         * @param {String} report
         * @param {aria.widgets.form.MultiAutoComplete} ref
         * @return {String}
         */
        _generateSuggestionMarkup : function (value) {
            var suggestionMarkup, checkExistingValue = false, cfg = this._cfg;
            var label = aria.utils.String.escapeHTML(value.label || value);
            for (var k = 0; k < this.controller.selectedSuggestions.length; k++) {
                if (this.controller.selectedSuggestions[k].label == value) {
                    checkExistingValue = true;
                    break;
                }
            }
            if (!checkExistingValue) {
                this.controller.selectedSuggestions.push(value);
                this.controller.selectedSuggestionsLabelsArray.push(label);
            }
            suggestionMarkup = "<div class='xMultiAutoComplete_" + cfg.sclass + "_options' "
                    + "><span class='xMultiAutoComplete_Option_Text' >" + label
                    + "</span><a href='javascript:void(0);' class='closeBtn'></a></div>";
            return suggestionMarkup;
        },
        /**
         * Method to create ellipsis for an added Suggestion
         * @param {HTMLElement} input textInputField
         * @private
         */
        __createEllipsis : function (input) {
            var ellipsisContainer = input.previousSibling, elementoffsetWidth = ellipsisContainer.offsetWidth, frameWidth = this._frame.innerWidth;
            // 10 is to consider margin and padding
            if (elementoffsetWidth >= (frameWidth - 10)) {
                ellipsisContainer.firstChild.className += " ellipsisClass";
                var elementWidth = frameWidth - ellipsisContainer.offsetLeft
                        - (ellipsisContainer.firstChild.offsetLeft + ellipsisContainer.lastChild.offsetWidth) * 2;
                ellipsisContainer.firstChild.style.maxWidth = elementWidth + "px";
            }

        },
        /**
         * Handling double click event for editing suggestion
         * @param {aria.utils.Event} event
         * @protected
         */
        _dom_ondblclick : function (event) {
            if (event.type == "dblclick" && this.controller.freeText) {
                var element = event.target;
                if (element.className.indexOf("xMultiAutoComplete_Option_Text") != -1) {
                    this._editMultiselectValue(element, event);
                }
            }
        },
        /**
         * Handling blur event
         * @param {aria.utils.Event} event
         * @protected
         */
        _dom_onblur : function (event) {
            var inputField = this.getTextInputField();
            if (inputField.nextSibling != null && inputField.value === "") {
                this._makeInputFieldLastChild();
            }
            this.$TextInput._dom_onblur.call(this, event);
        },
        /**
         * Make the inputfield as last child of widget
         * @protected
         */
        _makeInputFieldLastChild : function () {
            var domUtil = aria.utils.Dom;
            if (this._frame.getChild(0).lastChild !== this._textInputField) {
                domUtil.insertAdjacentHTML(this._frame.getChild(0).lastChild, "afterEnd", "<span></span>");
                domUtil.replaceDomElement(this._frame.getChild(0).lastChild, this._textInputField);
                this._textInputField.style.width = "0px";
                this.__resizeInput();
            }
        },
        /**
         * Handling keydow event for enter, backspace
         * @param {aria.utils.Event} event
         * @protected
         */
        _dom_onkeydown : function (event) {
            var stringUtil = aria.utils.String;
            var domUtil = aria.utils.Dom;
            var inputField = this.getTextInputField();
            var inputFieldValue = inputField.value;
            var inputFieldIsEmpty = (stringUtil.trim(inputFieldValue) === "");
            var backspacePressed = (event.keyCode == event.KC_BACKSPACE);
            var tabPressed = (event.keyCode == event.KC_TAB);
            var deleteKeyPressed = (event.keyCode == event.KC_DELETE);

            if (tabPressed && !inputFieldIsEmpty && this.controller.freeText) {
                event.preventDefault();
                var report = this.controller.checkText(inputFieldValue, false);
                this._reactToControllerReport(report);
                this.setHelpText(false);
                inputField.focus();
            }
            if (tabPressed && inputFieldIsEmpty && inputField.nextSibling != null) {
                event.preventDefault();
                this._makeInputFieldLastChild();
                this.setHelpText(false);
                inputField.focus();
                var newSuggestions = aria.utils.Json.copy(this.controller.selectedSuggestions);
                this.setProperty("value", newSuggestions);

            }
            if (backspacePressed && inputFieldIsEmpty) {
                var highlightedElementIndex = this.getHighlight()[0];
                var highlightedElement = inputField.parentNode.children[highlightedElementIndex - 1];
                if (highlightedElement) {
                    var highlightedElementLabel = highlightedElement.textContent || highlightedElement.innerText;
                    if (highlightedElement.previousSibling == null) {
                        this.addHighlight(highlightedElementIndex + 1);
                    } else {
                        this.addHighlight(highlightedElementIndex - 1);
                    }
                    domUtil.removeElement(highlightedElement);
                    this._removeValues(highlightedElementLabel);
                } else {
                    var previousSiblingElement = domUtil.getPreviousSiblingElement(inputField);
                    if (previousSiblingElement) {
                        var previousSiblingLabel = previousSiblingElement.firstChild.textContent
                                || previousSiblingElement.firstChild.innerText;
                        domUtil.removeElement(previousSiblingElement);
                        this._removeValues(previousSiblingLabel);
                    }
                }
            }
            if (deleteKeyPressed && inputFieldIsEmpty) {
                var highlightedElementIndex = this.getHighlight()[0];
                var highlightedElement = inputField.parentNode.children[highlightedElementIndex - 1];
                if (highlightedElement) {
                    var highlightedElementLabel = highlightedElement.textContent || highlightedElement.innerText;
                    domUtil.removeElement(highlightedElement);
                    this.addHighlight(highlightedElementIndex);
                    this._removeValues(highlightedElementLabel);
                }

            }
            this.$DropDownTextInput._dom_onkeydown.call(this, event);
        },
        /**
         * To remove suggestion on click of close
         * @protected
         * @param {aria.utils.HTML} domElement
         * @param {aria.widgets.form.MultiAutoComplete} ref
         * @param {aria.utils.Event} event
         * @param {Boolean} if current element is a parent element itself
         */
        _removeMultiselectValues : function (domElement, event, isParent) {
            var parent = (!isParent) ? domElement.parentNode : domElement;
            var domUtil = aria.utils.Dom;
            var label = parent.firstChild.textContent || parent.firstChild.innerText;
            domUtil.removeElement(parent);
            this._removeValues(label);
            if (event && event.type == "click") {
                this.getTextInputField().focus();

            }

        },
        /**
         * To edit suggestion on doubleclick
         * @param {aria.utils.HTML} domElement
         * @param {aria.utils.Event} event
         * @protected
         */
        _editMultiselectValue : function (domElement, event) {
            var label, arg = {};
            var domUtil = aria.utils.Dom;
            label = domElement.textContent || domElement.innerText;
            domUtil.replaceDomElement(domElement.parentNode, this._textInputField);
            this.controller.editMode = true;
            this._removeValues(label);
            this._textInputField.focus();
            // to select the edited text.
            this._keepFocus = true;
            // this._textInputField.style.width = "0px";
            var report = this.controller.checkValue(label);
            report.caretPosStart = 0;
            report.caretPosEnd = label.length;
            this.$TextInput._reactToControllerReport.call(this, report, arg);
            // after setting the value removing focus
            this._keepFocus = false;

        },
        /**
         * To remove the label from widget
         * @param {String} label
         * @protected
         */
        _removeValues : function (label) {
            var indexToRemove, controller = this.controller;
            var arrayUtil = aria.utils.Array;
            arrayUtil.forEach(controller.selectedSuggestions, function (obj, index) {
                var suggestionLabel = obj.label || obj;
                if (suggestionLabel == label) {
                    indexToRemove = index;
                    controller.editedSuggestion = obj;
                }
            });
            arrayUtil.removeAt(controller.selectedSuggestions, indexToRemove);
            arrayUtil.remove(controller.selectedSuggestionsLabelsArray, label);
            var newSuggestions = aria.utils.Json.copy(controller.selectedSuggestions);
            this.setProperty("value", newSuggestions);
            this._textInputField.style.width = "0px";
            this.__resizeInput();
        },
        /**
         * Method used to get a dom reference for positioning the popup
         */
        getValidationPopupReference : function () {
            return this.getTextInputField();
        },
        /**
         * To remove the highlight class from the suggestion(s)
         * @param {Array|Integer} indices It can be an array of indices of suggestions or an index of suggestion. If
         * nothing is provided it will remove the highlight class from all the highlighted suggestions. Indexing starts
         * with 1.
         * @public
         */
        removeHighlight : function (indices) {
            var suggestionContainer = this._textInputField.parentNode;
            var typeUtil = aria.utils.Type;
            if (typeof indices === "undefined") {
                indices = this.getHighlight();
            }
            if (typeUtil.isArray(indices)) {
                for (var k = 0; k < indices.length; k++) {
                    var suggestionNode = suggestionContainer.children[indices[k] - 1];
                    if (suggestionNode) {
                        this._removeClass(suggestionNode, 'highlight');
                    }
                }
            } else {
                this.removeHighlight([indices]);
            }
        },
        /**
         * To remove class from DomElement
         * @param {HTMLElement} suggestionNode
         * @param {String} className
         * @protected
         */
        _removeClass : function (suggestionNode, className) {
            var suggestionNodeClassList = new aria.utils.ClassList(suggestionNode);
            suggestionNodeClassList.remove(className);
            suggestionNodeClassList.$dispose();
        },

        /**
         * To add the highlight class for the suggestion(s)
         * @param {Array|Integer} indices It can be an array of indices of suggestions or an index of suggestion to be
         * highlighted. Indexing starts with 1.
         * @public
         */
        addHighlight : function (indices) {
            var suggestionContainer = this._textInputField.parentNode;
            var typeUtil = aria.utils.Type;
            if (typeUtil.isArray(indices)) {
                for (var k = 0; k < indices.length; k++) {
                    var suggestionNode = suggestionContainer.children[indices[k] - 1];
                    if (suggestionNode) {
                        this._addClass(suggestionNode, 'highlight');
                    }
                }
            } else {
                this.addHighlight([indices]);
            }
        },
        /**
         * To add class for DomElement
         * @param {HTMLElement} suggestionNode
         * @param {String} className
         * @protected
         */
        _addClass : function (suggestionNode, className) {
            var suggestionNodeClassList = new aria.utils.ClassList(suggestionNode);
            suggestionNodeClassList.add(className);
            suggestionNodeClassList.$dispose();
        },
        /**
         * Returns an array of indices of suggestions which have highlight class. Indexing starts with 1
         * @public
         * @return {Array}
         */
        getHighlight : function () {
            var suggestionContainer = this._textInputField.parentNode;
            var highlightedArray = [];
            for (var i = 0; i < suggestionContainer.children.length - 1; i++) {
                var suggestionNode = suggestionContainer.children[i];
                var suggestionNodeClassList = new aria.utils.ClassList(suggestionNode);
                if (suggestionNodeClassList.contains("highlight")) {
                    highlightedArray.push(i + 1);
                }
                suggestionNodeClassList.$dispose();
            }
            return highlightedArray;
        },
        /**
         * Internal method for calculating the maxOptions allowed for setting it in template
         * @return {Number}
         */
        __returnMaxCount : function () {
            var maxCount = 0, suggestion = this.controller.selectedSuggestions;
            if (suggestion.length < this.controller.maxOptions) {
                return this.controller.maxOptions;
            } else {
                for (var i = 0, len = suggestion.length; i < len; i++) {
                    if (aria.utils.Type.isObject(suggestion[i])) {
                        maxCount++;
                    }
                }
                return maxCount;
            }
        },
        /**
         * Callback called when the user clicks on a checkbox (or its label) on a dropdown list or
         * selectAll/deselectAll.
         * @protected
         * @param {Array} newVals array of values that will be selected after the change
         */
        _changeOnItem : function (values) {
            this._closeDropdown();
            var newArrayValue = this._constructSelectedSuggestion();
            var valueArray = this.__constructLabelArray(values);
            var checkedValue = this._selectDeselectValues(newArrayValue, valueArray, values);
            if (checkedValue && aria.utils.Type.isArray(checkedValue)) {
                var report = this.controller.checkValue(checkedValue);
                this._reactToControllerReport(report);
            }
        },
        /**
         * Internal Method for bulding label array from values
         * @param {Array} values
         * @return {Array} Array of labels
         */
        __constructLabelArray : function (values) {
            var valueArray = [];
            for (var m = 0; m < values.length; m++) {
                valueArray.push(values[m].label);
            }
            return valueArray;
        },
        /**
         * To select or deselect the options from widget depending on the action performed on the template
         * @param {Array} newArray Array containing all the selected suggestions from allSuggestions.
         * @param {} newlabelArray Array containing the all the labels returned from the list template
         * @param {} values actual Array of values returned from list Template.
         * @return {Boolean}
         */
        _selectDeselectValues : function (newArray, newlabelArray, values) {
            var arrayUtil = aria.utils.Array, jsonUtil = aria.utils.Json;
            // In case of deselectAll
            if (!values.length > 0) {
                this._unselectValues(newArray);
                return false;
            }
            // In case of deselecting individually
            if (values.length < newArray.length) {
                var labelArray = jsonUtil.copy(newArray);
                for (var l = 0; l < newArray.length; l++) {
                    if (arrayUtil.contains(newlabelArray, newArray[l])) {
                        arrayUtil.removeAt(labelArray, arrayUtil.indexOf(labelArray, newArray[l]));
                    }
                }
                this._unselectValues(labelArray);
                return false;
            }
            // In case of selectAll and each select
            if (values.length > newArray.length) {
                var optionsArray = [];
                for (var m = 0; m < values.length; m++) {
                    if (!arrayUtil.contains(newArray, values[m].label) && this._checkMaxCount(optionsArray)) {
                        optionsArray.push(values[m]);
                    }
                }
                return optionsArray;
            }
            return false;
        },
        /**
         * for checking the maxoptions is not exceeded while adding options from list
         * @param {Array} options total number of options to the widget
         * @return {Boolean} returns true if maxOptions are not exceeded
         */
        _checkMaxCount : function (options) {
            if (!this.controller.maxOptions) {
                return true;
            } else {
                var totalOptions = this.controller.selectedSuggestions.length + options.length;
                return totalOptions < this.controller.maxOptions;
            }
        },
        /**
         * To filter the the array of elements to remove
         * @param {Array} newArray
         */
        _unselectValues : function (newArray) {
            var selectedElements = this._textInputField.parentElement.childNodes, elementArray = [];
            for (var index = 0, elementLen = newArray.length; index < elementLen; index++) {
                var elementLabel = newArray[index];
                for (var eleIndex = 0, len = selectedElements.length - 1; eleIndex < len; eleIndex++) {
                    var element = selectedElements[eleIndex], label = element.firstChild.innerText
                            || element.firstChild.textContent;
                    if (label === elementLabel) {
                        elementArray.push(element);
                        break;
                    }

                }
            }
            this._removeElements(elementArray);
        },
        /**
         * Method to remove the selected options after deselecting in list template
         * @param {Array} of elementsToremove
         */
        _removeElements : function (elementsToremove) {
            if (elementsToremove.length === 0) {
                // do Nothing
                return;
            }
            for (var k = 0, len = elementsToremove.length; k < len; k++) {
                this._removeMultiselectValues(elementsToremove[k], null, 1);
            }
        },
        /**
         * Method to construct the Array after comparing the selected suggestion in widget with allSuggestions
         * @return {Array} returns the Array of suggestons labels
         */
        _constructSelectedSuggestion : function () {
            var selectedArray = this.controller.selectedSuggestionsLabelsArray, labelArray = aria.utils.Json.copy(selectedArray), arrayUtil = aria.utils.Array;
            for (var labelIndex = 0; labelIndex < selectedArray.length; labelIndex++) {
                var eachLabel = selectedArray[labelIndex];
                var allSuggestions = this.controller._resourcesHandler._suggestions, matchFound = false;
                for (var suggstion = 0; suggstion < allSuggestions.length; suggstion++) {
                    var suggestionLabel = allSuggestions[suggstion].label;
                    if (suggestionLabel === eachLabel.toLowerCase()) {
                        matchFound = true;
                        break;
                    }
                }
                if (!matchFound) {
                    arrayUtil.removeAt(labelArray, arrayUtil.indexOf(labelArray, eachLabel));
                }
            }
            return labelArray;
        }
    }
});