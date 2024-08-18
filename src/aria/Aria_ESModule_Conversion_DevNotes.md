# Common pattern/steps to convert to ES modules

## To add .js at end in require calls
require\(('|")(.*?)('|")\) --> require('$2.js')

## Replace require('.../Aria.js') with the required definition function
replace ---> var\s+Aria\s*=\s*require\(("|')(.*?)/Aria(.js)?("|')\);

for classDefinition with --> var { classDefinition } = require('$2/core/class-definition.js');

for beanDefinitions with --> var { beanDefinitions } = require('$2/core/bean-definitions.js');

for interfaceDefinition with --> var { interfaceDefinition } = require('$2/core/interface-definition.js');

for resourcesDefinition with --> var { resourceDefintion } = require('$2/core/resource-definition.js');

## Use destructing to import functions previous singleton class modules (mostly in utils), which have been changed to directly export functions

## Ensure you add the exported name at end of require statement when source was changed fro mdefault export to named export.

## Fix the eslint issues either useing automatic fix / manually. Leave the ones doubtful about. Do not fix no unused vars in function/method declarations, add a eslint disable for those.

## Generally append '.{classname}' to module.exports to convert the default export to a named export.
So module.exports becomes module.exports.Classname, where classname is the actual classname.
This is to ensure we avoid default exports as much as possible.

## If the class definition has a documentation comment above it, copy it
## On the first require statement error go to quickfixes, and click on "convert to ESModule syntax"
## Paste the documentation comment above the export const... statement as the the ESmodule conversion autofix removes it for some reason.

## Fix pending ESlint issues. Make sure to replace all Aria.\* references with appropriate imports. And all "aria.\*" where the initial parts are the classpath with getClassref('{classpath}').\*


# Situations to mark changes for later checks with comments and/or logs (if feels complicated to resolve right away).
1. When you encounter Aria.load calls comment the call, Add another comment starting with pattern "MUST_DO: ModernAria: Aria.load: {description}". These are places where modules are dynamically loaded and generally the loaded modules are by classpath which are configurable and not fixed (based on configuraions in many cases).
  - Make sure that the loaded module classpaths are indeed dynamic and not passed by user directly in the call flow (e.g. see )
  - Add appropriate console.error statement(s) and "debugger;" statement.
  - See example in 'RequestMgr.js'.
2. Whenever you have to use 'getClassRef' or 'getClassInstance' calls, where it is expected that the class is already loaded (no checks against wheter 'classRef' or get 'classIntance' returns undefined or null)
  - Check if the module with the class can be statically imported (no cyclic dependency issues should come up). __*NOTE: Cyclic dpendency checking instructions/setup is not ready yet *__
  - Otherwise add comment like "// MUST_CHECK: ModernAria: USELESS_CLASSREF: {description of class and module being referenced}" or "// MUST_CHECK: ModernAria: CLASSREF_USED: {description of class and module being referenced}"







