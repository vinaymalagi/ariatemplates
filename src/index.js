import { TplClassLoader } from "./aria/templates/TplClassLoader.js";
import Sample1HelloTpl from "./ariadoc/guides/hello/sample_1/view/Hello.tpl.js";
import Sample2HelloTpl from "./ariadoc/guides/hello/sample_2/view/Hello.tpl.js";
import { TodoCtrl } from "./ariadoc/guides/todo/TodoCtrl.js";
import TodoTpl from "./ariadoc/guides/todo/view/Todo.tpl.js";



TplClassLoader.loadTemplate({
  classpath: Sample1HelloTpl,
  div: "helloSample1Tpl",
  data: {
    msg: "Hello World, this is AriaTemplates!"
  }
});


TplClassLoader.loadTemplate({
  classpath: Sample2HelloTpl,
  div: "helloSample2Tpl",
  data: {
    people: [
      { name: "John", age: 27 },
      { name: "Mary", age: 25 },
      { name: "David", age: 35 },
      { name: "Fabien", age: 28 }
    ]
  }
});

TplClassLoader.loadTemplate({
  div: "todoAppTpl",
  classpath: TodoTpl,
  moduleCtrl: {
      classpath: TodoCtrl
  }
});
