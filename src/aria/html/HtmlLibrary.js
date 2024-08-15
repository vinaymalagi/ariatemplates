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
import { WidgetLib as ariaWidgetLibsWidgetLib } from '../widgetLibs/WidgetLib.js';


export const HtmlLibrary = classDefinition({
    $classpath : "aria.html.HtmlLibrary",
    $extends : ariaWidgetLibsWidgetLib,
    $singleton : true,
    $prototype : {
        widgets : {
            "TextInput" : {
              importType: "Named",
              modulePath: "ariatemplates/aria/html/TextInput.js",
              name: "TextInput",
              alias: "ariaHtmlTextInput",
              classpath: "aria.html.TextInput"
            },
            "TextArea" : {
              importType: "Named",
              modulePath: "ariatemplates/aria/html/TextArea.js",
              name: "TextArea",
              alias: "ariaHtmlTextArea",
              classpath: "aria.html.TextArea"
            },
            "Template" : {
              importType: "Named",
              modulePath: "ariatemplates/aria/html/Template.js",
              name: "Template",
              alias: "ariaHtmlTemplate",
              classpath: "aria.html.Template"
            },
            "CheckBox" : {
              importType: "Named",
              modulePath: "ariatemplates/aria/html/CheckBox.js",
              name: "CheckBox",
              alias: "ariaHtmlCheckBox",
              classpath: "aria.html.CheckBox"
            },
            "RadioButton" : {
              importType: "Named",
              modulePath: "ariatemplates/aria/html/RadioButton.js",
              name: "RadioButton",
              alias: "ariaHtmlRadioButton",
              classpath: "aria.html.RadioButton"
            },
            "Select" : {
              importType: "Named",
              modulePath: "ariatemplates/aria/html/Select.js",
              name: "Select",
              alias: "ariaHtmlSelect",
              classpath: "aria.html.Select"
            }
        }
    }
});
