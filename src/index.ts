// export * from "./aria"

import { TplParser } from "./aria/templates/TplParser.js";

const tpl = `
{Template {
    $classpath:'ariadoc.guides.hello.sample_1.view.Hello'
}}
  {macro main()}
    <h1>\${data.msg}</h1>
  {/macro}
{/Template}
`;

const parser = new TplParser();

// console.log(JSON.stringify(parser.parseTemplate(tpl, {}, [], true), null, 2));
console.log(parser.parseTemplate(tpl, {}, [], true));



