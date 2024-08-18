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

/**
 * Widget library provided by the Aria Templates framework.
 */
// TODO: ModernAria: Use named export 'AriaLib' instead of default export. Useful for barrel exports / documentation and IDE intellisense.
export default classDefinition({
  $classpath: "aria.widgets.AriaLib",
  $singleton: true,
  $extends: ariaWidgetLibsWidgetLib,
  $prototype: {
    /**
     * Map of all the widgets in the library. Keys in the map are widget names as they can be used in templates.
     * Values are the corresponding classpaths.
     * @type {Object}
     */
    widgets: {
      // MUST_CHECK: ModernAria: Refactor: If not possible to remove widgetLibs from the framework, redo this file, and figure out how create import statements for the widgets in lib during TPL class generation.
      // TODO: ModernAria: Redo: Redo this file, and figure out how create import statements for the widgets in lib during TPL class generation.
      "Fieldset": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/container/Fieldset.js",
        name: "Fieldset",
        alias: "ariaWidgetsContainerFieldset",
        classpath: "aria.widgets.container.Fieldset"
      },
      "Button": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/action/Button.js",
        name: "Button",
        alias: "ariaWidgetsActionButton",
        classpath: "aria.widgets.action.Button"
      },
      "IconButton": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/action/IconButton.js",
        name: "IconButton",
        alias: "ariaWidgetsActionIconButton",
        classpath: "aria.widgets.action.IconButton"
      },
      "Tooltip": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/container/Tooltip.js",
        name: "Tooltip",
        alias: "ariaWidgetsContainerTooltip",
        classpath: "aria.widgets.container.Tooltip"
      },
      "Text": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/Text.js",
        name: "Text",
        alias: "ariaWidgetsText",
        classpath: "aria.widgets.Text"
      },
      "Calendar": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/calendar/Calendar.js",
        name: "calendar.Calendar",
        alias: "ariaWidgetsCalendarCalendar",
        classpath: "aria.widgets.calendar.Calendar"
      },
      "RangeCalendar": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/calendar/RangeCalendar.js",
        name: "calendar.RangeCalendar",
        alias: "ariaWidgetsCalendarRangeCalendar",
        classpath: "aria.widgets.calendar.RangeCalendar"
      },
      "Dialog": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/container/Dialog.js",
        name: "Dialog",
        alias: "ariaWidgetsContainerDialog",
        classpath: "aria.widgets.container.Dialog"
      },
      "Link": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/action/Link.js",
        name: "Link",
        alias: "ariaWidgetsActionLink",
        classpath: "aria.widgets.action.Link"
      },
      "Div": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/container/Div.js",
        name: "Div",
        alias: "ariaWidgetsContainerDiv",
        classpath: "aria.widgets.container.Div"
      },
      "TextField": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/TextField.js",
        name: "TextField",
        alias: "ariaWidgetsFormTextField",
        classpath: "aria.widgets.form.TextField"
      },
      "Textarea": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/Textarea.js",
        name: "Textarea",
        alias: "ariaWidgetsFormTextarea",
        classpath: "aria.widgets.form.Textarea"
      },
      "Splitter": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/container/Splitter.js",
        name: "Splitter",
        alias: "ariaWidgetsContainerSplitter",
        classpath: "aria.widgets.container.Splitter"
      },
      "Tab": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/container/Tab.js",
        name: "Tab",
        alias: "ariaWidgetsContainerTab",
        classpath: "aria.widgets.container.Tab"
      },
      "TabPanel": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/container/TabPanel.js",
        name: "TabPanel",
        alias: "ariaWidgetsContainerTabPanel",
        classpath: "aria.widgets.container.TabPanel"
      },
      "PasswordField": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/PasswordField.js",
        name: "PasswordField",
        alias: "ariaWidgetsFormPasswordField",
        classpath: "aria.widgets.form.PasswordField"
      },
      "DateField": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/DateField.js",
        name: "DateField",
        alias: "ariaWidgetsFormDateField",
        classpath: "aria.widgets.form.DateField"
      },
      "DatePicker": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/DatePicker.js",
        name: "DatePicker",
        alias: "ariaWidgetsFormDatePicker",
        classpath: "aria.widgets.form.DatePicker"
      },
      "MultiSelect": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/MultiSelect.js",
        name: "MultiSelect",
        alias: "ariaWidgetsFormMultiSelect",
        classpath: "aria.widgets.form.MultiSelect"
      },
      "TimeField": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/TimeField.js",
        name: "TimeField",
        alias: "ariaWidgetsFormTimeField",
        classpath: "aria.widgets.form.TimeField"
      },
      "NumberField": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/NumberField.js",
        name: "NumberField",
        alias: "ariaWidgetsFormNumberField",
        classpath: "aria.widgets.form.NumberField"
      },
      "AutoComplete": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/AutoComplete.js",
        name: "AutoComplete",
        alias: "ariaWidgetsFormAutoComplete",
        classpath: "aria.widgets.form.AutoComplete"
      },
      "CheckBox": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/CheckBox.js",
        name: "CheckBox",
        alias: "ariaWidgetsFormCheckBox",
        classpath: "aria.widgets.form.CheckBox"
      },
      "RadioButton": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/RadioButton.js",
        name: "RadioButton",
        alias: "ariaWidgetsFormRadioButton",
        classpath: "aria.widgets.form.RadioButton"
      },
      "Icon": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/Icon.js",
        name: "Icon",
        alias: "ariaWidgetsIcon",
        classpath: "aria.widgets.Icon"
      },
      "SelectBox": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/SelectBox.js",
        name: "SelectBox",
        alias: "ariaWidgetsFormSelectBox",
        classpath: "aria.widgets.form.SelectBox"
      },
      "Select": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/Select.js",
        name: "Select",
        alias: "ariaWidgetsFormSelect",
        classpath: "aria.widgets.form.Select"
      },
      "SortIndicator": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/action/SortIndicator.js",
        name: "SortIndicator",
        alias: "ariaWidgetsActionSortIndicator",
        classpath: "aria.widgets.action.SortIndicator"
      },
      "Template": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/Template.js",
        name: "Template",
        alias: "ariaWidgetsTemplate",
        classpath: "aria.widgets.Template"
      },
      "List": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/list/List.js",
        name: "List",
        alias: "ariaWidgetsFormListList",
        classpath: "aria.widgets.form.list.List"
      },
      "Gauge": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/Gauge.js",
        name: "Gauge",
        alias: "ariaWidgetsFormGauge",
        classpath: "aria.widgets.form.Gauge"
      },
      "ErrorList": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/errorlist/ErrorList.js",
        name: "ErrorList",
        alias: "ariaWidgetsErrorlistErrorList",
        classpath: "aria.widgets.errorlist.ErrorList"
      },
      "MultiAutoComplete": {
        importType: "Named",
        modulePath: "ariatemplates/aria/widgets/form/MultiAutoComplete.js",
        name: "MultiAutoComplete",
        alias: "ariaWidgetsFormMultiAutoComplete",
        classpath: "aria.widgets.form.MultiAutoComplete"
      }
    }
  }
});
