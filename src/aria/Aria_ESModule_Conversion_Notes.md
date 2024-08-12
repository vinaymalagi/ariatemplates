
# Potentially Not Implementable or Very Difficult to Implement

## Framework wide
1. Dynamic Replacement of Classes, based on customization Descriptor.
2. Module unload and reload. With EsModules we no longer control loading of code files.
  - In aria context JS files are all .tpl, .cml, .tml, .tpl.css, .tpl, .tpl.txt files
  - With EsModules, browser loads and evaluates the module. Once downloaded it remains in browser memory until page refresh. 


## Individual Functionalities
1. [CSS templates](./templates/CSSTemplate.js) have access to cssFolderPath property computed by the packing and resolving system of the JS loader in old Aria. This will not be possible to do accurately, when package/bundling systems like webpack, rollup or vite is setup. 
