
# Not Implementable - Framework wide
1. Dynamic Replacement of Classes, based on customization Descriptor.
2. Module unload and reload. With EsModules we no longer control loading of code files.
  - In aria context JS files are all .tpl, .cml, .tml, .tpl.css, .tpl, .tpl.txt files
  - With EsModules, browser loads and evaluates the module. Once downloaded it remains in browser memory until page refresh.


# Not Implementable - Individual Functionalities
1. [CSS templates](./templates/CSSTemplate.js) have access to cssFolderPath property computed by the packing and resolving system of the JS loader in old Aria. This will not be possible to do accurately, when package/bundling systems like webpack, rollup or vite is setup.

## Mandatory Changes:
1. All template root statements need to change to allow for ESM module imports instead of classpath strings
2. Access to Template global variables, template script methods, and template 'data' (passed with loadTemplate call) need to be prefixed with 'this.'. This is because template code compilation with old Aria used "with" statements, which is deperecated. In EsModules, with statement is not allowed, ES modules always run in strict mode.


## Core Yet to do:
1. Implement internationalization (download resources based on language code). Currently only static resource definitions (without language switch) are implemented.
2. Need to implement resource provider sepecification for resources, needed for cases where resorces are downloaded from server, with AriaJSP. Aria templates uses only static resources.
2. Convert other files.
3. Implement npm package for the new aria templates mplementation. Move demo pages as a separate npm project, and use 'ariatemplates' npm package as a dependency.
3. Implement a build system using Vite (most recent angular versions have vite as the default build provider)

## Structural changes Must do
1. Use JS to define root template statement, and update parsers. This will do away with complex import spec definitions and make it more resilient.
2. Explore using zod instead of BeanDefinitions.
3. Use ES6 classes instead of classDefinition $prototype. Also restrict use of classRegistry only for cases in which we need to check whether a class is loaded.
4. Proper JsDoc and typedefs in JS doc comments (will make it easier to migrate to typescript), will help provide type and structural hints in IDEs
5. More of a future problem that we will face, Singleton instances will remain in memory even if not used as Module unload is not possible. Can be mitigated with singleton instance stored as a weakRef and registering instance with a finalization registry to call destructor when instance is gargabe collected.

