
# Not Implementable - Framework wide
1. Dynamic Replacement of Classes, based on customization Descriptor. Might be possible but will need a full solutioning + POC + implementation cycle.
2. Module unload and reload. With EsModules we no longer control loading of code files.
  - In aria context JS files are all .tpl, .cml, .tml, .tpl.css, .tpl, .tpl.txt files
  - With EsModules, browser loads and evaluates the module. Once downloaded it remains in browser memory until page refresh.


# Not Implementable - Individual Functionalities
1. [CSS templates](./templates/CSSTemplate.js) have access to cssFolderPath property computed by the packing and resolving system of the JS loader in old Aria. This will not be possible to do accurately, when package/bundling systems like webpack, rollup or vite is setup.

# Core Yet to do:
1. In Progress: Widget Library conversion to ES Modules and Demo setup - Should be done in 2 more days.
2. Implement internationalization (download resources based on language code). *Needed before AriaJSP*
3. Need to implement resource provider sepecification for server resources, needed for cases where resorces are downloaded from server with AriaJSP. Aria templates uses only static resources. *Can be done while implementing AriaJSP*

# Build and packaging TODO (5-10 days):
1. Make the template parsing scripts configurable and runnable through downstream projects.
2. Implement npm package for the new aria templates implementation. Move demo pages as a separate npm project, and use 'ariatemplates' npm package as a dependency.
3. Implement a build system using Vite (most recent angular versions have vite as the default build provider).

# Will need Technical changes to be done as needed:
1. Currently framework allows for dynamic loading of modules based on classpath strings (mostly in configuration settings). Since with ES Modules classpath will not be used for loading, we need to build a solution for loading these modules with module path and yet have the bundling/packaging systems be aware of it.
2. Aria Templates provides a way to make backend calls and covers many use cases for Sync calls, XHR, Cross domain with Iframe, through one module. This will need to be re-designed.

# Changes to be made to existing templates:
1. All template root statements need to change to allow for ESM module imports instead of classpath strings
2. Access to Template global variables, template script methods, and template 'data' (passed with loadTemplate call) need to be prefixed with 'this.'. This is because template code compilation with old Aria used "with" statements, which is deperecated. In EsModules, with statement is not allowed, ES modules always run in strict mode.


## Structural changes whi
1. Use JS to define root template statement, and update parsers. This will do away with complex import spec definitions and make it more resilient.
2. Explore using zod instead of BeanDefinitions.
3. Use ES6 classes instead of classDefinition $prototype. Also restrict use of classRegistry only for cases in which we need to check whether a class is loaded.
4. Proper JsDoc and typedefs in JS doc comments (will make it easier to migrate to typescript), will help provide type and structural hints in IDEs
5. More of a future problem that we will face, Singleton instances will remain in memory even if not used as Module unload is not possible. Can be mitigated with singleton instance stored as a weakRef and registering instance with a finalization registry to call destructor when instance is gargabe collected.

