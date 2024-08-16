import { interfaceDefinition } from "../../../aria/core/interface-definition.js";
import { IModuleCtrl } from "../../../aria/templates/IModuleCtrl.js";

export const ITodoCtrl = interfaceDefinition({
    $classpath: "ariadoc.guides.todo.ITodoCtrl",
    $extends: IModuleCtrl,

    $interface: {

        tasksLeft:  function() {},
        // eslint-disable-next-line no-unused-vars
        addTask:    function(desc) {},
        // eslint-disable-next-line no-unused-vars
        updateTask: function(desc, idx) {},
        // eslint-disable-next-line no-unused-vars
        deleteTask: function(idx) {},
        // eslint-disable-next-line no-unused-vars
        flagTask:   function(idx, done) {}

    }
});
