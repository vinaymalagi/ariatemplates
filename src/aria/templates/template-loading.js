import { TplClassLoader } from "./TplClassLoader";

/**
 * Load a template in a div. If a customized template has been defined for the given classpath, the substitute will
 * be loaded instead.
 * @param {aria.templates.CfgBeans:LoadTemplateCfg} cfg configuration object
 * @param {aria.core.CfgBeans:Callback} callback which will be called when the template is loaded or if there is an
 * error. The first parameter of the callback is a JSON object with the following properties: { success : {Boolean}
 * true if the template was displayed, false otherwise } Note that the callback is called when the template is
 * loaded, but sub-templates may still be waiting to be loaded (showing a loading indicator). Note that
 * success==true means that the template was displayed, but there may be errors inside some widgets or
 * sub-templates.
 */
export function loadTemplate(cfg, cb) {
  TplClassLoader.loadTemplate(cfg, cb);
};
