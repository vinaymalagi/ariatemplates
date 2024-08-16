import { classDefinition } from "./class-definition";

/**
 * Load a resource definition.
 */
export function resourcesDefinition(res) {
  // return require("./core/ResMgr").resourcesDefinition(res);
  classDefinition({
    $classpath : res.$classpath,
    $singleton : true,
    $prototype : res.$resources
    // $onunload : this._unloadResource
  });
};
