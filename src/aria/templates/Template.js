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

import { classDefinition } from '../core/class-definition.js';
// ----------------------
// MUST_DO: ModernAria: Implement Contextual menu Environment and dynamic loading of contextual menu itself
// import { contains } from '../utils/Array.js';
// import { contextualMenu as contextualEnvironment } from '../tools/contextual/environment/ContextualMenu.js';
// import { AppEnvironment } from '../core/AppEnvironment.js';
// ----------------------
import { ITemplate } from './ITemplate.js';
import { BaseTemplate } from './BaseTemplate.js';
import { UtilsJson } from '../utils/Json.js';

// --------------------
// MUST_DO: ModernAria: Implement Contextual menu Environment and dynamic loading of contextual menu itself
// /**
//  * Load the contextual menu if needed
//  */
// require("./$Template").load();
// ----------------------


    // --------------------
    // MUST_DO: ModernAria: Implement Contextual menu Environment and dynamic loading of contextual menu itself
    // /**
    //  * This function handles environment change. When the contextual menu is enabled it loads the required classes.
    //  */
    // var changingEnvironment = function (evt) {
    //     if (!evt || !evt.changedProperties || contains(evt.changedProperties, "contextualMenu")) {
    //         Aria.load({
    //             classes : ["aria.tools.contextual.ContextualMenu"]
    //         });
    //     }
    // };
    // --------------------

    // --------------------------
    // MUST_DO: ModernAria: Implement loading of Visual focus environment and also dynamic loading if Visual focus when config enabled.
    // import "../utils/environment/VisualFocus";
    // --------------------------


    /**
     * Base class from which all templates inherit. Some methods will be added to instances of this class, from the
     * TemplateCtxt class.
     * @extends aria.templates.BaseTemplate
     * @dependencies ["aria.utils.Array", "aria.tools.contextual.environment.ContextualMenu",
     * "aria.core.AppEnvironment", "aria.templates.ITemplate", "aria.utils.environment.VisualFocus", "aria.utils.Json"]
     */
    export const Template = classDefinition({
        $classpath : "aria.templates.Template",
        $extends : BaseTemplate,
        $statics : {
            // ERROR MESSAGES:
            EXCEPTION_IN_CONTROL_PARAMETERS : "line %2: Uncaught runtime exception in control %3 for parameters '%1'",
            EXCEPTION_IN_REPEATER_PARAMETER : "line %2: Uncaught runtime exception in repeater parameter '%1'"
        },
        // --------------------
        // MUST_DO: ModernAria: Implement dynamic loading of contextual menu when enabled
        // $onload : function () {
        //     if (!contextualEnvironment.getContextualMenu().enabled) {
        //         // since it's disabled, add a listener to load a class when it's enabled
        //         AppEnvironment.$on({
        //             "environmentChanged" : changingEnvironment,
        //             scope : {}
        //         });
        //     }
        // },
        // --------------------
        $prototype : {
            // $width and $height are the current values for width and height
            $width : undefined,
            $height : undefined,

            /**
             * Prototype init method called at prototype creation time Allows to store class-level objects that are
             * shared by all instances
             * @param {Object} p the prototype object being built
             * @param {Object} def the class definition
             */
            $init : function (p, def) {
                // The prototype should be an instance of Template, that inheriths from BaseTemplate
                p.$BaseTemplate.constructor.classDefinition.$prototype.$init(p, def);

                // copy the prototype of ITemplate:
                var itf = ITemplate.prototype;
                for (var key in itf) {
                    if (Object.prototype.hasOwnProperty.call(itf, key) && !Object.prototype.hasOwnProperty.call(p, key)) {
                        // copy methods which are not already on this object (this avoids copying $classpath and
                        // $destructor)
                        p[key] = itf[key];
                    }
                }

                // get shortcuts to necessary functions in other classes,
                // so that templates work even in a sandbox
                // TODO: ModernAria: Maybe just add $json: UtilsJson to the $prototype itself??
                p.$json = UtilsJson;
            },

            /**
             * Function to be overriden by subclasses to receive events from the module controller.
             * @param {Object} evt the event object (depends on the module event)
             */
            // eslint-disable-next-line no-unused-vars
            onModuleEvent : function (evt) {
                // default implementation: just ignore the events
            },

            /**
             * Function to be overriden by subclasses to receive events from the flow controller.
             * @param {Object} evt the event object (depends on the flow event)
             */
            // eslint-disable-next-line no-unused-vars
            onFlowEvent : function (evt) {
                // default implementation: just ignore the events
            },

            /**
             * This function can be overridden by Template Scripts. It is called by the TemplateLoader when data is
             * ready for use by the template.
             */
            $dataReady : function () {
                // default implementation
            },

            /**
             * This function can be overridden by Template Scripts. It is called by the TemplateLoader when the template
             * has been succesfully rendered.
             */
            $viewReady : function () {
                // default implementation
            },

            /**
             * This function can be overridden by Template Scripts. It is called after any refresh when all elements
             * from the view are displayed, including subtemplates.
             */
            $displayReady : function () {
                // default implementation
            }
        }
    });
