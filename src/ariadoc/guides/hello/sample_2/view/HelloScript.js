import { tplScriptDefinition } from '../../../../../aria/core/class-definition.js';
import { Json as ariaUtilsJson } from '../../../../../aria/utils/Json.js';

tplScriptDefinition({
  $classpath: 'ariadoc.guides.hello.sample_2.view.HelloScript',
  $constructor: function () { },
  $prototype: {

    getRepeaterSectionBinding: function (repItem) {
      var person = repItem.item;
      return [{ to: "data:detailsVisible", inside: person }];
    },

    toggleDetailDisplay: function (evt, args) {
      var person = args;
      var detailsVisible = (person["data:detailsVisible"] == true);
      ariaUtilsJson.setValue(person, "data:detailsVisible", !detailsVisible);
    }

  }
});

